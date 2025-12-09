// site/src/routes/creator/grow/CreatorSocialPulse.jsx
import React, { useEffect, useState, useMemo } from "react";
import { runGraphQL } from "../../../api/runGraphQL";

const CREATOR_GOAL_COMPASS_QUERY = `
  query CreatorGoalCompass {
    creatorGoalCompass {
      primaryGoal
      timeHorizon
      weeklyCapacity
      focusAreas
      riskTolerance
      notes
    }
  }
`;

function fallbackCompass() {
  return {
    primaryGoal: "GROWTH",
    timeHorizon: "90_DAYS",
    weeklyCapacity: 5,
    focusAreas: ["PERSONALITY", "NURTURE"],
    riskTolerance: "MEDIUM",
    notes: null,
  };
}

function buildPulse(compass) {
  const c = compass || fallbackCompass();
  const primary = (c.primaryGoal || "GROWTH").toUpperCase();
  const focus = (c.focusAreas || []).map((f) => String(f).toUpperCase());
  const weekly = c.weeklyCapacity || 5;

  let headline = "This week: short, punchy growth hooks.";
  let theme = "Stack small, scroll-stopping moments that invite new people in.";
  let platformFocus = "Lean into short-form video (TikTok, Reels, Shorts).";
  let suggestedPosts = weekly;
  let angles = [];
  let prompts = [];
  let watchouts = [];

  if (primary === "TRUST") {
    headline = "This week: slower, story-led nurture content.";
    theme =
      "Help your existing audience feel like insiders, not spectators.";
    platformFocus =
      "Use Stories, close friends, and captions that read like mini-essays.";
    angles = [
      "Share a small, honest story about something that almost made you quit.",
      "“What you don’t see” behind a polished look, launch, or post.",
      "One tiny ritual that keeps you grounded as a creator.",
    ];
    prompts = [
      "“If we were on FaceTime right now, I’d tell you about…”",
      "“The part of this creator life that no one in my real life understands is…”",
      "“If you’ve ever felt [emotion], this one’s for you.”",
    ];
    watchouts = [
      "Don’t over-edit: one take, light cuts, and messy details are your friend.",
      "Avoid only giving advice; mix in things you’re still figuring out.",
    ];
  } else if (primary === "AUTHORITY") {
    headline = "This week: crisp teaching and proof-driven content.";
    theme =
      "Show the frameworks and receipts that make you the obvious choice.";
    platformFocus =
      "Carousels, list-style hooks, and side-by-side proof visuals.";
    angles = [
      "“3 rules I give every client before they…”",
      "Before/after breakdown with 3 concrete decisions you made.",
      "My unpopular take on [topic] + why it actually works.",
    ];
    prompts = [
      "“Most creators overcomplicate [topic]. Here’s the simple version I use.”",
      "“I tested this with [X clients / X videos]. Here’s what actually worked.”",
      "“You can skip 6 months of trial + error by doing this instead…”",
    ];
    watchouts = [
      "Don’t bury the result; say it early, then break down the how.",
      "Avoid going too broad—niche frameworks feel more actionable.",
    ];
  } else if (primary === "CONVERSION") {
    headline = "This week: gentle but clear conversion moments.";
    theme =
      "Show the offer, show the proof, and repeat the CTA without feeling spammy.";
    platformFocus =
      "Alternate between value posts and soft pitch posts that name the offer.";
    angles = [
      "Client story broken into: struggle → shift → result → offer CTA.",
      "“Who [offer] is really for” clarity post.",
      "Screen-record walkthrough of what happens after someone buys / books.",
    ];
    prompts = [
      "“If you’ve been circling [offer] but haven’t jumped, this is for you.”",
      "“3 signs you’re ready for [offer], and 1 sign you’re not.”",
      "“Here’s exactly what you get inside [offer], no vague hype.”",
    ];
    watchouts = [
      "Keep at least half your posts pure value or story, not pitches.",
      "Name the offer the same way each time so it sticks.",
    ];
  } else {
    // GROWTH default
    angles = [
      "Fast “here’s the problem” hook with a visual of the outcome.",
      "Micro-tutorial under 30 seconds with one clear win.",
      "Trend remix but with your niche-specific twist.",
    ];
    prompts = [
      "“Stop scrolling if you’re [very specific person].”",
      "“You’re probably doing [niche task] like this. Here’s a better way.”",
      "“POV: you’re tired of [annoying trend in your niche].”",
    ];
    watchouts = [
      "Don’t over-explain; let visuals and on-screen text do some of the work.",
      "Avoid posting 5 unrelated topics—cluster ideas into mini-series.",
    ];
  }

  if (focus.includes("EXPERIMENTS")) {
    angles.push(
      "Try one “weird” format: green screen, duet, or stitching a trend with your commentary.",
    );
  }
  if (focus.includes("PERSONALITY")) {
    prompts.push(
      "“Here’s the chaotic version of how I actually do [thing in your niche].”",
    );
  }

  return {
    headline,
    theme,
    platformFocus,
    suggestedPosts,
    angles,
    prompts,
    watchouts,
  };
}

export default function CreatorSocialPulse() {
  const [compass, setCompass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCompass() {
      setLoading(true);
      setError(null);
      try {
        const res = await runGraphQL(CREATOR_GOAL_COMPASS_QUERY, {});
        const data =
          (res && res.data && res.data.creatorGoalCompass) ||
          (res && res.creatorGoalCompass) ||
          null;
        if (!cancelled) {
          setCompass(data || fallbackCompass());
        }
      } catch (err) {
        console.error("Failed to load creatorGoalCompass", err);
        if (!cancelled) {
          setError("Couldn’t load your Goal Compass; using defaults.");
          setCompass(fallbackCompass());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCompass();
    return () => {
      cancelled = true;
    };
  }, []);

  const pulse = useMemo(
    () => buildPulse(compass || fallbackCompass()),
    [compass],
  );

  const weeklyCapacity =
    (compass && compass.weeklyCapacity) ||
    fallbackCompass().weeklyCapacity;

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Grow · Creator Social Pulse</span>
        <h1 className="creator-page__title">Creator Social Pulse</h1>
        <p className="creator-page__subtitle">
          A quick creative brief for this week — tuned to your Goal Compass so
          you’re never staring at a blank posting schedule.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__row">
          {/* Left – weekly brief */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                This week’s pulse
              </h2>
              <p className="creator-page__card-subtitle">
                Based on your compass and capacity, here’s the vibe for the
                next few days.
              </p>

              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(236,72,153,0.09))",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {pulse.headline}
                </div>
                <p
                  style={{
                    marginTop: 4,
                    fontSize: "0.8rem",
                    color: "#374151",
                  }}
                >
                  {pulse.theme}
                </p>
                <p
                  style={{
                    marginTop: 4,
                    fontSize: "0.78rem",
                    color: "#4B5563",
                  }}
                >
                  <strong>Platform focus:</strong> {pulse.platformFocus}
                </p>
                <p
                  style={{
                    marginTop: 4,
                    fontSize: "0.78rem",
                    color: "#4B5563",
                  }}
                >
                  <strong>Suggested output:</strong>{" "}
                  {weeklyCapacity} posts / week (adjusted from Goal Compass).
                </p>
              </div>

              {error && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: "0.78rem",
                    color: "#B91C1C",
                  }}
                >
                  {error}
                </p>
              )}

              <p
                style={{
                  marginTop: 8,
                  fontSize: "0.78rem",
                  color: "#6B7280",
                }}
              >
                Tip: When you plan a new shoot in Director Suite, pull 2–3 ideas
                from this list and turn them into specific scenes.
              </p>
            </div>

            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">
                Angles to try
              </h2>
              <ul
                style={{
                  margin: "4px 0 0",
                  paddingLeft: 18,
                  fontSize: "0.85rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {pulse.angles.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right – prompts & watchouts */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Hook & caption starters
              </h2>
              <p className="creator-page__card-subtitle">
                Swipe a line, plug in your niche, and you’re 60% done.
              </p>
              <ol
                style={{
                  margin: "4px 0 0",
                  paddingLeft: 20,
                  fontSize: "0.82rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {pulse.prompts.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ol>
            </div>

            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">Watch out for…</h2>
              <p className="creator-page__card-subtitle">
                Gentle guardrails so your content stays on-brand for this
                season.
              </p>
              <ul
                style={{
                  margin: "4px 0 0",
                  paddingLeft: 18,
                  fontSize: "0.82rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {pulse.watchouts.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
