// site/src/routes/creator/Studio.jsx
import React, { useEffect, useState, useCallback } from "react";
import { graphql } from "../../lib/sa";

/**
 * Creator Studio (neutral theme)
 * Home for Creator / Collab / Admin / Prime tools.
 */

export default function CreatorStudio() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    looksPublished: 0,
    closetItems: 0,
    storiesPublished: 0,
    followers: 0,
  });

  const canGraphQL =
    typeof window !== "undefined" &&
    !!(window.sa?.graphql || window.__cfg?.appsyncUrl);

  const loadFromBackend = useCallback(async () => {
    if (!canGraphQL) return false;
    try {
      setLoading(true);
      setErr("");

      try {
        const data = await graphql(`
          query CreatorStudioOverview {
            myCloset {
              items {
                id
                status
              }
            }
            myWishlist {
              items {
                id
              }
            }
            stories: myStories {
              items {
                id
                status
              }
            }
          }
        `);

        const closetItems = data?.myCloset?.items ?? [];
        const stories = data?.stories?.items ?? [];

        const looksPublished = closetItems.filter(
          (c) => c.status === "PUBLISHED" || c.status === "APPROVED",
        ).length;

        const storiesPublished = stories.filter(
          (s) => s.status === "PUBLISHED",
        ).length;

        setStats({
          looksPublished,
          closetItems: closetItems.length,
          storiesPublished,
          followers: 0,
        });
      } catch (inner) {
        console.warn("CreatorStudio overview fetch failed", inner);
      }

      return true;
    } catch (e) {
      setErr(String(e?.message || e));
      return false;
    } finally {
      setLoading(false);
    }
  }, [canGraphQL]);

  useEffect(() => {
    loadFromBackend().catch(() => {});
  }, [loadFromBackend]);

  return (
    <div className="creator-page">
      <header className="creator-header">
        <div className="creator-header-left">
          <div className="creator-avatar-wrap">
            <div className="creator-avatar">C</div>
          </div>
          <div className="creator-header-info">
            <h1 className="creator-title">Creator Studio</h1>
            <div className="creator-subline">
              <span className="creator-subline-main">
                Styling Adventures • Creator / Collab / Prime tools
              </span>
              <span className="creator-dot">•</span>
              <span className="creator-subline-pill">
                Plan episodes, closets, and collabs.
              </span>
            </div>
            <div className="creator-header-tags">
              <span className="creator-tag">Studio</span>
              <span className="creator-tag">Production</span>
              <span className="creator-tag">Collabs</span>
            </div>
          </div>
        </div>

        <div className="creator-header-right">
          <a href="/fan/closet" className="creator-btn creator-btn-primary">
            💄 Closet tools
          </a>
          <a href="/creator/episodes" className="creator-btn creator-btn-ghost">
            🎬 Episodes
          </a>
          <a href="/creator/prime" className="creator-btn creator-btn-ghost">
            🎥 Prime Studio
          </a>
        </div>
      </header>

      {err && (
        <div className="creator-global-notice">
          <div className="creator-notice creator-notice--error">{err}</div>
        </div>
      )}

      <main className="creator-main">
        <section className="creator-main-left">
          {/* Overview */}
          <section className="creator-card">
            <div className="creator-card-head">
              <h2 className="creator-card-title">Overview</h2>
              {loading && (
                <span className="creator-pill creator-pill--tiny">
                  Syncing…
                </span>
              )}
            </div>
            <div className="creator-stats-grid">
              <div className="creator-stat">
                <div className="creator-stat-label">Published looks</div>
                <div className="creator-stat-value">
                  {stats.looksPublished}
                </div>
                <div className="creator-stat-sub">
                  Approved + live in closet
                </div>
              </div>
              <div className="creator-stat">
                <div className="creator-stat-label">Closet items</div>
                <div className="creator-stat-value">
                  {stats.closetItems}
                </div>
                <div className="creator-stat-sub">Drafts and published</div>
              </div>
              <div className="creator-stat">
                <div className="creator-stat-label">Stories live</div>
                <div className="creator-stat-value">
                  {stats.storiesPublished}
                </div>
                <div className="creator-stat-sub">
                  Closet stories in rotation
                </div>
              </div>
              <div className="creator-stat">
                <div className="creator-stat-label">Followers</div>
                <div className="creator-stat-value">
                  {stats.followers}
                </div>
                <div className="creator-stat-sub">
                  Hooked up later via analytics
                </div>
              </div>
            </div>
          </section>

          {/* Workbench */}
          <section className="creator-card">
            <div className="creator-card-head">
              <h2 className="creator-card-title">Workbench</h2>
              <span className="creator-card-sub">
                Jump into a creator task.
              </span>
            </div>
            <div className="creator-workbench">
              <a className="creator-task" href="/fan/closet">
                <div className="creator-task-icon">👗</div>
                <div className="creator-task-main">
                  <div className="creator-task-title">Draft a new look</div>
                  <div className="creator-task-sub">
                    Build a closet item and send it through approval.
                  </div>
                </div>
              </a>
              <a className="creator-task" href="/creator/episodes">
                <div className="creator-task-icon">🎬</div>
                <div className="creator-task-main">
                  <div className="creator-task-title">Plan an episode</div>
                  <div className="creator-task-sub">
                    Sketch beats, outfits, and interactive moments.
                  </div>
                </div>
              </a>
              <a className="creator-task" href="/creator/prime">
                <div className="creator-task-icon">🎥</div>
                <div className="creator-task-main">
                  <div className="creator-task-title">Prime Studios board</div>
                  <div className="creator-task-sub">
                    Track production, approvals, and delivery.
                  </div>
                </div>
              </a>
              <a className="creator-task" href="/creator/collabs">
                <div className="creator-task-icon">🤝</div>
                <div className="creator-task-main">
                  <div className="creator-task-title">Collab center</div>
                  <div className="creator-task-sub">
                    Manage partner briefs, uploads, and timelines.
                  </div>
                </div>
              </a>
            </div>
          </section>
        </section>

        <aside className="creator-main-right">
          <section className="creator-card">
            <div className="creator-card-head">
              <h2 className="creator-card-title">Role-based tools</h2>
              <span className="creator-card-sub">
                Creator, Collab, Admin & Prime
              </span>
            </div>

            <ul className="creator-role-list">
              <li className="creator-role-row">
                <div className="creator-role-dot" />
                <div className="creator-role-main">
                  <div className="creator-role-title">Creator tools</div>
                  <div className="creator-role-meta">
                    Closet, stories, and planning.
                  </div>
                </div>
                <a className="creator-pill-link" href="/creator/tools">
                  Open
                </a>
              </li>
              <li className="creator-role-row">
                <div className="creator-role-dot" />
                <div className="creator-role-main">
                  <div className="creator-role-title">Collab center</div>
                  <div className="creator-role-meta">
                    Brand briefs and deliverables.
                  </div>
                </div>
                <a className="creator-pill-link" href="/creator/collabs">
                  View
                </a>
              </li>
              <li className="creator-role-row">
                <div className="creator-role-dot" />
                <div className="creator-role-main">
                  <div className="creator-role-title">Admin console</div>
                  <div className="creator-role-meta">
                    Moderation & game settings.
                  </div>
                </div>
                <a className="creator-pill-link" href="/admin">
                  Admin
                </a>
              </li>
              <li className="creator-role-row">
                <div className="creator-role-dot" />
                <div className="creator-role-main">
                  <div className="creator-role-title">Prime Studios</div>
                  <div className="creator-role-meta">
                    Internal production-only workflows.
                  </div>
                </div>
                <a className="creator-pill-link" href="/creator/prime">
                  Studio
                </a>
              </li>
            </ul>
          </section>

          <section className="creator-card">
            <div className="creator-card-head">
              <h2 className="creator-card-title">Context</h2>
            </div>
            <p className="creator-next-text">
              Access to this studio is enforced by your account tier:
              Creator, Collab, Admin, or Prime. Fan / Bestie accounts stay
              in the fan hub and Bestie area.
            </p>
            <a
              href="/fan/community"
              className="creator-btn creator-btn-ghost creator-btn-full"
            >
              Back to fan community
            </a>
          </section>
        </aside>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.creator-page {
  max-width:1100px;
  margin:0 auto 32px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

/* HEADER (neutral) -------------------------------------- */

.creator-header {
  background:#ffffff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 16px 30px rgba(15,23,42,0.12);
  padding:12px 16px;
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:center;
}

.creator-header-left {
  display:flex;
  align-items:center;
  gap:10px;
}

.creator-avatar-wrap { position:relative; }

.creator-avatar {
  width:56px;
  height:56px;
  border-radius:999px;
  background:#111827;
  color:#f9fafb;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1.4rem;
  font-weight:700;
  box-shadow:0 0 0 3px #ffffff,0 8px 18px rgba(15,23,42,0.5);
}

.creator-header-info {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.creator-title {
  margin:0;
  font-size:1.5rem;
  letter-spacing:-0.03em;
  color:#0f172a;
}
.creator-subline {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
  font-size:0.86rem;
}
.creator-subline-main {
  font-weight:500;
  color:#4b5563;
}
.creator-subline-pill {
  padding:3px 9px;
  border-radius:999px;
  font-size:0.8rem;
  background:#e5e7eb;
  color:#111827;
}
.creator-dot {
  color:#d1d5db;
}

.creator-header-tags {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.creator-tag {
  padding:3px 8px;
  border-radius:999px;
  font-size:0.78rem;
  background:#f3f4f6;
  color:#374151;
  border:1px solid #e5e7eb;
}

.creator-header-right {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

/* MAIN -------------------------------------------------- */

.creator-main {
  max-width:1100px;
  margin:0 auto;
  display:grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1.1fr);
  gap:14px;
  align-items:flex-start;
}
@media (max-width: 880px) {
  .creator-main {
    grid-template-columns:minmax(0,1fr);
  }
}
.creator-main-left,
.creator-main-right {
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* CARD -------------------------------------------------- */

.creator-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:12px 14px 14px;
  box-shadow:0 10px 24px rgba(15,23,42,0.08);
}

.creator-card-head {
  display:flex;
  justify-content:space-between;
  gap:8px;
  align-items:flex-start;
}
.creator-card-title {
  margin:0;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.creator-card-sub {
  font-size:0.8rem;
  color:#9ca3af;
}

/* STATS ------------------------------------------------- */

.creator-stats-grid {
  margin-top:8px;
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
  gap:8px;
}
.creator-stat {
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:8px 9px;
  background:#f9fafb;
}
.creator-stat-label {
  font-size:0.78rem;
  color:#6b7280;
}
.creator-stat-value {
  font-size:1.25rem;
  font-weight:700;
  margin-top:2px;
  color:#111827;
}
.creator-stat-sub {
  font-size:0.78rem;
  color:#9ca3af;
  margin-top:2px;
}

/* WORKBENCH -------------------------------------------- */

.creator-workbench {
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.creator-task {
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:8px;
  align-items:flex-start;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:7px 9px;
  text-decoration:none;
  background:#f9fafb;
}
.creator-task:hover {
  background:#f3f4f6;
  border-color:#d1d5db;
}
.creator-task-icon {
  width:32px;
  height:32px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#e5e7eb;
  font-size:1.1rem;
}
.creator-task-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.creator-task-title {
  font-size:0.9rem;
  font-weight:600;
  color:#111827;
}
.creator-task-sub {
  font-size:0.8rem;
  color:#6b7280;
}

/* ROLE LIST -------------------------------------------- */

.creator-role-list {
  list-style:none;
  padding:0;
  margin:6px 0 0;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.creator-role-row {
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:8px;
  align-items:center;
  border-radius:10px;
  border:1px solid #e5e7eb;
  padding:7px 8px;
  background:#f9fafb;
}
.creator-role-dot {
  width:10px;
  height:10px;
  border-radius:999px;
  background:#111827;
}
.creator-role-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.creator-role-title {
  font-size:0.88rem;
  font-weight:600;
  color:#111827;
}
.creator-role-meta {
  font-size:0.78rem;
  color:#6b7280;
}
.creator-pill-link {
  font-size:0.78rem;
  padding:4px 9px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  text-decoration:none;
  color:#111827;
  background:#ffffff;
}
.creator-pill-link:hover {
  background:#f3f4f6;
}

/* TEXT & NOTICES ---------------------------------------- */

.creator-next-text {
  font-size:0.9rem;
  color:#4b5563;
  margin:4px 0 8px;
}

.creator-global-notice {
  max-width:1100px;
  margin:0 auto;
}

.creator-notice {
  padding:10px 12px;
  border-radius:10px;
}
.creator-notice--error {
  border:1px solid #ffd4d4;
  background:#fff6f6;
  color:#7a1a1a;
}

/* BUTTONS ----------------------------------------------- */

.creator-btn {
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#ffffff;
  color:#111827;
  padding:8px 14px;
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
.creator-btn:hover {
  background:#f3f4f6;
  border-color:#9ca3af;
  box-shadow:0 4px 12px rgba(15,23,42,0.15);
}
.creator-btn:active {
  transform: translateY(1px);
}
.creator-btn-primary {
  background:#111827;
  border-color:#111827;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(15,23,42,0.45);
}
.creator-btn-primary:hover {
  background:#020617;
  border-color:#020617;
}
.creator-btn-ghost {
  background:#ffffff;
  color:#111827;
}
.creator-btn-full {
  width:100%;
}

/* PILLS ------------------------------------------------- */

.creator-pill {
  display:inline-flex;
  align-items:center;
  height:24px;
  padding:0 9px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
  font-size:0.8rem;
}
.creator-pill--tiny {
  height:20px;
  padding:0 8px;
  font-size:0.75rem;
}

/* RESPONSIVE -------------------------------------------- */

@media (max-width: 640px) {
  .creator-header {
    flex-direction:column;
    align-items:flex-start;
  }
  .creator-header-right {
    width:100%;
    justify-content:flex-start;
    flex-wrap:wrap;
  }
  .creator-title {
    font-size:1.35rem;
  }
}
`;
