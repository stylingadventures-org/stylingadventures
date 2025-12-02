// site/src/routes/Profile.jsx
import React, { useEffect, useState } from "react";
import { getSA, fetchProfile, setDisplayName } from "../lib/sa";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [closet, setCloset] = useState([]);
  const [error, setError] = useState("");
  const [nameEdit, setNameEdit] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [economy, setEconomy] = useState(null);
  const [economyError, setEconomyError] = useState("");

  useEffect(() => {
    let gone = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const sa = await getSA();

        // 1) Game profile (level, coins, badges, displayName)
        const prof = await fetchProfile().catch(() => null);

        // 2) Basic user info (email / role) from SA.getUser if available
        let userMeta = {};
        try {
          if (sa?.getUser) {
            userMeta = sa.getUser() || {};
          }
        } catch {}

        // 3) My closet items
        let closetItems = [];
        try {
          const data = await sa.gql(`
            query {
              myCloset {
                id
                title
                status
                mediaKey
                createdAt
              }
            }
          `);
          closetItems = data?.myCloset ?? [];
        } catch (e) {
          console.warn("[Profile] myCloset query failed:", e);
        }

        // 4) Game economy config (for quick rules peek)
        let econ = null;
        try {
          const econResp = await sa.gql(`
            query GetGameEconomyConfig {
              getGameEconomyConfig {
                dailyCoinCap
                weeklyCoinCap
              }
            }
          `);
          econ = econResp?.getGameEconomyConfig || null;
        } catch (e) {
          console.warn("[Profile] getGameEconomyConfig failed:", e);
          if (!gone) setEconomyError(e?.message || String(e));
        }

        if (!gone) {
          const merged = {
            ...prof,
            email: userMeta.email || prof?.email || "",
            role: userMeta.role || "FAN",
          };
          setProfile(merged);
          setNameEdit(merged?.displayName || "");
          setCloset(closetItems);
          setEconomy(econ);
        }
      } catch (e) {
        if (!gone) setError(e?.message || String(e));
      } finally {
        if (!gone) setLoading(false);
      }
    })();

    return () => {
      gone = true;
    };
  }, []);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!nameEdit.trim()) return;
    try {
      setSavingName(true);
      const updated = await setDisplayName(nameEdit.trim());
      setProfile((p) => ({ ...(p || {}), ...updated }));
    } catch (e) {
      alert(e?.message || String(e));
    } finally {
      setSavingName(false);
    }
  }

  const p = profile || {};
  const badges = Array.isArray(p.badges) ? p.badges : [];
  const initial =
    (p.displayName || p.email || "U").slice(0, 1).toUpperCase();

  // --- loading / error shells in-page -------------------------

  if (loading && !profile) {
    return (
      <div className="pf-page">
        <div className="pf-shell">
          <div className="pf-cover pf-cover--loading" />
          <div className="pf-main">
            <div className="pf-main-left">
              <div className="pf-card">Loading your profile…</div>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pf-page">
        <div className="pf-shell">
          <div className="pf-cover" />
          <div className="pf-main">
            <div className="pf-main-left">
              <div className="pf-card pf-card-error">
                <h2>We couldn’t load your profile</h2>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // --- main FB-style layout ----------------------------------

  return (
    <div className="pf-page">
      <div className="pf-shell">
        {/* COVER + AVATAR (facebook-y header) */}
        <header className="pf-header">
          <div className="pf-cover" />

          <div className="pf-header-inner">
            <div className="pf-header-left">
              <div className="pf-avatar-wrap">
                <div className="pf-avatar">{initial}</div>
              </div>
              <div className="pf-header-info">
                <h1 className="pf-name">
                  {p.displayName || "Your display name"}
                </h1>
                <div className="pf-subline">
                  <span className="pf-subline-role">
                    {p.role || "FAN"}
                  </span>
                  <span className="pf-dot">•</span>
                  <span className="pf-subline-stat">
                    Level {p.level ?? 1}
                  </span>
                  <span className="pf-dot">•</span>
                  <span className="pf-subline-stat">
                    {closet.length} closet look
                    {closet.length === 1 ? "" : "s"}
                  </span>
                </div>
                {badges.length > 0 && (
                  <div className="pf-header-badges">
                    {badges.slice(0, 4).map((b) => (
                      <span key={b} className="pf-badge-pill">
                        {b}
                      </span>
                    ))}
                    {badges.length > 4 && (
                      <span className="pf-badge-pill pf-badge-pill--more">
                        +{badges.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pf-header-right">
              <button
                type="button"
                className="pf-btn pf-btn-primary"
                onClick={() => {
                  const el = document.querySelector(
                    ".pf-name-form-card",
                  );
                  if (el) {
                    el.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }}
              >
                ✏️ Edit profile
              </button>
              <a href="/fan/community" className="pf-btn pf-btn-ghost">
                💬 Community
              </a>
              <a href="/fan/closet" className="pf-btn pf-btn-ghost">
                💄 Closet
              </a>
            </div>
          </div>

          {/* "Tabs" bar (visual only, keeps page single-view) */}
          <div className="pf-tabs">
            <button className="pf-tab pf-tab--active">
              Timeline
            </button>
            <button className="pf-tab">Closet</button>
            <button className="pf-tab">Badges</button>
            <button className="pf-tab">About</button>
          </div>
        </header>

        {/* MAIN: left = timeline, right = about/stats */}
        <main className="pf-main">
          {/* LEFT COLUMN (Timeline-style feed) */}
          <div className="pf-main-left">
            {/* About / name edit card (like FB "Intro") */}
            <section className="pf-card pf-name-form-card">
              <h2 className="pf-card-title">Intro</h2>
              <p className="pf-card-sub">
                This is how you appear across episodes, leaderboards
                and comments.
              </p>

              <form
                onSubmit={handleSaveName}
                className="pf-name-form"
              >
                <label className="pf-field-label">
                  Display name
                </label>
                <div className="pf-name-row">
                  <input
                    type="text"
                    value={nameEdit}
                    onChange={(e) => setNameEdit(e.target.value)}
                    placeholder="Update your display name"
                    className="pf-input"
                  />
                  <button
                    type="submit"
                    disabled={savingName || !nameEdit.trim()}
                    className="pf-btn pf-btn-primary"
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </div>
                <p className="pf-help">
                  Pick something you’re happy to see on the fan
                  leaderboard and in community replies.
                </p>
              </form>

              <div className="pf-intro-list">
                {p.email && (
                  <div className="pf-intro-row">
                    <span className="pf-intro-icon">📧</span>
                    <span className="pf-intro-text">{p.email}</span>
                  </div>
                )}
                <div className="pf-intro-row">
                  <span className="pf-intro-icon">🎮</span>
                  <span className="pf-intro-text">
                    Level {p.level ?? 1} • {p.xp ?? 0} XP
                  </span>
                </div>
                <div className="pf-intro-row">
                  <span className="pf-intro-icon">👗</span>
                  <span className="pf-intro-text">
                    {closet.length} look
                    {closet.length === 1 ? "" : "s"} in the Style Lab
                  </span>
                </div>
              </div>
            </section>

            {/* Activity feed — closet items render like posts */}
            <section className="pf-card">
              <h2 className="pf-card-title">Activity</h2>
              <p className="pf-card-sub">
                Recent looks and styling adventures from your profile.
              </p>

              {closet.length === 0 ? (
                <p className="pf-empty">
                  No looks yet.{" "}
                  <a href="/fan/closet" className="pf-link">
                    Jump into the Style Lab →</a>
                </p>
              ) : (
                <div className="pf-feed">
                  {closet.map((item) => (
                    <article
                      key={item.id}
                      className="pf-post-card"
                    >
                      <div className="pf-post-head">
                        <div className="pf-post-avatar">
                          {initial}
                        </div>
                        <div className="pf-post-meta">
                          <div className="pf-post-author">
                            {p.displayName || "You"}
                          </div>
                          <div className="pf-post-line">
                            added a new closet look
                          </div>
                          <div className="pf-post-time">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt,
                                ).toLocaleString()
                              : "Recently"}
                          </div>
                        </div>
                      </div>

                      <div className="pf-post-body">
                        <div className="pf-post-title">
                          {item.title || "Untitled look"}
                        </div>
                        <div className="pf-post-tags">
                          <span className="pf-status-pill">
                            {item.status || "DRAFT"}
                          </span>
                          {item.mediaKey && (
                            <span className="pf-status-pill pf-status-pill--soft">
                              {item.mediaKey}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pf-post-footer">
                        <button
                          type="button"
                          className="pf-post-btn"
                          onClick={() =>
                            (window.location.href = "/fan/closet")
                          }
                        >
                          💄 Style more
                        </button>
                        <button
                          type="button"
                          className="pf-post-btn pf-post-btn--ghost"
                          onClick={() =>
                            (window.location.href =
                              "/fan/closet-feed")
                          }
                        >
                          ✨ View Lala&apos;s Closet
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN (About / stats sidebar) */}
          <aside className="pf-main-right">
            {/* Game stats card (existing) */}
            <section className="pf-card">
              <h2 className="pf-card-title">Game stats</h2>
              <p className="pf-card-sub">
                Your current progress inside Styling Adventures.
              </p>
              <div className="pf-stat-grid">
                <Stat label="Level" value={p.level ?? 1} />
                <Stat label="XP" value={p.xp ?? 0} />
                <Stat label="Coins" value={p.coins ?? 0} />
                <Stat
                  label="Streak"
                  value={p.streakCount ?? 0}
                  suffix=" days"
                />
              </div>
            </section>

            {/* NEW: Money system quick view */}
            <section className="pf-card">
              <h2 className="pf-card-title">Lala&apos;s money system</h2>
              <p className="pf-card-sub">
                A quick look at how many coins you can earn and where
                to read the full rules.
              </p>
              {economy ? (
                <div className="pf-intro-list">
                  <div className="pf-intro-row">
                    <span className="pf-intro-icon">📆</span>
                    <span className="pf-intro-text">
                      Daily cap:{" "}
                      <strong>
                        {economy.dailyCoinCap ?? "—"} coins/day
                      </strong>
                    </span>
                  </div>
                  <div className="pf-intro-row">
                    <span className="pf-intro-icon">📈</span>
                    <span className="pf-intro-text">
                      Weekly cap:{" "}
                      <strong>
                        {economy.weeklyCoinCap ?? "—"} coins/week
                      </strong>
                    </span>
                  </div>
                  <div className="pf-intro-row">
                    <span className="pf-intro-icon">📜</span>
                    <span className="pf-intro-text">
                      Want the full breakdown?{" "}
                      <a href="/fan/rules" className="pf-link">
                        Read Lala&apos;s coin rules →
                      </a>
                    </span>
                  </div>
                </div>
              ) : economyError ? (
                <p className="pf-empty">
                  Couldn&apos;t load coin limits. You can still read the
                  rules{" "}
                  <a href="/fan/rules" className="pf-link">
                    here →
                  </a>
                  .
                </p>
              ) : (
                <p className="pf-empty">
                  Loading your money rules…
                </p>
              )}
            </section>

            {/* Badges */}
            <section className="pf-card">
              <h2 className="pf-card-title">Badges</h2>
              {badges.length === 0 ? (
                <p className="pf-empty">
                  No badges yet — join events in the{" "}
                  <a href="/fan/community" className="pf-link">
                    Community hub
                  </a>{" "}
                  and style more looks to earn some.
                </p>
              ) : (
                <div className="pf-badges">
                  {badges.map((b) => (
                    <span key={b} className="pf-badge-pill">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Help / account tips */}
            <section className="pf-card">
              <h2 className="pf-card-title">Account & help</h2>
              <ul className="pf-help-list">
                <li>
                  <span className="pf-help-dot">•</span>
                  <span>
                    For email or password changes, use your main
                    login provider settings.
                  </span>
                </li>
                <li>
                  <span className="pf-help-dot">•</span>
                  <span>
                    If progress looks wrong, screenshot this page and
                    share it with support.
                  </span>
                </li>
                <li>
                  <span className="pf-help-dot">•</span>
                  <span>
                    Share ideas or report bugs in the{" "}
                    <a
                      href="/fan/community"
                      className="pf-link"
                    >
                      Community hub
                    </a>
                    .
                  </span>
                </li>
              </ul>
            </section>
          </aside>
        </main>
      </div>

      <style>{styles}</style>
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div className="pf-stat-card">
      <div className="pf-stat-label">{label}</div>
      <div className="pf-stat-value">
        {value}
        {suffix ? (
          <span className="pf-stat-suffix">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

const styles = `
.pf-page {
  max-width: 900px;
  margin: 0 auto 32px;
}

/* OUTER SHELL -------------------------------------------- */

.pf-shell {
  background: transparent;
}

/* COVER / HEADER ----------------------------------------- */

.pf-header {
  background:#ffffff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 18px 40px rgba(148,163,184,0.35);
  overflow:hidden;
  margin-bottom:12px;
}

.pf-cover {
  height:140px;
  background:
    radial-gradient(circle at top left,#f9a8d4,#fdf2ff 50%,transparent 80%),
    radial-gradient(circle at bottom right,#bfdbfe,#eff6ff 55%,transparent 80%),
    linear-gradient(135deg,#6366f1,#ec4899);
}
.pf-cover--loading {
  opacity:0.7;
}

.pf-header-inner {
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:12px;
  padding:0 16px 10px;
  position:relative;
}

.pf-header-left {
  display:flex;
  align-items:flex-end;
  gap:12px;
  margin-top:-42px; /* avatar overlaps cover */
}

.pf-avatar-wrap {
  position:relative;
}
.pf-avatar {
  width:88px;
  height:88px;
  border-radius:999px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  color:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:2.2rem;
  font-weight:700;
  box-shadow:0 0 0 3px #ffffff, 0 12px 26px rgba(129,140,248,0.7);
}

.pf-header-info {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.pf-name {
  margin:0;
  font-size:1.6rem;
  letter-spacing:-0.03em;
  color:#0f172a;
}
.pf-subline {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
  font-size:0.86rem;
  color:#4b5563;
}
.pf-subline-role {
  font-weight:600;
  color:#4c1d95;
}
.pf-subline-stat {
  color:#374151;
}
.pf-dot {
  color:#d1d5db;
}

.pf-header-badges {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:2px;
}

/* header actions */

.pf-header-right {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
  padding-bottom:4px;
}

/* TABS BAR ----------------------------------------------- */

.pf-tabs {
  border-top:1px solid #e5e7eb;
  padding:6px 12px 4px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.pf-tab {
  border:none;
  background:transparent;
  border-radius:999px;
  padding:6px 12px;
  font-size:0.85rem;
  cursor:pointer;
  color:#4b5563;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.pf-tab--active {
  background:#eef2ff;
  color:#4338ca;
  font-weight:600;
}

/* MAIN LAYOUT ------------------------------------------- */

.pf-main {
  display:grid;
  grid-template-columns:minmax(0, 1.6fr) minmax(0, 1.1fr);
  gap:14px;
}
@media (max-width: 800px) {
  .pf-main {
    grid-template-columns:minmax(0,1fr);
  }
}

.pf-main-left,
.pf-main-right {
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* CARDS -------------------------------------------------- */

.pf-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:12px 14px 14px;
  box-shadow:0 12px 32px rgba(148,163,184,0.15);
}
.pf-card-title {
  margin:0 0 2px;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.pf-card-sub {
  margin:0 0 8px;
  font-size:0.88rem;
  color:#6b7280;
}

/* INTRO / NAME FORM ------------------------------------- */

.pf-name-form {
  display:flex;
  flex-direction:column;
  gap:6px;
  margin-top:2px;
}
.pf-field-label {
  font-size:0.78rem;
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#9ca3af;
}
.pf-name-row {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}
.pf-input {
  flex:1 1 180px;
  min-width:180px;
  max-width:260px;
  padding:7px 11px;
  border-radius:999px;
  border:1px solid #d1d5db;
  font-size:0.9rem;
  font-family:inherit;
}
.pf-input:focus {
  outline:none;
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}
.pf-help {
  margin:0;
  font-size:0.78rem;
  color:#9ca3af;
}

/* intro rows */

.pf-intro-list {
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:4px;
}
.pf-intro-row {
  display:flex;
  gap:6px;
  font-size:0.88rem;
  color:#4b5563;
  align-items:flex-start;
}
.pf-intro-icon {
  font-size:1rem;
  line-height:1.4;
}
.pf-intro-text {
  flex:1;
}

/* ACTIVITY FEED ----------------------------------------- */

.pf-empty {
  margin:4px 0 0;
  font-size:0.88rem;
  color:#6b7280;
}
.pf-link {
  color:#4f46e5;
  text-decoration:none;
}
.pf-link:hover {
  text-decoration:underline;
}

.pf-feed {
  margin-top:6px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.pf-post-card {
  border-radius:14px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:10px 10px 9px;
}

.pf-post-head {
  display:flex;
  gap:8px;
  align-items:flex-start;
}
.pf-post-avatar {
  width:36px;
  height:36px;
  border-radius:999px;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  color:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1rem;
  font-weight:600;
}
.pf-post-meta {
  display:flex;
  flex-direction:column;
}
.pf-post-author {
  font-size:0.9rem;
  font-weight:600;
}
.pf-post-line {
  font-size:0.86rem;
  color:#4b5563;
}
.pf-post-time {
  font-size:0.75rem;
  color:#9ca3af;
}

.pf-post-body {
  margin-top:6px;
}
.pf-post-title {
  font-size:0.96rem;
  font-weight:600;
  color:#111827;
  margin-bottom:4px;
}
.pf-post-tags {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.pf-status-pill {
  padding:3px 9px;
  border-radius:999px;
  font-size:0.76rem;
  background:#eef2ff;
  border:1px solid #e0e7ff;
  color:#4338ca;
}
.pf-status-pill--soft {
  background:#f9fafb;
  border-color:#e5e7eb;
  color:#6b7280;
}

.pf-post-footer {
  margin-top:8px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.pf-post-btn {
  border:none;
  border-radius:999px;
  padding:6px 12px;
  font-size:0.8rem;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  background:#e0f2fe;
  color:#1d4ed8;
}
.pf-post-btn--ghost {
  background:#f9fafb;
  color:#4b5563;
}

/* STATS / BADGES (RIGHT) -------------------------------- */

.pf-stat-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
  gap:8px;
  margin-top:8px;
}
.pf-stat-card {
  padding:8px 10px;
  border-radius:12px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
}
.pf-stat-label {
  font-size:0.78rem;
  color:#6b7280;
}
.pf-stat-value {
  margin-top:3px;
  font-size:1.02rem;
  font-weight:600;
  color:#111827;
}
.pf-stat-suffix {
  margin-left:4px;
  font-size:0.78rem;
  color:#6b7280;
}

.pf-badges {
  margin-top:6px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.pf-badge-pill {
  padding:4px 10px;
  border-radius:999px;
  font-size:0.78rem;
  background:#fdf2ff;
  border:1px solid #f9a8d4;
  color:#9d174d;
}
.pf-badge-pill--more {
  background:#eff6ff;
  border-color:#bfdbfe;
  color:#1d4ed8;
}

/* HELP LIST --------------------------------------------- */

.pf-help-list {
  list-style:none;
  padding:0;
  margin:6px 0 0;
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:0.86rem;
  color:#4b5563;
}
.pf-help-dot {
  margin-right:4px;
  color:#9ca3af;
}

/* BUTTONS ----------------------------------------------- */

.pf-btn {
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  padding:7px 13px;
  font-size:0.86rem;
  font-weight:500;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.pf-btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.pf-btn:active {
  transform:translateY(1px);
}
.pf-btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.pf-btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.pf-btn-ghost {
  background:#ffffff;
  color:#374151;
}

/* ERROR CARD -------------------------------------------- */

.pf-card-error h2 {
  margin:0 0 4px;
  font-size:1.1rem;
}

/* RESPONSIVE -------------------------------------------- */

@media (max-width: 640px) {
  .pf-header-inner {
    flex-direction:column;
    align-items:flex-start;
  }
  .pf-header-right {
    padding-bottom:8px;
  }
  .pf-name {
    font-size:1.35rem;
  }
}
`;
