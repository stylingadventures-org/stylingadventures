/* eslint-env node */
const {
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");

const REGION = process.env.AWS_REGION || "us-east-1";
const argTable = process.argv[2] && process.argv[2].trim();
const TABLE = argTable || process.env.CLOSET_TABLE || process.env.APP_TABLE;

if (!TABLE) {
  console.error(
    "Usage: node scripts/backfill-userId.cjs <TableName>\n" +
      "Or set CLOSET_TABLE / APP_TABLE env var.",
  );
  process.exit(1);
}

const client = new DynamoDBClient({ region: REGION });

/**
 * Returns a userId candidate from the item.
 * 1) ownerSub
 * 2) pk that looks like USER#<sub>
 */
function deriveUserId(item) {
  // Dynamo returns AttributeValue map { S: "..." }
  const ownerSub = item.ownerSub && (item.ownerSub.S || item.ownerSub.s);
  if (ownerSub) return ownerSub;

  const pk =
    (item.pk && (item.pk.S || item.pk.s)) ||
    (item.PK && (item.PK.S || item.PK.s));
  if (pk && String(pk).startsWith("USER#")) {
    return String(pk).slice(5);
  }
  return null;
}

async function ensureKeyShape() {
  const desc = await client.send(new DescribeTableCommand({ TableName: TABLE }));
  const ks = desc.Table.KeySchema || [];
  const names = ks.map((k) => k.AttributeName).sort().join(",");
  if (names !== "pk,sk" && names !== "PK,SK") {
    console.error(
      `This script expects a composite key (pk, sk). Found: ${names || "(none)"}`,
    );
    console.error(
      "If your key names differ, tweak the code that builds the UpdateItem Key.",
    );
  }
}

async function run() {
  console.log(`Backfilling userId in table: ${TABLE}`);

  await ensureKeyShape();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  let ExclusiveStartKey;
  do {
    // Restrict to items that look like closet entries by sk prefix.
    // If your closet items use a different pattern, update the FilterExpression.
    const params = {
      TableName: TABLE,
      // Projection keeps the page small
      ProjectionExpression: "pk, sk, ownerSub, userId",
      FilterExpression:
        "attribute_not_exists(#uid) AND begins_with(#sk, :closetPrefix)",
      ExpressionAttributeNames: {
        "#uid": "userId",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":closetPrefix": { S: "CLOSET#" },
      },
      ExclusiveStartKey,
      Limit: 100, // adjust page size as needed
    };

    const page = await client.send(new ScanCommand(params));
    ExclusiveStartKey = page.LastEvaluatedKey;

    for (const item of page.Items || []) {
      scanned++;
      const userId = deriveUserId(item);
      if (!userId) {
        skipped++;
        continue;
      }

      const pk = item.pk?.S || item.PK?.S;
      const sk = item.sk?.S || item.SK?.S;
      if (!pk || !sk) {
        skipped++;
        continue;
      }

      await client.send(
        new UpdateItemCommand({
          TableName: TABLE,
          Key: { pk: { S: pk }, sk: { S: sk } },
          UpdateExpression:
            "SET #uid = :u, updatedAt = :now",
          ExpressionAttributeNames: {
            "#uid": "userId",
          },
          ExpressionAttributeValues: {
            ":u": { S: userId },
            ":now": { S: new Date().toISOString() },
          },
          // Idempotent: only set if not already there
          ConditionExpression: "attribute_not_exists(#uid)",
        }),
      );

      updated++;
      if (updated % 25 === 0) {
        process.stdout.write(`\rScanned: ${scanned}  Updated: ${updated}  Skipped: ${skipped}`);
      }
    }
  } while (ExclusiveStartKey);

  console.log(
    `\nDone. Scanned: ${scanned}  Updated: ${updated}  Skipped: ${skipped}`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
