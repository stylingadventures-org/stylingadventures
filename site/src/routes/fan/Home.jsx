// site/src/routes/fan/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile, dailyLoginOnce } from "../../lib/sa";
import { checkAndGrantBadges } from "../../lib/badges";
import { fetchSettings } from "../../stores/settingsStore";

import CoinPopup from "../../components/CoinPopup";
import StreakModal from "../../components/StreakModal";
import DailyTaskList from "../../components/DailyTaskList";
import { NewBadgeToast } from "../../components/NewBadgeToast";

export default function FanHome() {
  const [profile, setProfile] = useState(null);
  const [coinGain, setCoinGain] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [badgeQueue, setBadgeQueue] = useState([]);

  const [settings, setSettings] = useState({
    animationsEnabled: true,
    soundsEnabled: true,
    autoBadgeGrant: true,
  });

  // economy state
  const [econ, setEcon] = useState(null);
  const [econLoading, setEconLoading] = useState(true);
  const [econErr, setEconErr] = useState("");

  const navigate = useNavigate();

  // ------------------------------
  //  LOAD PROFILE + SETTINGS
  // ------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, s] = await Promise.all([
        fetchProfile().catch(() => null),
        fetchSettings().catch(() => null),
      ]);

      if (!alive) return;

      if (p) {
        setProfile(p);
        const streak =
          p.streakCount ?? // new backend field
          p.streak ?? // legacy field, just in case
          0;
        setStreakCount(streak);
      }

      if (s) {
        setSettings({
          animationsEnabled: s.animationsEnabled ?? true,
          soundsEnabled: s.soundsEnabled ?? true,
          autoBadgeGrant: s.autoBadgeGrant ?? true,
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ------------------------------
  //  ECONOMY SUMMARY (fan view)
  // ------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setEconErr("");
        setEconLoading(true);

        if (window.sa?.ready) {
          await window.sa.ready();
        } else if (window.getSA) {
          await window.getSA();
        }

        const r = await window.sa?.graphql?.(
          `query GetGameEconomyConfig {
             getGameEconomyConfig {
               dailyCoinCap
               weeklyCoinCap
               rules {
                 id
                 category
                 coins
                 label
                 per
                 maxPerDay
               }
             }
           }`,
        );

        if (!alive) return;
        setEcon(r?.getGameEconomyConfig || null);
      } catch (e) {
        if (!alive) return;
        setEconErr(e?.message || String(e));
      } finally {
        if (alive) setEconLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ------------------------------
  //  BADGE AUTO-GRANT LOGIC
  // ------------------------------
  const applyAutoBadges = (updatedProfile, prevProfile) => {
    if (!settings.autoBadgeGrant || !updatedProfile) return;

    const existingBadges = (prevProfile?.badges || []).slice();
    const newOnes = checkAndGrantBadges(updatedProfile, existingBadges);

    if (newOnes && newOnes.length) {
      setProfile((prev) => {
        if (!prev) return prev;
        const allBadges = [...(prev.badges || []), ...newOnes];
        const deduped = Array.from(
          new Map(allBadges.map((b) => [b.id, b])).values(),
        );
        return { ...prev, badges: deduped };
      });

      setBadgeQueue((queue) => [...queue, ...newOnes]);
    }
  };

  // ------------------------------
  //  DAILY CHECK-IN
  // ------------------------------
  const onDailyCheckIn = async () => {
    try {
      const did = await dailyLoginOnce(); // calls logGameEvent(type: DAILY_LOGIN)

      // Always refresh profile after attempting daily login so we see xp/coins/streak
      const p = await fetchProfile().catch(() => null);
      const updated = p || profile;

      if (updated) {
        setProfile(updated);
        const streak =
          updated.streakCount ?? // new field from backend
          updated.streak ?? // fallback for older records
          1;
        setStreakCount(streak);
        applyAutoBadges(updated, profile);
      }

      if (did) {
        // Coin popup amount – purely cosmetic
        setCoinGain(settings.soundsEnabled ? 10 : null);
        setShowStreakModal(true);
      }
    } catch {
      // ignore – non-fatal if not signed in yet
    }
  };

  // ------------------------------
  //  TASK COMPLETION
  // ------------------------------
  const onTaskComplete = (taskId, coinValue) => {
    const updated = {
      ...profile,
      coins: (profile?.coins || 0) + coinValue,
      tasksCompleted: (profile?.tasksCompleted || 0) + 1,
    };

    setCoinGain(settings.soundsEnabled ? coinValue : null);
    setProfile(updated);

    localStorage.setItem("sa:coins", String(updated.coins));
    applyAutoBadges(updated, profile);
  };

  // ------------------------------
  //  MANUAL BADGE UNLOCKS
  // ------------------------------
  const handleBadgeUnlocked = (badge) => {
    setProfile((prev) => {
      if (!prev) return prev;
      if (prev.badges?.find((b) => b.id === badge.id)) return prev;
      return { ...prev, badges: [...(prev.badges || []), badge] };
    });

    setBadgeQueue((prev) => [...prev, badge]);
  };

  // ------------------------------
  //  STATS
  // ------------------------------
  const xp = profile?.xp || 0;
  const xpProgress = xp % 100;
  const badgeCount = profile?.badges?.length || 0;
  const coins = profile?.coins || 0;

  // prefer streakCount, then legacy streak, then existing state, then 0
  const streak =
    (profile?.streakCount ?? profile?.streak ?? streakCount) || 0;

  const currentBadge = badgeQueue[0] || null;

  // ------------------------------
  //  RENDER
  // ------------------------------
  return (
    <div className="fan-dash">
      <style>{`
        .fan-dash {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* HERO */
        .fan-dash-hero {
          padding: 20px 22px 22px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, #ffe7f6, #fdf5ff 45%),
            radial-gradient(circle at bottom right, #e6e7ff, #ffffff 75%);
          box-shadow: 0 18px 45px rgba(15,23,42,0.10);
          border: 1px solid rgba(244,220,255,0.9);
          position: relative;
          overflow: hidden;
        }

        .fan-dash-hero::before,
        .fan-dash-hero::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.8), transparent 70%);
          opacity: 0.8;
          pointer-events: none;
        }
        .fan-dash-hero::before {
          top: -80px;
          left: -40px;
        }
        .fan-dash-hero::after {
          bottom: -80px;
          right: -60px;
        }

        .fan-dash-hero__body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }

        .fan-dash-hero__copy {
          max-width: 60%;
        }

        .fan-dash-hero__eyebrow {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .fan-dash-hero__title {
          font-size: 28px;
          line-height: 1.2;
          margin: 0 0 10px;
          background: linear-gradient(90deg, #a855f7, #ec4899);
          -webkit-background-clip: text;
          color: transparent;
          font-weight: 800;
        }

        .fan-dash-hero__subtitle {
          margin: 0 0 16px;
          color: #4b5563;
          max-width: 30rem;
        }

        .hero-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin: 10px 0 0;
        }

        .hero-step {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 11px;
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(243,232,255,0.9);
          min-width: 0;
        }

        .hero-step__bubble {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(147,51,234,0.4);
        }

        .hero-step__label {
          font-size: 13px;
          font-weight: 600;
          color: #4c1d95;
          margin-bottom: 2px;
        }

        .hero-step__text {
          font-size: 13px;
          color: #6b7280;
        }

        /* AVATAR CARD */
        .fan-dash-hero__avatar-card {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          padding: 14px 14px 16px;
          border-radius: 22px;
          background: rgba(255,255,255,0.96);
          box-shadow: 0 16px 40px rgba(147,51,234,0.30);
          border: 1px solid rgba(243,232,255,0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 180px;
        }

        .avatar-circle {
          width: 96px;
          height: 96px;
          border-radius: 999px;
          overflow: hidden;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          padding: 4px;
          box-shadow: 0 18px 40px rgba(147,51,234,0.5);
        }

        .avatar-circle img {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          object-fit: cover;
          background: #fee2f8;
        }

        .avatar-meta {
          text-align: center;
          font-size: 13px;
          color: #4b5563;
        }

        .avatar-greeting {
          font-weight: 700;
          color: #4c1d95;
          margin-bottom: 2px;
        }

        .avatar-coins {
          font-weight: 700;
          background: linear-gradient(135deg, #f97316, #facc15);
          -webkit-background-clip: text;
          color: transparent;
        }

        /* Today’s Adventures card under hero body */
        .fan-dash-hero__tasks {
          margin-top: 6px;
          position: relative;
          z-index: 1;
        }

        .card {
          background: #ffffff;
          border-radius: 22px;
          padding: 18px 18px 20px;
          border: 1px solid rgba(229,231,235,0.9);
          box-shadow: 0 16px 40px rgba(15,23,42,0.06);
        }

        .card__title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 10px;
          color: #111827;
        }

        .card__title--brand {
          color: #4c1d95;
        }

        .tasks-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 6px;
        }

        .tasks-card__hint {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .tasks-card__today-pill {
          border-radius: 999px;
          border: none;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(147,51,234,0.4);
          white-space: nowrap;
        }

        .fan-dash .tasks-card ul {
          list-style: none;
          padding-left: 0;
          margin: 0;
          display: grid;
          gap: 8px;
        }

        .fan-dash .tasks-card li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          font-size: 14px;
          color: #111827;
        }

        .fan-dash .tasks-card li span,
        .fan-dash .tasks-card li p {
          margin: 0;
        }

        .fan-dash .tasks-card button {
          border-radius: 999px;
          border: none;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(147,51,234,0.4);
          white-space: nowrap;
        }

        .tasks-card__footer {
          margin-top: 10px;
          font-size: 12px;
          color: #9ca3af;
        }

        .checkin-row {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .btn-hot {
          border-radius: 999px;
          border: none;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #ffffff;
          box-shadow: 0 12px 26px rgba(147,51,234,0.45);
          white-space: nowrap;
        }
        .btn-hot:hover {
          filter: brightness(1.03);
        }
        .btn-hot:active {
          transform: translateY(1px);
          box-shadow: 0 8px 20px rgba(147,51,234,0.5);
        }

        /* GRID BELOW HERO */
        .fan-dash-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 18px;
        }

        @media (max-width: 900px) {
          .fan-dash-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .fan-dash-hero__body {
            flex-direction: column;
            align-items: flex-start;
          }

          .fan-dash-hero__copy {
            max-width: 100%;
          }

          .fan-dash-hero__avatar-card {
            align-self: center;
          }
        }

        /* STATS + QUICK ACTION PANELS */
        .stats__row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-tile {
          padding: 10px 10px 12px;
          border-radius: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
        }

        .stat-tile__label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
          margin-bottom: 4px;
        }

        .stat-tile__value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 6px;
        }

        .stat-tile__value--accent {
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text;
          color: transparent;
        }

        .progress {
          margin-top: 4px;
        }

        .progress__track {
          width: 100%;
          height: 7px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .progress__bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #a855f7, #4f46e5, #0ea5e9);
          transition: width 0.25s ease;
        }

        .progress__meta {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .fan-dash-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-panel {
          border-radius: 20px;
          padding: 16px 16px 18px;
          background: radial-gradient(circle at top left, #ffe7f6, #ffffff 65%);
          border: 1px solid rgba(244,220,255,0.9);
          box-shadow: 0 14px 32px rgba(148,163,184,0.25);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .feature-panel--episode {
          background:
            radial-gradient(circle at top left, #fee2f2, #ffffff 65%);
        }

        .feature-panel--closet {
          background:
            radial-gradient(circle at top left, #ede9fe, #ffffff 65%);
        }

        .feature-panel__label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #9ca3af;
        }

        .feature-panel__title {
          font-size: 16px;
          font-weight: 700;
          color: #4c1d95;
        }

        .feature-panel__text {
          font-size: 13px;
          color: #4b5563;
        }

        .feature-panel__footer {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .feature-panel__cta {
          border-radius: 999px;
          border: none;
          padding: 6px 13px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(147,51,234,0.4);
          white-space: nowrap;
        }

        .feature-panel__meta {
          font-size: 11px;
          color: #9ca3af;
        }

        .fan-econ-card {
          margin-top: 10px;
        }
      `}</style>

      {/* HERO */}
      <section className="fan-dash-hero">
        <div className="fan-dash-hero__body">
          {/* LEFT: copy + steps */}
          <div className="fan-dash-hero__copy">
            <div className="fan-dash-hero__eyebrow">
              Welcome to Lala&apos;s world ✨
            </div>
            <h1 className="fan-dash-hero__title">
              Welcome to Styling Adventures, bestie 💜
            </h1>
            <p className="fan-dash-hero__subtitle">
              Complete daily tasks, earn rewards, and unlock badges!
            </p>

            <div className="hero-steps">
              <div className="hero-step">
                <div className="hero-step__bubble">1</div>
                <div>
                  <div className="hero-step__label">Watch</div>
                  <div className="hero-step__text">
                    Catch the latest episode.
                  </div>
                </div>
              </div>

              <div className="hero-step">
                <div className="hero-step__bubble">2</div>
                <div>
                  <div className="hero-step__label">Style</div>
                  <div className="hero-step__text">
                    Create outfits &amp; win coins.
                  </div>
                </div>
              </div>

              <div className="hero-step">
                <div className="hero-step__bubble">3</div>
                <div>
                  <div className="hero-step__label">Share</div>
                  <div className="hero-step__text">
                    Show off looks &amp; chat.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: avatar card */}
          <div className="fan-dash-hero__avatar-card">
            <div className="avatar-circle">
              <img src="/lala-avatar.png" alt="Lala avatar" />
            </div>
            <div className="avatar-meta">
              <div className="avatar-greeting">
                Hi, {profile?.displayName || "bestie"}!
              </div>
              <div className="avatar-subline">
                You have <span className="avatar-coins">{coins}</span> coins
              </div>
            </div>
          </div>
        </div>

        {/* Today’s Adventures card */}
        <div className="card tasks-card fan-dash-hero__tasks">
          <div className="tasks-card__header">
            <h3 className="card__title card__title--brand">
              Today&apos;s Adventures
            </h3>
            <button type="button" className="tasks-card__today-pill">
              Today&apos;s →
            </button>
          </div>

          <p className="tasks-card__hint">
            Complete tasks to earn more petals &amp; coins.
          </p>
          <DailyTaskList
            onTaskComplete={onTaskComplete}
            onBadgeUnlocked={handleBadgeUnlocked}
          />
          <div className="checkin-row">
            <span>Don&apos;t forget your daily check-in streak!</span>
            <button type="button" className="btn-hot" onClick={onDailyCheckIn}>
              Check in
            </button>
          </div>
          <div className="tasks-card__footer">
            Current streak: <strong>{streak}</strong> day
            {streak === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {/* STATS + QUICK ACTION PANELS */}
      <section className="fan-dash-grid">
        {/* Left: stats */}
        <div>
          <div className="card">
            <h3 className="card__title card__title--brand">Your Progress</h3>
            <div className="stats__row">
              <div className="stat-tile">
                <div className="stat-tile__label">XP</div>
                <div className="stat-tile__value">{xp}</div>
                <div className="progress">
                  <div className="progress__track">
                    <div
                      className="progress__bar"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <span className="progress__meta">
                    {xpProgress}% to next level
                  </span>
                </div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile__label">Coins</div>
                <div className="stat-tile__value stat-tile__value--accent">
                  {coins}
                </div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile__label">Badges</div>
                <div className="stat-tile__value">{badgeCount}</div>
              </div>

              <div className="stat-tile">
                <div className="stat-tile__label">Streak</div>
                <div className="stat-tile__value">{streak} days</div>
              </div>
            </div>
          </div>

          {/* New: lightweight economy summary card */}
          <div className="card fan-econ-card">
            <h3 className="card__title card__title--brand">
              Lala&apos;s coin system
            </h3>
            {econLoading && (
              <p className="tasks-card__hint">
                Loading your money rules…
              </p>
            )}
            {!econLoading && econErr && (
              <p className="tasks-card__hint">
                Couldn&apos;t load the latest rules. You can still read them{" "}
                <a href="/fan/rules">here →</a>
              </p>
            )}
            {!econLoading && econ && (
              <>
                <p className="tasks-card__hint">
                  Coins are how you unlock fun stuff in Lala&apos;s world.
                  Here&apos;s your daily &amp; weekly ceiling:
                </p>
                <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
                  <li>
                    Daily cap:{" "}
                    <strong>
                      {econ.dailyCoinCap ?? "—"} coins/day
                    </strong>
                  </li>
                  <li>
                    Weekly cap:{" "}
                    <strong>
                      {econ.weeklyCoinCap ?? "—"} coins/week
                    </strong>
                  </li>
                </ul>
                <p
                  className="tasks-card__hint"
                  style={{ marginTop: 8 }}
                >
                  Wondering how to earn more?{" "}
                  <a href="/fan/rules">See all coin rules →</a>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right: quick actions */}
        <div className="fan-dash-actions">
          <div className="feature-panel feature-panel--episode">
            <div className="feature-panel__label">Watch</div>
            <div className="feature-panel__title">
              Watch the latest episode
            </div>
            <p className="feature-panel__text">
              Jump back into the story and earn coins by keeping up with
              Lala&apos;s world.
            </p>
            <div className="feature-panel__footer">
              <button
                type="button"
                className="feature-panel__cta"
                onClick={() => navigate("/fan/episodes")}
              >
                Continue watching →
              </button>
              <span className="feature-panel__meta">
                Earn coins from Watch tasks
              </span>
            </div>
          </div>

          <div className="feature-panel feature-panel--closet">
            <div className="feature-panel__label">Style</div>
            <div className="feature-panel__title">
              View Lala&apos;s Closet
            </div>
            <p className="feature-panel__text">
              Style outfits, play fashion games, and show off your looks in the
              Closet.
            </p>
            <div className="feature-panel__footer">
              <button
                type="button"
                className="feature-panel__cta"
                onClick={() => navigate("/fan/closet-feed")}
              >
                Open Lala&apos;s Closet →
              </button>
              <span className="feature-panel__meta">
                Earn XP & coins for styling
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* POPUPS / MODALS */}
      {settings.animationsEnabled && coinGain && (
        <CoinPopup show amount={coinGain} />
      )}

      {settings.animationsEnabled && showStreakModal && (
        <StreakModal
          streakCount={streakCount}
          bonusCoins={10}
          onClose={() => setShowStreakModal(false)}
        />
      )}

      {currentBadge && (
        <NewBadgeToast
          badge={currentBadge}
          badgeId={currentBadge.id}
          badgeLabel={currentBadge.label}
          onClose={() => setBadgeQueue((q) => q.slice(1))}
        />
      )}
    </div>
  );
}

