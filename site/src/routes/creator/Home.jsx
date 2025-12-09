import React, { useEffect, useState, useMemo } from "react";
import { runGraphQL } from "../../api/runGraphQL";

/**
 * Queries
 */

const ME_QUERY = `
  query Me {
    me {
      id
      email
      role
      tier
      createdAt
    }
  }
`;

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

const CREATOR_REVENUE_BY_PLATFORM_QUERY = `
  query CreatorRevenueByPlatform($window: CreatorRevenueWindow!) {
    creatorRevenueByPlatform(window: $window) {
      currency
      totalRevenue
      platforms {
        platform
        label
        currency
        amount
        lastPayoutAt
      }
      timeseries {
        date
        totalRevenue
      }
    }
  }
`;

/**
 * Helpers
 */

function formatMoney(amount, currency = "USD") {
  if (typeof amount !== "number" || isNaN(amount)) return "-";
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

const PLATFORM_EMOJI = {
  tiktok: "🎵",
  "tik tok": "🎵",
  instagram: "📸",
  ig: "📸",
  youtube: "▶️",
  "youtube shorts": "▶️",
  facebook: "📘",
  meta: "📘",
  snapchat: "👻",
  pinterest: "📌",
  other: "💼",
};

function Sparkline({ points }) {
  if (!points || points.length === 0) return null;

  const width = 150;
  const height = 40;
  const pad = 4;

  const values = points.map((p) => p.totalRevenue || 0);
  const maxY = Math.max(...values);
  const minY = Math.min(...values);
  const spanY = maxY - minY || 1;
  const stepX =
    points.length > 1
      ? (width - pad * 2) / (points.length - 1)
      : width - pad * 2;

  const svgPoints = points
    .map((p, idx) => {
      const v = p.totalRevenue || 0;
      const x = pad + idx * stepX;
      const norm = (v - minY) / spanY;
      const y = height - pad - norm * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="#E5E7EB"
        strokeWidth="1"
      />
      <polyline
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={svgPoints}
      />
    </svg>
  );
}

/**
 * Component
 */

export default function CreatorHome() {
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState(null);

  const [compass, setCompass] = useState(null);
  const [compassLoading, setCompassLoading] = useState(true);
  const [compassError, setCompassError] = useState(null);

  const [rev, setRev] = useState(null);
  const [revLoading, setRevLoading] = useState(true);
  const [revError, setRevError] = useState(null);
  const [revWindowDays, setRevWindowDays] = useState(30);

  // Load "me"
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setMeLoading(true);
      setMeError(null);
      try {
        const res = await runGraphQL(ME_QUERY, {});
        const data = res?.data?.me || res?.me || null;
        if (!cancelled) setMe(data);
      } catch (err) {
        console.error("Failed to load me", err);
        if (!cancelled) setMeError("Couldn’t load your profile.");
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load Goal Compass
  useEffect(() => {
    let cancelled = false;

    async function loadCompass() {
      setCompassLoading(true);
      setCompassError(null);
      try {
        const res = await runGraphQL(CREATOR_GOAL_COMPASS_QUERY, {});
        const data =
          res?.data?.creatorGoalCompass ||
          res?.creatorGoalCompass ||
          null;
        if (!cancelled) setCompass(data);
      } catch (err) {
        console.error("Failed to load creatorGoalCompass", err);
        if (!cancelled) {
          setCompassError("Couldn’t load your Goal Compass yet.");
        }
      } finally {
        if (!cancelled) setCompassLoading(false);
      }
    }

    loadCompass();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load revenue snapshot
  useEffect(() => {
    let cancelled = false;

    async function loadRevenue() {
      setRevLoading(true);
      setRevError(null);
      const windowEnum =
        revWindowDays === 7
          ? "LAST_7_DAYS"
          : revWindowDays === 90
          ? "LAST_90_DAYS"
          : "LAST_30_DAYS";
      try {
        const res = await runGraphQL(
          CREATOR_REVENUE_BY_PLATFORM_QUERY,
          { window: windowEnum },
        );
        const data =
          res?.data?.creatorRevenueByPlatform ||
          res?.creatorRevenueByPlatform ||
          null;
        if (!cancelled) setRev(data);
      } catch (err) {
        console.error("Failed to load creatorRevenueByPlatform", err);
        if (!cancelled) setRevError("Couldn’t load earnings snapshot.");
      } finally {
        if (!cancelled) setRevLoading(false);
      }
    }

    loadRevenue();
    return () => {
      cancelled = true;
    };
  }, [revWindowDays]);

  const revenueCurrency = rev?.currency || "USD";
  const revenueTotal =
    typeof rev?.totalRevenue === "number" ? rev.totalRevenue : 0;
  const revenuePlatforms = rev?.platforms || [];
  const revenueTimeseries = rev?.timeseries || [];

  const primaryGoalLabel = useMemo(() => {
    if (!compass?.primaryGoal) return "Growth / reach";
    // compass is stored as enum-ish; try to humanize
    const s = String(compass.primaryGoal)
      .replace(/_/g, " ")
      .toLowerCase();
    if (s.includes("growth")) return "Growth / reach";
    if (s.includes("trust")) return "Trust & nurture";
    if (s.includes("authority")) return "Authority content";
    if (s.includes("conversion") || s.includes("sales")) {
      return "Conversion / sales";
    }
    return compass.primaryGoal;
  }, [compass]);

  const createdAtLabel = me?.createdAt ? formatDate(me.createdAt) : null;

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Creator HQ</span>
        <h1 className="creator-page__title">Creator Home</h1>
        <p className="creator-page__subtitle">
          A home base for your creator business — see your goals, earnings,
          and next moves in one place.
        </p>

        <div className="creator-page__header-meta">
          <span className="creator-badge">📌 Today at a glance</span>
          <span className="creator-badge">🎬 Shoots & content</span>
          <span className="creator-badge">💸 Monetization HQ</span>
        </div>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__row">
          {/* LEFT COLUMN – profile + compass */}
          <div className="creator-page__col">
            {/* Profile / status card */}
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">Your creator profile</h2>
              {meLoading && (
                <p className="creator-page__card-subtitle">
                  Loading your profile…
                </p>
              )}
              {meError && (
                <p
                  className="creator-page__card-subtitle"
                  style={{ color: "#B91C1C" }}
                >
                  {meError}
                </p>
              )}
              {!meLoading && !meError && me && (
                <>
                  <p className="creator-page__card-subtitle">
                    This is how Styling Adventures currently sees your account.
                    You can use this as a snapshot of your creator “status”.
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      fontSize: "0.85rem",
                      color: "#374151",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: "#EEF2FF",
                            fontSize: "0.75rem",
                            color: "#4338CA",
                            fontWeight: 600,
                          }}
                        >
                          {me.role || "FAN"} · {me.tier || "FREE"}
                        </span>
                        {createdAtLabel && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#6B7280",
                            }}
                          >
                            Since {createdAtLabel}
                          </span>
                        )}
                      </span>
                    </div>
                    {me.email && (
                      <div style={{ fontSize: "0.8rem", color: "#4B5563" }}>
                        Signed in as <strong>{me.email}</strong>
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "0.78rem",
                        color: "#6B7280",
                      }}
                    >
                      Tip: upgrade to <strong>Creator</strong> mode in the
                      navbar when you’re planning shoots or campaigns. Switch
                      back to <strong>Fan</strong> to see your Bestie feed.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Goal Compass card */}
            <div className="creator-page__card" style={{ marginTop: 12 }}>
              <h2 className="creator-page__card-title">
                Lala Goal Compass snapshot
              </h2>

              {compassLoading && (
                <p className="creator-page__card-subtitle">
                  Reading your Goal Compass…
                </p>
              )}
              {compassError && (
                <p
                  className="creator-page__card-subtitle"
                  style={{ color: "#B91C1C" }}
                >
                  {compassError}
                </p>
              )}

              {!compassLoading && !compassError && (
                <>
                  <p className="creator-page__card-subtitle">
                    Your Compass keeps all the tools in Creator HQ pointed at
                    the same outcome, so you don’t burn out chasing every trend.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 6,
                      fontSize: "0.8rem",
                    }}
                  >
                    <span className="creator-badge">
                      🎯 {primaryGoalLabel}
                    </span>
                    <span className="creator-badge">
                      ⏱{" "}
                      {compass?.timeHorizon
                        ? String(compass.timeHorizon)
                            .replace(/_/g, " ")
                            .toLowerCase()
                        : "90 days"}
                    </span>
                    <span className="creator-badge">
                      📅 {compass?.weeklyCapacity ?? 5} slots / week
                    </span>
                    <span className="creator-badge">
                      🧠{" "}
                      {compass?.riskTolerance
                        ? String(compass.riskTolerance)
                            .replace(/_/g, " ")
                            .toLowerCase()
                        : "medium"}{" "}
                      risk
                    </span>
                  </div>

                  {Array.isArray(compass?.focusAreas) &&
                    compass.focusAreas.length > 0 && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: "0.78rem",
                          color: "#4B5563",
                        }}
                      >
                        Focus areas:{" "}
                        <strong>
                          {compass.focusAreas
                            .map((f) =>
                              String(f)
                                .replace(/_/g, " ")
                                .toLowerCase(),
                            )
                            .join(" · ")}
                        </strong>
                      </p>
                    )}

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <a
                      href="/creator/align/goal-compass"
                      className="creator-btn creator-btn--primary"
                    >
                      Open Lala Goal Compass
                    </a>
                    <a
                      href="/creator/create/director-suite"
                      className="creator-btn creator-btn--ghost"
                    >
                      Plan today’s shoot
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN – monetization + next steps */}
          <div className="creator-page__col">
            {/* Monetization snapshot */}
            <div className="creator-page__card">
              <h2 className="creator-page__card-title">
                Monetization snapshot
              </h2>
              <p className="creator-page__card-subtitle">
                Quick glance at how much your creator work has earned recently
                across all connected platforms.
              </p>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {/* Total + window selector */}
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.04,
                    }}
                  >
                    Total in last {revWindowDays} days
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#111827",
                      minHeight: 32,
                    }}
                  >
                    {revLoading
                      ? "…"
                      : formatMoney(revenueTotal, revenueCurrency)}
                  </div>
                  {revError && (
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#B91C1C",
                        marginTop: 4,
                      }}
                    >
                      {revError}
                    </div>
                  )}
                  {!revLoading && !revError && (
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "#6B7280",
                        marginTop: 4,
                      }}
                    >
                      Platforms wired in here will also show up in{" "}
                      <strong>Monetization HQ → Revenue overview</strong>.
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 10,
                      display: "inline-flex",
                      gap: 4,
                      padding: 2,
                      borderRadius: 999,
                      background: "#F3F4F6",
                    }}
                  >
                    {[7, 30, 90].map((d) => {
                      const active = revWindowDays === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setRevWindowDays(d)}
                          style={{
                            border: "none",
                            outline: "none",
                            cursor: "pointer",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: "0.7rem",
                            fontWeight: active ? 600 : 400,
                            background: active ? "#FFFFFF" : "transparent",
                            boxShadow: active ? "0 0 0 1px #E5E7EB" : "none",
                            color: active ? "#111827" : "#6B7280",
                          }}
                        >
                          {d}d
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sparkline */}
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      letterSpacing: 0.04,
                    }}
                  >
                    Earnings trend
                  </span>
                  <Sparkline points={revenueTimeseries} />
                </div>
              </div>

              {/* Top platforms */}
              {!revLoading && !revError && revenuePlatforms.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr",
                      fontSize: "0.78rem",
                      color: "#6B7280",
                      borderBottom: "1px solid #E5E7EB",
                      paddingBottom: 4,
                      marginBottom: 4,
                      gap: 6,
                    }}
                  >
                    <span>Platform</span>
                    <span style={{ textAlign: "right" }}>
                      Last {revWindowDays} days
                    </span>
                    <span style={{ textAlign: "right" }}>Last payout</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {revenuePlatforms.map((p) => {
                      const key = (p.platform || "").toLowerCase();
                      const emoji =
                        PLATFORM_EMOJI[key] || PLATFORM_EMOJI.other;
                      const label = p.label || p.platform || "Unknown";
                      return (
                        <div
                          key={p.platform}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr",
                            gap: 6,
                            fontSize: "0.8rem",
                            alignItems: "center",
                            padding: "4px 0",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 999,
                                background: "#F3F4F6",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {emoji}
                            </span>
                            <span>{label}</span>
                          </span>
                          <span
                            style={{
                              textAlign: "right",
                              fontWeight: 600,
                            }}
                          >
                            {formatMoney(
                              p.amount || 0,
                              p.currency || revenueCurrency,
                            )}
                          </span>
                          <span
                            style={{
                              textAlign: "right",
                              fontSize: "0.75rem",
                              color: "#9CA3AF",
                            }}
                          >
                            {formatDate(p.lastPayoutAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA to Monetization HQ */}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                  fontSize: "0.78rem",
                  color: "#4B5563",
                }}
              >
                <span>
                  Want a deeper dive? Open{" "}
                  <strong>Monetization HQ → Revenue overview</strong> for full
                  trends and platform breakdowns.
                </span>
                <a
                  href="/creator/monetization/revenue-overview"
                  className="creator-btn creator-btn--ghost"
                >
                  Open Monetization HQ
                </a>
              </div>
            </div>

            {/* Next steps card */}
            <div className="creator-page__card" style={{ marginTop: 12 }}>
              <h2 className="creator-page__card-title">
                What to do next
              </h2>
              <p className="creator-page__card-subtitle">
                A simple checklist so you always know your next best move in
                Creator HQ.
              </p>

              <ol
                style={{
                  marginTop: 8,
                  paddingLeft: 18,
                  fontSize: "0.85rem",
                  color: "#4B5563",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <li>
                  <strong>Set / refine your Goal Compass</strong> so every tool
                  knows what you’re aiming for.
                </li>
                <li>
                  <strong>Draft a shoot in Director Suite</strong> using your
                  current focus areas.
                </li>
                <li>
                  <strong>Review Monetization snapshot</strong> and note which
                  platform is actually paying you.
                </li>
                <li>
                  <strong>Schedule your next content day</strong> in your own
                  calendar while energy is high.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
