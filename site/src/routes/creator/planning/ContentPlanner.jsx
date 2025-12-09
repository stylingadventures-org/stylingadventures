// site/src/routes/creator/planning/ContentPlanner.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
      updatedAt
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
    updatedAt: null,
  };
}

function humanGoal(value) {
  const v = (value || "").toUpperCase();
  if (v === "TRUST") return "Trust & nurture";
  if (v === "AUTHORITY") return "Authority content";
  if (v === "CONVERSION") return "Conversion / sales";
  return "Growth / reach";
}

function buildShootQueue(compass) {
  const c = compass || fallbackCompass();
  const primary = (c.primaryGoal || "GROWTH").toUpperCase();

  const base = [
    {
      id: "shoot-1",
      label: "This week’s anchor video",
      focus:
        primary === "TRUST"
          ? "Story-led nurture + personality"
          : primary === "AUTHORITY"
          ? "Teach + proof"
          : primary === "CONVERSION"
          ? "Soft pitch into offer"
          : "Short, hooky growth video",
      status: "Next up",
    },
    {
      id: "shoot-2",
      label: "Evergreen / backlog piece",
      focus:
        primary === "TRUST"
          ? "Behind-the-scenes process or routine"
          : primary === "AUTHORITY"
          ? "Framework or ‘3 rules’ content"
          : "Evergreen tutorial that can be recycled later",
      status: "Queued",
    },
  ];

  if (c.weeklyCapacity >= 5) {
    base.push({
      id: "shoot-3",
      label: "Fun / experimental slot",
      focus:
        "Try a new format or trend without putting pressure on the results.",
      status: "Optional",
    });
  }

  return base;
}

export default function ContentPlanner() {
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

  const queue = useMemo(
    () => buildShootQueue(compass || fallbackCompass()),
    [compass],
  );

  const lastUpdated =
    compass && compass.updatedAt
      ? new Date(compass.updatedAt)
      : null;

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">
          Story & Content Studio · Planner
        </span>
        <h1 className="creator-page__title">Content Planner</h1>
        <p className="creator-page__subtitle">
          Connect your big-picture Goal Compass to concrete shoots in Director
          Suite and a realistic posting schedule in Social OS.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__row">
          {/* Left – compass snapshot & flow */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Compass snapshot
              </h2>
              <p className="creator-page__card-subtitle">
                This is the upstream setting everything else here flows from.
              </p>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  fontSize: "0.8rem",
                }}
              >
                <span className="creator-badge">
                  🎯 {humanGoal(compass?.primaryGoal)}
                </span>
                <span className="creator-badge">
                  ⏱ Horizon: {compass?.timeHorizon || "90_DAYS"}
                </span>
                <span className="creator-badge">
                  📅 {compass?.weeklyCapacity ?? 5} slots / week
                </span>
                <span className="creator-badge">
                  🧠 Risk: {compass?.riskTolerance || "MEDIUM"}
                </span>
              </div>

              {lastUpdated && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: "0.78rem",
                    color: "#6B7280",
                  }}
                >
                  Last updated: {lastUpdated.toLocaleString()}
                </p>
              )}

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

              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "#F9FAFB",
                  fontSize: "0.8rem",
                  color: "#4B5563",
                }}
              >
                <strong>Flow:</strong> Adjust{" "}
                <strong>Lala Goal Compass</strong> → Plan shoots in{" "}
                <strong>Director Suite</strong> → Drop them into{" "}
                <strong>Social OS</strong> as scheduled posts.
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <Link
                  to="/creator/align/goal-compass"
                  className="creator-btn creator-btn--ghost"
                  style={{ fontSize: "0.8rem" }}
                >
                  Open Lala Goal Compass
                </Link>
                <Link
                  to="/creator/create/director-suite"
                  className="creator-btn creator-btn--ghost"
                  style={{ fontSize: "0.8rem" }}
                >
                  Open Director Suite
                </Link>
                <Link
                  to="/creator/grow/social-os"
                  className="creator-btn creator-btn--primary"
                  style={{ fontSize: "0.8rem" }}
                >
                  Open Social OS calendar
                </Link>
              </div>
            </div>

            <div className="creator-page__card" style={{ marginTop: 10 }}>
              <h2 className="creator-page__card-title">
                Today’s focus
              </h2>
              <p className="creator-page__card-subtitle">
                A tiny briefing so when you sit down to plan, you already know
                what kind of content you’re making.
              </p>
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
                <li>
                  Start by planning{" "}
                  <strong>{queue[0]?.label ?? "an anchor shoot"}</strong> in
                  Director Suite.
                </li>
                <li>
                  Pull 1–2 ideas from{" "}
                  <strong>Creator Social Pulse</strong> to fill your scenes.
                </li>
                <li>
                  Once you’ve filmed, drop the final assets into{" "}
                  <strong>Social OS</strong> slots for the week.
                </li>
              </ul>
            </div>
          </div>

          {/* Right – shoot queue */}
          <div className="creator-page__col">
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Shoot queue (lightweight)
              </h2>
              <p className="creator-page__card-subtitle">
                A simple list of shoots you’d like to make in the next 1–2
                weeks. You can turn each one into a full Director Suite plan.
              </p>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {queue.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                      padding: 10,
                      background: "#F9FAFB",
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
                          fontSize: "0.78rem",
                          color: "#6B7280",
                        }}
                      >
                        Shoot {idx + 1} · {item.status}
                      </span>
                      <Link
                        to="/creator/create/director-suite"
                        className="creator-btn creator-btn--ghost"
                        style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                      >
                        Open in Director Suite
                      </Link>
                    </div>
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {item.label}
                    </div>
                    <p
                      style={{
                        marginTop: 4,
                        fontSize: "0.8rem",
                        color: "#4B5563",
                      }}
                    >
                      {item.focus}
                    </p>
                  </div>
                ))}
              </div>

              <p
                style={{
                  marginTop: 10,
                  fontSize: "0.75rem",
                  color: "#6B7280",
                }}
              >
                This queue is intentionally non-precious. Cross things off,
                rewrite them, or let them roll into next week — the important
                thing is that you always know what you’re filming next.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
