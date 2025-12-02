// lambda/prime/mock-social-feed.ts

/**
 * Prime Studios - Mock Social Feed Generator
 *
 * Purpose:
 *  - Generate IG Reels / YT Shorts style embeds for immersive story UI.
 *  - Internal-only helper for Prime Studios tools / preview UIs.
 *
 * Behavior:
 *  - GENERATE_FEED: returns a list of "posts" tied to an episode / story.
 *  - GET_POST: returns a single mock post by ID.
 *
 * This is intentionally mock-only for now (no DB writes).
 */

export type MockSocialAction = "GENERATE_FEED" | "GET_POST";

export interface GenerateFeedInput {
  episodeId?: string;
  storyId?: string;
  characterId?: string;
  count?: number; // default 6
}

export interface GetPostInput {
  postId: string;
}

export interface MockSocialFeedEvent {
  action: MockSocialAction;
  generateFeed?: GenerateFeedInput;
  getPost?: GetPostInput;
}

export type SocialPlatform = "instagram_reel" | "youtube_short" | "tiktok";

export interface MockSocialPost {
  postId: string;
  platform: SocialPlatform;

  // Link targets (front-end can turn into embeds)
  shareUrl: string;
  thumbnailUrl: string;

  // Episode / story context
  episodeId?: string;
  storyId?: string;
  characterId?: string;

  // Pretty UI bits
  title: string;
  caption: string;
  durationSeconds: number;

  // Fake performance metrics for UI testing
  views: number;
  likes: number;
  comments: number;

  createdAt: string;

  // Optional: CTA that can deep-link back into your episode UI
  cta?: {
    label: string;
    type: "WATCH_EPISODE" | "SHOP_OUTFIT" | "JOIN_POLL" | "FOLLOW_CHARACTER";
    targetId?: string;
  };
}

export interface GenerateFeedResult {
  kind: "feed";
  posts: MockSocialPost[];
}

export interface GetPostResult {
  kind: "post";
  post: MockSocialPost;
}

export type MockSocialResult = GenerateFeedResult | GetPostResult;

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function pickPlatform(idx: number): SocialPlatform {
  const platforms: SocialPlatform[] = [
    "instagram_reel",
    "youtube_short",
    "tiktok",
  ];
  return platforms[idx % platforms.length];
}

function fakeMetrics(seed: number) {
  // Very simple deterministic-ish metrics so the UI has stable-ish values
  const base = 1_000 + seed * 137;
  return {
    views: base,
    likes: Math.floor(base * 0.18),
    comments: Math.floor(base * 0.03),
  };
}

function buildMockPost(
  idx: number,
  ctx: { episodeId?: string; storyId?: string; characterId?: string },
): MockSocialPost {
  const platform = pickPlatform(idx);
  const postId = randomId("post");
  const createdAt = nowIso();
  const metrics = fakeMetrics(idx + 1);

  const episodeTag = ctx.episodeId ? `EP ${ctx.episodeId}` : "Prime Studios";
  const charTag = ctx.characterId ? `with ${ctx.characterId}` : "with the Besties";

  const title = `${episodeTag}: Scene ${idx + 1}`;
  const caption = `POV: You just unlocked a new outfit ${charTag} ✨`;

  const ctaType: NonNullable<MockSocialPost["cta"]>["type"] =
    idx % 3 === 0
      ? "WATCH_EPISODE"
      : idx % 3 === 1
      ? "SHOP_OUTFIT"
      : "JOIN_POLL";

  return {
    postId,
    platform,
    shareUrl: `https://prime.stylingadventures.local/${platform}/${postId}`,
    thumbnailUrl: `https://prime.stylingadventures.local/thumbs/${postId}.jpg`,

    episodeId: ctx.episodeId,
    storyId: ctx.storyId,
    characterId: ctx.characterId,

    title,
    caption,
    durationSeconds: 12 + (idx % 8), // 12–19s shorts

    views: metrics.views,
    likes: metrics.likes,
    comments: metrics.comments,

    createdAt,

    cta: {
      label:
        ctaType === "WATCH_EPISODE"
          ? "Watch episode"
          : ctaType === "SHOP_OUTFIT"
          ? "Shop the look"
          : "Vote in poll",
      type: ctaType,
      targetId:
        ctaType === "WATCH_EPISODE"
          ? ctx.episodeId
          : ctaType === "SHOP_OUTFIT"
          ? "outfit-placeholder"
          : "poll-placeholder",
    },
  };
}

// ─────────────────────────────────────────────
// action handlers
// ─────────────────────────────────────────────

async function handleGenerateFeed(
  input: GenerateFeedInput,
): Promise<GenerateFeedResult> {
  const count = input.count && input.count > 0 ? input.count : 6;

  const posts: MockSocialPost[] = [];
  for (let i = 0; i < count; i++) {
    posts.push(
      buildMockPost(i, {
        episodeId: input.episodeId,
        storyId: input.storyId,
        characterId: input.characterId,
      }),
    );
  }

  console.log(
    "MockSocialFeed GENERATE_FEED:",
    JSON.stringify({ input, postsCount: posts.length }, null, 2),
  );

  return { kind: "feed", posts };
}

async function handleGetPost(input: GetPostInput): Promise<GetPostResult> {
  if (!input.postId) {
    throw new Error("MockSocialFeed GET_POST: missing postId");
  }

  // For now, we just generate a deterministic-ish mock post from the ID.
  const idxSeed = Math.abs(hashStringToInt(input.postId)) % 10;

  const post = buildMockPost(idxSeed, {
    episodeId: undefined,
    storyId: undefined,
    characterId: undefined,
  });

  // Override the auto id so the returned post matches the requested ID.
  post.postId = input.postId;
  post.shareUrl = `https://prime.stylingadventures.local/reels/${input.postId}`;
  post.thumbnailUrl = `https://prime.stylingadventures.local/thumbs/${input.postId}.jpg`;

  console.log(
    "MockSocialFeed GET_POST:",
    JSON.stringify({ input, post }, null, 2),
  );

  return { kind: "post", post };
}

// Simple deterministic hash for GET_POST so metrics feel stable-ish.
function hashStringToInt(str: string): number {
  let hash = 0;
  for (const ch of str) {
    hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  }
  // make non-negative
  return hash >>> 0;
}

// ─────────────────────────────────────────────
// Lambda handler
// ─────────────────────────────────────────────

export const handler = async (
  event: MockSocialFeedEvent,
): Promise<MockSocialResult> => {
  console.log(
    "MockSocialFeed incoming event:",
    JSON.stringify(event, null, 2),
  );

  if (!event || !event.action) {
    throw new Error("MockSocialFeed: missing action");
  }

  switch (event.action) {
    case "GENERATE_FEED":
      if (!event.generateFeed) {
        throw new Error(
          "MockSocialFeed GENERATE_FEED: missing 'generateFeed' payload",
        );
      }
      return handleGenerateFeed(event.generateFeed);

    case "GET_POST":
      if (!event.getPost) {
        throw new Error(
          "MockSocialFeed GET_POST: missing 'getPost' payload",
        );
      }
      return handleGetPost(event.getPost);

    default:
      throw new Error(
        `MockSocialFeed: unsupported action ${(event as any).action}`,
      );
  }
};
