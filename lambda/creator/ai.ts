const STORY_SCHEDULER_ARN = process.env.STORY_SCHEDULER_ARN || "";

type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

function getUserTier(identity: any): UserTier {
  const claims = identity?.claims || {};
  const tierClaim =
    (claims["custom:tier"] as string | undefined) ||
    (claims["tier"] as string | undefined);

  const rawGroups = claims["cognito:groups"];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("COLLAB")) return "COLLAB";
  if (groups.includes("PRIME")) return "PRIME";
  if (groups.includes("CREATOR")) return "CREATOR";
  if (groups.includes("BESTIE")) return "BESTIE";

  if (
    tierClaim &&
    ["FREE", "BESTIE", "CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(
      tierClaim,
    )
  ) {
    return tierClaim as UserTier;
  }

  return "FREE";
}

function requireCreator(identity: any): UserTier {
  const tier = getUserTier(identity);
  if (!["CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(tier)) {
    throw new Error("Creator tier required");
  }
  return tier;
}

export const handler = async (event: any) => {
  console.log("CreatorAiFn event", JSON.stringify(event));
  const fieldName = event.info?.fieldName as string | undefined;
  const identity = event.identity;

  requireCreator(identity);

  switch (fieldName) {
    case "creatorAiSuggest": {
      const { text, kind } = event.arguments || {};
      // Stubbed responses – later we can plug in OpenAI / Bedrock
      if (kind === "CAPTION") {
        return {
          suggestions: [
            `✨ ${text || "New look"} — styled by you.`,
            `Outfit check: ${text || "today's fit"} ✨`,
          ],
        };
      }
      if (kind === "HASHTAGS") {
        return {
          suggestions: ["#stylelala", "#outfitoftheday", "#creatorbestie"],
        };
      }
      return {
        suggestions: ["Try a short, punchy hook + 3 strong hashtags."],
      };
    }

    default:
      throw new Error(`Unsupported field in CreatorAiFn: ${fieldName}`);
  }
};
