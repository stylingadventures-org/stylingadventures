// site/src/routes/episodes/Episodes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EPISODES,
  fmtCountdown,
  getEpisodesOrdered,
} from "../../lib/episodes";

/**
 * Helper: determine whether a BestieStatus object represents
 * an active Bestie membership.
 */
function isBestieActive(status) {
  if (!status) return false;

  // If schema exposes activeSubscription, respect it
  if (typeof status.activeSubscription === "boolean") {
    if (!status.activeSubscription) return false;
  }

  // Optional expiry guard
  if (status.expiresAt) {
    const exp = Date.parse(status.expiresAt);
    if (!Number.isNaN(exp) && exp < Date.now()) {
      return false;
    }
  }

  // Fallback: isBestie boolean
  if (typeof status.isBestie === "boolean") {
    return status.isBestie;
  }

  return false;
}

export default function Episodes() {
  const nav = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [isBestie, setIsBestie] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // live countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // membership check
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (window.sa?.ready) {
          await window.sa.ready();
        }
        const data = await window.sa?.graphql?.(
          `query MeBestieStatus {
             meBestieStatus {
               isBestie
               activeSubscription
               expiresAt
             }
           }`
        );
        if (!alive) return;
        setIsBestie(isBestieActive(data?.meBestieStatus));
      } catch {
        if (!alive) return;
        setIsBestie(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ordered = useMemo(() => getEpisodesOrdered(), []);
  const featured = ordered[0] || null;

  async function unlockBestieForEpisode(epId) {
    try {
      setErr("");

      if (window.sa?.ready) {
        await window.sa.ready();
      }

      // make sure they're signed in
      const idTok =
        window.sa?.session?.idToken ||
        localStorage.getItem("sa:idToken") ||
        localStorage.getItem("sa_id_token") ||
        sessionStorage.getItem("id_token");
      if (!idTok) {
        if (window.SA?.startLogin) {
          window.SA.startLogin();
          return;
        }
        window.location.assign("/");
        return;
      }

      // Try checkout -> return to /watch/:id
      try {
        const r = await window.sa.graphql(
          `mutation StartBestieCheckout($successPath: String){ 
             startBestieCheckout(successPath:$successPath){ url } 
           }`,
          { successPath: `/watch/${epId}` }
        );
        const url = r?.startBestieCheckout?.url;
        if (url) {
          window.location.assign(url);
          return;
        }
      } catch {
        // ignore, try trial next
      }

      // Trial fallback – only ask for __typename to avoid
      // touching fields that may be non-null in schema but null in resolver
      const trial = await window.sa.graphql(
        `mutation ClaimBestieTrial {
           claimBestieTrial {
             __typename
           }
         }`
      );

      if (trial?.claimBestieTrial) {
        // trial succeeded or they were already a Bestie
        setIsBestie(true);
      }
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  const renderCta = (ep) => {
    const early = now < ep.publicAt;
    const countdown = fmtCountdown(ep.publicAt, now);

    if (!early || isBestie) {
      return (
        <button
          className="ep-btn ep-btn-primary"
          onClick={() => nav(`/watch/${ep.id}`)}
        >
          Watch now
        </button>
      );
    }

    return (
      <>
        <button
          className="ep-btn ep-btn-primary"
          onClick={() => unlockBestieForEpisode(ep.id)}
        >
          Unlock with Bestie
        </button>
        <div className="ep-card-countdown">
          Public in <strong>{countdown}</strong>
        </div>
      </>
    );
  };

  function smallStatusLine(ep) {
    const early = now < ep.publicAt;
    const countdown = fmtCountdown(ep.publicAt, now);
    if (!early || isBestie) {
      return `Public now · ${new Date(ep.publicAt).toLocaleDateString()}`;
    }
    return `Early for Besties · Public in ${countdown}`;
  }

  return (
    <div className="ep-page">
      {/* HERO / SERIES HEADER */}
      <header className="ep-hero">
        <div className="ep-hero-inner">
          <div className="ep-hero-topRow">
            <div className="ep-hero-pill">📺 Style Lab • Episodes</div>
            <div className="ep-hero-bestie">
              <span
                className={
                  "ep-bestie-pill" +
                  (isBestie ? " ep-bestie-pill--active" : "")
                }
              >
                {isBestie ? "Active Bestie 💖" : "Bestie locked"}
              </span>
              {loading && (
                <span className="ep-bestie-meta">Checking…</span>
              )}
              {!loading && !isBestie && (
                <span className="ep-bestie-meta">
                  Unlock early access and bonus drops.
                </span>
              )}
            </div>
          </div>

          <div className="ep-hero-main">
            <div className="ep-hero-left">
              <h1 className="ep-hero-title">Binge Styling Adventures</h1>
              <p className="ep-hero-sub">
                New episodes drop regularly with fresh fits, challenges, and
                Bestie-only early access. Watch, earn petals, then jump into{" "}
                <strong>Lala&apos;s Closet</strong> to heart your favorite
                looks.
              </p>

              <div className="ep-hero-actions">
                <Link to="/fan" className="ep-hero-link">
                  ← Back to fan home
                </Link>
                <Link to="/fan/closet" className="ep-hero-link">
                  Open Style Lab games →
                </Link>
              </div>
            </div>

            {/* Featured episode “hero card” */}
            {featured && (
              <div className="ep-featured-card">
                <div className="ep-featured-thumb">
                  <div className="ep-featured-episodeTag">
                    EP{" "}
                    {ordered.findIndex((x) => x.id === featured.id) + 1 ||
                      1}
                  </div>
                  <div className="ep-featured-thumbOverlay" />
                </div>
                <div className="ep-featured-body">
                  <div className="ep-featured-label">Featured episode</div>
                  <h2 className="ep-featured-title">{featured.title}</h2>
                  <div className="ep-featured-meta">
                    <span className="ep-pill ep-pill--series">
                      Styling Adventures
                    </span>
                    <span className="ep-pill ep-pill--status">
                      {smallStatusLine(featured)}
                    </span>
                  </div>
                  <div className="ep-featured-cta">
                    {renderCta(featured)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="ep-main">
        {err && <div className="ep-notice ep-notice--error">{err}</div>}
        {loading && (
          <div className="ep-loading">Checking your Bestie status…</div>
        )}

        {/* Episodes rail */}
        <section className="ep-row">
          <div className="ep-row-header">
            <div>
              <h2 className="ep-row-title">Latest episodes</h2>
              <p className="ep-row-sub">
                Start from the top or skip to the vibe you&apos;re in the mood
                for. Locked thumbnails are early access for Besties.
              </p>
            </div>
            <button
              className="ep-btn ep-btn-ghost ep-row-refresh"
              type="button"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>

          <div className="ep-rail">
            {ordered.map((ep, idx) => {
              const early = now < ep.publicAt;
              const countdown = fmtCountdown(ep.publicAt, now);
              const locked = early && !isBestie;

              return (
                <article key={ep.id} className="ep-tile">
                  <div className="ep-tile-thumbWrap">
                    <div className="ep-tile-thumb">
                      <span className="ep-tile-episodeTag">
                        EP {idx + 1}
                      </span>
                      {locked && (
                        <div className="ep-tile-lockOverlay">
                          <span className="ep-tile-lockIcon">🔒</span>
                          <span className="ep-tile-lockText">
                            Early for Besties
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ep-tile-body">
                    <h3 className="ep-tile-title">{ep.title}</h3>
                    <div className="ep-tile-meta">
                      <span
                        className={
                          "ep-pill ep-pill--small " +
                          (locked ? "" : "ep-pill--public")
                        }
                      >
                        {locked
                          ? `Public in ${countdown}`
                          : "Public now"}
                      </span>
                      <span className="ep-pill ep-pill--small ep-pill--date">
                        {new Date(ep.publicAt).toLocaleDateString()}
                      </span>
                      {early && (
                        <span className="ep-pill ep-pill--small ep-pill--bestie">
                          Bestie early access
                        </span>
                      )}
                    </div>

                    <div className="ep-tile-actions">
                      {renderCta(ep)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.ep-page {
  padding: 16px 0 32px;
}

/* HERO / SERIES HEADER – pink/purple/blue gradient --------------------- */

.ep-hero {
  background:
    radial-gradient(circle at top left, #f9a8d4 0, #fdf2ff 35%, transparent 70%),
    radial-gradient(circle at bottom right, #bfdbfe 0, #eff6ff 35%, transparent 75%),
    linear-gradient(135deg, #6366f1, #ec4899);
  border-radius: 24px;
  border: 1px solid rgba(216, 180, 254, 0.9);
  box-shadow: 0 18px 40px rgba(129,140,248,0.55);
  color: #0f172a;
}

.ep-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 18px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ep-hero-topRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ep-hero-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(196,181,253,0.9);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b21a8;
}

.ep-hero-bestie {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ep-bestie-pill {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(196,181,253,0.9);
  background: rgba(255,255,255,0.9);
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
}
.ep-bestie-pill--active {
  background: linear-gradient(135deg,#6366f1,#ec4899);
  border-color: #a855f7;
  color: #f9fafb;
}
.ep-bestie-meta {
  font-size: 11px;
  color: #4b5563;
}

.ep-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 2.3fr);
  gap: 18px;
  align-items: stretch;
}
@media (max-width: 900px) {
  .ep-hero-main {
    grid-template-columns: minmax(0,1fr);
  }
}

.ep-hero-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 520px;
}

.ep-hero-title {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
  color: #111827;
}

.ep-hero-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
}

.ep-hero-actions {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ep-hero-link {
  font-size: 0.85rem;
  color: #312e81;
  text-decoration: none;
}
.ep-hero-link:hover {
  text-decoration: underline;
}

/* Featured episode card */

.ep-featured-card {
  background: rgba(15,23,42,0.85);
  border-radius: 18px;
  border: 1px solid rgba(165,180,252,0.9);
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 2fr);
  gap: 10px;
  padding: 10px 12px;
  box-shadow: 0 18px 40px rgba(15,23,42,0.6);
  color: #e5e7eb;
}
@media (max-width: 600px) {
  .ep-featured-card {
    grid-template-columns: minmax(0,1fr);
  }
}

.ep-featured-thumb {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left,#f9a8d4,#ec4899),
    radial-gradient(circle at bottom,#6366f1,#312e81);
  min-height: 130px;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.ep-featured-thumbOverlay {
  flex: 1;
  background-image: linear-gradient(
    to bottom,
    rgba(15,23,42,0.1),
    rgba(15,23,42,0.55)
  );
}

.ep-featured-episodeTag {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15,23,42,0.95);
  color: #f9fafb;
  font-size: 11px;
  font-weight: 600;
}

.ep-featured-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.ep-featured-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #c7d2fe;
}

.ep-featured-title {
  margin: 0;
  font-size: 1.1rem;
}

.ep-featured-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ep-featured-cta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* MAIN ----------------------------------------------------- */

.ep-main {
  max-width: 1120px;
  margin: 14px auto 0;
}

.ep-loading {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #6b7280;
}

.ep-notice {
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}
.ep-notice--error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #7f1d1d;
}

/* Episodes row / rail -------------------------------------- */

.ep-row {
  margin-top: 4px;
}

.ep-row-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.ep-row-title {
  margin: 0;
  font-size: 1.1rem;
}

.ep-row-sub {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.ep-row-refresh {
  align-self: flex-start;
}

/* horizontal rail */

.ep-rail {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 2px;
  scroll-snap-type: x mandatory;
}

.ep-rail::-webkit-scrollbar {
  height: 6px;
}
.ep-rail::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 999px;
}

/* Episode tiles -------------------------------------------- */

.ep-tile {
  scroll-snap-align: start;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(148,163,184,0.32);
  width: 220px;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ep-tile-thumbWrap {
  position: relative;
}

.ep-tile-thumb {
  position: relative;
  background:
    radial-gradient(circle at top left,#e0e7ff,#c4b5fd),
    radial-gradient(circle at bottom right,#fecaca,#f9a8d4);
  aspect-ratio: 16 / 9;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.ep-tile-episodeTag {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(15,23,42,0.9);
  color: #f9fafb;
  font-size: 11px;
  font-weight: 600;
}

.ep-tile-lockOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(88,28,135,0.4),
    rgba(30,64,175,0.9)
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #f9fafb;
  font-size: 0.8rem;
}

.ep-tile-lockIcon {
  font-size: 1.2rem;
}

.ep-tile-body {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ep-tile-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.ep-tile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.ep-card-countdown {
  font-size: 0.78rem;
  color: #4b5563;
}

.ep-tile-actions {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Pills & buttons ------------------------------------------ */

.ep-pill {
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.78rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
}

.ep-pill--small {
  padding: 2px 7px;
  font-size: 0.72rem;
}

.ep-pill--series {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #3730a3;
}

.ep-pill--status {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #4b5563;
}

.ep-pill--public {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #3730a3;
}

.ep-pill--date {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.ep-pill--bestie {
  background: #fdf2ff;
  border-color: #f9a8d4;
  color: #be185d;
}

/* generic episode buttons */

.ep-btn {
  appearance: none;
  border-radius: 999px;
  padding: 7px 13px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.ep-btn:hover {
  background: #f5f3ff;
  border-color: #ddd6fe;
  box-shadow: 0 6px 16px rgba(129,140,248,0.35);
}
.ep-btn:active {
  transform: translateY(1px);
}

.ep-btn-primary {
  background: linear-gradient(135deg,#6366f1,#ec4899);
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(236,72,153,0.45);
}
.ep-btn-primary:hover {
  background: linear-gradient(135deg,#4f46e5,#db2777);
  border-color: #4f46e5;
}

.ep-btn-ghost {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #4b5563;
}

/* Responsive tweaks ---------------------------------------- */

@media (max-width: 768px) {
  .ep-rail {
    gap: 10px;
  }
  .ep-tile {
    width: 200px;
  }
}

@media (max-width: 640px) {
  .ep-hero-inner {
    padding: 14px 14px 14px;
  }
  .ep-hero-title {
    font-size: 1.5rem;
  }
}
`;
