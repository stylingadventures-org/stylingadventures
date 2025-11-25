// site/src/routes/fan/Home.jsx
// Fan home / dashboard

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  dailyLoginOnce,
  fetchProfile,
  fetchLeaderboard,
} from "../../lib/sa";
import { getEpisodesOrdered } from "../../lib/episodes";

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

  const episodesPreview = useMemo(() => {
    try {
      const ordered = getEpisodesOrdered?.() || [];
      return ordered.slice(0, 3);
    } catch {
      return [];
    }
  }, []);

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

  const isSignedIn = !!profile;

  return (
    <div className="fan-dash">
      {/* HERO */}
      <section className="fan-dash-hero" aria-label="Fan dashboard hero">
        <div className="fan-dash-hero__inner">
          <div className="fan-dash-hero__top">
            <div className="fan-dash-hero__top-left">
              <div className="fan-dash-hero__chip">
                Welcome to Lala&apos;s world ✨
              </div>
              <h1 className="fan-dash-hero__title">
                {loading
                  ? "Loading your hub…"
                  : displayName
                  ? `Hey ${displayName}, come play!`
                  : "Welcome to Styling Adventures, bestie 💜"}
              </h1>
              <p className="fan-dash-hero__subtitle">
                Binge episodes, style outfits, and hang out with the
                community. Everything you do earns petals (XP) &amp; coins.
              </p>

              <div className="hero-steps">
                <div className="hero-step">
                  <span className="hero-step__bubble">1</span>
                  <div>
                    <div className="hero-step__label">Watch</div>
                    <div className="hero-step__text">
                      Catch the latest Styling Adventures episode.
                    </div>
                  </div>
                </div>
                <div className="hero-step">
                  <span className="hero-step__bubble">2</span>
                  <div>
                    <div className="hero-step__label">Style</div>
                    <div className="hero-step__text">
                      Build looks in Style Games &amp; Lala&apos;s Closet.
                    </div>
                  </div>
                </div>
                <div className="hero-step">
                  <span className="hero-step__bubble">3</span>
                  <div>
                    <div className="hero-step__label">Share</div>
                    <div className="hero-step__text">
                      Show off fits &amp; chat with other besties.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="petals-panel">
              <div className="petals-panel__header">
                <span className="petals-panel__label">
                  Your vibe today
                </span>
                {isSignedIn && (
                  <span className="petals-panel__badge">
                    Level {profile.level ?? 1}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="petals-strip__skeleton petals-strip__skeleton--full" />
              ) : isSignedIn ? (
                <div className="petals-strip petals-strip--stacked">
                  <Petal label="XP" value={profile.xp ?? 0} />
                  <Petal label="Coins" value={profile.coins ?? 0} />
                  <Petal label="Badges" value={badgeCount} />
                </div>
              ) : (
                <div className="petals-panel__empty">
                  Sign in or create a profile to start your journey and
                  become a Bestie.
                </div>
              )}

              <Link to="/fan/profile" className="petals-panel__link">
                {isSignedIn ? "View my profile →" : "Create your profile →"}
              </Link>
            </div>
          </div>

          <div className="fan-dash-hero__cta-row">
            <Link
              to="/fan/episodes"
              className="hero-btn hero-btn-primary hero-btn--wide"
            >
              Start watching
              <span className="hero-btn__sub">New &amp; past episodes</span>
            </Link>
            <Link
              to="/fan/closet"
              className="hero-btn hero-btn-secondary hero-btn--wide"
            >
              Style the closet
              <span className="hero-btn__sub">Play the fashion game</span>
            </Link>
            <Link
              to="/fan/community"
              className="hero-btn hero-btn-ghost hero-btn--stack"
            >
              Join the community
              <span className="hero-btn__sub">Polls, events &amp; chat</span>
            </Link>
          </div>
        </div>
      </section>

      {error && <div className="notice notice--error">{error}</div>}

      {/* MAIN GRID */}
      <main className="fan-dash-grid">
        {/* PROGRESS – tall left card */}
        <section className="card stats">
          <h2 className="card__title">Your journey</h2>
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
                  Edit profile
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
              <p>
                Sign in to start earning XP and coins and unlock Bestie
                perks.
              </p>
              <Link className="btn btn-primary" to="/bestie">
                Become a Bestie
              </Link>
            </div>
          )}
        </section>

        {/* TOP STYLISTS – top-right card */}
        <section className="card leaderboard">
          <h2 className="card__title">Top stylists</h2>
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
                Start styling
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
                <span className="action__title">Continue watching</span>
                <span className="action__subtitle">
                  Pick up the latest episode
                </span>
              </Link>
            </li>
            <li>
              <Link to="/fan/closet" className="action">
                <span className="action__title">Style a look</span>
                <span className="action__subtitle">
                  Earn XP from the fashion game
                </span>
              </Link>
            </li>
            <li>
              <Link to="/fan/community" className="action">
                <span className="action__title">Community hub</span>
                <span className="action__subtitle">
                  Polls, events &amp; fan chat
                </span>
              </Link>
            </li>
          </ul>
        </section>
      </main>

      {/* RAILS – streaming-style row */}
      <section className="fan-dash-rails">
        <div className="rails-header">
          <h2 className="rails-header__title">Step into Lala&apos;s world</h2>
          <p className="rails-header__subtitle">
            Pick where to start your session: binge, style, or hang out.
          </p>
        </div>

        <div className="rails-grid">
          {/* Episodes rail */}
          <article className="rail rail--episodes">
            <div className="rail__head">
              <span className="rail__label">Binge tonight</span>
              <Link to="/fan/episodes" className="rail__link">
                View all episodes →
              </Link>
            </div>
            {episodesPreview.length ? (
              <ul className="rail-list">
                {episodesPreview.map((ep, idx) => (
                  <li key={ep.id} className="rail-episode">
                    <div className="rail-episode__thumb">
                      <span className="rail-episode__epTag">
                        EP {idx + 1}
                      </span>
                    </div>
                    <div className="rail-episode__body">
                      <div className="rail-episode__title">
                        {ep.title}
                      </div>
                      <div className="rail-episode__meta">
                        Public:{" "}
                        {new Date(ep.publicAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rail-empty">
                Episodes are still loading. Check back soon!
              </p>
            )}
          </article>

          {/* Closet rail */}
          <article className="rail rail--closet">
            <div className="rail__head">
              <span className="rail__label">Lala&apos;s Closet</span>
              <Link to="/fan/closet-feed" className="rail__link">
                See closet feed →
              </Link>
            </div>
            <p className="rail__text">
              Dive into Lala&apos;s favorite looks, heart outfits you&apos;d
              wear, and unlock inspo for future drops.
            </p>
            <div className="rail-cta-row">
              <Link to="/fan/closet" className="btn btn-primary">
                Play Style Games
              </Link>
              <Link to="/fan/closet-feed" className="btn btn-ghost">
                Browse closet
              </Link>
            </div>
          </article>

          {/* Community rail */}
          <article className="rail rail--community">
            <div className="rail__head">
              <span className="rail__label">Community buzz</span>
              <Link to="/fan/community" className="rail__link">
                Open hub →
              </Link>
            </div>
            <ul className="rail-chips">
              <li className="rail-chip">Episode discussions</li>
              <li className="rail-chip">Style polls</li>
              <li className="rail-chip">Watch parties</li>
            </ul>
            <p className="rail__text">
              Share outfit ideas, drop reactions after episodes, and connect
              with other besties in Lala&apos;s world.
            </p>
          </article>
        </div>
      </section>

      {/* LOCAL STYLES */}
      <style>{styles}</style>
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

const styles = `
.fan-dash {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* HERO ----------------------------------------------------- */

.fan-dash-hero {
  background:
    radial-gradient(circle at top left, rgba(251,207,232,0.9), rgba(255,255,255,0.9)),
    radial-gradient(circle at bottom right, rgba(191,219,254,0.95), rgba(255,255,255,1));
  border-radius: 24px;
  border: 1px solid rgba(248, 250, 252, 0.9);
  box-shadow: 0 20px 48px rgba(148,163,184,0.4);
}
.fan-dash-hero__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 18px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fan-dash-hero__top {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.fan-dash-hero__top-left {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fan-dash-hero__chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(216,180,254,0.9);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #6b21a8;
}

.fan-dash-hero__title {
  margin: 2px 0 4px;
  font-size: 1.75rem;
  line-height: 1.2;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.fan-dash-hero__subtitle {
  margin: 0;
  font-size: 0.96rem;
  color: #374151;
  max-width: 540px;
}

/* hero steps row */
.hero-steps {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-step {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(226,232,240,0.9);
}
.hero-step__bubble {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(135deg,#6366f1,#ec4899);
  color:#fff;
  font-size: 0.75rem;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:600;
}
.hero-step__label {
  font-size: 0.8rem;
  font-weight: 600;
  color:#111827;
}
.hero-step__text {
  font-size: 0.78rem;
  color:#4b5563;
}

/* petals side panel */
.petals-panel {
  min-width: 240px;
  max-width: 280px;
  background: rgba(255,255,255,0.96);
  border-radius: 20px;
  border: 1px solid rgba(226,232,240,0.9);
  padding: 12px 14px;
  box-shadow: 0 14px 38px rgba(148,163,184,0.45);
  display:flex;
  flex-direction:column;
  gap:8px;
}
.petals-panel__header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
}
.petals-panel__label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color:#9ca3af;
}
.petals-panel__badge {
  padding:2px 8px;
  border-radius:999px;
  font-size:0.75rem;
  background:#eef2ff;
  color:#4338ca;
  font-weight:600;
}
.petals-panel__empty {
  font-size:0.85rem;
  color:#4b5563;
}
.petals-panel__link {
  font-size:0.85rem;
  color:#7c3aed;
  text-decoration:none;
}
.petals-panel__link:hover {
  text-decoration:underline;
}

/* petals strip */
.petals-strip {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
  border-radius: 18px;
  background: rgba(248,250,252,0.96);
  border: 1px solid rgba(226,232,240,0.9);
}
.petals-strip--stacked {
  width: 100%;
  justify-content: flex-start;
}
.petals-strip__skeleton {
  width: 220px;
  height: 32px;
  border-radius: 999px;
  background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}
.petals-strip__skeleton--full {
  width: 100%;
}

.petal {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  padding: 6px 10px;
  min-width: 80px;
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

/* hero CTA row */
.fan-dash-hero__cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 10px;
  margin-top: 6px;
}
.hero-btn {
  border-radius: 18px;
  padding: 9px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
  min-height: 50px;
  transition: background .15s ease, box-shadow .15s ease, transform .04s ease, border-color .15s ease;
}
.hero-btn--wide {
  min-width: 190px;
}
.hero-btn--stack {
  min-width: 180px;
}
.hero-btn__sub {
  font-size: 0.78rem;
  font-weight: 400;
  opacity: 0.9;
}
.hero-btn-primary {
  background: linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 10px 26px rgba(129,140,248,0.6);
}
.hero-btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
  transform:translateY(-1px);
}
.hero-btn-secondary {
  background:linear-gradient(135deg,#ec4899,#f97316);
  border-color:#ec4899;
  color:#ffffff;
  box-shadow:0 10px 26px rgba(248,113,113,0.55);
}
.hero-btn-secondary:hover {
  background:linear-gradient(135deg,#db2777,#ea580c);
  border-color:#db2777;
  transform:translateY(-1px);
}
.hero-btn-ghost {
  background:rgba(255,255,255,0.96);
  border-color:rgba(226,232,240,0.9);
  color:#111827;
}
.hero-btn-ghost:hover {
  background:#eef2ff;
  box-shadow:0 8px 20px rgba(148,163,184,0.4);
  transform:translateY(-1px);
}

/* MAIN GRID ------------------------------------------------ */

.fan-dash-grid {
  max-width: 1100px;
  margin: 0 auto 24px;
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
  box-shadow: 0 10px 35px rgba(148,163,184,0.16);
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

/* layout positions */
.stats {
  grid-column: 1;
  grid-row: 1 / span 2;
  background:
    radial-gradient(circle at top left,#fdf2ff,#eef2ff 55%),
    radial-gradient(circle at bottom right,#e0f2fe,#ffffff 70%);
}
.leaderboard {
  grid-column: 2;
  grid-row: 1;
}
.actions {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
}

/* actions card gradient stripe */
.actions::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg,#6366f1,#ec4899);
  border-radius: 18px 0 0 18px;
}

/* stats card */
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

/* "Your journey" empty state */
.journey-empty {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.journey-text {
  font-size: 0.95rem;
  color: #111827;
  max-width: 460px;
}
.journey-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.journey-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(248,250,252,1);
  font-size: 0.78rem;
  color: #4b5563;
}
.journey-step__icon {
  font-size: 0.95rem;
}
.btn-bestie {
  width: 100%;
  max-width: 360px;
  justify-content: center;
  height: 48px;
  background: linear-gradient(135deg,#6366f1,#ec4899);
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: 0 10px 26px rgba(236,72,153,0.45);
}
.btn-bestie:hover {
  background: linear-gradient(135deg,#4f46e5,#db2777);
  border-color: #4f46e5;
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

/* leaderboard */
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

/* actions card – upgraded tiles */
.actions .action-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.action {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 10px 12px;
  text-decoration: none;
  color: inherit;
  background: #f9fafb;
  transition:
    background 120ms ease,
    transform 40ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;
}
.action:hover {
  background: #f4f4ff;
  border-color: #ddd6fe;
  box-shadow: 0 6px 20px rgba(148,163,184,0.25);
}
.action:active {
  transform: translateY(1px);
}

.action__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.action__icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: radial-gradient(circle at top left,#6366f1,#ec4899);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.action__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.action__title {
  font-weight: 600;
  font-size: 0.9rem;
}
.action__subtitle {
  color: #6b7280;
  font-size: 0.85rem;
}
.action__pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  color: #4c1d95;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* RAILS ---------------------------------------------------- */

.fan-dash-rails {
  max-width: 1100px;
  margin: 0 auto 30px;
  display:flex;
  flex-direction:column;
  gap:12px;
}
.rails-header__title {
  margin:0;
  font-size:1.15rem;
  font-weight:600;
}
.rails-header__subtitle {
  margin:2px 0 0;
  font-size:0.9rem;
  color:#6b7280;
}
.rails-grid {
  display:grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap:12px;
}
.rail {
  border-radius:18px;
  padding:12px 12px 14px;
  border:1px solid #e5e7eb;
  background:#fff;
  box-shadow:0 10px 30px rgba(148,163,184,0.25);
  display:flex;
  flex-direction:column;
  gap:8px;
}
.rail--episodes {
  background:radial-gradient(circle at top left,#e0e7ff,#fdf2ff);
}
.rail--closet {
  background:radial-gradient(circle at top,#fdf2ff,#e0f2fe);
}
.rail--community {
  background:radial-gradient(circle at top,#eef2ff,#ffe4f3);
}
.rail__head {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
}
.rail__label {
  font-size:0.8rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#6b21a8;
}
.rail__link {
  font-size:0.8rem;
  color:#4338ca;
  text-decoration:none;
}
.rail__link:hover {
  text-decoration:underline;
}
.rail__text {
  margin:0;
  font-size:0.86rem;
  color:#374151;
}
.rail-empty {
  font-size:0.86rem;
  color:#6b7280;
}

/* episodes rail list */
.rail-list {
  margin:4px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.rail-episode {
  display:grid;
  grid-template-columns:72px minmax(0,1fr);
  gap:8px;
  align-items:center;
}
.rail-episode__thumb {
  height:52px;
  border-radius:12px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  position:relative;
}
.rail-episode__epTag {
  position:absolute;
  left:6px;
  bottom:4px;
  padding:2px 6px;
  border-radius:999px;
  background:rgba(15,23,42,0.9);
  color:#f9fafb;
  font-size:0.7rem;
  font-weight:600;
}
.rail-episode__body {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.rail-episode__title {
  font-size:0.86rem;
  font-weight:600;
  color:#111827;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.rail-episode__meta {
  font-size:0.78rem;
  color:#6b7280;
}

/* closet rail */
.rail-cta-row {
  margin-top:4px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.rail-cta-row .btn {
  min-height:36px;
}

/* community rail */
.rail-chips {
  margin:2px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.rail-chip {
  padding:4px 10px;
  border-radius:999px;
  font-size:0.75rem;
  background:rgba(255,255,255,0.96);
  border:1px solid rgba(226,232,240,0.95);
  color:#4b5563;
}

/* notices & misc ------------------------------------------- */

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

/* buttons */
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

/* shimmer anim */
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* responsive tweaks ---------------------------------------- */

@media (max-width: 900px) {
  .fan-dash-hero__inner {
    padding: 16px 16px 16px;
  }
  .fan-dash-hero__top {
    align-items: flex-start;
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
  .rails-grid {
    grid-template-columns:minmax(0,1fr);
  }
}

@media (max-width: 640px) {
  .fan-dash-hero__title {
    font-size: 1.45rem;
  }
  .stats__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`;
