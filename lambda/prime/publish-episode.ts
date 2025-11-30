// lambda/prime/publish-episode.ts

/**
 * Prime Studios - Episode Publisher
 *
 * Role in pipeline:
 *  - Final step after validation + layout checks.
 *  - Marks an episode as "published" and (optionally) writes to a fan-facing feed.
 *
 * This is kept deliberately generic:
 *  - If EPISODE_FEED_TABLE is set, we persist a minimal feed record to DynamoDB.
 *  - Otherwise, we just return the transformed payload for Step Functions / API.
 */

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

const EPISODE_FEED_TABLE = process.env.EPISODE_FEED_TABLE; // optional
const EPISODE_FEED_PK_PREFIX =
  process.env.EPISODE_FEED_PK_PREFIX ?? "EPISODE#";
const EPISODE_FEED_SK_PREFIX =
  process.env.EPISODE_FEED_SK_PREFIX ?? "VERSION#";

type Severity = "INFO" | "WARNING" | "ERROR";

export interface ValidationIssue {
  code: string;
  severity: Severity;
  message: string;
  path?: string;
}

export interface EpisodeDocument {
  episodeId?: string;
  slug?: string;
  title?: string;
  status?: string;
  version?: string;
  publishedAt?: string;
  [key: string]: any;
}

export interface ValidationSummary {
  ok: boolean;
  issues?: ValidationIssue[];
  [key: string]: any;
}

export interface PublishEpisodeEvent {
  /**
   * Episode document, ideally already validated + with layout checklist applied.
   */
  episode: EpisodeDocument;

  /**
   * Optional validation result from ValidateEpisodeFn.
   * If present and ok === false, we will refuse to publish.
   */
  validation?: ValidationSummary;

  /**
   * If true, perform no writes; just return what *would* be published.
   */
  dryRun?: boolean;

  /**
   * Optional override status, e.g. "scheduled" instead of "published".
   */
  targetStatus?: string;
}

export interface PublishedFeedItem {
  episodeId?: string;
  slug?: string;
  title?: string;
  version?: string;
  status: string;
  publishedAt: string;
}

export interface PublishEpisodeResult {
  published: boolean;
  status: string;
  episode: EpisodeDocument;
  feedItem?: PublishedFeedItem;
  validation?: ValidationSummary;
  skippedWrite?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function ensureEpisodeIdentity(ep: EpisodeDocument) {
  if (!ep.episodeId && ep.slug) {
    ep.episodeId = ep.slug;
  }
}

/**
 * Derive a version string if none present.
 * Very simple: YYYYMMDDHHmmss for now.
 */
function ensureVersion(ep: EpisodeDocument) {
  if (!ep.version) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const v =
      now.getUTCFullYear().toString() +
      pad(now.getUTCMonth() + 1) +
      pad(now.getUTCDate()) +
      pad(now.getUTCHours()) +
      pad(now.getUTCMinutes()) +
      pad(now.getUTCSeconds());
    ep.version = v;
  }
}

async function putFeedRecord(item: PublishedFeedItem): Promise<void> {
  if (!EPISODE_FEED_TABLE) {
    console.log(
      "EPISODE_FEED_TABLE not set; skipping DynamoDB write, but publish succeeds.",
    );
    return;
  }

  const episodeKey = item.episodeId ?? item.slug;
  if (!episodeKey) {
    console.warn(
      "No episodeId or slug present; skipping DynamoDB write, but publish succeeds.",
    );
    return;
  }

  const pk = `${EPISODE_FEED_PK_PREFIX}${episodeKey}`;
  const sk = `${EPISODE_FEED_SK_PREFIX}${item.version}`;

  console.log("Writing episode feed item to DynamoDB:", {
    table: EPISODE_FEED_TABLE,
    pk,
    sk,
    item,
  });

  // Simple S-only AttributeValue mapping
  const attributes: any = {
    pk: { S: pk },
    sk: { S: sk },
    type: { S: "episode#feed" },
  };

  for (const [key, value] of Object.entries(item)) {
    if (value === undefined || value === null) continue;
    attributes[key] = { S: String(value) };
  }

  await ddb.send(
    new PutItemCommand({
      TableName: EPISODE_FEED_TABLE,
      Item: attributes,
    }),
  );
}

// ─────────────────────────────────────────────
// Lambda handler
// ─────────────────────────────────────────────

export const handler = async (
  event: PublishEpisodeEvent,
): Promise<PublishEpisodeResult> => {
  console.log(
    "PublishEpisode incoming event:",
    JSON.stringify(event, null, 2),
  );

  if (!event || !event.episode) {
    throw new Error("PublishEpisode requires 'episode' in payload.");
  }

  // If validation is present and failed, refuse to publish
  if (event.validation && event.validation.ok === false) {
    console.warn(
      "Refusing to publish: validation.ok === false. Issues:",
      JSON.stringify(event.validation.issues ?? [], null, 2),
    );

    const ep: EpisodeDocument = {
      ...event.episode,
      status: event.episode.status ?? "validation_failed",
    };

    return {
      published: false,
      status: ep.status!,
      episode: ep,
      validation: event.validation,
      skippedWrite: true,
    };
  }

  const nowIso = new Date().toISOString();
  const targetStatus = event.targetStatus ?? "published";

  const episode: EpisodeDocument = {
    status: targetStatus,
    ...event.episode,
    publishedAt: event.episode.publishedAt ?? nowIso,
  };

  ensureEpisodeIdentity(episode);
  ensureVersion(episode);

  const feedItem: PublishedFeedItem = {
    episodeId: episode.episodeId,
    slug: episode.slug,
    title: episode.title,
    version: episode.version,
    status: episode.status ?? targetStatus,
    publishedAt: episode.publishedAt!,
  };

  let skippedWrite = false;

  if (event.dryRun) {
    console.log("Dry-run publish; not writing to any datastore.");
    skippedWrite = true;
  } else {
    try {
      await putFeedRecord(feedItem);
    } catch (err) {
      console.error("Error writing episode feed record:", err);
      // Surface the error so Step Functions can decide retry / DLQ.
      throw err;
    }
  }

  const result: PublishEpisodeResult = {
    published: true,
    status: episode.status ?? targetStatus,
    episode,
    feedItem,
    validation: event.validation,
    skippedWrite,
  };

  console.log("PublishEpisode result:", JSON.stringify(result, null, 2));

  return result;
};
