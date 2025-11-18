// site/src/routes/fan/Home.jsx
// Fan home / dashboard

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  dailyLoginOnce,
  fetchProfile,
  fetchLeaderboard,
} from "../../lib/sa";

export default function FanHome() {
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState("");

  const xpPct = useMemo(() => {
    const xp = Number(profile?.xp || 0);
    return Math.max(0, Math.min(100, xp % 100));
  }, [profile]);

  const badgeCount = Array.isArray(profile?.badges)
    ? profile.badges.length
    : 0;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        // fire-and-forget daily login
        dailyLoginOnce().catch(() => {});

        const [p, lb] = await Promise.all([
          fetchProfile().catch(() => null),
          fetchLeaderboard(10).catch(() => []),
        ]);

        if (!alive) return;
        setProfile(p);
        setLeaders(lb || []);
      } catch {
        if (!alive) return;
        setError("We couldn't load your dashboard. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onDailyCheckIn = async () => {
    try {
      setCheckingIn(true);
      const did = await dailyLoginOnce();
      const p = await fetchProfile().catch(() => null);
      setProfile(p || profile);
      if (!did) {
        // already checked in or not signed in – silently ignore
      }
    } catch {
      // ignore
    } finally {
      setCheckingIn(false);
    }
  };

  const displayName =
    profile?.displayName ||
    (profile?.userId && profile.userId.includes("@")
      ? profile.userId.split("@")[0]
      : "") ||
    "";

  return (
    <div className="fan-dash">
      {/* HERO */}
      <section className="fan-dash-hero" aria-label="Fan dashboard hero">
        <div className="fan-dash-hero__inner">
          <div className="fan-dash-hero__top">
            <div>
              <h1 className="fan-dash-hero__title">
                {loading
                  ? "Loading your hub…"
                  : displayName
                  ? `Welcome back, ${displayName}!`
                  : "Welcome to Styling Adventures"}
              </h1>
              <p className="fan-dash-hero__subtitle">
                Play the fashion game, watch episodes, and climb the leaderboard
                as you earn petals (XP) & coins.
              </p>
            </div>

            <div className="petals-strip">
              {loading ? (
                <div className="petals-strip__skeleton" />
              ) : profile ? (
                <>
                  <Petal label="Level" value={profile.level ?? 1} />
                  <Petal label="XP" value={profile.xp ?? 0} />
                  <Petal label="Coins" value={profile.coins ?? 0} />
                </>
              ) : (
                <span className="petals-strip__empty">
                  Sign in to start earning petals (XP) &amp; perks.
                </span>
              )}
            </div>
          </div>

          <div className="fan-dash-hero__cta-row">
            <Link to="/fan/episodes" className="hero-btn hero-btn-primary">
              Watch Episodes
            </Link>
            <Link to="/fan/closet" className="hero-btn hero-btn-secondary">
              Browse Closet
            </Link>
            <div className="hero-links">
              <Link to="/fan/community" className="hero-link">
                Community
              </Link>
              <span className="hero-dot">•</span>
              <Link to="/fan/profile" className="hero-link">
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="notice notice--error">{error}</div>}

      {/* GRID */}
      <main className="fan-dash-grid">
        {/* PROGRESS – tall left card */}
        <section className="card stats">
          <h2 className="card__title">Your Progress</h2>
          {loading ? (
            <div className="skeleton" />
          ) : profile ? (
            <>
              <div className="stats__row">
                <StatTile label="Level" value={profile.level ?? 1} />
                <StatTile label="XP" value={profile.xp ?? 0} />
                <StatTile label="Coins" value={profile.coins ?? 0} />
                <StatTile label="Badges" value={badgeCount} />
              </div>

              <div className="progress">
                <div
                  className="progress__bar"
                  style={{ width: `${xpPct}%` }}
                />
              </div>

              <div className="stats__actions">
                <button
                  className="btn btn-primary"
                  onClick={onDailyCheckIn}
                  disabled={checkingIn}
                  title="One check-in per day"
                >
                  {checkingIn ? "Checking in…" : "Daily check-in"}
                </button>
                <Link className="btn btn-ghost" to="/fan/profile">
                  Edit Profile
                </Link>
              </div>

              <ul className="quests">
                <li>• Watch 1 episode</li>
                <li>• Style 1 look</li>
                <li>• Check in daily</li>
              </ul>
            </>
          ) : (
            <div className="empty">
              <p>Sign in to start earning XP and coins.</p>
              <Link className="btn btn-primary" to="/bestie">
                Become a Bestie
              </Link>
            </div>
          )}
        </section>

        {/* TOP STYLISTS – top-right card */}
        <section className="card leaderboard">
          <h2 className="card__title">Top Stylists</h2>
          {loading ? (
            <div className="skeleton" />
          ) : leaders.length ? (
            <ol className="lb">
              {leaders.slice(0, 10).map((r) => (
                <li key={r.rank} className="lb__row">
                  <span className="lb__rank">#{r.rank}</span>
                  <span className="lb__name">
                    {r.displayName || r.userId}
                  </span>
                  <span className="lb__xp">{r.xp} XP</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty">
              <p>No leaderboard data yet—be the first to earn XP!</p>
              <Link className="btn btn-secondary" to="/fan/closet">
                Start Styling
              </Link>
            </div>
          )}
          <div className="card__footer">
            <Link to="/fan/profile" className="link">
              See your rank
            </Link>
          </div>
        </section>

        {/* JUMP BACK IN – bottom-right card */}
        <section className="card actions">
          <h2 className="card__title">Jump back in</h2>
          <ul className="action-list">
            <li>
              <Link to="/fan/episodes" className="action">
                <span className="action__title">Continue Watching</span>
                <span className="action__subtitle">
                  Pick up the latest episode
                </span>
              </Link>
            </li>
            <li>
              <Link to="/fan/closet" className="action">
                <span className="action__title">Style a Look</span>
                <span className="action__subtitle">
                  Earn XP from the fashion game
                </span>
              </Link>
            </li>
            <li>
              <Link to="/fan/community" className="action">
                <span className="action__title">Community Polls</span>
                <span className="action__subtitle">
                  Vote and join events
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </main>

      {/* LOCAL STYLES */}
      <style>{`
        .fan-dash {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* HERO */
        .fan-dash-hero {
          background: linear-gradient(
            135deg,
            rgba(253, 231, 244, 0.95),
            rgba(232, 244, 255, 0.95)
          );
          border-radius: 24px;
          border: 1px solid rgba(248, 250, 252, 0.9);
          box-shadow: 0 18px 40px rgba(15,23,42,0.06);
        }
        .fan-dash-hero__inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 18px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fan-dash-hero__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .fan-dash-hero__title {
          margin: 0 0 4px;
          font-size: 1.6rem;
          line-height: 1.2;
          color: #0f172a;
        }
        .fan-dash-hero__subtitle {
          margin: 0;
          font-size: 0.96rem;
          color: #4b5563;
          max-width: 540px;
        }

        .fan-dash-hero__cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }
        .hero-btn {
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 0.95rem;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background .15s ease, box-shadow .15s ease, transform .04s ease, border-color .15s ease;
        }
        .hero-btn-primary {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #ffffff;
        }
        .hero-btn-primary:hover {
          background: #4338ca;
          border-color: #4338ca;
          box-shadow: 0 8px 22px rgba(79,70,229,0.5);
          transform: translateY(-1px);
        }
        .hero-btn-secondary {
          background: #ec4899;
          border-color: #ec4899;
          color: #ffffff;
        }
        .hero-btn-secondary:hover {
          background: #db2777;
          border-color: #db2777;
          box-shadow: 0 8px 22px rgba(236,72,153,0.5);
          transform: translateY(-1px);
        }

        .hero-links {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #4b5563;
        }
        .hero-link {
          color: #334155;
          text-decoration: none;
        }
        .hero-link:hover {
          text-decoration: underline;
        }
        .hero-dot {
          opacity: 0.6;
        }

        /* Petals strip */
        .petals-strip {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(226,232,240,0.9);
        }
        .petals-strip__skeleton {
          width: 220px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        .petals-strip__empty {
          font-size: 0.85rem;
          color: #6b7280;
        }
        .petal {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          padding: 6px 10px;
          min-width: 90px;
          border-radius: 999px;
          background: linear-gradient(135deg,#fef3ff,#eef2ff);
        }
        .petal__label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #a855f7;
        }
        .petal__value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111827;
        }

        /* GRID + CARDS */
        .fan-dash-grid {
          max-width: 1100px;
          margin: 0 auto 32px;
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
          grid-template-rows: auto auto;
          gap: 16px;
          align-items: start;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 16px 16px 14px;
          box-shadow: 0 10px 35px rgba(15,23,42,0.06);
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 160px;
          box-sizing: border-box;
        }
        .card__title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #111827;
        }
        .card__footer {
          margin-top: auto;
        }

        /* Layout positions for the three cards */
        .stats {
          grid-column: 1;
          grid-row: 1 / span 2;
        }
        .leaderboard {
          grid-column: 2;
          grid-row: 1;
        }
        .actions {
          grid-column: 2;
          grid-row: 2;
        }

        .stats__row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .stat-tile {
          padding: 10px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          background: #faf5ff;
          text-align: center;
        }
        .stat-tile__label {
          color: #6b7280;
          font-size: 0.75rem;
          margin-bottom: 4px;
        }
        .stat-tile__value {
          font-weight: 700;
          font-size: 1.1rem;
          color: #111827;
        }

        .progress {
          height: 10px;
          border-radius: 999px;
          background: #f3e8ff;
          overflow: hidden;
          border: 1px solid #e9d5ff;
        }
        .progress__bar {
          height: 100%;
          background: linear-gradient(90deg,#a855f7,#ec4899);
          width: 0%;
          transition: width 200ms ease-out;
        }

        .stats__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quests {
          margin: 6px 0 0;
          padding: 0;
          list-style: none;
          font-size: 0.8rem;
          color: #6b7280;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .quests li {
          white-space: nowrap;
        }

        .actions .action-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .action {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 10px 12px;
          text-decoration: none;
          color: inherit;
          background: #f9fafb;
          transition: background 120ms ease, transform 40ms ease, box-shadow 120ms ease;
        }
        .action:hover {
          background: #f4f4ff;
          box-shadow: 0 6px 20px rgba(148,163,184,0.25);
        }
        .action:active { transform: translateY(1px); }
        .action__title { font-weight: 600; }
        .action__subtitle { color: #6b7280; font-size: 0.9rem; }

        .leaderboard .lb {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 6px;
        }
        .lb__row {
          display: grid;
          grid-template-columns: 56px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
        }
        .lb__rank {
          font-weight: 700;
          text-align: center;
          color: #4b5563;
        }
        .lb__name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lb__xp {
          color: #4c1d95;
          font-weight: 600;
        }

        .notice {
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 14px;
          border-radius: 12px;
        }
        .notice--error {
          border: 1px solid #fed7d7;
          background: #fff5f5;
          color: #7f1d1d;
        }

        .empty {
          display: grid;
          gap: 10px;
        }

        .skeleton {
          height: 120px;
          border-radius: 14px;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }

        .btn {
          appearance: none;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.04s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .btn:hover {
          background: #f3f4ff;
          box-shadow: 0 6px 18px rgba(148,163,184,0.3);
        }
        .btn:active {
          transform: translateY(1px);
        }
        .btn-primary {
          background: #4f46e5;
          border-color: #4f46e5;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #4338ca;
          border-color: #4338ca;
        }
        .btn-secondary {
          background: #ec4899;
          border-color: #ec4899;
          color: #ffffff;
        }
        .btn-secondary:hover {
          background: #db2777;
          border-color: #db2777;
        }
        .btn-ghost {
          background: transparent;
          border-color: transparent;
          padding-inline: 10px;
          color: #4b5563;
        }
        .btn-ghost:hover {
          background: #f3f4ff;
          border-color: #e5e7eb;
          box-shadow: none;
        }
        .link {
          appearance: none;
          border: none;
          background: transparent;
          color: #7c3aed;
          cursor: pointer;
          text-decoration: underline;
          padding: 6px 10px;
          font-size: 0.9rem;
        }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }

        @media (max-width: 900px) {
          .fan-dash-hero__inner {
            padding: 16px 16px 14px;
          }
          .fan-dash-hero__top {
            align-items: flex-start;
          }
          .stats__row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .fan-dash-grid {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto;
          }
          .stats,
          .leaderboard,
          .actions {
            grid-column: auto;
            grid-row: auto;
          }
        }

        @media (max-width: 640px) {
          .fan-dash-grid {
            margin-bottom: 24px;
          }
          .fan-dash-hero__title {
            font-size: 1.4rem;
          }
          .quests {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

function Petal({ label, value }) {
  return (
    <div className="petal">
      <span className="petal__label">{label}</span>
      <span className="petal__value">{value}</span>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value">{value}</div>
    </div>
  );
}

