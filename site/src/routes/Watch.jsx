// site/src/routes/Watch.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import NextUpOverlay from "../components/NextUpOverlay.jsx";
import {
  getEpisodeById,
  fmtCountdown,
  getEpisodesOrdered,
  getNextEpisode,
  getRelatedEpisodes,
} from "../lib/episodes";

export default function Watch() {
  const { id } = useParams();
  const nav = useNavigate();
  const ep = getEpisodeById(id);

  const videoRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const [isBestie, setIsBestie] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNext, setShowNext] = useState(false);
  const [err, setErr] = useState("");

  // keep a tick so countdown updates
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

  // Recompute with `now` so countdown lives-updates.
  const early = useMemo(() => {
    if (!ep) return false;
    return Date.now() < new Date(ep.publicAt || 0).getTime();
  }, [ep, now]);

  const countdown = useMemo(
    () => (ep ? fmtCountdown(ep.publicAt, now) : ""),
    [ep, now]
  );

  // Build related + next using helpers
  const all = useMemo(() => getEpisodesOrdered(), []);
  const nextEp = useMemo(
    () => (ep ? getNextEpisode(ep.id, all) : null),
    [ep, all]
  );
  const related = useMemo(
    () => (ep ? getRelatedEpisodes(ep.id, 6, all) : []),
    [ep, all]
  );

  const onEnded = () => setShowNext(true);

  // Fallback for YouTube iframes: show Next up after a short delay
  useEffect(() => {
    if (!ep) return;
    if (ep.video && (ep.video.includes("youtube.com") || ep.video.includes("youtu.be"))) {
      const t = setTimeout(() => setShowNext(true), 10_000);
      return () => clearTimeout(t);
    }
  }, [ep?.id, ep?.video]);

  // When user clicks a new episode (or auto-advance)
  const playEpisode = (nextId) => {
    setShowNext(false);
    nav(`/watch/${nextId}`);
    setTimeout(() => videoRef.current?.play?.(), 120);
  };

  async function unlockBestieHere() {
    try {
      setErr("");
      // sign-in first if needed
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

      // Try checkout (returns to this watch page)
      try {
        const r = await window.sa.graphql(
          `mutation Start($successPath: String){ 
             startBestieCheckout(successPath:$successPath){ url } 
           }`,
          { successPath: `/watch/${id}` }
        );
        const url = r?.startBestieCheckout?.url;
        if (url) {
          window.location.assign(url);
          return;
        }
      } catch {
        // ignore — try trial next
      }

      // Fallback: trial
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

  if (!ep) {
    return (
      <div className="watch-wrap">
        <div className="card">
          <h1 className="title">Not found</h1>
          <p className="muted">We couldn’t find that episode.</p>
          <Link className="btn btn-ghost" to="/fan/episodes">
            ← Back to Episodes
          </Link>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  // Gate early access
  if (loading) {
    return (
      <div className="watch-wrap">
        <div className="muted">Checking access…</div>
        <style>{styles}</style>
      </div>
    );
  }

  if (early && !isBestie) {
    return (
      <div className="watch-wrap">
        <header className="hero">
          <div className="hero__inner">
            <div className="title-row">
              <h1 className="title">{ep.title}</h1>
              <span className="pill">Fan</span>
            </div>
            <p className="muted">
              Public in <strong>{countdown}</strong> · Early access for Besties
            </p>
          </div>
        </header>

        <main className="stage">
          <div className="lock-card card">
            <div className="lock-head">
              <span className="lock-emoji" aria-hidden>
                🔒
              </span>
              <h2 className="lock-title">This episode isn’t public yet</h2>
            </div>
            <p className="muted">
              Public release in <b>{countdown}</b>. Unlock now with Bestie to
              watch early.
            </p>
            {err && <div className="notice notice--error">{err}</div>}
            <div className="actions">
              <button className="btn btn-primary" onClick={unlockBestieHere}>
                Unlock with Bestie
              </button>
              <Link className="btn btn-ghost" to="/fan/episodes">
                Back to Episodes
              </Link>
            </div>
          </div>
        </main>

        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="watch-wrap">
      <header className="hero">
        <div className="hero__inner">
          <div className="title-row">
            <Link className="crumb" to="/fan/episodes">
              ← Episodes
            </Link>
            <h1 className="title">{ep.title}</h1>
            <span className={`pill ${early ? "pill--bestie" : ""}`}>
              {early ? `Early • Public in ${countdown}` : "Public"}
            </span>
          </div>
          {err && <div className="notice notice--error">{err}</div>}
        </div>
      </header>

      <main className="stage">
        {/* Player */}
        <div className="player-card card">
          {ep.video ? (
            ep.video.includes("youtube.com") || ep.video.includes("youtu.be") ? (
              <div className="yt-wrap">
                <iframe
                  src={ep.video}
                  title={ep.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <video
                ref={videoRef}
                key={ep.id}
                className="player"
                controls
                autoPlay
                playsInline
                onEnded={onEnded}
              >
                <source src={ep.video} />
              </video>
            )
          ) : (
            <div className="poster">
              <div className="poster__title">{ep.title}</div>
              <div className="poster__sub">Video coming soon…</div>
            </div>
          )}

          <div className="player-meta">
            <span className="pill">Episode ID: {ep.id}</span>
            <span className="pill">
              Public: {new Date(ep.publicAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Netflix-style Next Up overlay */}
        {nextEp && (
          <NextUpOverlay
            show={showNext}
            currentId={ep.id}
            episodes={all}
            onDismiss={() => setShowNext(false)}
            onPlay={playEpisode}
            autoSeconds={8}
          />
        )}

        {/* Related grid */}
        {related.length > 0 && (
          <section className="related">
            <h3 className="related__title">Related episodes</h3>
            <div className="related__grid">
              {related.map((e) => {
                const isEarly = Date.now() < new Date(e.publicAt || 0).getTime();
                return (
                  <button
                    key={e.id}
                    onClick={() => playEpisode(e.id)}
                    className="rel-card"
                    title={e.title}
                  >
                    <div className="rel-thumb">
                      {e.title?.slice(0, 26) || "Episode"}
                    </div>
                    <div className="rel-meta">
                      <div className="rel-title">{e.title}</div>
                      <span className="chip">
                        {isEarly ? "Early" : "Public"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.watch-wrap { display:flex; flex-direction:column; gap:16px; }
.hero {
  background: linear-gradient(180deg, rgba(0,0,0,0.03), rgba(255,255,255,0));
  border-radius:16px; padding:20px 16px;
}
.hero__inner, .stage { max-width: 1100px; margin: 0 auto; }
.title-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.crumb { text-decoration:none; color:#374151; }
.crumb:hover { text-decoration:underline; }
.title { margin:0; font-size:1.6rem; line-height:1.2; }
.muted { color:#586073; }

.card {
  background:#fff; border:1px solid #eceef3; border-radius:14px; padding:14px;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
}

.player-card { display:grid; gap:12px; }
.player {
  width:100%; max-height:70vh; background:#000; border-radius:10px;
}
.yt-wrap { position:relative; padding-bottom:56.25%; height:0; border-radius:10px; overflow:hidden; background:#000; }
.yt-wrap iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
.poster {
  height:420px; border-radius:10px;
  background:linear-gradient(120deg,#f6f7ff,#fff);
  display:grid; place-items:center; text-align:center;
}
.poster__title { font-weight:700; font-size:1.1rem; }
.poster__sub { color:#586073; }

.player-meta { display:flex; gap:8px; flex-wrap:wrap; }

.lock-card { display:grid; gap:10px; }
.lock-head { display:flex; align-items:center; gap:10px; }
.lock-emoji { font-size:1.4rem; }
.lock-title { margin:0; }

.related { margin-top:24px; }
.related__title { margin:0 0 12px; }
.related__grid {
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap:12px;
}
.rel-card {
  text-align:left; padding:12px; border-radius:16px; cursor:pointer;
  border:1px solid #eceef3; background:#fff; display:grid; gap:8px;
}
.rel-card:hover { background:#fafbff; }
.rel-thumb {
  width:100%; aspect-ratio:16/9; border-radius:12px;
  background: linear-gradient(135deg, rgba(17,24,39,.12), rgba(17,24,39,.06));
  display:grid; place-items:center; font-weight:600;
}
.rel-meta { display:flex; gap:8px; align-items:center; }
.rel-title { font-weight:600; font-size:14px; line-height:18px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.pill {
  display:inline-flex; align-items:center; height:26px; padding:0 10px;
  border-radius:999px; border:1px solid #e7e7ef; background:#f7f8ff;
  color:#222; font-size:.85rem;
}
.pill--bestie { background:#ecf0ff; border-color:#c9d2ff; color:#2e47d1; }

.chip {
  border:1px solid #e5e7eb; background:#fff; color:#111827;
  border-radius:999px; padding:6px 10px; font-size:.8rem;
}

.btn {
  appearance:none; border:1px solid #e5e7eb; background:#f7f7f9; color:#111827;
  border-radius:10px; padding:10px 14px; cursor:pointer;
  transition:transform 40ms ease, background 140ms ease, border-color 140ms ease;
  text-decoration:none; display:inline-flex; align-items:center;
}
.btn:hover { background:#f2f2f6; }
.btn:active { transform: translateY(1px); }
.btn-primary { background:#6b8cff; border-color:#6b8cff; color:#fff; }
.btn-primary:hover { background:#5a7bff; border-color:#5a7bff; }
.btn-ghost { background:#fff; color:#374151; }

.notice { padding:10px 12px; border-radius:10px; margin-top:10px; }
.notice--error { border:1px solid #ffd4d4; background:#fff6f6; color:#7a1a1a; }
`;
