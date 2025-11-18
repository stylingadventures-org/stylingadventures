// site/src/routes/fan/Watch.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import NextUpOverlay from "../../components/NextUpOverlay.jsx";
import {
  getEpisodeById,
  fmtCountdown,
  getEpisodesOrdered,
  getNextEpisode,
  getRelatedEpisodes,
} from "../../lib/episodes.js";

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

  // Recompute with `now` so countdown live-updates.
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
    if (
      ep.video &&
      (ep.video.includes("youtube.com") || ep.video.includes("youtu.be"))
    ) {
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

  // ---------- render branches ----------

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
        <header className="hero hero--watch">
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

  // ---------- main watch layout ----------

  return (
    <div className="watch-wrap">
      <header className="hero hero--watch">
        <div className="hero__inner">
          <div className="title-row">
            <Link className="crumb" to="/fan/episodes">
              ← Episodes
            </Link>
            <h1 className="title">{ep.title}</h1>
            <span className={`pill ${early ? "pill--bestie" : "pill--public"}`}>
              {early ? `Early • Public in ${countdown}` : "Public episode"}
            </span>
          </div>
          {err && <div className="notice notice--error">{err}</div>}
        </div>
      </header>

      <main className="stage">
        {/* two-column layout */}
        <section className="watch-layout">
          {/* LEFT: video card */}
          <article className="player-card card">
            {ep.video ? (
              ep.video.includes("youtube.com") ||
              ep.video.includes("youtu.be") ? (
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
              <span className="pill pill--meta">
                Episode ID: <strong>{ep.id}</strong>
              </span>
              <span className="pill pill--meta">
                Public:{" "}
                <strong>{new Date(ep.publicAt).toLocaleString()}</strong>
              </span>
            </div>

            <div className="watch-video-ctas">
              <Link to="/fan/closet" className="btn btn-primary">
                Open Style Games
              </Link>
              <Link to="/fan/closet-feed" className="btn btn-ghost">
                Browse Lala&apos;s Closet
              </Link>
            </div>
          </article>

          {/* RIGHT: side details + styling panel */}
          <aside className="watch-side">
            <section className="watch-side-card">
              <h2 className="watch-side-title">Episode details</h2>
              <dl className="watch-details">
                <div className="watch-details-row">
                  <dt>Status</dt>
                  <dd>
                    {early ? (
                      <>
                        Early for Besties • Public in{" "}
                        <strong>{countdown}</strong>
                      </>
                    ) : (
                      "Public"
                    )}
                  </dd>
                </div>
                <div className="watch-details-row">
                  <dt>Public date</dt>
                  <dd>{new Date(ep.publicAt).toLocaleString()}</dd>
                </div>
                <div className="watch-details-row">
                  <dt>Bestie perk</dt>
                  <dd>
                    Early drops, behind-the-scenes vibes, and styling prompts
                    that connect to your Bestie closet.
                  </dd>
                </div>
              </dl>
            </section>

            <section className="watch-side-card">
              <h2 className="watch-side-title">Style this episode</h2>
              <p className="watch-side-text">
                After you watch, hop into the{" "}
                <strong>Style lab mini game</strong> to build outfits inspired
                by this story. You&apos;ll earn petals (XP) and can send
                favorite looks into{" "}
                <strong>Lala&apos;s Closet &amp; Bestie uploads</strong> later.
              </p>

              <div className="watch-side-actions">
                <Link
                  to="/fan/closet"
                  className="btn btn-primary watch-btn-full"
                >
                  Start styling
                </Link>
                <Link
                  to="/bestie/closet"
                  className="btn btn-ghost watch-btn-full"
                >
                  Go to Bestie closet
                </Link>
              </div>
            </section>
          </aside>
        </section>

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
            <div className="related-header">
              <h3 className="related__title">Related episodes</h3>
              <Link to="/fan/episodes" className="related-link">
                View all episodes →
              </Link>
            </div>
            <div className="related__grid">
              {related.map((e) => {
                const isEarly =
                  Date.now() < new Date(e.publicAt || 0).getTime();
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
.watch-wrap {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* light hero with a bit more glow */
.hero {
  background:
    radial-gradient(circle at top left, rgba(251,207,232,0.7), rgba(255,255,255,0.7)),
    radial-gradient(circle at bottom right, rgba(191,219,254,0.8), rgba(255,255,255,0.9));
  border-radius:20px;
  padding:18px 16px;
  border:1px solid rgba(248,250,252,0.9);
  box-shadow:0 16px 40px rgba(15,23,42,0.08);
}
.hero__inner,
.stage {
  max-width: 1100px;
  margin: 0 auto;
}

.title-row {
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}
.crumb {
  text-decoration:none;
  color:#374151;
}
.crumb:hover {
  text-decoration:underline;
}
.title {
  margin:0;
  font-size:1.7rem;
  line-height:1.2;
  letter-spacing:-0.03em;
}
.muted {
  color:#586073;
}

/* main layout */
.stage {
  margin-top:14px;
}
.watch-layout {
  display:grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap:18px;
}
@media (max-width: 900px) {
  .watch-layout {
    grid-template-columns: minmax(0,1fr);
  }
}

/* cards + player */
.card {
  background:#fff;
  border:1px solid #eceef3;
  border-radius:18px;
  padding:18px 18px 16px;
  box-shadow:0 10px 28px rgba(15,23,42,0.06);
}

.player-card {
  display:grid;
  gap:14px;
}

.player {
  width:100%;
  max-height:70vh;
  background:#000;
  border-radius:16px;
}

.yt-wrap {
  position:relative;
  padding-bottom:56.25%;
  height:0;
  border-radius:16px;
  overflow:hidden;
  background:#000;
}
.yt-wrap iframe {
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  border:0;
}

.poster {
  height:420px;
  border-radius:16px;
  background:radial-gradient(circle at top, #eef2ff, #fef3ff);
  display:grid;
  place-items:center;
  text-align:center;
}
.poster__title {
  font-weight:700;
  font-size:1.1rem;
}
.poster__sub {
  color:#586073;
}

.player-meta {
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}

.pill {
  display:inline-flex;
  align-items:center;
  height:26px;
  padding:0 10px;
  border-radius:999px;
  border:1px solid #e7e7ef;
  background:#f7f8ff;
  color:#222;
  font-size:.85rem;
}
.pill--bestie {
  background:#ecf0ff;
  border-color:#c9d2ff;
  color:#2e47d1;
}
.pill--public {
  background:#ecfdf3;
  border-color:#bbf7d0;
  color:#166534;
}
.pill--meta {
  background:#f9fafb;
  border-color:#e5e7eb;
  font-size:0.78rem;
  color:#4b5563;
}

/* buttons under the player */
.watch-video-ctas {
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:6px;
}
.watch-video-ctas .btn {
  min-width:170px;
}

/* side column */
.watch-side {
  display:flex;
  flex-direction:column;
  gap:12px;
}
.watch-side-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  box-shadow:0 10px 25px rgba(15,23,42,0.05);
  padding:14px 16px 16px;
}
.watch-side-title {
  margin:0 0 6px;
  font-size:1rem;
  font-weight:600;
  color:#111827;
}
.watch-side-text {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
}
.watch-details {
  margin:6px 0 0;
  padding:0;
}
.watch-details-row {
  display:grid;
  grid-template-columns: 90px minmax(0,1fr);
  gap:6px;
  font-size:0.86rem;
  color:#4b5563;
  margin-bottom:6px;
}
.watch-details-row dt {
  font-weight:600;
  color:#6b7280;
}
.watch-details-row dd {
  margin:0;
}
.watch-side-actions {
  margin-top:12px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.watch-btn-full {
  width:100%;
}

/* lock / early gate */
.lock-card {
  display:grid;
  gap:10px;
}
.lock-head {
  display:flex;
  align-items:center;
  gap:10px;
}
.lock-emoji {
  font-size:1.4rem;
}
.lock-title {
  margin:0;
}

/* related grid */
.related {
  margin-top:26px;
}
.related-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:10px;
}
.related__title {
  margin:0;
}
.related-link {
  font-size:0.85rem;
  color:#4f46e5;
  text-decoration:none;
}
.related-link:hover {
  text-decoration:underline;
}

.related__grid {
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap:12px;
}
.rel-card {
  text-align:left;
  padding:12px;
  border-radius:16px;
  cursor:pointer;
  border:1px solid #eceef3;
  background:#fff;
  display:grid;
  gap:8px;
  transition:background 140ms ease, box-shadow 140ms ease, transform 40ms ease;
}
.rel-card:hover {
  background:#fafbff;
  box-shadow:0 10px 22px rgba(148,163,184,0.35);
  transform:translateY(-1px);
}
.rel-thumb {
  width:100%;
  aspect-ratio:16/9;
  border-radius:12px;
  background: linear-gradient(135deg, rgba(17,24,39,.12), rgba(17,24,39,.06));
  display:grid;
  place-items:center;
  font-weight:600;
}
.rel-meta {
  display:flex;
  gap:8px;
  align-items:center;
}
.rel-title {
  font-weight:600;
  font-size:14px;
  line-height:18px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.chip {
  border:1px solid #e5e7eb;
  background:#fff;
  color:#111827;
  border-radius:999px;
  padding:6px 10px;
  font-size:.8rem;
}

/* ✨ BUTTON GLOW-UP ✨ */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:11px 20px;
  min-height:40px;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:500;
}
.btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  border-color:#6366f1;
  color:#fff;
  box-shadow:0 8px 18px rgba(99,102,241,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#7c3aed);
  border-color:#4f46e5;
  box-shadow:0 10px 24px rgba(79,70,229,0.55);
}
.btn-ghost {
  background:#ffffff;
  color:#374151;
}

/* notices */
.notice {
  padding:10px 12px;
  border-radius:10px;
  margin-top:10px;
}
.notice--error {
  border:1px solid #ffd4d4;
  background:#fff6f6;
  color:#7a1a1a;
}
`;
