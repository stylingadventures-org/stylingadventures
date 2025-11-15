// lambda/bestie/index.ts
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AppSyncIdentityCognito } from "aws-lambda";
import Stripe from "stripe";

const { USER_POOL_ID = "", TABLE_NAME = "" } = process.env;
if (!TABLE_NAME) throw new Error("Missing env TABLE_NAME");
if (!USER_POOL_ID) throw new Error("Missing env USER_POOL_ID");

// Stripe (checked lazily per-request so non-Stripe paths still work)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || "";
const BASE_SUCCESS_URL = (process.env.BASE_SUCCESS_URL || "http://localhost:5173").replace(
  /\/$/,
  "",
);

const cognito = new CognitoIdentityProviderClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

type SAId =
  | (AppSyncIdentityCognito & {
      groups?: string[] | null;
    })
  | null
  | undefined;

const PK = (sub: string) => `USER#${sub}`;
const SK_BESTIE = "BESTIE";

type BestieStatus = {
  active: boolean;
  since: string | null;
  until: string | null;
  source: string | null;
};

/** Load current Bestie status from DDB, always returning a BestieStatus object. */
async function loadBestie(sub: string): Promise<BestieStatus> {
  const r = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: PK(sub), sk: SK_BESTIE },
    }),
  );
  const i = (r.Item as any) ?? {};
  return {
    active: !!i.active,
    since: (i.since as string) ?? null,
    until: (i.until as string) ?? null,
    source: (i.source as string) ?? null,
  };
}

/** Upsert Bestie status and return the resulting BestieStatus object. */
async function saveBestie(
  sub: string,
  patch: { active: boolean; since?: string | null; until?: string | null; source?: string | null },
): Promise<BestieStatus> {
  const now = new Date().toISOString();

  // Ensure document exists (bootstrap)
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: PK(sub), sk: SK_BESTIE },
      UpdateExpression: "SET #doc = if_not_exists(#doc, :empty), #updatedAt = :now",
      ExpressionAttributeNames: { "#doc": "doc", "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: { ":empty": {}, ":now": now },
    }),
  );

  // Apply the patch (use names to avoid reserved words like "until")
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: PK(sub), sk: SK_BESTIE },
      UpdateExpression:
        "SET #active = :a, #since = if_not_exists(#since, :since), #until = :u, #source = :s, #updatedAt = :now",
      ExpressionAttributeNames: {
        "#active": "active",
        "#since": "since",
        "#until": "until",
        "#source": "source",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":a": patch.active,
        ":since": patch.since ?? now,
        ":u": patch.until ?? null,
        ":s": patch.source ?? null,
        ":now": now,
      },
    }),
  );

  return loadBestie(sub);
}

/** Helper: find sub by email when admin sets bestie by email. */
async function lookupSubByEmail(email: string) {
  const res = await cognito.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );
  const user = res.Users?.[0];
  if (!user?.Attributes) return null;
  const subAttr = user.Attributes.find((a) => a.Name === "sub");
  return subAttr?.Value ?? null;
}

function isAdmin(id: SAId) {
  // Prefer groups from JWT claims if present
  const claimsGroups =
    (id as any)?.claims?.["cognito:groups"] ||
    (id as any)?.claims?.["custom:groups"] ||
    (id as any)?.groups;

  const g = Array.isArray(claimsGroups)
    ? claimsGroups
    : typeof claimsGroups === "string"
    ? claimsGroups.split(",")
    : [];

  return g.includes("ADMIN");
}

export const handler = async (event: any) => {
  const id = event.identity as SAId;
  const fn = event.info?.fieldName as string;

  // ───────────────────────────────────────────
  // Mutation: startBestieCheckout (Stripe)
  // GraphQL: startBestieCheckout(successUrl, cancelUrl): AWSURL!
  // Returns the Stripe Checkout URL as a string.
  // ───────────────────────────────────────────
  if (fn === "startBestieCheckout") {
    const identity = event.identity as AppSyncIdentityCognito | undefined;
    if (!identity?.sub) throw new Error("Unauthorized");

    if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
      throw new Error("Stripe not configured");
    }

    // Use the SDK’s current version literal to satisfy TS
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const argSuccess: string | undefined = event.arguments?.successUrl;
    const argCancel: string | undefined = event.arguments?.cancelUrl;

    const successUrl = argSuccess || `${BASE_SUCCESS_URL}/bestie/thanks`;
    const cancelUrl = argCancel || `${BASE_SUCCESS_URL}/bestie?cancelled=1`;

    const email = (identity as any)?.claims?.email as string | undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      client_reference_id: identity.sub,
      customer_email: email,
      metadata: { sub: identity.sub, email: email ?? "" },
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("No checkout URL from Stripe");
    // GraphQL field is AWSURL!, so return the URL string directly
    return session.url;
  }

  // ───────────────────────────────────────────
  // Query: meBestieStatus: BestieStatus!
  // ───────────────────────────────────────────
  if (fn === "meBestieStatus") {
    if (!id?.sub) throw new Error("Unauthorized");
    return loadBestie(id.sub);
  }

  // ───────────────────────────────────────────
  // Query: isEpisodeEarlyAccess(id): EarlyAccessGate!
  // Rule: Bestie is active && until > now
  // ───────────────────────────────────────────
  if (fn === "isEpisodeEarlyAccess") {
    const now = Date.now();
    const sub = id?.sub;
    if (!sub) return { allowed: false, reason: "not_signed_in" };

    const b = await loadBestie(sub);
    const untilMs = b.until ? Date.parse(b.until) : 0;
    const allowed = b.active && untilMs > now;

    return { allowed, reason: allowed ? null : "not_bestie" };
  }

  // ───────────────────────────────────────────
  // Mutation: claimBestieTrial (7-day trial)
  // GraphQL: claimBestieTrial: BestieStatus!
  // ───────────────────────────────────────────
  if (fn === "claimBestieTrial") {
    if (!id?.sub) throw new Error("Unauthorized");

    const current = await loadBestie(id.sub);

    // Already active with a future-until → just return
    if (current.active && current.until && Date.parse(current.until) > Date.now()) {
      return current;
    }

    // If they already had a trial, do not re-grant
    if (current.source === "TRIAL") {
      return current;
    }

    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const until = new Date(Date.now() + sevenDays).toISOString();

    return saveBestie(id.sub, { active: true, until, source: "TRIAL" });
  }

  // ───────────────────────────────────────────
  // Admin helpers (require ADMIN group)
  // All return BestieStatus!
  // ───────────────────────────────────────────
  if (fn === "adminSetBestie") {
    if (!isAdmin(id)) throw new Error("Forbidden");
    const { userSub, active } = event.arguments as { userSub: string; active: boolean };
    const until = active
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    return saveBestie(userSub, { active: !!active, until, source: "ADMIN" });
  }

  if (fn === "adminRevokeBestie") {
    if (!isAdmin(id)) throw new Error("Forbidden");
    const { userSub } = event.arguments as { userSub: string };
    return saveBestie(userSub, { active: false, until: null, source: "ADMIN" });
  }

  if (fn === "adminSetBestieByEmail") {
    if (!isAdmin(id)) throw new Error("Forbidden");
    const { email, active } = event.arguments as { email: string; active: boolean };
    const sub = await lookupSubByEmail(email);
    if (!sub) throw new Error("User not found");
    const until = active
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    return saveBestie(sub, { active: !!active, until, source: "ADMIN_EMAIL" });
  }

  if (fn === "adminRevokeBestieByEmail") {
    if (!isAdmin(id)) throw new Error("Forbidden");
    const { email } = event.arguments as { email: string };
    const sub = await lookupSubByEmail(email);
    if (!sub) throw new Error("User not found");
    return saveBestie(sub, { active: false, until: null, source: "ADMIN_EMAIL" });
  }

  throw new Error(`Unknown field ${fn}`);
};

