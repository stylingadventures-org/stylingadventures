// site/src/routes/episodes/Episodes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EPISODES,
  fmtCountdown,
  getEpisodesOrdered,
} from "../../lib/episodes";

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
        const data = await window.sa?.graphql?.(
          `query { meBestieStatus { active } }`
        );
        if (!alive) return;
        setIsBestie(!!data?.meBestieStatus?.active);
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

  async function unlockBestieForEpisode(epId) {
    try {
      setErr("");
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
          `mutation Start($successPath: String){ 
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
        // ignore, try trial
      }

      const trial = await window.sa.graphql(
        `mutation { claimBestieTrial { active } }`
      );
      if (trial?.claimBestieTrial?.active) {
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
          className="btn btn-primary"
          onClick={() => nav(`/watch/${ep.id}`)}
        >
          Watch now
        </button>
      );
    }

    return (
      <>
        <div className="ep-countdown">
          Public in <strong>{countdown}</strong>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => unlockBestieForEpisode(ep.id)}
        >
          Unlock with Bestie
        </button>
      </>
    );
  };

  return (
    <div className="ep-page">
      {/* HERO */}
      <header className="ep-hero">
        <div className="ep-hero-inner">
          <div className="ep-hero-left">
            <div className="ep-hero-badge">📺 Style Lab • Episodes</div>
            <h1 className="ep-hero-title">Binge Styling Adventures</h1>
            <p className="ep-hero-sub">
              Watch new drops, earn petals (XP), and get early access as a
              Bestie. When you spot a favorite outfit, jump into{" "}
              <strong>Lala&apos;s Closet</strong> to heart the look.
            </p>

            <div className="ep-hero-actions">
              <Link to="/fan" className="ep-hero-btn ep-hero-btn-ghost">
                ← Back to fan home
              </Link>
              <Link
                to="/fan/closet"
                className="ep-hero-btn ep-hero-btn-soft"
              >
                Open style games
              </Link>
            </div>
          </div>

          <div className="ep-hero-right">
            <div className="ep-status-card">
              <div className="ep-status-label">Bestie status</div>
              <div className="ep-status-row">
                <span
                  className={
                    "ep-status-pill" +
                    (isBestie ? " ep-status-pill--active" : "")
                  }
                >
                  {isBestie ? "Active Bestie 💖" : "Locked"}
                </span>
                {loading && (
                  <span className="ep-status-meta">Checking…</span>
                )}
                {!loading && !isBestie && (
                  <span className="ep-status-meta">
                    Unlock early episodes with Bestie.
                  </span>
                )}
              </div>
              <p className="ep-status-footnote">
                Besties see episodes before the public release date. Public
                drops unlock automatically once the countdown hits zero.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="ep-main">
        {err && <div className="notice notice--error">{err}</div>}
        {loading && (
          <div className="ep-loading">
            Checking your Bestie status…
          </div>
        )}

        <div className="ep-grid">
          {ordered.map((ep, idx) => {
            const early = now < ep.publicAt;
            const countdown = fmtCountdown(ep.publicAt, now);

            return (
              <article key={ep.id} className="ep-card">
                <div className="ep-card-thumb">
                  <span className="ep-card-episode-tag">
                    EP {idx + 1}
                  </span>
                </div>

                <div className="ep-card-body">
                  <div className="ep-card-header">
                    <h2 className="ep-card-title">{ep.title}</h2>
                    {early && <span className="ep-lock">🔒</span>}
                  </div>

                  <div className="ep-card-meta">
                    <span
                      className={
                        "ep-pill" +
                        (early ? "" : " ep-pill--public")
                      }
                    >
                      {early
                        ? `Public in ${countdown}`
                        : "Public now"}
                    </span>
                    <span className="ep-pill ep-pill--date">
                      Public:{" "}
                      {new Date(ep.publicAt).toLocaleString()}
                    </span>
                    {early && (
                      <span className="ep-pill ep-pill--bestie">
                        Bestie early access
                      </span>
                    )}
                  </div>

                  <div className="ep-card-actions">
                    {renderCta(ep)}
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => window.location.reload()}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.ep-page {
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* HERO */
.ep-hero {
  border-radius:22px;
  background:
    radial-gradient(circle at top left, #fde7f4 0, #fdf2ff 35%, transparent 65%),
    radial-gradient(circle at bottom right, #dbeafe 0, #eef2ff 35%, transparent 70%);
  border:1px solid rgba(248,250,252,0.95);
  box-shadow:0 18px 40px rgba(15,23,42,0.08);
}
.ep-hero-inner {
  max-width:1100px;
  margin:0 auto;
  padding:18px 20px 18px;
  display:grid;
  grid-template-columns:minmax(0, 3fr) minmax(0, 2fr);
  gap:18px;
}
.ep-hero-left {
  display:flex;
  flex-direction:column;
  gap:10px;
}
.ep-hero-badge {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:4px 10px;
  border-radius:999px;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
  background:rgba(255,255,255,0.92);
  color:#6b21a8;
  border:1px solid rgba(148,163,184,0.5);
}
.ep-hero-title {
  margin:0;
  font-size:1.6rem;
  letter-spacing:-0.02em;
  color:#0f172a;
}
.ep-hero-sub {
  margin:0;
  font-size:0.96rem;
  color:#4b5563;
  max-width:520px;
}
.ep-hero-actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:4px;
}
.ep-hero-btn {
  border-radius:999px;
  padding:8px 16px;
  font-size:0.9rem;
  font-weight:600;
  border:1px solid transparent;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition:background .15s ease, box-shadow .15s ease, transform .04s ease, border-color .15s ease;
}
.ep-hero-btn-ghost {
  background:rgba(255,255,255,0.96);
  border-color:rgba(148,163,184,0.5);
  color:#111827;
}
.ep-hero-btn-ghost:hover {
  background:#f9fafb;
}
.ep-hero-btn-soft {
  background:#4f46e5;
  border-color:#4f46e5;
  color:#fff;
  box-shadow:0 10px 26px rgba(79,70,229,0.45);
}
.ep-hero-btn-soft:hover {
  background:#4338ca;
  border-color:#4338ca;
  transform:translateY(-1px);
}

.ep-hero-right {
  display:flex;
  align-items:stretch;
  justify-content:flex-end;
}
.ep-status-card {
  background:rgba(255,255,255,0.96);
  border-radius:18px;
  padding:12px 14px;
  border:1px solid rgba(226,232,240,0.9);
  box-shadow:0 14px 30px rgba(15,23,42,0.10);
  min-width:240px;
}
.ep-status-label {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.16em;
  color:#9ca3af;
  margin-bottom:4px;
}
.ep-status-row {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
  margin-bottom:6px;
}
.ep-status-pill {
  padding:4px 10px;
  border-radius:999px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  font-size:11px;
  font-weight:600;
  color:#4b5563;
}
.ep-status-pill--active {
  background:#111827;
  border-color:#111827;
  color:#f9fafb;
}
.ep-status-meta {
  font-size:11px;
  color:#6b7280;
}
.ep-status-footnote {
  margin:0;
  font-size:11px;
  color:#6b7280;
}

/* MAIN */
.ep-main {
  max-width:1100px;
  margin:0 auto 24px;
}

.ep-loading {
  margin-bottom:10px;
  font-size:0.9rem;
  color:#6b7280;
}

.notice {
  padding:10px 12px;
  border-radius:10px;
  margin-bottom:12px;
}
.notice--error {
  border:1px solid #ffd4d4;
  background:#fff6f6;
  color:#7a1a1a;
  font-size:0.9rem;
}

/* GRID + CARDS */
.ep-grid {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap:14px;
}
.ep-card {
  display:grid;
  grid-template-columns:110px minmax(0,1fr);
  gap:12px;
  padding:12px;
  border-radius:18px;
  background:#ffffff;
  border:1px solid #e5e7eb;
  box-shadow:0 12px 32px rgba(15,23,42,0.06);
}
.ep-card-thumb {
  border-radius:14px;
  background:linear-gradient(135deg,#e0e7ff,#fef3ff);
  position:relative;
}
.ep-card-episode-tag {
  position:absolute;
  left:10px;
  bottom:10px;
  padding:4px 10px;
  border-radius:999px;
  background:rgba(15,23,42,0.92);
  color:#f9fafb;
  font-size:11px;
  font-weight:600;
}
.ep-card-body {
  display:flex;
  flex-direction:column;
  gap:6px;
}
.ep-card-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:8px;
}
.ep-card-title {
  margin:0;
  font-size:1.0rem;
  font-weight:600;
  color:#111827;
}
.ep-lock {
  font-size:1.1rem;
}
.ep-card-meta {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
}
.ep-pill {
  border-radius:999px;
  padding:3px 9px;
  font-size:0.76rem;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
}
.ep-pill--public {
  background:#ecfdf3;
  border-color:#bbf7d0;
  color:#166534;
}
.ep-pill--date {
  background:#f3f4ff;
  border-color:#e0e7ff;
  color:#4338ca;
}
.ep-pill--bestie {
  background:#fef3c7;
  border-color:#fde68a;
  color:#b45309;
}

.ep-card-actions {
  margin-top:6px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}

/* Buttons – reuse across page */
.btn {
  appearance:none;
  border-radius:999px;
  padding:8px 14px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
  cursor:pointer;
  font-size:0.86rem;
  font-weight:500;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition:transform 40ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
}
.btn:hover {
  background:#f3f4ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(148,163,184,0.3);
}
.btn:active {
  transform:translateY(1px);
}
.btn-primary {
  background:#4f46e5;
  border-color:#4f46e5;
  color:#ffffff;
}
.btn-primary:hover {
  background:#4338ca;
  border-color:#4338ca;
}
.btn-ghost {
  background:#ffffff;
  border-color:#e5e7eb;
  color:#4b5563;
}
.btn-ghost:hover {
  background:#f9fafb;
}

/* Countdown text */
.ep-countdown {
  font-size:0.82rem;
  color:#374151;
}

/* Responsive */
@media (max-width:900px) {
  .ep-hero-inner {
    grid-template-columns:minmax(0,1fr);
  }
  .ep-card {
    grid-template-columns:minmax(0,1fr);
  }
}
@media (max-width:640px) {
  .ep-hero-inner {
    padding:14px 14px 14px;
  }
  .ep-hero-title {
    font-size:1.4rem;
  }
}
`;
