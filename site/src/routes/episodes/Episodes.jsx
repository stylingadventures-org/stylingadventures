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
    <div className="episodes-wrap">
      <header className="hero">
        <div className="hero__inner">
          <div className="title-row">
            <h1 className="title">Episodes</h1>
            <span className="pill pill--bestie">Bestie</span>
          </div>
          <p className="muted">
            Besties get early drops. Public releases unlock on their dates.
          </p>
        </div>
      </header>

      <main className="stage">
        {err && <div className="notice notice--error">{err}</div>}
        {loading && (
          <div className="muted" style={{ marginBottom: 12 }}>
            Checking your Bestie status…
          </div>
        )}

        <div className="ep-grid">
          {ordered.map((ep) => {
            const early = now < ep.publicAt;
            const countdown = fmtCountdown(ep.publicAt, now);
            return (
              <div key={ep.id} className="ep-card card">
                <div className="ep-head">
                  <h2 className="ep-title">{ep.title}</h2>
                  {early && <span className="lock-emoji">🔒</span>}
                </div>
                <div className="ep-meta">
                  {early ? (
                    <span className="chip">
                      Public in {countdown}
                    </span>
                  ) : (
                    <span className="chip chip--public">Public</span>
                  )}
                  <span className="pill">
                    Public: {new Date(ep.publicAt).toLocaleString()}
                  </span>
                </div>
                <div className="ep-actions">
                  {renderCta(ep)}
                  <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                    Refresh
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Link className="btn btn-ghost" to="/fan">
          ← Back to Fan home
        </Link>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.episodes-wrap { display:flex; flex-direction:column; gap:16px; }
.hero {
  background: linear-gradient(180deg, rgba(0,0,0,0.03), rgba(255,255,255,0));
  border-radius:16px; padding:20px 16px;
}
.hero__inner, .stage { max-width: 1100px; margin: 0 auto; }
.title-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.title { margin:0; font-size:1.6rem; line-height:1.2; }
.muted { color:#586073; }

.card {
  background:#fff; border:1px solid #eceef3; border-radius:14px; padding:14px;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
}

.ep-grid {
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap:16px;
  margin-bottom:20px;
}
.ep-card { display:grid; gap:10px; }
.ep-head { display:flex; justify-content:space-between; align-items:center; }
.ep-title { margin:0; font-size:1.1rem; }
.ep-meta { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.ep-actions { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }

.lock-emoji { font-size:1.2rem; }

.pill {
  display:inline-flex; align-items:center; height:26px; padding:0 10px;
  border-radius:999px; border:1px solid #e7e7ef; background:#f7f8ff;
  color:#222; font-size:.85rem;
}
.pill--bestie { background:#ecf0ff; border-color:#c9d2ff; color:#2e47d1; }

.chip {
  border:1px solid #e5e7eb; background:#fff; color:#111827;
  border-radius:999px; padding:4px 10px; font-size:.75rem;
}
.chip--public { background:#ecfdf3; border-color:#bbf7d0; color:#166534; }

.btn {
  appearance:none; border:1px solid #e5e7eb; background:#f7f7f9; color:#111827;
  border-radius:10px; padding:8px 12px; cursor:pointer;
  transition:transform 40ms ease, background 140ms ease, border-color 140ms ease;
  text-decoration:none; display:inline-flex; align-items:center;
}
.btn:hover { background:#f2f2f6; }
.btn:active { transform: translateY(1px); }
.btn-primary { background:#6b8cff; border-color:#6b8cff; color:#fff; }
.btn-primary:hover { background:#5a7bff; border-color:#5a7bff; }
.btn-ghost { background:#fff; color:#374151; }

.notice { padding:10px 12px; border-radius:10px; margin-bottom:12px; }
.notice--error { border:1px solid #ffd4d4; background:#fff6f6; color:#7a1a1a; }

.ep-countdown { margin-bottom:4px; font-size:.85rem; color:#374151; }
`;
