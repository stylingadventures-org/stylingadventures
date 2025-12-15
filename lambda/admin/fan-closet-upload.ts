import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const sfn = new SFNClient({});

const {
  TABLE_NAME = "",
  PK_NAME = "pk",
  SK_NAME = "sk",

  // Fan approval state machine (WAIT_FOR_TASK_TOKEN)
  FAN_APPROVAL_SM_ARN = "",

  // Optional defaults
  DEFAULT_AUDIENCE = "PUBLIC",
  DEFAULT_STATUS = "PENDING",
} = process.env;

if (!TABLE_NAME) throw new Error("Missing env: TABLE_NAME");
if (!FAN_APPROVAL_SM_ARN) throw new Error("Missing env: FAN_APPROVAL_SM_ARN");

type HttpEvent = {
  headers?: Record<string, string | undefined>;
  requestContext?: any;
  body?: string | null;
  isBase64Encoded?: boolean;
};

function json(statusCode: number, payload: any) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "OPTIONS,POST",
      "access-control-allow-headers": "*",
    },
    body: JSON.stringify(payload),
  };
}

function nowIso() {
  return new Date().toISOString();
}

function requireString(v: any, name: string) {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`${name} is required`);
  }
  return v.trim();
}

function safeParseBody(event: HttpEvent): any {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

/**
 * Admin Fan Closet Upload
 *
 * Expected request body:
 * {
 *   "title": "Cute fit",
 *   "s3Key": "closet/raw/abc.jpg",        // OR rawMediaKey
 *   "rawMediaKey": "closet/raw/abc.jpg", // optional alias
 *   "ownerSub": "cognito-sub-of-owner",  // required unless JWT provides caller sub
 *   "audience": "PUBLIC",                // optional (defaults to DEFAULT_AUDIENCE)
 *   "category": "...",                   // optional
 *   "subcategory": "...",                // optional
 *   "season": "...",                     // optional
 *   "vibes": "...",                      // optional
 *   "description": "...",                // optional
 *   "story": "...",                      // optional
 *   "id": "optional-item-id"             // optional; otherwise generated
 * }
 *
 * Response:
 * {
 *   "ok": true,
 *   "itemId": "...",
 *   "executionArn": "...",
 *   "status": "PENDING"
 * }
 */
export const handler = async (event: HttpEvent) => {
  // CORS preflight
  const method =
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    "";
  if (method === "OPTIONS") {
    return json(200, { ok: true });
  }

  try {
    const body = safeParseBody(event);

    const title = requireString(body.title, "title");

    const s3Key = requireString(
      body.s3Key ?? body.rawMediaKey,
      "s3Key/rawMediaKey",
    );

    // If your HTTP API has JWT auth, you'll often have a sub here:
    const callerSub =
      event.requestContext?.authorizer?.jwt?.claims?.sub ||
      event.requestContext?.authorizer?.claims?.sub ||
      event.requestContext?.authorizer?.principalId ||
      null;

    // Admin is uploading "for" a closet owner.
    // If you don't pass ownerSub, we fall back to callerSub (useful for dev).
    const ownerSub = String(body.ownerSub || callerSub || "").trim();
    if (!ownerSub) {
      throw new Error(
        "ownerSub is required (or configure JWT auth so caller sub is available)",
      );
    }

    const id = (body.id && String(body.id).trim()) || randomUUID();
    const now = nowIso();

    const audience =
      (body.audience && String(body.audience).trim()) || DEFAULT_AUDIENCE;

    const status = String(DEFAULT_STATUS || "PENDING").trim() || "PENDING";

    // Single-table admin namespace:
    // pk=ITEM#<id>, sk=META
    const itemPk = `ITEM#${id}`;
    const itemSk = "META";

    // Put item meta (PENDING) — NotifyAdminFn will later store taskToken on this record
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          [PK_NAME]: itemPk,
          [SK_NAME]: itemSk,

          id,
          ownerSub,

          // Fan approval pipeline expects the raw upload key
          rawMediaKey: s3Key,

          title,
          status,

          // Index keys (keep as-is if your admin list uses gsi2; otherwise switch to gsi1 in one place consistently)
          gsi2pk: `STATUS#${status}`,
          gsi2sk: now,

          createdAt: now,
          updatedAt: now,

          favoriteCount: 0,

          audience,

          category: body.category ? String(body.category) : undefined,
          subcategory: body.subcategory ? String(body.subcategory) : undefined,
          season: body.season ? String(body.season) : undefined,
          vibes: body.vibes ? String(body.vibes) : undefined,
          description: body.description ? String(body.description) : undefined,
          story: body.story ? String(body.story) : undefined,
        },

        // Avoid overwriting if same id is re-used
        ConditionExpression: "attribute_not_exists(#pk)",
        ExpressionAttributeNames: {
          "#pk": PK_NAME,
        },
      }),
    );

    // Start Fan approval state machine (WAIT_FOR_TASK_TOKEN flow)
    const exec = await sfn.send(
      new StartExecutionCommand({
        stateMachineArn: FAN_APPROVAL_SM_ARN,
        input: JSON.stringify({
          item: {
            id,
            ownerSub,
            userId: ownerSub, // compatibility
            s3Key, // required by SegmentOutfit task in your SM
          },
        }),
      }),
    );

    return json(201, {
      ok: true,
      itemId: id,
      executionArn: exec.executionArn,
      status,
    });
  } catch (err: any) {
    console.error("fan-closet-upload error", err);
    const message = err?.message || "Unknown error";

    const isBadRequest =
      /required|invalid json|missing env|unauthorized/i.test(message);

    return json(isBadRequest ? 400 : 500, {
      ok: false,
      error: message,
    });
  }
};
