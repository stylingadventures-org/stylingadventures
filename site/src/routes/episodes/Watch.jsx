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

/**
 * Helper: determine whether a BestieStatus object represents
 * an active Bestie membership.
 */
function isBestieActive(status) {
  if (!status) return false;

  if (typeof status.activeSubscription === "boolean") {
    if (!status.activeSubscription) return false;
  }

  if (status.expiresAt) {
    const exp = Date.parse(status.expiresAt);
    if (!Number.isNaN(exp) && exp < Date.now()) {
      return false;
    }
  }

  if (typeof status.isBestie === "boolean") {
    return status.isBestie;
  }

  return false;
}

function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(arr))));
  } catch {
    // ignore
  }
}

export default function Watch() {
  const { id } = useParams();
  const nav = useNavigate();
  const ep = getEpisodeById(id);

  const videoRef = useRef(null);
  const [now, setNow] = useState(Date.now());

  const [isBestie, setIsBestie] = useState(false);
  const [loadingMembership, setLoadingMembership] = useState(true);

  // unlock state (coins)
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(true);
  const [unlockError, setUnlockError] = useState("");

  // watch tracking
  const [watched, setWatched] = useState(false);
  const [rewardSent, setRewardSent] = useState(false);

  const [showNext, setShowNext] = useState(false);
  const [err, setErr] = useState("");

  // lightweight comment thread (local-only for now)
  const [comments, setComments] = useState([
    {
      id: "c1",
      author: "Style fan",
      text: "I’d totally wear this fit to brunch ✨",
      ts: "Just now",
    },
    {
      id: "c2",
      author: "Closet bestie",
      text: "Saving this episode so I can recreate the airport look.",
      ts: "2h ago",
    },
  ]);
  const [commentText, setCommentText] = useState("");

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
           }`,
        );
        if (!alive) return;
        setIsBestie(isBestieActive(data?.meBestieStatus));
      } catch {
        if (!alive) return;
        setIsBestie(false);
      } finally {
        if (alive) setLoadingMembership(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // seed watched + unlocked from localStorage + server
  useEffect(() => {
    if (!id) return;
    let alive = true;

    const localWatched = readJsonArray("sa:watchedEpisodes");
    if (localWatched.includes(id)) {
      setWatched(true);
    } else {
      setWatched(false);
    }

    (async () => {
      setUnlockLoading(true);
      setUnlockError("");
      try {
        const localUnlocked = readJsonArray("sa:unlockedEpisodes");
        if (localUnlocked.includes(id)) {
          setUnlocked(true);
        }

        if (window.sa?.ready) {
          await window.sa.ready();
        }
        const data = await window.sa?.graphql?.(
          `query MyUnlockedEpisodes {
             myUnlockedEpisodes {
               episodeId
             }
           }`,
        );
        if (!alive) return;

        const serverIds =
          data?.myUnlockedEpisodes?.map((u) => String(u.episodeId)) || [];
        if (serverIds.includes(id)) {
          setUnlocked(true);
        }

        const merged = Array.from(new Set([...localUnlocked, ...serverIds]));
        writeJsonArray("sa:unlockedEpisodes", merged);
      } catch {
        // ignore – we still have local cache
      } finally {
        if (alive) setUnlockLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  // Recompute with `now` so countdown live-updates.
  const early = useMemo(() => {
    if (!ep) return false;
    return now < new Date(ep.publicAt || 0).getTime();
  }, [ep, now]);

  const countdown = useMemo(
    () => (ep ? fmtCountdown(ep.publicAt, now) : ""),
    [ep, now],
  );

  const all = useMemo(() => getEpisodesOrdered(), []);
  const nextEp = useMemo(
    () => (ep ? getNextEpisode(ep.id, all) : null),
    [ep, all],
  );
  const related = useMemo(
    () => (ep ? getRelatedEpisodes(ep.id, 6, all) : []),
    [ep, all],
  );

  // coin cost (if defined in EPISODES or coming from backend later)
  const coinCost =
    (ep && (ep.unlockCoinCost ?? ep.coinCost ?? null)) ?? null;

  const lockedEarly = early && !isBestie && !unlocked;
  const checkingAccess = loadingMembership || unlockLoading;

  const onEnded = () => {
    setShowNext(true);
    markWatchedAndReward();
  };

  // Fallback for YouTube iframes: show Next up after a short delay
  useEffect(() => {
    if (!ep) return;
    if (
      ep.video &&
      (ep.video.includes("youtube.com") || ep.video.includes("youtu.be"))
    ) {
      const t = setTimeout(() => {
        setShowNext(true);
        markWatchedAndReward();
      }, 10_000);
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

      if (window.sa?.ready) {
        await window.sa.ready();
      }

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
          `mutation StartBestieCheckout($successPath: String){ 
             startBestieCheckout(successPath:$successPath){ url } 
           }`,
          { successPath: `/watch/${id}` },
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
        `mutation ClaimBestieTrial {
           claimBestieTrial {
             __typename
           }
         }`,
      );
      if (trial?.claimBestieTrial) {
        setIsBestie(true);
      }
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  async function unlockWithCoins() {
    if (!ep) return;
    setUnlockError("");
    try {
      if (window.sa?.ready) await window.sa.ready();

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

      const data = await window.sa.graphql(
        `mutation UnlockEpisode($episodeId: ID!) {
           unlockEpisode(episodeId: $episodeId) {
             success
             costCoins
             unlockedAt
             remainingCoins
             episode { id title }
           }
         }`,
        { episodeId: ep.id },
      );

      if (!data?.unlockEpisode?.success) {
        throw new Error("Unable to unlock this episode.");
      }

      setUnlocked(true);
      const localUnlocked = readJsonArray("sa:unlockedEpisodes");
      writeJsonArray("sa:unlockedEpisodes", [...localUnlocked, ep.id]);
    } catch (e) {
      setUnlockError(e?.message || String(e));
    }
  }

  function markWatchedAndReward() {
    if (!ep) return;
    if (!watched) {
      const local = readJsonArray("sa:watchedEpisodes");
      if (!local.includes(ep.id)) {
        writeJsonArray("sa:watchedEpisodes", [...local, ep.id]);
      }
      setWatched(true);
    }
    if (!rewardSent) {
      setRewardSent(true);
      sendWatchReward(ep.id);
    }
  }

  async function sendWatchReward(episodeId) {
    try {
      if (!window.sa?.graphql) return;
      if (window.sa?.ready) await window.sa.ready();
      await window.sa.graphql(
        `mutation LogWatchEvent($input: LogGameEventInput!) {
           logGameEvent(input: $input) {
             success
             xp
             coins
             newXP
             newCoins
             lastEventAt
           }
         }`,
        {
          input: {
            type: "WATCH_EPISODE",
            metadata: { episodeId },
          },
        },
      );
    } catch {
      // ignore reward errors
    }
  }

  function handleAddComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    const newComment = {
      id: `c-${Date.now()}`,
      author: "You",
      text,
      ts: "Just now",
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
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
  if (checkingAccess) {
    return (
      <div className="watch-wrap">
        <div className="muted">Checking access…</div>
        <style>{styles}</style>
      </div>
    );
  }

  if (lockedEarly) {
    const combinedError = err || unlockError;

    return (
      <div className="watch-wrap">
        <header className="watch-hero">
          <div className="watch-hero-inner">
            <div className="watch-hero-top">
              <Link className="crumb" to="/fan/episodes">
                ← Episodes
              </Link>
              <span className="watch-hero-pill">Early access</span>
            </div>
            <h1 className="title">{ep.title}</h1>
            <p className="muted">
              Public in <strong>{countdown}</strong> · Early access for Besties
              or unlock with coins.
            </p>
          </div>
        </header>

        <main className="watch-main">
          <div className="lock-card card">
            <div className="lock-head">
              <span className="lock-emoji" aria-hidden>
                🔒
              </span>
              <h2 className="lock-title">This episode isn’t public yet</h2>
            </div>
            <p className="muted">
              Public release in <b>{countdown}</b>. Unlock now with Bestie or
              spend coins for early access.
            </p>
            {combinedError && (
              <div className="notice notice--error">
                {combinedError}
                {typeof combinedError === "string" &&
                  combinedError.toLowerCase().includes("coin") && (
                    <div className="watch-help">
                      Need more coins?{" "}
                      <a href="/fan/rules" className="watch-help-link">
                        How to earn more →
                      </a>
                    </div>
                  )}
              </div>
            )}
            <div className="actions">
              <button className="btn btn-primary" onClick={unlockBestieHere}>
                Unlock with Bestie
              </button>
              {coinCost != null && (
                <button className="btn btn-ghost" onClick={unlockWithCoins}>
                  Unlock for {coinCost} coins
                </button>
              )}
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

  const statusLabel = early
    ? unlocked
      ? `Unlocked early${coinCost ? ` · ${coinCost} coins` : ""}`
      : `Early • Public in ${countdown}`
    : watched
    ? "Watched"
    : "Public episode";

  return (
    <div className="watch-wrap">
      {/* top bar */}
      <header className="watch-hero">
        <div className="watch-hero-inner">
          <div className="watch-hero-top">
            <Link className="crumb" to="/fan/episodes">
              ← Episodes
            </Link>
            <span
              className={
                "watch-status-pill" +
                (early
                  ? " watch-status-pill--early"
                  : " watch-status-pill--public")
              }
            >
              {statusLabel}
            </span>
          </div>
          <h1 className="title">{ep.title}</h1>
        </div>
      </header>

      <main className="watch-main">
        {/* cinema shell: video + comments + sidebar */}
        <section className="watch-shell">
          <div className="watch-shell-left">
            <article className="player-card card">
              <div className="player-frame">
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
              </div>

              <div className="player-meta">
                <span className="pill pill--meta">
                  Episode ID: <strong>{ep.id}</strong>
                </span>
                <span className="pill pill--meta">
                  Public:{" "}
                  <strong>{new Date(ep.publicAt).toLocaleString()}</strong>
                </span>
                {watched && (
                  <span className="pill pill--meta">You watched this</span>
                )}
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

            {/* Comments panel – Crunchyroll style */}
            <section className="comments-card card">
              <div className="comments-header">
                <h2 className="comments-title">
                  Episode chat{" "}
                  <span className="comments-count">
                    · {comments.length} comment
                    {comments.length === 1 ? "" : "s"}
                  </span>
                </h2>
                <span className="comments-hint">
                  Share outfit ideas, favorite moments, and styling prompts.
                </span>
              </div>

              <form className="comments-form" onSubmit={handleAddComment}>
                <textarea
                  className="comments-input"
                  rows={3}
                  placeholder="What look from this episode would you style IRL?"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="comments-form-footer">
                  <span className="comments-form-note">
                    Comments are local to your device for now.
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary comments-submit"
                    disabled={!commentText.trim()}
                  >
                    Post comment
                  </button>
                </div>
              </form>

              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="comment-avatar">
                      {c.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{c.author}</span>
                        <span className="comment-ts">{c.ts}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: episode info + mini queue */}
          <aside className="watch-shell-right">
            <section className="watch-side-card">
              <h2 className="watch-side-title">Episode details</h2>
              <dl className="watch-details">
                <div className="watch-details-row">
                  <dt>Status</dt>
                  <dd>
                    {early ? (
                      unlocked ? (
                        <>
                          Unlocked early
                          {coinCost != null ? ` · ${coinCost} coins` : ""}
                        </>
                      ) : (
                        <>
                          Early for Besties • Public in{" "}
                          <strong>{countdown}</strong>
                        </>
                      )
                    ) : watched ? (
                      "Public · Watched"
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

            {/* Crunchyroll-style up-next sidebar list */}
            <section className="watch-side-card">
              <h2 className="watch-side-title">Up next</h2>
              <div className="upnext-list">
                {all.map((e, index) => {
                  const isCurrent = e.id === ep.id;
                  const isEarlyQueue =
                    Date.now() < new Date(e.publicAt || 0).getTime();

                  const watchedSet = readJsonArray("sa:watchedEpisodes");
                  const isWatched = watchedSet.includes(e.id);

                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={
                        "upnext-item" +
                        (isCurrent ? " upnext-item--current" : "")
                      }
                      onClick={() => !isCurrent && playEpisode(e.id)}
                    >
                      <div className="upnext-thumb">
                        <span className="upnext-epTag">EP {index + 1}</span>
                      </div>
                      <div className="upnext-body">
                        <div className="upnext-title">{e.title}</div>
                        <div className="upnext-metaRow">
                          <span
                            className={
                              "upnext-pill" +
                              (isEarlyQueue
                                ? " upnext-pill--early"
                                : " upnext-pill--public")
                            }
                          >
                            {isEarlyQueue ? "Early" : "Public"}
                          </span>
                          {isWatched && (
                            <span className="upnext-currentLabel">
                              Watched
                            </span>
                          )}
                          {isCurrent && (
                            <span className="upnext-currentLabel">
                              Now playing
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>

        {/* Next up overlay (auto-advance) */}
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

        {/* Related grid under everything */}
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
                const watchedSet = readJsonArray("sa:watchedEpisodes");
                const isWatched = watchedSet.includes(e.id);
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
                        {isEarly
                          ? "Early"
                          : isWatched
                          ? "Watched"
                          : "Public"}
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

/* HERO BAR -------------------------------------------------- */

.watch-hero {
  background:
    radial-gradient(circle at top left, #f9a8d4 0, #fdf2ff 35%, transparent 70%),
    radial-gradient(circle at bottom right, #bfdbfe 0, #eff6ff 35%, transparent 75%),
    linear-gradient(135deg, #6366f1, #ec4899);
  border-radius:20px;
  padding:14px 16px;
  border:1px solid rgba(216,180,254,0.9);
  box-shadow:0 16px 40px rgba(129,140,248,0.45);
}

.watch-hero-inner {
  max-width:1100px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:6px;
}

.watch-hero-top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}

.watch-hero-pill {
  padding:4px 10px;
  border-radius:999px;
  background:rgba(255,255,255,0.9);
  border:1px solid rgba(196,181,253,0.9);
  font-size:11px;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:#6b21a8;
}

.watch-status-pill {
  padding:4px 10px;
  border-radius:999px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.12em;
  background:rgba(255,255,255,0.9);
  border:1px solid rgba(196,181,253,0.9);
  color:#4c1d95;
}
.watch-status-pill--public {
  background:#ecfdf5;
  border-color:#a7f3d0;
  color:#065f46;
}
.watch-status-pill--watched {
  background:#ecfdf5;
  border-color:#34d399;
  color:#047857;
}
.watch-status-pill--early {
  background:#fdf2ff;
  border-color:#f9a8d4;
  color:#9d174d;
}

.crumb {
  text-decoration:none;
  color:#111827;
  font-size:0.9rem;
}
.crumb:hover {
  text-decoration:underline;
}

.title {
  margin:0;
  font-size:1.7rem;
  line-height:1.2;
  letter-spacing:-0.03em;
  color:#0f172a;
}

.muted {
  color:#586073;
}

/* MAIN CINEMA SHELL ---------------------------------------- */

.watch-main {
  max-width:1100px;
  margin:0 auto 28px;
}

.watch-shell {
  margin-top:14px;
  display:grid;
  grid-template-columns:minmax(0, 3.2fr) minmax(0, 2.2fr);
  gap:18px;
}
@media (max-width: 900px) {
  .watch-shell {
    grid-template-columns:minmax(0,1fr);
  }
}

.watch-shell-left {
  display:flex;
  flex-direction:column;
  gap:12px;
}

.watch-shell-right {
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* CARDS & PLAYER ------------------------------------------- */

.card {
  background:#ffffff;
  border:1px solid #eceef3;
  border-radius:18px;
  padding:16px 16px 14px;
  box-shadow:0 10px 28px rgba(148,163,184,0.25);
}

.player-card {
  display:flex;
  flex-direction:column;
  gap:10px;
  background:radial-gradient(circle at top,#eef2ff,#fdf2ff);
}

.player-frame {
  border-radius:16px;
  overflow:hidden;
  background:#020617;
}

.player {
  width:100%;
  max-height:70vh;
  background:#000;
  display:block;
}

.yt-wrap {
  position:relative;
  padding-bottom:56.25%;
  height:0;
}
.yt-wrap iframe {
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}

.poster {
  height:420px;
  display:grid;
  place-items:center;
  text-align:center;
  background:radial-gradient(circle at top, #eef2ff, #fef3ff);
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

/* pills */

.pill {
  display:inline-flex;
  align-items:center;
  padding:3px 10px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
  font-size:0.78rem;
}

.pill--meta {
  background:#ffffff;
  border-color:#e5e7eb;
  color:#4b5563;
}

.pill--watched {
  border-color:#34d399;
  color:#047857;
}

/* video CTAs */

.watch-video-ctas {
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:2px;
}

.watch-video-ctas .btn {
  flex:1 1 160px;
  min-height:40px;
  padding:8px 14px;
}

/* SIDE CARDS ------------------------------------------------ */

.watch-side-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  box-shadow:0 10px 24px rgba(148,163,184,0.18);
  padding:12px 14px 14px;
}

.watch-side-title {
  margin:0 0 4px;
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
  grid-template-columns:90px minmax(0,1fr);
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
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

/* force the two style buttons to be identical size */
.watch-side-actions .btn {
  width:100%;
  min-height:42px;
  padding:9px 16px;
}

/* shared "full width" utility (kept for clarity) */
.watch-btn-full {
  width:100%;
}

/* UP-NEXT LIST --------------------------------------------- */

.upnext-list {
  display:flex;
  flex-direction:column;
  gap:6px;
  max-height:320px;
  overflow:auto;
}

.upnext-item {
  display:grid;
  grid-template-columns:70px minmax(0,1fr);
  gap:8px;
  align-items:center;
  border-radius:12px;
  border:1px solid transparent;
  background:#f9fafb;
  padding:6px;
  cursor:pointer;
  text-align:left;
  transition:background 140ms ease, border-color 140ms ease, transform 40ms ease;
}
.upnext-item:hover {
  background:#f3e8ff;
  border-color:#ddd6fe;
  transform:translateY(-1px);
}
.upnext-item--current {
  background:#ede9fe;
  border-color:#a855f7;
}

.upnext-thumb {
  border-radius:10px;
  background:linear-gradient(
    135deg,
    var(--sa-pink-warm, #ffb3dd),
    var(--sa-purple, #a855f7)
  );
  height:52px;
  position:relative;
  overflow:hidden;
}
.upnext-epTag {
  position:absolute;
  left:6px;
  bottom:4px;
  padding:2px 6px;
  border-radius:999px;
  background:rgba(15,23,42,0.85);
  color:#f9fafb;
  font-size:10px;
  font-weight:600;
}

.upnext-body {
  display:flex;
  flex-direction:column;
  gap:2px;
}

.upnext-title {
  font-size:0.86rem;
  font-weight:600;
  color:#111827;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.upnext-metaRow {
  display:flex;
  align-items:center;
  gap:6px;
}

.upnext-pill {
  padding:2px 7px;
  border-radius:999px;
  font-size:0.7rem;
  border:1px solid #e5e7eb;
  background:#ffffff;
}
.upnext-pill--public {
  background:#ecfdf5;
  border-color:#bbf7d0;
  color:#166534;
}
.upnext-pill--watched {
  background:#ecfdf5;
  border-color:#34d399;
  color:#047857;
}
.upnext-pill--early {
  background:#fdf2ff;
  border-color:#f9a8d4;
  color:#9d174d;
}

.upnext-currentLabel {
  font-size:0.7rem;
  color:#4c1d95;
}

/* COMMENTS PANEL ------------------------------------------- */

.comments-card {
  display:flex;
  flex-direction:column;
  gap:10px;
}

.comments-header {
  display:flex;
  flex-direction:column;
  gap:2px;
}

.comments-title {
  margin:0;
  font-size:1rem;
  font-weight:600;
}
.comments-count {
  font-weight:400;
  font-size:0.9rem;
  color:#6b7280;
}
.comments-hint {
  font-size:0.8rem;
  color:#6b7280;
}

.comments-form {
  display:flex;
  flex-direction:column;
  gap:6px;
}

.comments-input {
  width:100%;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:8px 10px;
  resize:vertical;
  font-size:0.9rem;
  font-family:inherit;
}
.comments-input:focus {
  outline:none;
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}

.comments-form-footer {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.comments-form-note {
  font-size:0.78rem;
  color:#9ca3af;
}
.comments-submit {
  padding-inline:14px;
  min-height:36px;
}

.comments-list {
  margin-top:6px;
  display:flex;
  flex-direction:column;
  gap:8px;
  max-height:260px;
  overflow:auto;
}

.comment {
  display:flex;
  gap:8px;
}

.comment-avatar {
  width:28px;
  height:28px;
  border-radius:999px;
  background:linear-gradient(
    135deg,
    var(--sa-pink-hot, #ff4fa3),
    var(--sa-purple, #a855f7)
  );
  color:#f9fafb;
  font-size:0.85rem;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.comment-body {
  flex:1;
  min-width:0;
}

.comment-meta {
  display:flex;
  align-items:center;
  gap:6px;
  font-size:0.78rem;
}
.comment-author {
  font-weight:600;
}
.comment-ts {
  color:#9ca3af;
}
.comment-text {
  margin:0;
  font-size:0.86rem;
  color:#111827;
}

/* LOCK / EARLY GATE ---------------------------------------- */

.lock-card {
  max-width:640px;
  margin:24px auto 0;
  display:flex;
  flex-direction:column;
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

.actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

/* RELATED GRID --------------------------------------------- */

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
  background:#faf5ff;
  box-shadow:0 10px 22px rgba(148,163,184,0.35);
  transform:translateY(-1px);
}
.rel-thumb {
  width:100%;
  aspect-ratio:16/9;
  border-radius:12px;
  background:linear-gradient(135deg,#e0e7ff,#fbcfe8);
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
  background:#f9fafb;
  color:#111827;
  border-radius:999px;
  padding:4px 10px;
  font-size:.78rem;
}

/* BUTTONS -------------------------------------------------- */

.btn {
  appearance:none;
  border-radius:999px;
  padding:8px 16px;
  min-height:36px;
  border:1px solid rgba(244, 184, 255, 0.9);
  background:#ffffff;
  color:#4b5563;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:500;
}

.btn:hover {
  background:#fff5fb;
  border-color:rgba(249,168,212,0.9);
  box-shadow:0 4px 12px rgba(248,113,170,0.25);
}

.btn:active {
  transform: translateY(1px);
  box-shadow:0 3px 10px rgba(248,113,170,0.3);
}

.btn[disabled],
.btn:disabled {
  opacity:0.6;
  cursor:not-allowed;
  box-shadow:none;
  transform:none;
}

.btn-primary {
  background:linear-gradient(
    135deg,
    var(--sa-pink-hot, #ff4fa3),
    var(--sa-purple, #a855f7)
  );
  border-color:transparent;
  color:#ffffff;
  box-shadow:0 8px 20px rgba(236,72,153,0.45);
}

.btn-primary:hover {
  filter:brightness(1.05);
  box-shadow:0 10px 22px rgba(236,72,153,0.5);
}

.btn-primary:active {
  filter:brightness(0.98);
}

.btn-ghost {
  background:rgba(255,255,255,0.96);
  border-color:rgba(244,184,255,0.9);
  color:#9d174d;
}

.btn-ghost:hover {
  background:#fff5fb;
  border-color:rgba(249,168,212,1);
}

/* NOTICES -------------------------------------------------- */

.notice {
  padding:10px 12px;
  border-radius:10px;
  margin-top:10px;
}
.notice--error {
  border:1px solid #fecaca;
  background:#fef2f2;
  color:#7f1d1d;
}

/* Watch help link inside error notice */
.watch-help {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #4b5563;
}

.watch-help-link {
  color: #4f46e5;
  text-decoration: none;
}
.watch-help-link:hover {
  text-decoration: underline;
}

/* RESPONSIVE ----------------------------------------------- */

@media (max-width: 640px) {
  .watch-hero-inner {
    padding-inline:2px;
  }
  .title {
    font-size:1.4rem;
  }
}
`;
