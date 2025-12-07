// lambda/creator/ai.ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const STORY_SCHEDULER_ARN = process.env.STORY_SCHEDULER_ARN || "";
const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ||
  "anthropic.claude-3-5-sonnet-20240620-v1:0";
const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION;

// ---------- tier helpers --------------------------------------------

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

// ---------- Bedrock client ------------------------------------------

const bedrock =
  BEDROCK_REGION && BEDROCK_MODEL_ID
    ? new BedrockRuntimeClient({ region: BEDROCK_REGION })
    : null;

type CreatorAiKind = "CAPTION" | "HASHTAGS" | "OTHER";

async function callClaudeSuggestions(
  text: string,
  kind: CreatorAiKind,
): Promise<string[]> {
  if (!bedrock) {
    throw new Error("Bedrock not configured");
  }

  const userInstruction =
    kind === "CAPTION"
      ? `You are helping a fashion content creator write short social captions.
Return a JSON array of 2-4 caption strings only. Each caption should be under 120 characters and feel natural on TikTok/IG. Base them on this context:\n\n"${text}"`
      : kind === "HASHTAGS"
        ? `You are helping a fashion creator pick hashtags.
Return a JSON array of 2-3 strings. Each string should be a space-separated list of 4-7 hashtags. Base them on this context:\n\n"${text}"`
        : `You are helping a fashion content creator with planning and hooks.
Return a JSON array of 2-4 short suggestion strings. Each suggestion should be under 160 characters. Base them on this context:\n\n"${text}"`;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 256,
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: userInstruction }],
      },
    ],
  };

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: Buffer.from(JSON.stringify(body)),
    }),
  );

  const payload = JSON.parse(
    new TextDecoder("utf-8").decode(res.body),
  ) as any;

  const textContent: string =
    payload?.output?.messages?.[0]?.content?.[0]?.text ??
    payload?.content?.[0]?.text ??
    "";

  // Expecting a JSON array – but be defensive.
  try {
    const parsed = JSON.parse(textContent);
    if (Array.isArray(parsed)) {
      return parsed.map((s) => String(s));
    }
  } catch {
    // if model didn't follow instructions, fall back to splitting lines
  }

  return textContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

// ---------- handler --------------------------------------------------

export const handler = async (event: any) => {
  console.log("CreatorAiFn event", JSON.stringify(event));
  const fieldName = event.info?.fieldName as string | undefined;
  const identity = event.identity;

  requireCreator(identity);

  switch (fieldName) {
    case "creatorAiSuggest": {
      const { text = "", kind = "OTHER" } = event.arguments || {};
      const k: CreatorAiKind =
        kind === "CAPTION" || kind === "HASHTAGS" ? kind : "OTHER";

      // Try Bedrock first
      try {
        const suggestions = await callClaudeSuggestions(text, k);
        if (suggestions.length) {
          return { suggestions };
        }
      } catch (err) {
        console.error("[CreatorAiFn] Bedrock error", err);
        // fall through to stubs
      }

      // Fallback suggestions if Bedrock is unavailable or misconfigured
      if (k === "CAPTION") {
        return {
          suggestions: [
            `✨ ${text || "New look"} — styled by you.`,
            `Outfit check: ${text || "today's fit"} ✨`,
          ],
        };
      }
      if (k === "HASHTAGS") {
        return {
          suggestions: ["#stylelala #outfitideas #creatorstudio"],
        };
      }
      return {
        suggestions: [
          "Try a short, punchy hook plus 3 strong hashtags.",
        ],
      };
    }

    default:
      throw new Error(`Unsupported field in CreatorAiFn: ${fieldName}`);
  }
};
