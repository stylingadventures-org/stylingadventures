/* eslint-disable no-console */
import {
  AppSyncClient,
  GetIntrospectionSchemaCommand,
  GetSchemaCreationStatusCommand,
} from "@aws-sdk/client-appsync";

type CfnCustomResourceEvent = {
  RequestType: "Create" | "Update" | "Delete";
  PhysicalResourceId?: string;
  ResourceProperties?: Record<string, any>;
};

type HandlerResult = {
  PhysicalResourceId: string;
  Data?: Record<string, any>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function nowIso() {
  return new Date().toISOString();
}

function log(...args: any[]) {
  console.log(`[schema-ready] ${nowIso()}`, ...args);
}

function warn(...args: any[]) {
  console.warn(`[schema-ready] ${nowIso()}`, ...args);
}

function err(...args: any[]) {
  console.error(`[schema-ready] ${nowIso()}`, ...args);
}

function requiredString(v: any, name: string): string {
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  throw new Error(`Missing required "${name}" (got ${JSON.stringify(v)})`);
}

function parseNumber(v: any, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function findMutationBlock(sdl: string): string | null {
  // Keep it simple: grab "type Mutation { ... }" block if present
  const m = sdl.match(/type\s+Mutation\s*\{[\s\S]*?\}/m);
  return m ? m[0] : null;
}

function fieldExistsAnywhere(sdl: string, fieldName: string): boolean {
  // word boundary match; avoids matching "adminPublishClosetItemXYZ"
  const re = new RegExp(`\\b${escapeRegExp(fieldName)}\\b`);
  return re.test(sdl);
}

function fieldExistsInMutation(sdl: string, fieldName: string): boolean {
  const block = findMutationBlock(sdl);
  if (!block) return false;
  const re = new RegExp(`\\b${escapeRegExp(fieldName)}\\b`);
  return re.test(block);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getSchemaStatus(client: AppSyncClient, apiId: string) {
  const resp = await client.send(new GetSchemaCreationStatusCommand({ apiId }));
  // status values typically: PROCESSING | SUCCESS | FAILED | NOT_APPLICABLE
  return {
    status: resp.status ?? "UNKNOWN",
    details: resp.details ?? "",
  };
}

async function getIntrospectionSdl(client: AppSyncClient, apiId: string) {
  const resp = await client.send(
    new GetIntrospectionSchemaCommand({
      apiId,
      format: "SDL",
    })
  );

  // Handle both shapes:
  // - Some SDKs/handlers return base64 string
  // - SDK v3 returns Uint8Array bytes
  const raw = resp.schema;
  if (!raw) return "";

  const buf =
    typeof raw === "string"
      ? Buffer.from(raw, "base64")
      : Buffer.from(raw as Uint8Array);

  return buf.toString("utf8");
}

async function waitForSchemaSuccess(
  client: AppSyncClient,
  apiId: string,
  maxAttempts: number,
  delayMs: number
) {
  for (let i = 1; i <= maxAttempts; i++) {
    const { status, details } = await getSchemaStatus(client, apiId);

    log(`schema status attempt ${i}/${maxAttempts}: ${status} (${details})`);

    if (status === "SUCCESS") return { status, details };
    if (status === "FAILED") {
      throw new Error(`Schema status FAILED: ${details || "no details"}`);
    }

    // PROCESSING / NOT_APPLICABLE / UNKNOWN -> keep waiting
    await sleep(delayMs);
  }

  throw new Error(`Timed out waiting for schema to reach SUCCESS`);
}

async function waitForFieldInIntrospection(
  client: AppSyncClient,
  apiId: string,
  expectedField: string,
  maxAttempts: number,
  delayMs: number
) {
  let lastSdlLen = 0;
  let lastMutationHasField = false;

  for (let i = 1; i <= maxAttempts; i++) {
    let sdl = "";
    try {
      sdl = await getIntrospectionSdl(client, apiId);
    } catch (e: any) {
      warn(`introspection attempt ${i}/${maxAttempts} error:`, e?.message ?? e);
      await sleep(delayMs);
      continue;
    }

    lastSdlLen = sdl.length;

    const anywhere = fieldExistsAnywhere(sdl, expectedField);
    const inMutation = fieldExistsInMutation(sdl, expectedField);
    lastMutationHasField = inMutation;

    log(
      `introspection attempt ${i}/${maxAttempts}: sdlLen=${sdl.length} fieldAnywhere=${anywhere} fieldInMutation=${inMutation}`
    );

    // ✅ DEBUG: Log the first 2000 chars of the SDL to see what we're getting
    if (i === 1) {
      log("SDL prefix (first 2000 chars):", JSON.stringify(sdl.slice(0, 2000)));
      const queryMatch = sdl.match(/extend type Query \{[\s\S]*?\}/);
      if (queryMatch) {
        log("Query block found:", JSON.stringify(queryMatch[0]));
      } else {
        log("No 'extend type Query' block found");
      }
      
      // ✅ NEW DEBUG: count types
      const typeMatches = sdl.match(/^type \w+/gm);
      const extendMatches = sdl.match(/^extend type \w+/gm);
      log(`Type count: ${typeMatches ? typeMatches.length : 0}, Extend count: ${extendMatches ? extendMatches.length : 0}`);
    }

    // If it's anywhere, we consider it "ready" to avoid false negatives
    // (AppSync introspection can be eventually consistent / timing-sensitive).
    if (anywhere) {
      // Provide a tiny context snippet in logs for confidence
      const idx = sdl.search(new RegExp(`\\b${escapeRegExp(expectedField)}\\b`));
      if (idx >= 0) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(sdl.length, idx + 120);
        log("field context snippet:", JSON.stringify(sdl.slice(start, end)));
      }
      return {
        ok: true,
        fieldAnywhere: true,
        fieldInMutation: inMutation,
        sdlLen: sdl.length,
      };
    }

    // Backoff with small jitter
    const jitter = Math.floor(Math.random() * Math.min(500, delayMs));
    await sleep(delayMs + jitter);
  }

  return {
    ok: false,
    fieldAnywhere: false,
    fieldInMutation: lastMutationHasField,
    sdlLen: lastSdlLen,
  };
}

export async function handler(event: CfnCustomResourceEvent): Promise<HandlerResult> {
  const props = event?.ResourceProperties ?? {};

  // Allow either env vars or ResourceProperties
  const apiId =
    (process.env.APPSYNC_API_ID as string) ??
    (process.env.API_ID as string) ??
    props.apiId ??
    props.ApiId;

  const expectedField =
    (process.env.EXPECTED_FIELD as string) ??
    props.expectedField ??
    props.ExpectedField;

  const region =
    (process.env.AWS_REGION as string) ??
    (process.env.REGION as string) ??
    props.region ??
    props.Region;

  const maxSchemaAttempts = parseNumber(
    process.env.SCHEMA_STATUS_MAX_ATTEMPTS ?? props.schemaStatusMaxAttempts,
    30
  );
  const schemaDelayMs = parseNumber(
    process.env.SCHEMA_STATUS_DELAY_MS ?? props.schemaStatusDelayMs,
    2000
  );

  const maxIntrospectionAttempts = parseNumber(
    process.env.INTROSPECTION_MAX_ATTEMPTS ?? props.introspectionMaxAttempts,
    40
  );
  const introspectionDelayMs = parseNumber(
    process.env.INTROSPECTION_DELAY_MS ?? props.introspectionDelayMs,
    2500
  );

  const physicalId =
    event.PhysicalResourceId ??
    `AppSyncSchemaReady:${String(apiId ?? "unknown")}`;

  // Deletes should never block stack deletion
  if (event.RequestType === "Delete") {
    log("Delete request -> skipping checks");
    return { PhysicalResourceId: physicalId, Data: { skipped: true } };
  }

  const apiIdStr = requiredString(apiId, "apiId");
  const regionStr = requiredString(region, "region");

  const expected = String(expectedField ?? "").trim();

  log("starting", {
    requestType: event.RequestType,
    apiId: apiIdStr,
    expectedField: expected || "(none)",
    region: regionStr,
    maxSchemaAttempts,
    schemaDelayMs,
    maxIntrospectionAttempts,
    introspectionDelayMs,
  });

  const client = new AppSyncClient({ region: regionStr });

  // 1) wait for schema creation status SUCCESS
  const schemaStatus = await waitForSchemaSuccess(
    client,
    apiIdStr,
    maxSchemaAttempts,
    schemaDelayMs
  );

  // 2) Optional: wait for introspection to include the field (only if provided)
  if (expected) {
    const introspection = await waitForFieldInIntrospection(
      client,
      apiIdStr,
      expected,
      maxIntrospectionAttempts,
      introspectionDelayMs
    );

    if (!introspection.ok) {
      const message =
        `Schema SUCCESS but expectedField "${expected}" not found via introspection after retries. ` +
        `details=${schemaStatus.details || "no details"} (sdlLen=${introspection.sdlLen}, fieldInMutation=${introspection.fieldInMutation})`;

      err(message);
      throw new Error(message);
    }

    log("READY", {
      status: schemaStatus.status,
      details: schemaStatus.details,
      expectedField: expected,
      fieldInMutation: introspection.fieldInMutation,
      sdlLen: introspection.sdlLen,
    });

    return {
      PhysicalResourceId: physicalId,
      Data: {
        ok: true,
        apiId: apiIdStr,
        expectedField: expected,
        schemaStatus: schemaStatus.status,
        schemaDetails: schemaStatus.details,
        fieldInMutation: introspection.fieldInMutation,
        sdlLen: introspection.sdlLen,
      },
    };
  }

  // No expected field check requested
  log("READY (no expectedField check)", {
    status: schemaStatus.status,
    details: schemaStatus.details,
  });

  return {
    PhysicalResourceId: physicalId,
    Data: {
      ok: true,
      apiId: apiIdStr,
      schemaStatus: schemaStatus.status,
      schemaDetails: schemaStatus.details,
      expectedField: "",
    },
  };
}
