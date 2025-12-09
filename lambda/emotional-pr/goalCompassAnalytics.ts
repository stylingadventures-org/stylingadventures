// lambda/emotional-pr/goalCompassAnalytics.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TABLE_NAME = process.env.TABLE_NAME!;
const PK = process.env.PK_NAME || "pk";
const SK = process.env.SK_NAME || "sk";

function now() {
  return new Date().toISOString();
}

// 🔹 Shared key type for content mix pillars
type ContentPillar = "personality" | "nurture" | "authority" | "conversion";

const DEFAULT_TARGET_MIX: Record<ContentPillar, number> = {
  personality: 30,
  nurture: 30,
  authority: 20,
  conversion: 20,
};

/**
 * Very lightweight Emotional PR Engine analytics stub.
 *
 * Input shape (from Step Functions):
 *   { "creatorId": "sub-123" }
 *
 * Later you can extend this to look at:
 * - CreatorPrItem rows for that creator
 * - Recent content performance from AnalyticsStack
 * - Emotional tone labels from the Emotional PR Engine
 */
export const handler = async (event: any) => {
  const creatorId: string =
    event?.creatorId ||
    event?.creatorSub ||
    event?.userId ||
    event?.userSub;

  if (!creatorId) {
    throw new Error("creatorId is required");
  }

  const pkValue = `CREATOR#${creatorId}`;
  const skValue = "GOAL_COMPASS";

  const nowIso = now();

  // 1) Load existing compass (if none, nothing to update)
  const getRes = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: pkValue,
        [SK]: skValue,
      },
    }),
  );

  if (!getRes.Item) {
    // No compass yet; nothing to do for this creator
    return {
      ok: false,
      reason: "NO_GOAL_COMPASS",
      creatorId,
    };
  }

  const compass = getRes.Item as any;

  // 🔹 Normalize to a fully-typed target mix
  const targetMix: Record<ContentPillar, number> = {
    personality:
      compass.contentMixTarget?.personality ??
      DEFAULT_TARGET_MIX.personality,
    nurture:
      compass.contentMixTarget?.nurture ??
      DEFAULT_TARGET_MIX.nurture,
    authority:
      compass.contentMixTarget?.authority ??
      DEFAULT_TARGET_MIX.authority,
    conversion:
      compass.contentMixTarget?.conversion ??
      DEFAULT_TARGET_MIX.conversion,
  };

  // 2) TODO: calculate actual mix based on real data.
  // For now, simulate a slightly wobbly mix around the target.
  const wobble = (value: number, delta: number) => {
    const min = Math.max(0, value - delta);
    const max = value + delta;
    return Math.round(min + Math.random() * (max - min));
  };

  const contentMixActual: Record<ContentPillar, number> = {
    personality: wobble(targetMix.personality, 10),
    nurture: wobble(targetMix.nurture, 10),
    authority: wobble(targetMix.authority, 10),
    conversion: wobble(targetMix.conversion, 10),
  };

  // Simple heuristic for weeklyPathStatus
  const deviation = (field: ContentPillar) => {
    const t = targetMix[field] ?? 0;
    const a = contentMixActual[field] ?? 0;
    return Math.abs(a - t);
  };

  const maxDeviation = Math.max(
    deviation("personality"),
    deviation("nurture"),
    deviation("authority"),
    deviation("conversion"),
  );

  let weeklyPathStatus = "ON_PATH";
  if (maxDeviation > 25) {
    weeklyPathStatus = "OFF_PATH";
  } else if (maxDeviation > 15) {
    weeklyPathStatus = "SLIGHTLY_OFF";
  }

  // 3) Persist back to the GOAL_COMPASS item
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        [PK]: pkValue,
        [SK]: skValue,
      },
      UpdateExpression:
        "SET #contentMixActual = :contentMixActual, #weeklyPathStatus = :weeklyPathStatus, #lastWeeklyCheckAt = :now",
      ExpressionAttributeNames: {
        "#contentMixActual": "contentMixActual",
        "#weeklyPathStatus": "weeklyPathStatus",
        "#lastWeeklyCheckAt": "lastWeeklyCheckAt",
      },
      ExpressionAttributeValues: {
        ":contentMixActual": contentMixActual,
        ":weeklyPathStatus": weeklyPathStatus,
        ":now": nowIso,
      },
    }),
  );

  return {
    ok: true,
    creatorId,
    contentMixActual,
    weeklyPathStatus,
    lastWeeklyCheckAt: nowIso,
  };
};
