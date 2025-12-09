// site/src/routes/creator/monetization/RevenueOverview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { runGraphQL } from "../../../api/runGraphQL";

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

function formatMoney(amount, currency) {
  if (typeof amount !== "number" || isNaN(amount)) return "-";
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

// Tiny inline sparkline for the trend
function Sparkline({ points }) {
  if (!points || points.length === 0) return null;

  const width = 160;
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
      const value = p.totalRevenue || 0;
      const x = pad + idx * stepX;
      const norm = (value - minY) / spanY;
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
      {/* Baseline */}
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="#E5E7EB"
        strokeWidth="1"
      />
      {/* Sparkline */}
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

export default function RevenueOverview() {
  const [rev, setRev] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI-friendly window state; we map to enum when calling GraphQL
  const [windowDays, setWindowDays] = useState(30); // 7, 30, or 90

  useEffect(() => {
    let cancelled = false;

    async function fetchRevenue() {
      setLoading(true);
      setError(null);

      const windowEnum =
        windowDays === 7
          ? "LAST_7_DAYS"
          : windowDays === 90
          ? "LAST_90_DAYS"
          : "LAST_30_DAYS";

      try {
        const res = await runGraphQL(
          CREATOR_REVENUE_BY_PLATFORM_QUERY,
          { window: windowEnum },
        );

        const data =
          (res &&
            res.data &&
            res.data.creatorRevenueByPlatform) ||
          (res && res.creatorRevenueByPlatform) ||
          null;

        if (!cancelled) {
          setRev(data);
        }
      } catch (err) {
        console.error("Failed to load creatorRevenueByPlatform", err);
        if (!cancelled) setError("Couldn’t load earnings yet.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRevenue();
    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  const currency = rev && rev.currency ? rev.currency : "USD";
  const total =
    rev && typeof rev.totalRevenue === "number" ? rev.totalRevenue : 0;
  const platforms = (rev && rev.platforms) || [];
  const timeseries = (rev && rev.timeseries) || [];

  const trendLabel = useMemo(() => {
    if (!timeseries || timeseries.length < 2) return "";
    const first = timeseries[0].totalRevenue || 0;
    const last = timeseries[timeseries.length - 1].totalRevenue || 0;
    if (first === 0 && last === 0) return "";
    const change = last - first;
    const pct = first === 0 ? null : (change / first) * 100;
    if (pct === null) {
      return change > 0
        ? "Trending up"
        : change < 0
        ? "Trending down"
        : "";
    }
    const rounded = Math.round(pct);
    if (rounded > 0) return `Up ${rounded}% vs start of period`;
    if (rounded < 0) return `Down ${Math.abs(rounded)}% vs start of period`;
    return "Flat over this period";
  }, [timeseries]);

  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Monetization HQ</span>
        <h1 className="creator-page__title">Revenue Overview</h1>
        <p className="creator-page__subtitle">
          One place to see how much your creator business is earning and from
          where.
        </p>
      </header>

      <div className="creator-page__body">
        {/* Summary + trend card */}
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Earnings dashboard</h2>
          <p className="creator-page__card-subtitle">
            This is the summary layer — where platform payouts, brand deals, and
            product sales roll up.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            As you wire in more sources, this becomes the single truth for how
            your creator business is performing.
          </p>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                }}
              >
                Total (all platforms)
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {loading ? "…" : formatMoney(total, currency)}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#6B7280",
                  marginTop: 4,
                }}
              >
                {loading && "Fetching latest earnings…"}
                {error && (
                  <span style={{ color: "#B91C1C" }}>{error}</span>
                )}
                {!loading && !error && platforms.length === 0 && (
                  <span>
                    No platform-linked earnings yet. Start by connecting TikTok,
                    YouTube, Instagram, and more.
                  </span>
                )}
              </div>
            </div>

            {/* Tiny trend sparkline + range selector */}
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
                Last {windowDays} days
              </span>
              <Sparkline points={timeseries} />
              {trendLabel && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#10B981",
                  }}
                >
                  {trendLabel}
                </span>
              )}

              {/* Tiny range selector */}
              <div
                style={{
                  marginTop: 4,
                  display: "inline-flex",
                  gap: 4,
                  padding: 2,
                  borderRadius: 999,
                  background: "#F3F4F6",
                }}
              >
                {[7, 30, 90].map((d) => {
                  const active = windowDays === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWindowDays(d)}
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
          </div>
        </div>

        {/* Platform breakdown card */}
        <div className="creator-page__card" style={{ marginTop: 12 }}>
          <h2 className="creator-page__card-title">Platform breakdown</h2>
          <p className="creator-page__card-subtitle">
            See which platforms are actually driving revenue — not just views.
          </p>

          {loading && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#6B7280",
                fontStyle: "italic",
                marginTop: 8,
              }}
            >
              Loading platform earnings…
            </p>
          )}

          {!loading && error && (
            <p style={{ fontSize: "0.85rem", color: "#B91C1C", marginTop: 8 }}>
              {error}
            </p>
          )}

          {!loading && !error && platforms.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: 6,
                  fontSize: "0.78rem",
                  color: "#6B7280",
                  paddingBottom: 4,
                  borderBottom: "1px solid #E5E7EB",
                  marginBottom: 4,
                }}
              >
                <span>Platform</span>
                <span style={{ textAlign: "right" }}>
                  Last {windowDays} days
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
                {platforms.map((p) => {
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
                        alignItems: "center",
                        fontSize: "0.8rem",
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
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#F3F4F6",
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
                          p.currency || currency,
                        )}
                      </span>
                      <span
                        style={{
                          textAlign: "right",
                          color: "#9CA3AF",
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatDateTime(p.lastPayoutAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !error && platforms.length === 0 && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#6B7280",
                marginTop: 8,
              }}
            >
              Once you connect creator accounts, this will show a breakdown of
              earnings from TikTok, Instagram, YouTube, Facebook, Snapchat, and
              Pinterest.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

