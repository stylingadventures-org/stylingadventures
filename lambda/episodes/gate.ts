// lambda/episodes/gate.ts
import {
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import type { AppSyncIdentityCognito } from "aws-lambda";

const ddb = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME!;

type AppSyncEvent = {
  info: { fieldName: string };
  arguments: { id: string };
  identity?: (AppSyncIdentityCognito & { groups?: string[] }) | null;
};

function isAdmin(identity?: AppSyncEvent["identity"]) {
  const gs = identity?.groups || [];
  return gs.includes("ADMIN") || gs.includes("COLLAB");
}

async function bestieActive(userSub?: string) {
  if (!userSub) return false;
  const r = await ddb.send(
    new GetItemCommand({
      TableName: TABLE,
      Key: { pk: { S: `USER#${userSub}` }, sk: { S: "BESTIE" } },
    })
  );
  const active = r.Item?.active?.BOOL ?? false;
  const until = r.Item?.until?.S ? new Date(r.Item.until.S) : null;
  return !!active && (!until || until > new Date());
}

async function loadEpisodeMeta(epId: string) {
  // Meta convention:  pk=EPISODE#<id>  sk=META
  const r = await ddb.send(
    new GetItemCommand({
      TableName: TABLE,
      Key: { pk: { S: `EPISODE#${epId}` }, sk: { S: "META" } },
    })
  );

  if (r.Item) {
    return {
      title: r.Item.title?.S ?? epId,
      publishedAt: r.Item.publishedAt?.S ?? null,
      earlyHours: r.Item.earlyHours?.N ? Number(r.Item.earlyHours.N) : 0,
      bestieOnly: r.Item.bestieOnly?.BOOL ?? false,
    };
  }

  // Sensible fallback so you can try it immediately without seeding data:
  // Treat ep-002 and ep-003 as "early for 48h" unless Bestie.
  if (epId === "ep-002" || epId === "ep-003") {
    return {
      title: epId,
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      earlyHours: 48,
      bestieOnly: false,
    };
  }
  return { title: epId, publishedAt: null, earlyHours: 0, bestieOnly: false };
}

export const handler = async (event: AppSyncEvent) => {
  const { fieldName } = event.info;

  if (fieldName !== "isEpisodeEarlyAccess") {
    throw new Error(`Unknown field ${fieldName}`);
  }

  const epId = event.arguments.id;
  const id = event.identity;
  const admin = isAdmin(id);

  // Admins & collabs always allowed
  if (admin) return { allowed: true, reason: "Admin / collaborator override." };

  const meta = await loadEpisodeMeta(epId);

  const now = new Date();
  const publishedAt = meta.publishedAt ? new Date(meta.publishedAt) : null;
  const inEarlyWindow =
    !!publishedAt &&
    meta.earlyHours > 0 &&
    now.getTime() - publishedAt.getTime() < meta.earlyHours * 3600 * 1000;

  // Gate if (bestieOnly) or (in early window)
  const requiresBestie = meta.bestieOnly || inEarlyWindow;

  if (!requiresBestie) {
    return { allowed: true, reason: null };
  }

  // Require Bestie
  const active = await bestieActive(id?.sub);
  if (active) return { allowed: true, reason: "Bestie access." };

  return {
    allowed: false,
    reason: inEarlyWindow
      ? "Early drops are Bestie-only for a short window. Unlock with Bestie."
      : "This episode is Bestie-only.",
  };
};
