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
} from "../lib/episodes"; // 👈 THIS LINE **must** be here

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

  // Intentionally recompute with `now` to make countdown live.
  const early = useMemo(() => {
    if (!ep) return false;
    return Date.now() < new Date(ep.publicAt || 0).getTime();
  }, [ep, now]);

  const countdown = useMemo(
    () => (ep ? fmtCountdown(ep.publicAt) : ""),
    [ep, now]
  );

  // Build related + next using util helpers
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

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTimeUpdate = () => {
      const remain = (el.duration || 0) - el.currentTime;
      if (remain > 0 && remain < 10) {
        // warm path near the end — keeps overlay snappy
      }
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [id]);

  // Fallback for YouTube iframes (no player API): show Next up after a short delay
  useEffect(() => {
    if (!ep) return;
    if (
      ep.video &&
      (ep.video.includes("youtube.com") || ep.video.includes("youtu.be"))
    ) {
      const t = setTimeout(() => setShowNext(true), 10_000); // 10s
      return () => clearTimeout(t);
    }
  }, [ep?.id, ep?.video]);

  const playEpisode = (nextId) => {
    setShowNext(false);
    nav(`/watch/${nextId}`);
    setTimeout(() => videoRef.current?.play?.(), 120);
  };

  async function unlockBestieHere() {
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

      try {
        const r = await window.sa.graphql(
          `mutation Start($successPath: String){ startBestieCheckout(successPath:$successPath){ url } }`,
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

  if (loading)
    return (
      <div className="watch-wrap">
        <div className="muted">Checking access…</div>
        <style>{styles}</style>
      </div>
    );

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
        <div className="player-card card">
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
            <span className="pill">Episode ID: {ep.id}</span>
            <span className="pill">
              Public: {new Date(ep.publicAt).toLocaleString()}
            </span>
          </div>
        </div>

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

        {related.length > 0 && (
          <section className="related">
            <h3 className="related__title">Related episodes</h3>
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
  /* (same CSS you already had – leaving as-is) */
`;
