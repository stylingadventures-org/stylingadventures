// site/src/routes/fan/ClosetFeed.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSignedGetUrl } from "../../lib/sa";

// Full query – tries to use viewerHasFaved
const GQL_FEED_FULL = /* GraphQL */ `
  query ClosetFeedSimple($sort: ClosetFeedSort) {
    closetFeed(sort: $sort) {
      id
      title
      status
      audience
      mediaKey
      rawMediaKey
      favoriteCount
      viewerHasFaved
      createdAt
    }
  }
`;

// Legacy query – no viewerHasFaved field yet
const GQL_FEED_LEGACY = /* GraphQL */ `
  query ClosetFeedSimple($sort: ClosetFeedSort) {
    closetFeed(sort: $sort) {
      id
      title
      status
      audience
      mediaKey
      rawMediaKey
      favoriteCount
      createdAt
    }
  }
`;

// Backend sync for hearts – matches your schema
const GQL_TOGGLE_FAVORITE = /* GraphQL */ `
  mutation ToggleFavoriteClosetItem($id: ID!, $on: Boolean) {
    toggleFavoriteClosetItem(id: $id, on: $on) {
      id
      favoriteCount
      viewerHasFaved
    }
  }
`;

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

/** Prefer cleaned mediaKey; fall back to rawMediaKey */
function effectiveKey(item) {
  const k = item.mediaKey || item.rawMediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
}

/** Map audience -> label + CSS modifier */
function audienceChip(it) {
  const raw = (it.audience || "PUBLIC").toUpperCase();

  let label = "Fan + Bestie";
  let mod = "public";

  if (raw === "BESTIE") {
    label = "Bestie only";
    mod = "bestie";
  } else if (raw === "EXCLUSIVE") {
    label = "Exclusive drop";
    mod = "exclusive";
  }

  return {
    label,
    className: `closet-chip closet-chip--audience closet-chip--${mod}`,
  };
}

export default function ClosetFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [sort, setSort] = useState("NEWEST"); // NEWEST | MOST_LOVED
  const [busyId, setBusyId] = useState(null); // while syncing favorite

  const query = useQuery();
  const highlightId = query.get("highlight");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        // --- Try full query first (with viewerHasFaved) ---
        let res;
        try {
          res = await window.sa.graphql(GQL_FEED_FULL, { sort });
        } catch (e) {
          const msg = String(e?.message || e);
          if (msg.includes("FieldUndefined") && msg.includes("viewerHasFaved")) {
            console.warn(
              "[ClosetFeed] viewerHasFaved unsupported – using legacy feed query"
            );
            res = await window.sa.graphql(GQL_FEED_LEGACY, { sort });
          } else {
            throw e;
          }
        }

        let raw = [];
        const cf = res?.closetFeed;
        if (Array.isArray(cf)) {
          raw = cf;
        } else if (cf && Array.isArray(cf.items)) {
          raw = cf.items;
        }

        // Filter: APPROVED/PUBLISHED only (backend also enforces visibility)
        const visible = raw.filter((it) => {
          const statusOk =
            it.status === "APPROVED" || it.status === "PUBLISHED";
          if (!statusOk) return false;

          const audience = (it.audience || "").toUpperCase();
          if (audience === "HIDDEN" || audience === "ADMIN_ONLY") return false;

          return true;
        });

        const withKeys = visible.map((it) => ({
          ...it,
          effectiveKey: effectiveKey(it),
          viewerHasFaved: Boolean(it.viewerHasFaved), // legacy feeds => false
          favoriteCount: it.favoriteCount ?? 0,
        }));

        const hydrated = await Promise.all(
          withKeys.map(async (it) => {
            if (!it.effectiveKey) return it;
            try {
              const url = await getSignedGetUrl(it.effectiveKey);
              return { ...it, mediaUrl: url || null };
            } catch (e) {
              console.warn("[ClosetFeed] getSignedGetUrl failed", e);
              return it;
            }
          })
        );

        // sort client-side in case backend doesn’t yet
        hydrated.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;

          if (sort === "MOST_LOVED") {
            const af = a.favoriteCount ?? 0;
            const bf = b.favoriteCount ?? 0;
            if (bf !== af) return bf - af;
            return bTime - aTime;
          }

          // NEWEST
          return bTime - aTime;
        });

        if (!cancelled) setItems(hydrated);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Failed to load Lala's closet.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sort]);

  const isInitialLoading = loading && items.length === 0;

  // scroll highlight into view on first render
  useEffect(() => {
    if (!highlightId) return;
    const el = document.querySelector(`[data-closet-id="${highlightId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, items]);

  // ----- hearts -----

  function toggleHeartLocal(id) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const wasFaved = !!it.viewerHasFaved;
        const count = it.favoriteCount ?? 0;
        return {
          ...it,
          viewerHasFaved: !wasFaved,
          favoriteCount: Math.max(0, count + (wasFaved ? -1 : 1)),
        };
      })
    );
  }

  async function syncFavoriteToBackend(id, on) {
    try {
      if (!window.sa?.graphql) return;
      if (window.sa?.ready) {
        await window.sa.ready();
      }
      await window.sa.graphql(GQL_TOGGLE_FAVORITE, { id, on });
    } catch (e) {
      // Non-fatal – we already updated the UI optimistically
      console.warn("[ClosetFeed] toggleFavoriteClosetItem failed", e);
    }
  }

  function handleToggleHeart(it) {
    const nextOn = !it.viewerHasFaved; // compute before optimistic update

    if (busyId && busyId !== it.id) {
      // optional: you could early-return to avoid spamming multiple items
    }

    toggleHeartLocal(it.id);
    setBusyId(it.id);
    syncFavoriteToBackend(it.id, nextOn).finally(() => setBusyId(null));
  }

  return (
    <div className="closet-feed-wrap">
      <main className="closet-feed">
        {/* Hero / header */}
        <header className="closet-hero">
          <div className="closet-hero__top">
            <Link to="/fan/closet" className="closet-crumb">
              ← Back to Style lab
            </Link>
          </div>

          <div className="closet-hero__content">
            <div className="closet-hero__left">
              <div className="closet-pill-label">Lala’s Closet</div>
              <h1 className="closet-hero__title">Come style me, bestie 💕</h1>
              <p className="closet-hero__subtitle">
                Browse my favorite saved looks, heart your faves, and get ideas
                for your next Style Lab combo. The most-loved outfits inspire
                future Bestie drops.
              </p>
            </div>

            <div className="closet-hero__right">
              <div className="closet-hero__card">
                <p className="closet-hero__stat-label">Closet mood</p>
                <p className="closet-hero__stat-value">Pastel Barbiecore</p>
                <p className="closet-hero__stat-sub">
                  New looks will appear here as Lala&apos;s team approves
                  uploads.
                </p>
                <Link
                  to="/fan/closet"
                  className="btn btn-primary closet-hero__btn"
                >
                  Open Style Lab
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main closet card */}
        <section className="closet-shell card">
          <div className="closet-shell__header">
            <div>
              <h2 className="closet-shell__title">Lala’s Closet grid</h2>
              <p className="closet-shell__subtitle">
                Tap a card to view the full look details (coming soon). For now,
                use this as inspo while you play in Style Lab.
              </p>
            </div>

            {/* Sort toggle */}
            <div className="closet-sort">
              {[
                { value: "NEWEST", label: "Newest" },
                { value: "MOST_LOVED", label: "Most loved" },
              ].map((opt) => {
                const active = opt.value === sort;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={
                      active
                        ? "closet-sort__btn closet-sort__btn--active"
                        : "closet-sort__btn"
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {err && (
            <div className="closet-notice closet-notice--error">
              <strong>Oops:</strong> {err}
            </div>
          )}

          {isInitialLoading && (
            <div className="closet-empty">
              Loading Lala&apos;s closet looks…
            </div>
          )}

          {!isInitialLoading && !err && items.length === 0 && (
            <div className="closet-empty">
              <span role="img" aria-label="empty closet">
                🧺
              </span>{" "}
              No approved closet items yet. Style Lala in the{" "}
              <Link to="/fan/closet">Style Lab</Link> and submit your looks for
              review to see them appear here.
            </div>
          )}

          {!err && items.length > 0 && (
            <div className="closet-grid">
              {items.map((it) => {
                const isHighlight = highlightId && it.id === highlightId;
                const liked = !!it.viewerHasFaved;
                const favCount = it.favoriteCount ?? 0;
                const { label: audienceLabel, className: audienceClass } =
                  audienceChip(it);

                return (
                  <article
                    key={it.id}
                    data-closet-id={it.id}
                    className={
                      "closet-item" +
                      (isHighlight ? " closet-item--highlight" : "")
                    }
                  >
                    <div className="closet-item__thumbWrap">
                      {it.mediaUrl ? (
                        <img
                          src={it.mediaUrl}
                          alt={it.title || "Closet item"}
                          className="closet-item__thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="closet-item__thumb closet-item__thumb--empty">
                          Look coming soon…
                        </div>
                      )}

                      <button
                        type="button"
                        className={
                          liked
                            ? "closet-heart closet-heart--active"
                            : "closet-heart"
                        }
                        aria-label={
                          liked ? "Un-heart this look" : "Heart this look"
                        }
                        onClick={() => handleToggleHeart(it)}
                        disabled={busyId === it.id}
                      >
                        <span className="closet-heart__icon">
                          {liked ? "❤" : "♡"}
                        </span>
                      </button>

                      <div className="closet-heartCount">{favCount}</div>
                    </div>

                    <div className="closet-item__body">
                      <div className="closet-item__title">
                        {it.title || "Untitled look"}
                      </div>
                      <div className="closet-item__meta">
                        <div className="closet-item__meta-left">
                          <span className="closet-chip">Closet look</span>
                          <span className={audienceClass}>{audienceLabel}</span>
                        </div>
                        <span className="closet-meta-text">
                          Added{" "}
                          {it.createdAt
                            ? new Date(it.createdAt).toLocaleDateString()
                            : "recently"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <style>{styles}</style>
    </div>
  );
}


const styles = `
.closet-feed-wrap {
  padding: 16px 0 32px;
}

.closet-feed {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
}

/* ✨ HERO AREA ✨ */
.closet-hero {
  border-radius: 24px;
  padding: 16px 18px 18px;
  margin-bottom: 18px;
  background:
    radial-gradient(circle at top left, rgba(251,207,232,0.9), rgba(255,255,255,0.9)),
    radial-gradient(circle at bottom right, rgba(196,181,253,0.9), rgba(255,255,255,1));
  box-shadow: 0 18px 40px rgba(148,163,184,0.45);
  border: 1px solid rgba(248,250,252,0.8);
}

.closet-hero__top {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:8px;
}

.closet-crumb {
  font-size: 0.85rem;
  color:#374151;
  text-decoration:none;
}
.closet-crumb:hover {
  text-decoration:underline;
}

.closet-hero__content {
  display:grid;
  grid-template-columns: minmax(0, 2.7fr) minmax(0, 2fr);
  gap:16px;
  align-items:flex-start;
}
@media (max-width: 900px) {
  .closet-hero__content {
    grid-template-columns: minmax(0,1fr);
  }
}

.closet-hero__left {
  max-width: 520px;
}

.closet-pill-label {
  display:inline-flex;
  align-items:center;
  padding:4px 12px;
  border-radius:999px;
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.12em;
  background:rgba(255,255,255,0.8);
  color:#6b21a8;
  border:1px solid rgba(250,250,255,0.9);
}

.closet-hero__title {
  margin:8px 0 4px;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  color:#111827;
}

.closet-hero__subtitle {
  margin:0;
  font-size:0.95rem;
  color:#374151;
}

.closet-hero__right {
  display:flex;
  justify-content:flex-end;
}

.closet-hero__card {
  background:rgba(255,255,255,0.96);
  border-radius:20px;
  padding:12px 14px 14px;
  border:1px solid rgba(229,231,235,0.9);
  box-shadow:0 12px 30px rgba(148,163,184,0.5);
  max-width:260px;
}

.closet-hero__stat-label {
  margin:0;
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#9f1239;
}

.closet-hero__stat-value {
  margin:2px 0 4px;
  font-weight:700;
  font-size:1.05rem;
  color:#111827;
}

.closet-hero__stat-sub {
  margin:0 0 10px;
  font-size:0.8rem;
  color:#4b5563;
}

.closet-hero__btn {
  width:100%;
}

/* CARD SHELL */
.card {
  background:#ffffff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 12px 30px rgba(148,163,184,0.25);
}

.closet-shell {
  padding:16px 18px 18px;
}

.closet-shell__header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  flex-wrap:wrap;
}

.closet-shell__title {
  margin:0;
  font-size:1.15rem;
}
.closet-shell__subtitle {
  margin:4px 0 0;
  font-size:0.9rem;
  color:#6b7280;
}

/* SORT TOGGLE */
.closet-sort {
  display:inline-flex;
  align-items:center;
  padding:3px;
  border-radius:999px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
}

.closet-sort__btn {
  border:none;
  background:transparent;
  padding:6px 14px;
  border-radius:999px;
  font-size:0.8rem;
  cursor:pointer;
  color:#6b7280;
}
.closet-sort__btn--active {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}

/* NOTICES + EMPTY */
.closet-notice {
  margin-top:14px;
  padding:10px 12px;
  border-radius:12px;
  font-size:0.9rem;
}
.closet-notice--error {
  border:1px solid #fecaca;
  background:#fee2e2;
  color:#7f1d1d;
}

.closet-empty {
  margin-top:18px;
  font-size:0.9rem;
  color:#4b5563;
}

/* GRID + CARDS */
.closet-grid {
  margin-top:20px;
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap:18px;
}

.closet-item {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  padding:8px;
  box-shadow:0 8px 20px rgba(148,163,184,0.3);
  display:flex;
  flex-direction:column;
  gap:8px;
  transition:transform 50ms ease, box-shadow 140ms ease, background 140ms ease;
}
.closet-item:hover {
  transform:translateY(-2px);
  background:#fdf2ff;
  box-shadow:0 12px 26px rgba(236,72,153,0.3);
}

/* highlight from admin link */
.closet-item--highlight {
  box-shadow:0 0 0 2px #f9a8d4, 0 16px 32px rgba(244,114,182,0.5);
}

/* THUMBS + HEARTS */
.closet-item__thumbWrap {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, #fdf2ff, #fee2f2),
    #fee2f2;
  height: 240px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* image behaves like a sticker in the middle, not a background */
.closet-item__thumb {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.closet-item__thumb--empty {
  height:210px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#6b7280;
}

/* Heart button */
.closet-heart {
  position:absolute;
  right:8px;
  top:8px;
  width:28px;
  height:28px;
  border-radius:999px;
  border:none;
  background:rgba(255,255,255,0.9);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  font-size:0.9rem;
  color:#ec4899;
  box-shadow:0 4px 10px rgba(0,0,0,0.08);
  transition:
    transform 60ms ease,
    box-shadow 140ms ease,
    background 140ms ease,
    color 140ms ease;
}
.closet-heart:hover {
  background:#fecdd3;
}
.closet-heart--active {
  background:#ec4899;
  color:#fff;
  box-shadow:0 6px 14px rgba(244,114,182,0.6);
  transform:translateY(-1px);
}
.closet-heart__icon {
  font-size: 0.9rem;
}

/* little count badge in bottom-right of the image */
.closet-heartCount {
  position:absolute;
  right:10px;
  bottom:8px;
  padding:2px 7px;
  border-radius:999px;
  font-size:0.7rem;
  background:rgba(17,24,39,0.7);
  color:#f9fafb;
}

/* BODY + META */
.closet-item__body {
  padding:0 4px 4px;
}

.closet-item__title {
  font-size:0.9rem;
  font-weight:600;
  margin-bottom:3px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.closet-item__meta {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:6px;
}

.closet-item__meta-left {
  display:flex;
  align-items:center;
  gap:4px;
}

.closet-meta-text {
  font-size:0.75rem;
  color:#9ca3af;
}

/* CHIPS */
.closet-chip {
  font-size:0.7rem;
  border-radius:999px;
  padding:4px 8px;
  background:#fef9c3;
  color:#92400e;
  border:1px solid #facc15;
}

.closet-chip--audience {
  border-width:0;
  padding:3px 8px;
}

.closet-chip--public {
  background:#ecfdf5;
  color:#047857;
}
.closet-chip--bestie {
  background:#eff6ff;
  color:#1d4ed8;
}
.closet-chip--exclusive {
  background:#fef2f2;
  color:#b91c1c;
}

/* BUTTONS – reuse global vibe */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:9px 16px;
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
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#fff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
`;
