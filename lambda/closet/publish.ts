import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const eb = new EventBridgeClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";

async function emit(detailType: string, detail: any) {
  try {
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: "stylingadventures.closet",
            DetailType: detailType,
            Detail: JSON.stringify(detail),
          },
        ],
      }),
    );
  } catch (e) {
    console.warn("[publish] EventBridge put failed:", e);
  }
}

function isConditionalCheckFailed(err: any) {
  return err?.name === "ConditionalCheckFailedException";
}

export const handler = async (event: any) => {
  console.log("[publish] incoming event:", JSON.stringify(event));

  const approvalId =
    event?.approvalId ||
    event?.item?.id ||
    event?.itemId ||
    event?.closetItemId ||
    event?.admin?.approvalId;

  if (!approvalId) {
    console.warn("[publish] missing approvalId; no-op publish");
    return { ok: false, status: "NO_ID" };
  }

  const pk = `ITEM#${approvalId}`;
  const sk = "META";
  const now = new Date().toISOString();

  const mediaKey =
    event?.segmentation?.outputKey ||
    event?.processedImageKey ||
    event?.item?.s3Key ||
    null;

  // 0) Read current status
  const getResp = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { [PK_NAME]: pk, [SK_NAME]: sk },
      ConsistentRead: true,
    }),
  );

  const Item = getResp?.Item;

  if (!Item) {
    console.warn("[publish] meta not found", { approvalId });
    return { ok: false, status: "NOT_FOUND", approvalId };
  }

  const currentStatus = Item.status as string | undefined;

  if (currentStatus === "PUBLISHED") {
    return {
      ok: true,
      approvalId,
      status: "PUBLISHED",
      idempotent: true,
      mediaKey: (Item.mediaKey as string | undefined) ?? mediaKey,
    };
  }

  if (currentStatus !== "APPROVED") {
    return { ok: false, approvalId, status: "NOT_APPROVED", currentStatus };
  }

  // 1) Conditional update
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },
        ConditionExpression: "#status = :approved",
        UpdateExpression:
          "SET #status = :published, updatedAt = :t, publishedAt = :t, mediaKey = :m",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":approved": "APPROVED",
          ":published": "PUBLISHED",
          ":t": now,
          ":m": mediaKey,
        },
      }),
    );
  } catch (err: any) {
    if (isConditionalCheckFailed(err)) {
      const reread = await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { [PK_NAME]: pk, [SK_NAME]: sk },
          ConsistentRead: true,
        }),
      );

      const s = (reread?.Item?.status as string | undefined) ?? "UNKNOWN";

      if (s === "PUBLISHED") {
        return {
          ok: true,
          approvalId,
          status: "PUBLISHED",
          idempotent: true,
          mediaKey: (reread?.Item?.mediaKey as string | undefined) ?? mediaKey,
        };
      }

      return { ok: false, approvalId, status: "RACE_LOST", currentStatus: s };
    }
    throw err;
  }

  await emit("ClosetItemPublished", {
    approvalId,
    publishedAt: now,
    mediaKey,
  });

  return { ok: true, approvalId, status: "PUBLISHED", mediaKey };
};
