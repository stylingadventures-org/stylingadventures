// site/src/routes/creator/create/DirectorSuite.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { runGraphQL } from "../../../api/runGraphQL";

const DEFAULT_SCENES = [
  {
    id: "scene-1",
    title: "Hook shot",
    shotType: "Talking head",
    location: "Desk / creator corner",
    mood: "High-energy, friendly",
    beats: "Introduce the problem in 3–5 seconds.",
  },
  {
    id: "scene-2",
    title: "B-roll overlay",
    shotType: "B-roll",
    location: "Closet / mirror",
    mood: "Aesthetic, clean",
    beats: "Visual proof of transformation or product in use.",
  },
];

// Fallback compass if nothing loaded yet (mirrors backend defaults loosely)
const DEFAULT_COMPASS = {
  primaryGoal: "Growth / reach",
  timeHorizon: "90 days",
  weeklyCapacity: 5,
  focusAreas: ["Personality hooks", "Nurture"],
  riskTolerance: "Medium",
  notes: "",
};

const CREATOR_GOAL_COMPASS_QUERY = `
  query CreatorGoalCompass {
    creatorGoalCompass {
      primaryGoal
      timeHorizon
      weeklyCapacity
      focusAreas
      riskTolerance
      notes
      updatedAt
    }
  }
`;

// Shoot plan persistence
const GET_DIRECTOR_SHOOT_PLAN = `
  query GetDirectorShootPlan($id: ID!) {
    getDirectorShootPlan(id: $id) {
      id
      shootName
      primaryPlatform
      objective
      scenes {
        id
        title
        shotType
        location
        mood
        beats
      }
    }
  }
`;

const SAVE_DIRECTOR_SHOOT_PLAN = `
  mutation SaveDirectorShootPlan($input: SaveDirectorShootPlanInput!) {
    saveDirectorShootPlan(input: $input) {
      id
      updatedAt
    }
  }
`;

// 🔹 Emotional PR Engine – text-only preview for current plan
const EMOTION_CHECK_MUTATION = `
  mutation RunCreatorEmotionCheck($input: CreatorEmotionAnalysisInput!) {
    runCreatorEmotionCheck(input: $input) {
      id
      emotionalToneLabels
      audienceResponseLabel
      brandAlignmentScore
      prRiskLevel
      createdAt
    }
  }
`;

// 🔹 Emotional PR Engine – weekly content mix preview
// NOTE: If your schema exposes contentMixActual as top-level fields (not nested),
// drop the inner { ... } block and just select the scalar fields directly.
const RUN_CREATOR_EMOTION_CHECK = `
  mutation RunCreatorEmotionCheck {
    runCreatorEmotionCheck {
      ok
      weeklyPathStatus
      lastWeeklyCheckAt
      contentMixActual {
        personality
        nurture
        authority
        conversion
      }
    }
  }
`;

// Real GraphQL loader using your client
async function loadCreatorGoalCompass() {
  const res = await runGraphQL(CREATOR_GOAL_COMPASS_QUERY, {});
  const compass =
    (res && res.data && res.data.creatorGoalCompass) ||
    (res && res.creatorGoalCompass) ||
    null;

  // We still return null here so the UI can show the "no compass yet" CTA.
  return compass;
}

function computeOptimizationAdvice(compass, scenes) {
  // At this point we always have *some* compass (real or DEFAULT_COMPASS).
  const primary = (compass.primaryGoal || "").toLowerCase();
  const focus = (compass.focusAreas || []).map((f) => f.toLowerCase());

  let modeLabel = "Balanced mode";
  let summary =
    "You’re running a balanced content strategy. Keep hooks clear, deliver value fast, and don’t forget a simple CTA.";
  let bullets = [
    "Make sure your first 3 seconds clearly show what’s in it for the viewer.",
    "Use at least one scene that’s just visual delight (no talking).",
    "End with a clear, low-friction next step (save, follow, or click).",
  ];

  if (primary.includes("growth")) {
    modeLabel = "Growth mode";
    summary =
      "You’re in Growth mode — prioritize thumb-stopping hooks and fast pacing. Every scene should earn its place.";
    bullets = [
      "Test 1–2 different hook lines for the same idea.",
      "Keep scenes short and punchy; cut any filler beats.",
      "Use dynamic B-roll and quick cuts to keep attention high.",
    ];
  } else if (primary.includes("trust")) {
    modeLabel = "Trust & nurture mode";
    summary =
      "You’re in Nurture mode — let scenes breathe, show more behind-the-scenes, and prioritize honesty over hype.";
    bullets = [
      "Add at least one scene where you share a personal story or struggle.",
      "Show imperfect, real moments (bloopers, small mistakes, process).",
      "Give more context instead of rushing from hook → CTA.",
    ];
  } else if (primary.includes("authority")) {
    modeLabel = "Authority mode";
    summary =
      "You’re in Authority mode — lean into structured teaching and proof. Scenes should make you the obvious expert.";
    bullets = [
      "Include a clear ‘framework’ or ‘3-step’ breakdown scene.",
      "Add proof: results, transformations, or screenshots.",
      "Use captions/overlays to highlight key points as text.",
    ];
  } else if (primary.includes("conversion") || primary.includes("sales")) {
    modeLabel = "Conversion mode";
    summary =
      "You’re in Conversion mode — clarify the offer, show proof, and remove objections with your scenes.";
    bullets = [
      "Add a scene that explicitly names the offer and who it’s for.",
      "Include before/after or testimonial-style proof scenes.",
      "End with a very specific CTA: where to click and what they get.",
    ];
  }

  const sceneHints = {};
  for (const scene of scenes) {
    const titleLower = (scene.title || "").toLowerCase();
    const shotLower = (scene.shotType || "").toLowerCase();

    const isHook =
      titleLower.includes("hook") || titleLower.includes("intro");
    const isBroll =
      shotLower.includes("b-roll") ||
      shotLower.includes("broll") ||
      titleLower.includes("b-roll");
    const isCTA =
      titleLower.includes("cta") ||
      titleLower.includes("outro") ||
      titleLower.includes("call to action");

    if (isHook) {
      if (primary.includes("growth")) {
        sceneHints[scene.id] =
          "Growth mode hook: lead with the problem in 1–3 seconds, then promise the payoff. Avoid long intros.";
      } else if (primary.includes("trust")) {
        sceneHints[scene.id] =
          "Trust mode hook: speak directly and warmly, hint at the story you’re about to share.";
      } else if (primary.includes("authority")) {
        sceneHints[scene.id] =
          "Authority hook: state the big promise and your angle. Example: “3 styling rules I give every client.”";
      } else if (primary.includes("conversion") || primary.includes("sales")) {
        sceneHints[scene.id] =
          "Conversion hook: call out your ideal viewer and the outcome. Example: “Creators who hate selling, this is for you.”";
      } else {
        sceneHints[scene.id] =
          "Make sure your hook makes a clear promise and visually shows what’s coming.";
      }
    } else if (isBroll) {
      if (focus.some((f) => f.includes("personality"))) {
        sceneHints[scene.id] =
          "Let your personality peek through here — add small gestures, smiles, or playful movements in the B-roll.";
      } else if (focus.some((f) => f.includes("nurture"))) {
        sceneHints[scene.id] =
          "Use B-roll to show process and context, not just the final look. Viewers love seeing how it comes together.";
      } else if (primary.includes("conversion")) {
        sceneHints[scene.id] =
          "Make sure B-roll clearly shows the product or outcome as if the viewer already said “yes.”";
      } else {
        sceneHints[scene.id] =
          "Use B-roll to add movement and visual interest so your talking scenes don’t have to carry everything.";
      }
    } else if (isCTA) {
      if (primary.includes("growth")) {
        sceneHints[scene.id] =
          "Ask for the lightest lift CTA: save, follow, or comment — not a big purchase.";
      } else if (primary.includes("conversion")) {
        sceneHints[scene.id] =
          "Repeat the key benefit once more, then give a very specific CTA (where to tap and what happens).";
      } else {
        sceneHints[scene.id] =
          "Tie your CTA back to the emotional payoff of the video, not just the action.";
      }
    } else {
      sceneHints[scene.id] =
        "Use this scene to either deepen the story, show process, or answer a silent objection your viewer might have.";
    }
  }

  return {
    modeLabel,
    summary,
    bullets,
    sceneHints,
  };
}

function describeWeeklyStatus(status) {
  switch (status) {
    case "ON_PATH":
      return {
        label: "On path",
        copy: "Your emotional mix is roughly matching your Goal Compass targets this week.",
      };
    case "SLIGHTLY_OFF":
      return {
        label: "Slightly off",
        copy: "You’re leaning a bit too hard into one pillar. Consider balancing your next few posts.",
      };
    case "OFF_PATH":
      return {
        label: "Off path",
        copy: "This week’s content is drifting from your plan. Use upcoming shoots to rebalance your mix.",
      };
    default:
      return {
        label: "No data yet",
        copy: "Run a check to see how your recent content compares to your Goal Compass.",
      };
  }
}

const SHOOT_PLAN_ID = "default";

export default function DirectorSuite() {
  const navigate = useNavigate();

  const [shootName, setShootName] = useState("Today’s shoot");
  const [platform, setPlatform] = useState("TikTok / Reels");
  const [goal, setGoal] = useState("Growth / reach");
  const [scenes, setScenes] = useState(DEFAULT_SCENES);
  const [newScene, setNewScene] = useState({
    title: "",
    shotType: "",
    location: "",
    mood: "",
    beats: "",
  });

  const [compass, setCompass] = useState(null);
  const [compassLoading, setCompassLoading] = useState(true);
  const [compassError, setCompassError] = useState(null);

  const [initialPlanLoaded, setInitialPlanLoaded] = useState(false);

  // 🔹 Emotion insight state (per-plan, text-only preview)
  const [emotionInsightLoading, setEmotionInsightLoading] = useState(false);
  const [emotionInsightError, setEmotionInsightError] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);

  // 🔹 Weekly emotion preview state (Emotional PR Engine – content mix / Goal Compass)
  const [emotionPreview, setEmotionPreview] = useState(null);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [emotionError, setEmotionError] = useState(null);

  // Load Goal Compass
  useEffect(() => {
    let cancelled = false;
    async function fetchCompass() {
      setCompassLoading(true);
      setCompassError(null);
      try {
        const data = await loadCreatorGoalCompass();
        if (!cancelled) {
          setCompass(data);
        }
      } catch (err) {
        console.error("Failed to load creatorGoalCompass", err);
        if (!cancelled) {
          setCompassError("Couldn’t load your Goal Compass yet.");
        }
      } finally {
        if (!cancelled) setCompassLoading(false);
      }
    }
    fetchCompass();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load existing shoot plan (if any)
  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const res = await runGraphQL(GET_DIRECTOR_SHOOT_PLAN, {
          id: SHOOT_PLAN_ID,
        });

        const plan =
          (res && res.data && res.data.getDirectorShootPlan) ||
          (res && res.getDirectorShootPlan) ||
          null;

        if (cancelled || !plan) {
          return;
        }

        if (plan.shootName) setShootName(plan.shootName);
        if (plan.primaryPlatform) setPlatform(plan.primaryPlatform);
        if (plan.objective) setGoal(plan.objective);

        if (Array.isArray(plan.scenes) && plan.scenes.length > 0) {
          setScenes(
            plan.scenes.map((s, idx) => ({
              id: s.id || `scene-${idx + 1}`,
              title: s.title || "Untitled scene",
              shotType: s.shotType || "Not set",
              location: s.location || "Not set",
              mood: s.mood || "Not set",
              beats: s.beats || "",
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load director shoot plan", err);
      } finally {
        if (!cancelled) setInitialPlanLoaded(true);
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  // Autosave shoot plan whenever it changes (after initial load)
  useEffect(() => {
    if (!initialPlanLoaded) return;

    const handle = setTimeout(async () => {
      try {
        const input = {
          id: SHOOT_PLAN_ID,
          shootName,
          primaryPlatform: platform,
          objective: goal,
          scenes: scenes.map((s) => ({
            id: s.id,
            title: s.title,
            shotType: s.shotType,
            location: s.location,
            mood: s.mood,
            beats: s.beats,
          })),
        };

        await runGraphQL(SAVE_DIRECTOR_SHOOT_PLAN, { input });
      } catch (err) {
        console.error("Failed to save director shoot plan", err);
      }
    }, 1000); // debounce 1s

    return () => clearTimeout(handle);
  }, [shootName, platform, goal, scenes, initialPlanLoaded]);

  const optimization = useMemo(
    () => computeOptimizationAdvice(compass || DEFAULT_COMPASS, scenes),
    [compass, scenes],
  );

  function handleNewSceneChange(field, value) {
    setNewScene((prev) => ({ ...prev, [field]: value }));
  }

  function addScene(e) {
    e.preventDefault();
    const title = newScene.title.trim();
    if (!title) return;

    const id = `scene-${Date.now()}`;
    setScenes((prev) => [
      ...prev,
      {
        id,
        title,
        shotType: newScene.shotType.trim() || "Not set",
        location: newScene.location.trim() || "Not set",
        mood: newScene.mood.trim() || "Not set",
        beats: newScene.beats.trim() || "",
      },
    ]);

    setNewScene({
      title: "",
      shotType: "",
      location: "",
      mood: "",
      beats: "",
    });
  }

  function deleteScene(id) {
    if (!window.confirm("Remove this scene from the shot list?")) return;
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }

  // 🔹 Emotion preview handler (per-plan, text input to Emotional PR Engine)
  async function handleEmotionPreview() {
    setEmotionInsightLoading(true);
    setEmotionInsightError(null);
    setEmotionResult(null);

    try {
      const firstScene = scenes[0];
      const textPieces = [
        shootName,
        goal,
        firstScene?.title,
        firstScene?.beats,
      ].filter(Boolean);

      const text = textPieces.join(" • ");

      const res = await runGraphQL(EMOTION_CHECK_MUTATION, {
        input: {
          text,
          platform,
          purpose: "DIRECTOR_SUITE_PREVIEW",
        },
      });

      const insight =
        (res && res.data && res.data.runCreatorEmotionCheck) ||
        (res && res.runCreatorEmotionCheck) ||
        null;

      setEmotionResult(insight);
    } catch (err) {
      console.error("Emotion preview failed", err);
      setEmotionInsightError("Couldn’t read the vibe yet.");
    } finally {
      setEmotionInsightLoading(false);
    }
  }

  // 🔹 Weekly emotion preview handler (Goal Compass vs actual content mix)
  async function runEmotionPreviewCheck() {
    setEmotionLoading(true);
    setEmotionError(null);

    try {
      const res = await runGraphQL(RUN_CREATOR_EMOTION_CHECK, {});
      const payload =
        (res && res.data && res.data.runCreatorEmotionCheck) ||
        (res && res.runCreatorEmotionCheck) ||
        null;

      if (!payload || !payload.ok) {
        setEmotionError("Couldn’t refresh emotion preview yet.");
        setEmotionPreview(null);
      } else {
        setEmotionPreview(payload);
      }
    } catch (err) {
      console.error("Failed to runCreatorEmotionCheck", err);
      setEmotionError("Something went wrong running the emotion check.");
      setEmotionPreview(null);
    } finally {
      setEmotionLoading(false);
    }
  }

  // Auto-run weekly check once when Goal Compass exists
  useEffect(() => {
    if (compass && !emotionPreview && !emotionLoading && !emotionError) {
      runEmotionPreviewCheck();
    }
  }, [compass, emotionPreview, emotionLoading, emotionError]);

  const emotionTone =
    emotionResult?.emotionalToneLabels &&
    emotionResult.emotionalToneLabels.length > 0
      ? emotionResult.emotionalToneLabels.join(", ")
      : null;
  const emotionRisk = emotionResult?.prRiskLevel || "LOW";
  const emotionScore = emotionResult?.brandAlignmentScore;

  const riskChipStyle =
    emotionRisk === "HIGH"
      ? { background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C" }
      : emotionRisk === "MEDIUM"
      ? { background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E" }
      : { background: "#ECFDF3", borderColor: "#BBF7D0", color: "#166534" };

  return (
    <section className="creator-page">
      {/* Header */}
      <header className="creator-page__header">
        <span className="creator-page__kicker">Create · Director Suite</span>
        <h1 className="creator-page__title">Director Suite</h1>
        <p className="creator-page__subtitle">
          Turn ideas into a concrete shot list. Plan your hooks, B-roll, and
          on-set flow so filming feels calm, not chaotic.
        </p>

        <div className="creator-page__header-meta">
          <span className="creator-badge">🎬 Scene planner</span>
          <span className="creator-badge">🎥 Hook + B-roll flow</span>
          <span className="creator-badge">✨ AI scene optimization</span>
        </div>
      </header>

      {/* Body */}
      <div className="creator-page__body">
        <div className="creator-page__row">
          {/* Left column – shoot overview + checklists */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">Today’s production</h2>
              <p className="creator-page__card-subtitle">
                Set your target platform and objective so the rest of the plan
                stays on-brand with your goals.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label className="creator-field-label">Shoot name</label>
                  <input
                    className="creator-input"
                    value={shootName}
                    onChange={(e) => setShootName(e.target.value)}
                    placeholder="e.g. Closet clean-out GRWM"
                  />
                </div>

                <div>
                  <label className="creator-field-label">
                    Primary platform
                  </label>
                  <select
                    className="creator-select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="TikTok / Reels">TikTok / Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="YouTube Longform">YouTube Longform</option>
                    <option value="Instagram Feed">Instagram Feed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="creator-field-label">
                    Objective for this shoot
                  </label>
                  <select
                    className="creator-select"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="Growth / reach">Growth / reach</option>
                    <option value="Trust & nurture">Trust & nurture</option>
                    <option value="Authority content">Authority content</option>
                    <option value="Conversion / sales">
                      Conversion / sales
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">On-set checklist</h2>
              <p className="creator-page__card-subtitle">
                Quick reminders before you press record.
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: "0.85rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <li>Lighting looks clean (no harsh shadows).</li>
                <li>Mic is working and audio is not peaking.</li>
                <li>Outfit and background match your brand aesthetic.</li>
                <li>First line of your hook is decided and practiced.</li>
                <li>Props / products are in reach for B-roll.</li>
              </ul>
            </div>

            {/* Compass snapshot */}
            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">Goal Compass snapshot</h2>
              {compassLoading && (
                <p
                  className="creator-page__card-subtitle"
                  style={{ fontStyle: "italic" }}
                >
                  Loading your Goal Compass…
                </p>
              )}
              {!compassLoading && compassError && (
                <p
                  className="creator-page__card-subtitle"
                  style={{ color: "#B91C1C" }}
                >
                  {compassError}
                </p>
              )}
              {!compassLoading && !compassError && compass && (
                <>
                  <p className="creator-page__card-subtitle">
                    This is how your content strategy is currently set. Scene
                    suggestions below are tuned to this.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: "0.8rem",
                    }}
                  >
                    <span className="creator-badge">
                      🎯 {compass.primaryGoal}
                    </span>
                    <span className="creator-badge">
                      ⏱ Horizon: {compass.timeHorizon}
                    </span>
                    <span className="creator-badge">
                      🧠 Risk: {compass.riskTolerance}
                    </span>
                    <span className="creator-badge">
                      📅 {compass.weeklyCapacity} slots / week
                    </span>
                  </div>
                  {Array.isArray(compass.focusAreas) &&
                    compass.focusAreas.length > 0 && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: "0.78rem",
                          color: "#4B5563",
                        }}
                      >
                        Focus areas:{" "}
                        <strong>{compass.focusAreas.join(" · ")}</strong>
                      </p>
                    )}
                </>
              )}
              {!compassLoading && !compassError && !compass && (
                <>
                  <p className="creator-page__card-subtitle">
                    You haven’t set up your Goal Compass yet. For now, Director
                    Suite assumes a default{" "}
                    <strong>Growth / reach</strong> focus so you can still plan
                    shoots.
                  </p>
                  <button
                    type="button"
                    className="creator-btn creator-btn--primary"
                    onClick={() =>
                      navigate("/creator/align/goal-compass")
                    }
                    style={{ marginTop: 8 }}
                  >
                    Open Lala Goal Compass
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right column – scene board + AI optimization */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Scene board & shot list
              </h2>
              <p className="creator-page__card-subtitle">
                Map out the flow of your video. Start with a hook, add B-roll,
                and end with a clean CTA.
              </p>

              {/* AI-driven scene optimization strip */}
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(236,72,153,0.06))",
                  border: "1px solid rgba(191,219,254,0.9)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#1D4ED8",
                    }}
                  >
                    ✨ AI Scene Optimization{" "}
                    {optimization.modeLabel &&
                      `· ${optimization.modeLabel}${
                        compass ? "" : " (default)"
                      }`}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {compassLoading && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B7280",
                          fontStyle: "italic",
                        }}
                      >
                        loading…
                      </span>
                    )}

                    {/* 🔹 Per-plan emotion preview chip */}
                    <button
                      type="button"
                      className="creator-pill"
                      onClick={handleEmotionPreview}
                      disabled={emotionInsightLoading}
                      style={{
                        cursor: emotionInsightLoading
                          ? "default"
                          : "pointer",
                        opacity: emotionInsightLoading ? 0.7 : 1,
                        borderStyle: "dashed",
                      }}
                    >
                      {emotionInsightLoading
                        ? "Reading vibe…"
                        : "💗 Emotion preview"}
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#374151",
                    margin: 0,
                  }}
                >
                  {optimization.summary}
                </p>

                {/* Emotion result chip */}
                {(emotionResult || emotionInsightError) && (
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {emotionResult && (
                      <span
                        className="creator-pill"
                        style={riskChipStyle}
                        title={
                          emotionResult.audienceResponseLabel ||
                          "How this plan might land with your audience."
                        }
                      >
                        {emotionScore != null && (
                          <strong style={{ marginRight: 4 }}>
                            {emotionScore} / 100
                          </strong>
                        )}
                        {emotionTone || "Neutral tone"} ·{" "}
                        {emotionRisk === "HIGH"
                          ? "High PR risk"
                          : emotionRisk === "MEDIUM"
                          ? "Some PR risk"
                          : "Low PR risk"}
                      </span>
                    )}

                    {emotionInsightError && !emotionResult && (
                      <span
                        className="creator-pill"
                        style={{
                          background: "#FEF2F2",
                          borderColor: "#FECACA",
                          color: "#B91C1C",
                        }}
                      >
                        {emotionInsightError}
                      </span>
                    )}
                  </div>
                )}

                <ul
                  style={{
                    margin: "6px 0 0",
                    paddingLeft: 16,
                    fontSize: "0.78rem",
                    color: "#4B5563",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {optimization.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>

              {/* Emotion preview chip (Emotional PR Engine – weekly content mix) */}
              <div
                style={{
                  marginTop: -4,
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.78rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        color: "#4B5563",
                      }}
                    >
                      🧭 Emotion preview
                    </span>
                    {emotionLoading && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#9CA3AF",
                          fontStyle: "italic",
                        }}
                      >
                        checking…
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: emotionError ? "#B91C1C" : "#6B7280",
                    }}
                  >
                    {emotionError
                      ? emotionError
                      : (() => {
                          const desc = describeWeeklyStatus(
                            emotionPreview?.weeklyPathStatus,
                          );
                          return desc.copy;
                        })()}
                  </span>
                  {emotionPreview?.contentMixActual && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#9CA3AF",
                      }}
                    >
                      Mix this week:{" "}
                      <strong>
                        P{emotionPreview.contentMixActual.personality}% · N
                        {emotionPreview.contentMixActual.nurture}% · A
                        {emotionPreview.contentMixActual.authority}% · C
                        {emotionPreview.contentMixActual.conversion}%
                      </strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="creator-btn creator-btn--ghost"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.72rem",
                    whiteSpace: "nowrap",
                  }}
                  onClick={runEmotionPreviewCheck}
                  disabled={emotionLoading}
                >
                  {emotionPreview ? "Refresh check" : "Run check"}
                </button>
              </div>

              {/* Existing scenes */}
              {scenes.length > 0 && (
                <div
                  className="creator-page__card-grid"
                  style={{ marginTop: 6 }}
                >
                  {scenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      style={{
                        borderRadius: 14,
                        border: "1px solid #E5E7EB",
                        padding: 10,
                        background: "#F9FAFB",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#6B7280",
                          }}
                        >
                          Scene {index + 1}
                        </span>
                        <button
                          type="button"
                          className="creator-btn creator-btn--ghost"
                          style={{ padding: "3px 8px", fontSize: "0.7rem" }}
                          onClick={() => deleteScene(scene.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {scene.title}
                      </div>

                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#4B5563",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span>
                          <strong>Shot:</strong> {scene.shotType}
                        </span>
                        <span>
                          <strong>Location:</strong> {scene.location}
                        </span>
                        <span>
                          <strong>Mood:</strong> {scene.mood}
                        </span>
                      </div>

                      {scene.beats && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: "0.78rem",
                            color: "#6B7280",
                          }}
                        >
                          <strong>Beats:</strong> {scene.beats}
                        </div>
                      )}

                      {/* Per-scene AI hint */}
                      {optimization.sceneHints[scene.id] && (
                        <div
                          style={{
                            marginTop: 6,
                            padding: 6,
                            borderRadius: 10,
                            background: "#EEF2FF",
                            fontSize: "0.75rem",
                            color: "#4338CA",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              marginRight: 4,
                            }}
                          >
                            AI tip:
                          </span>
                          {optimization.sceneHints[scene.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new scene form */}
              <form
                onSubmit={addScene}
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px dashed #E5E7EB",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <label className="creator-field-label">New scene title</label>
                  <input
                    className="creator-input"
                    value={newScene.title}
                    onChange={(e) =>
                      handleNewSceneChange("title", e.target.value)
                    }
                    placeholder="e.g. Intro hook, GRWM step, reveal..."
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label className="creator-field-label">Shot type</label>
                    <input
                      className="creator-input"
                      value={newScene.shotType}
                      onChange={(e) =>
                        handleNewSceneChange("shotType", e.target.value)
                      }
                      placeholder="Talking head, B-roll, POV..."
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label className="creator-field-label">Location</label>
                    <input
                      className="creator-input"
                      value={newScene.location}
                      onChange={(e) =>
                        handleNewSceneChange("location", e.target.value)
                      }
                      placeholder="Desk, mirror, closet, car..."
                    />
                  </div>
                </div>

                <div>
                  <label className="creator-field-label">Mood / direction</label>
                  <input
                    className="creator-input"
                    value={newScene.mood}
                    onChange={(e) =>
                      handleNewSceneChange("mood", e.target.value)
                    }
                    placeholder="High-energy, cozy, aesthetic, chaotic good…"
                  />
                </div>

                <div>
                  <label className="creator-field-label">
                    Key beats / line reminders
                  </label>
                  <textarea
                    className="creator-textarea"
                    value={newScene.beats}
                    onChange={(e) =>
                      handleNewSceneChange("beats", e.target.value)
                    }
                    placeholder="What do you want to say or show in this scene?"
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    className="creator-btn creator-btn--primary"
                    disabled={!newScene.title.trim()}
                  >
                    + Add scene to shot list
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
