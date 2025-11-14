import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  dailyLoginOnce,
  fetchProfile,
  fetchLeaderboard,
} from "../../lib/sa";

/**
 * FanDashboard.jsx
 * Friendly hub for fans:
 * - Greets the user (uses displayName when available)
 * - Shows XP, coins, badges, and a lightweight progress bar
 * - One-click "Daily check-in" (XP/coins via DAILY_LOGIN)
 * - Quick links: Episodes, Closet, Community, Profile
 * - Leaderboard preview (top 10)
 */

export default function FanDashboard() {
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [profile, setProfile] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState("");

  // naive progress: show percent of xp toward next hundred
  const xpPct = useMemo(() => {
    const xp = Number(profile?.xp || 0);
    return Math.max(0, Math.min(100, xp % 100));
  }, [profile]);

  const badgeCount = Array.isArray(profile?.badges) ? profile.badges.length : 0;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        // Fire-and-forget daily check-in (best effort)
        dailyLoginOnce().catch(() => {});

        const [p, lb] = await Promise.all([
          fetchProfile().catch(() => null),
          fetchLeaderboard(10).catch(() => []),
        ]);

        if (!alive) return;
        setProfile(p);
        setLeaders(lb || []);
      } catch (e) {
        if (!alive) return;
        setError("We couldn't load your dashboard. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onDailyCheckIn = async () => {
    try {
      setCheckingIn(true);
      const did = await dailyLoginOnce();
      // Re-pull lightweight profile so XP/coins reflect if check-in succeeded
      const p = await fetchProfile().catch(() => null);
      setProfile(p || profile);
      if (!did) {
        // either already checked in or not signed-in yet
      }
    } catch {
      // ignore; non-fatal
    } finally {
      setCheckingIn(false);
    }
  };

  const displayName =
    profile?.displayName ||
    // fallback to last part of email if present
    (profile?.userId && profile.userId.includes("@")
      ? profile.userId.split("@")[0]
      : "") ||
    "";

  return (
    <div className="fan-dash">
      <header className="hero">
        <div className="hero__inner">
          <h1 className="hero__title">
            {loading
              ? "Loading your hub…"
              : displayName
              ? `Welcome back, ${displayName}!`
              : "Welcome to Styling Adventures"}
          </h1>
          <p className="hero__subtitle">
            Play the fashion game, watch episodes, and climb the leaderboard.
          </p>

          <div className="hero__cta">
            <Link className="btn btn-primary" to="/fan/episodes">Watch Episodes</Link>
            <Link className="btn btn-secondary" to="/fan/closet">Browse Closet</Link>
            <Link className="btn" to="/fan/community">Community</Link>
            <Link className="btn" to="/fan/profile">My Profile</Link>
          </div>
        </div>
      </header>

      {error && (
        <div className="notice notice--error">
          {error}
        </div>
      )}

      <main className="grid">
        {/* Stats */}
        <section className="card stats">
          <h2 className="card__title">Your Progress</h2>
          {loading ? (
            <div className="skeleton" />
          ) : profile ? (
            <>
              <div className="stats__row">
                <div className="stat">
                  <div className="stat__label">Level</div>
                  <div className="stat__value">{profile.level ?? 1}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">XP</div>
                  <div className="stat__value">{profile.xp ?? 0}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">Coins</div>
                  <div className="stat__value">{profile.coins ?? 0}</div>
                </div>
                <div className="stat">
                  <div className="stat__label">Badges</div>
                  <div className="stat__value">{badgeCount}</div>
                </div>
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
                <Link className="btn" to="/fan/profile">Edit Profile</Link>
              </div>
            </>
          ) : (
            <div className="empty">
              <p>Sign in to start earning XP and coins.</p>
              <Link className="btn btn-primary" to="/bestie">Become a Bestie</Link>
            </div>
          )}
        </section>

        {/* Continue / Quick actions */}
        <section className="card actions">
          <h2 className="card__title">Jump back in</h2>
          <ul className="action-list">
            <li>
              <Link to="/fan/episodes" className="action">
                <span className="action__title">Continue Watching</span>
                <span className="action__subtitle">Pick up the latest episode</span>
              </Link>
            </li>
            <li>
              <Link to="/fan/closet" className="action">
                <span className="action__title">Style a Look</span>
                <span className="action__subtitle">Earn XP from the fashion game</span>
              </Link>
            </li>
            <li>
              <Link to="/fan/community" className="action">
                <span className="action__title">Community Polls</span>
                <span className="action__subtitle">Vote and join events</span>
              </Link>
            </li>
          </ul>
        </section>

        {/* Leaderboard */}
        <section className="card leaderboard">
          <h2 className="card__title">Top Stylists</h2>
          {loading ? (
            <div className="skeleton" />
          ) : leaders.length ? (
            <ol className="lb">
              {leaders.slice(0, 10).map((r) => (
                <li key={r.rank} className="lb__row">
                  <span className="lb__rank">#{r.rank}</span>
                  <span className="lb__name">{r.displayName || r.userId}</span>
                  <span className="lb__xp">{r.xp} XP</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty">
              <p>No leaderboard data yet—be the first to earn XP!</p>
              <Link className="btn btn-secondary" to="/fan/closet">Start Styling</Link>
            </div>
          )}
          <div className="card__footer">
            <Link to="/fan/profile" className="link">See your rank</Link>
          </div>
        </section>
      </main>

      {/* Local styles to keep this self-contained (no new deps) */}
      <style>{`
        .fan-dash {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero {
          background: linear-gradient(180deg, rgba(107,140,255,0.18), rgba(255,255,255,0));
          border-radius: 16px;
          padding: 28px 18px;
        }
        .hero__inner {
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }
        .hero__title {
          margin: 0 0 6px;
          font-size: 2rem;
          line-height: 1.2;
        }
        .hero__subtitle {
          margin: 0 0 16px;
          color: #4a4a4a;
        }
        .hero__cta {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .grid {
          max-width: 1100px;
          margin: 0 auto 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 160px;
        }
        .card__title {
          margin: 0;
          font-size: 1.1rem;
        }
        .card__footer {
          margin-top: auto;
        }

        .stats__row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .stat {
          padding: 10px;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          text-align: center;
        }
        .stat__label {
          color: #666;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }
        .stat__value {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .progress {
          height: 10px;
          border-radius: 20px;
          background: #f0f2ff;
          overflow: hidden;
          border: 1px solid #e5e9ff;
        }
        .progress__bar {
          height: 100%;
          background: #6b8cff;
          width: 0%;
          transition: width 200ms ease-out;
        }

        .stats__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
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
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          padding: 10px 12px;
          text-decoration: none;
          color: inherit;
          transition: background 120ms ease, transform 40ms ease;
        }
        .action:hover { background: #fafbff; }
        .action:active { transform: translateY(1px); }
        .action__title { font-weight: 600; }
        .action__subtitle { color: #666; font-size: 0.9rem; }

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
          border: 1px solid #f0f0f0;
          border-radius: 10px;
        }
        .lb__rank { font-weight: 700; text-align: center; }
        .lb__name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lb__xp { color: #333; font-weight: 600; }

        .notice {
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 14px;
          border-radius: 10px;
        }
        .notice--error {
          border: 1px solid #ffd4d4;
          background: #fff6f6;
          color: #7a1a1a;
        }

        .empty {
          display: grid;
          gap: 10px;
        }

        .skeleton {
          height: 120px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 37%, #f2f2f2 63%);
          background-size: 400% 100%;
          animation: shimmer 1.2s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }

        .btn {
          appearance: none;
          border: 1px solid #ddd;
          background: #f7f7f7;
          color: #222;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.04s ease, background 0.15s ease, border-color 0.15s ease;
        }
        .btn:hover { background: #f0f0f0; }
        .btn:active { transform: translateY(1px); }
        .btn-primary {
          background: #6b8cff;
          border-color: #6b8cff;
          color: white;
        }
        .btn-primary:hover { background: #5a7bff; border-color: #5a7bff; }
        .btn-secondary {
          background: #ff5fb2;
          border-color: #ff5fb2;
          color: white;
        }
        .btn-secondary:hover { background: #ff4aa7; border-color: #ff4aa7; }
        .link {
          appearance: none;
          border: none;
          background: transparent;
          color: #7a42ff;
          cursor: pointer;
          text-decoration: underline;
          padding: 6px 10px;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
