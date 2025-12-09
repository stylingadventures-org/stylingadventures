export const handler = async (event: any) => {
  const { creatorId, goalCompass, args } = event;

  const niche =
    args?.input?.nicheOverride ?? "general-creator";

  const platforms: string[] =
    args?.input?.platforms ??
    ["TIKTOK", "INSTAGRAM"];

  // Super simple static “trend signals” until you wire real APIs.
  const trendSignals = [
    {
      label: "Cozy behind-the-scenes",
      description: "Quiet, aesthetic looks into your process.",
      exampleHashtags: ["#bts", "#cozycreator"],
      riskLevel: "LOW",
    },
    {
      label: "Mini-series check-ins",
      description:
        "Short weekly updates about where you are in your journey.",
      exampleHashtags: ["#creatorcheckin"],
      riskLevel: "MEDIUM",
    },
  ];

  return {
    creatorId,
    goalCompass,
    niche,
    platforms,
    trendSignals,
  };
};

