import { v4 as uuid } from "uuid";

export const handler = async (event: any) => {
  const { creatorId, goalCompass, niche, platforms, trendSignals } =
    event;

  const ideas = (trendSignals ?? []).map(
    (t: any, index: number) => ({
      id: uuid(),
      title: `Idea ${index + 1}: ${t.label}`,
      hook: `Hook around: ${t.description}`,
      outline: ["Hook", "Main beat 1", "Main beat 2", "CTA"],
      recommendedPlatform: platforms[0] ?? "TIKTOK",
      recommendedLengthSec: 30,
    }),
  );

  return {
    creatorId,
    niche,
    platforms,
    trendBriefs: trendSignals,
    contentIdeas: ideas,
  };
};
