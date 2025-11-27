// lambda/engagement/handler.ts
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { EventBridgeEvent, Handler } from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME!;
const client = new DynamoDBClient({});

/**
 * EngagementDetail – what GraphQL / other services send to EventBridge
 * via PutEventsCommand.
 */
interface EngagementDetail {
  action:
    | "WISHLIST_TOGGLED"
    | "LIKED"
    | "COMMENTED"
    | "COMMUNITY_FEATURED"
    | "PINTEREST_SHARE_REQUESTED";

  closetItemId: string; // primary target
  ownerSub: string; // owner of the closet item
  actorSub: string; // user who performed the action
  delta?: number; // +1 / -1 for toggles (likes, wishlist)
  commentId?: string; // comment id if COMMENTED
  commentText?: string; // optional, for analytics
}

/**
 * Main handler for EventBridge events.
 * Event detailType is "BestieEngagement" – we just read event.detail.action.
 */
export const handler: Handler<EventBridgeEvent<string, EngagementDetail>> = async (
  event,
) => {
  console.log("Received engagement event:", JSON.stringify(event, null, 2));

  const detail = event.detail;

  switch (detail.action) {
    case "WISHLIST_TOGGLED":
      await handleWishlist(detail);
      break;
    case "LIKED":
      await handleLike(detail);
      break;
    case "COMMENTED":
      await handleComment(detail);
      break;
    case "COMMUNITY_FEATURED":
      await handleCommunityFeatured(detail);
      break;
    case "PINTEREST_SHARE_REQUESTED":
      await handlePinterestShareRequested(detail);
      break;
    default:
      console.warn("Unknown engagement action:", detail.action);
  }

  return { ok: true };
};

// ─────────────────────────────────────────────
// Handlers – update analytics & per-item counters
// (Closet item itself is already updated by your GraphQL Lambda.)
// ─────────────────────────────────────────────

async function handleWishlist(detail: EngagementDetail) {
  const delta = detail.delta ?? 1;

  await client.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: { S: `CLOSET#${detail.closetItemId}` },
        sk: { S: "ANALYTICS" },
      },
      UpdateExpression:
        "ADD wishlistCount :delta, totalEngagementCount :deltaAll",
      ExpressionAttributeValues: {
        ":delta": { N: String(delta) },
        ":deltaAll": { N: "1" },
      },
    }),
  );

  console.log("Wishlist analytics updated", detail);
}

async function handleLike(detail: EngagementDetail) {
  const delta = detail.delta ?? 1;

  await client.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: { S: `CLOSET#${detail.closetItemId}` },
        sk: { S: "ANALYTICS" },
      },
      UpdateExpression: "ADD likeCount :delta, totalEngagementCount :deltaAll",
      ExpressionAttributeValues: {
        ":delta": { N: String(delta) },
        ":deltaAll": { N: "1" },
      },
    }),
  );

  console.log("Like analytics updated", detail);
}

async function handleComment(detail: EngagementDetail) {
  await client.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: { S: `CLOSET#${detail.closetItemId}` },
        sk: { S: "ANALYTICS" },
      },
      UpdateExpression: "ADD commentCount :one, totalEngagementCount :one",
      ExpressionAttributeValues: {
        ":one": { N: "1" },
      },
    }),
  );

  console.log("Comment analytics updated", detail);
}

async function handleCommunityFeatured(detail: EngagementDetail) {
  // "CommunityFeed" logical item in same single-table
  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: { S: "COMMUNITY_FEED" },
        sk: { S: `CLOSET#${detail.closetItemId}` },
        type: { S: "COMMUNITY_CLOSET_FEATURE" },
        closetItemId: { S: detail.closetItemId },
        ownerSub: { S: detail.ownerSub },
        featuredAt: { S: new Date().toISOString() },
      },
    }),
  );

  console.log("Community feed entry created", detail);
}

async function handlePinterestShareRequested(detail: EngagementDetail) {
  // For now, just log / track. You can plug Pinterest API here later.
  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: { S: `CLOSET#${detail.closetItemId}` },
        sk: { S: `PINTEREST#${Date.now()}` },
        type: { S: "PINTEREST_SHARE_REQUEST" },
        ownerSub: { S: detail.ownerSub },
        actorSub: { S: detail.actorSub },
        requestedAt: { S: new Date().toISOString() },
      },
    }),
  );

  console.log("Pinterest share request recorded", detail);
}
