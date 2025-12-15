import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME!;
const PK_NAME = process.env.PK_NAME || "pk";
const SK_NAME = process.env.SK_NAME || "sk";
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export const handler = async (event: any) => {
  console.log("[notify-admin] event:", JSON.stringify(event));

  const token = event.token;
  const item = event.item;

  if (!token || !item?.id) {
    throw new Error("Missing task token or item.id");
  }

  const pk = `ITEM#${item.id}`;
  const sk = "META";

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = Math.floor(now.getTime() / 1000) + TOKEN_TTL_SECONDS;

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { [PK_NAME]: pk, [SK_NAME]: sk },

        // ✅ Don’t clobber terminal decisions.
        // ✅ Don’t overwrite an existing outstanding token.
        ConditionExpression:
          "attribute_not_exists(taskToken) AND (attribute_not_exists(#status) OR (#status IN (:new, :pending)))",

        UpdateExpression: `
          SET #status = :pending,
              taskToken = :token,
              taskTokenExpiresAt = :exp,
              approvalRequestedAt = :now,
              processedImageKey = :pkey,
              updatedAt = :now
        `,
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":new": "NEW",
          ":pending": "PENDING",
          ":token": token,
          ":exp": expiresAt,
          ":now": nowIso,
          ":pkey": event.processedImageKey ?? null,
        },
      }),
    );
  } catch (err: any) {
    // If it’s already decided or already has a token, treat as idempotent no-op.
    if (err?.name === "ConditionalCheckFailedException") {
      console.log("[notify-admin] idempotent/no-op (already has token or terminal status)", {
        approvalId: item.id,
      });
      return { ok: true, approvalId: item.id, idempotent: true };
    }
    throw err;
  }

  return { ok: true, approvalId: item.id };
};
