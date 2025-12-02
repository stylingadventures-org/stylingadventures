// site/src/routes/fan/ClosetFeed.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSignedGetUrl } from "../../lib/sa";
import { hasLiked, toggleLikeLocal } from "../../lib/closetLikes";

// Full query – tries viewerHasFaved when available, using ClosetConnection
const GQL_FEED_FULL = /* GraphQL */ `
  query ClosetFeedSimple($sort: ClosetFeedSort, $limit: Int, $nextToken: String) {
    closetFeed(sort: $sort, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        status
        audience
        mediaKey
        rawMediaKey
        category
        subcategory
        pinned
        favoriteCount
        viewerHasFaved
        createdAt
        coinValue
      }
      nextToken
    }
  }
`;

// Legacy query – same connection shape, but without viewerHasFaved
const GQL_FEED_LEGACY = /* GraphQL */ `
  query ClosetFeedSimple($sort: ClosetFeedSort, $limit: Int, $nextToken: String) {
    closetFeed(sort: $sort, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        status
        audience
        mediaKey
        rawMediaKey
        category
        subcategory
        pinned
        favoriteCount
        createdAt
        coinValue
      }
      nextToken
    }
  }
`;

// Fallback: use admin list of approved items if closetFeed is empty
const GQL_ADMIN_FALLBACK = /* GraphQL */ `
  query AdminListClosetItemsForFeed {
    adminListClosetItems(status: APPROVED, limit: 100) {
      items {
        id
        title
        status
        audience
        mediaKey
        rawMediaKey
        category
        subcategory
        pinned
        favoriteCount
        createdAt
        coinValue
      }
      nextToken
    }
  }
`;

// Hearts backend – uses likeClosetItem from the current schema
const GQL_TOGGLE_FAVORITE = /* GraphQL */ `
  mutation LikeClosetItem($itemId: ID!) {
    likeClosetItem(itemId: $itemId) {
      id
      favoriteCount
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

// Simple skeleton card component
function ClosetCardSkeleton() {
  return (
    <article className="closet-item closet-item--skeleton">
      <div className="closet-item__thumbWrap">
        <div className="closet-item__thumb closet-item__thumb--skeleton" />
      </div>
      <div className="closet-item__body">
        <div className="closet-item__title closet-item__title--skeleton" />
        <div className="closet-item__meta">
          <div className="closet-item__meta-left">
            <span className="closet-chip closet-chip--skeleton" />
            <span className="closet-chip closet-chip--skeleton" />
          </div>
          <span className="closet-meta-text closet-meta-text--skeleton" />
        </div>
      </div>
    </article>
  );
}

export default function ClosetFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // sort UI: NEWEST | MOST_LOVED | LALAS_PICK | MY_FAVES
  const [sort, setSort] = useState("NEWEST");
  const [busyId, setBusyId] = useState(null); // while syncing favorite

  // client-side pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const query = useQuery();
  const highlightId = query.get("highlight");

    useEffect(() => {
    let cancelled = false;

    (async () => {
      let lastError = null;

      try {
        setLoading(true);
        setErr("");
        setPage(1); // reset pagination when sort changes

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        // Map UI sort state to backend sort enum
        // LALAS_PICK & MY_FAVES reuse MOST_LOVED ordering from backend
        const sortForBackend =
          sort === "LALAS_PICK" || sort === "MY_FAVES" ? "MOST_LOVED" : sort;

        const baseVars = { sort: sortForBackend, limit: 100, nextToken: null };

        // --- Try full query first (with viewerHasFaved) ---
        let res = null;
        try {
          res = await window.sa.graphql(GQL_FEED_FULL, baseVars);
        } catch (e) {
          const msg = String(e?.message || e);

          if (
            msg.includes("FieldUndefined") &&
            msg.includes("viewerHasFaved")
          ) {
            console.warn(
              "[ClosetFeed] viewerHasFaved unsupported – using legacy feed query",
            );
            try {
              res = await window.sa.graphql(GQL_FEED_LEGACY, baseVars);
            } catch (inner) {
              console.warn(
                "[ClosetFeed] legacy closetFeed query also failed – will rely on admin fallback",
                inner,
              );
              lastError = inner;
            }
          } else {
            // Any other GraphQL error from closetFeed (including the
            // non-null items / ClosetConnection issue) – don't crash,
            // just note it and fall back to admin list.
            console.warn(
              "[ClosetFeed] closetFeed query failed – will rely on admin fallback",
              e,
            );
            lastError = e;
          }
        }

        let raw = [];
        const cf = res?.closetFeed;
        if (Array.isArray(cf)) {
          // super-legacy shape (plain list)
          raw = cf;
        } else if (cf && Array.isArray(cf.items)) {
          raw = cf.items;
        }

        // Fallback: if closetFeed is empty or failed, try admin list of APPROVED
        if (!raw.length) {
          try {
            const adminRes = await window.sa.graphql(
              GQL_ADMIN_FALLBACK,
              {},
            );
            const adminItems = adminRes?.adminListClosetItems?.items ?? [];
            if (adminItems.length) {
              raw = adminItems;
            }
          } catch (e) {
            console.warn(
              "[ClosetFeed] adminListClosetItems fallback failed",
              e,
            );
            if (!lastError) lastError = e;
          }
        }

        // If we still have nothing and we saw a real error, surface it
        if (!raw.length && lastError) {
          throw lastError;
        }

        // Visibility filter – allow APPROVED/PUBLISHED (or unknown),
        // hide obvious non-fan states and admin-only/hide audiences.
        const visible = raw.filter((it) => {
          const status = (it.status || "").toUpperCase();

          if (status === "REJECTED" || status === "DRAFT") return false;
          if (status === "PENDING") return false;

          const audience = (it.audience || "").toUpperCase();
          if (audience === "HIDDEN" || audience === "ADMIN_ONLY") {
            return false;
          }

          return true;
        });

        const withKeys = visible.map((it) => {
          // Local cache of likes (for snappy UX / offline-ish)
          const localLiked = hasLiked(it.id);
          const apiLiked =
            typeof it.viewerHasFaved === "boolean" ? it.viewerHasFaved : false;

          const viewerHasFaved = localLiked || apiLiked;

          return {
            ...it,
            effectiveKey: effectiveKey(it),
            favoriteCount: it.favoriteCount ?? 0,
            viewerHasFaved,
          };
        });

        // Hydrate S3 URLs
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
          }),
        );

        // Sort client-side as a fallback (backend already gives NEWEST / MOST_LOVED)
        hydrated.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;

          if (
            sort === "MOST_LOVED" ||
            sort === "LALAS_PICK" ||
            sort === "MY_FAVES"
          ) {
            const af = a.favoriteCount ?? 0;
            const bf = b.favoriteCount ?? 0;
            if (bf !== af) return bf - af;
            return bTime - aTime;
          }

          // NEWEST
          return bTime - aTime;
        });

        // Tab-specific filters:
        // - LALAS_PICK: Lala's editorial picks (pinned === true)
        // - MY_FAVES: viewerHasFaved === true
        let next = hydrated;
        if (sort === "LALAS_PICK") {
          next = hydrated.filter((it) => !!it.pinned);
        } else if (sort === "MY_FAVES") {
          next = hydrated.filter((it) => !!it.viewerHasFaved);
        }

        if (!cancelled) setItems(next);
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

  // Scroll highlight into view on first render
  useEffect(() => {
    if (!highlightId) return;
    const el = document.querySelector(
      `[data-closet-id="${highlightId}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, items]);

  // ----- hearts -----

  async function toggleFavoriteToBackend(item) {
    const id = item.id;

    // instant local toggle (no flicker)
    const localLiked = toggleLikeLocal(id);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const count = it.favoriteCount ?? 0;
        const nextCount = Math.max(0, count + (localLiked ? 1 : -1));
        return {
          ...it,
          viewerHasFaved: localLiked,
          favoriteCount: nextCount,
        };
      }),
    );

    setBusyId(id);

    try {
      if (!window.sa?.graphql) return;
      if (window.sa?.ready) {
        await window.sa.ready();
      }

      const res = await window.sa.graphql(GQL_TOGGLE_FAVORITE, {
        itemId: id,
      });

      const updated = res?.likeClosetItem;
      if (updated && updated.id) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === updated.id
              ? {
                  ...it,
                  favoriteCount:
                    typeof updated.favoriteCount === "number"
                      ? updated.favoriteCount
                      : it.favoriteCount ?? 0,
                }
              : it,
          ),
        );
      }
    } catch (e) {
      console.warn("[ClosetFeed] likeClosetItem failed", e);
    } finally {
      setBusyId(null);
    }
  }

  // pagination slice
  const visibleItems = items.slice(0, page * pageSize);
  const hasMore = items.length > visibleItems.length;

  const totalLooks = items.length;
  const showingLooks = visibleItems.length;

  return (
    <div className="closet-feed-wrap">
      <main className="closet-feed">
        {/* Hero / header */}
        <header className="closet-hero">
          <div className="closet-hero__top">
            <Link to="/fan/closet" className="closet-crumb">
              ← Back to Style Lab
            </Link>
          </div>

          <div className="closet-hero__content">
            <div className="closet-hero__left">
              <div className="closet-pill-label">Lala&apos;s Closet</div>
              <h1 className="closet-hero__title">
                Come style me, bestie 💜
              </h1>
              <p className="closet-hero__subtitle">
                Heart your fave looks and I&apos;ll use them to inspire future
                drops &amp; Style Lab combos.
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

        {/* Filter / sort strip under hero */}
        <section className="closet-filterBar">
          <div className="closet-filterBar-left">
            <div className="closet-sort">
              {[
                { value: "NEWEST", label: "Newest" },
                { value: "MOST_LOVED", label: "Most loved" },
                { value: "LALAS_PICK", label: "Lala's pick" },
                { value: "MY_FAVES", label: "My faves" },
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

          <div className="closet-filterBar-right">
            {totalLooks > 0
              ? `Showing ${showingLooks} of ${totalLooks} look${
                  totalLooks === 1 ? "" : "s"
                }`
              : "No looks yet"}
          </div>
        </section>

        {/* Main closet card */}
        <section className="closet-shell card">
          <div className="closet-shell__header">
            <div>
              <h2 className="closet-shell__title">Lala&apos;s Closet feed</h2>
              <p className="closet-shell__subtitle">
                Tap a look to heart it and save inspo. The most-loved looks help
                decide future Bestie drops.
              </p>
            </div>
          </div>

          {err && (
            <div className="closet-notice closet-notice--error">
              <strong>Oops:</strong> {err}
            </div>
          )}

          {isInitialLoading && (
            <div className="closet-grid">
              {Array.from({ length: pageSize }).map((_, i) => (
                <ClosetCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isInitialLoading && !err && items.length === 0 && (
            <div className="closet-empty" style={{ marginTop: 12 }}>
              <span role="img" aria-label="empty closet">
                🧺
              </span>{" "}
              No approved closet items yet. Style Lala in the{" "}
              <Link to="/fan/closet">Style Lab</Link> and submit your looks for
              review to see them appear here.
            </div>
          )}

          {!err && visibleItems.length > 0 && (
            <>
              <div className="closet-grid">
                {visibleItems.map((it) => {
                  const isHighlight = highlightId && it.id === highlightId;
                  const liked = !!it.viewerHasFaved;
                  const favCount = it.favoriteCount ?? 0;
                  const {
                    label: audienceLabel,
                    className: audienceClass,
                  } = audienceChip(it);

                  let socialLine = "";
                  if (favCount === 0) {
                    socialLine = "Heart this if you’d wear it 💗";
                  } else if (liked && favCount === 1) {
                    socialLine = "You love this look";
                  } else if (liked && favCount > 1) {
                    const others = favCount - 1;
                    socialLine = `You and ${others} other${
                      others === 1 ? "" : "s"
                    } love this look`;
                  } else {
                    socialLine = `${favCount} fan${
                      favCount === 1 ? "" : "s"
                    } love this look`;
                  }

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
                            liked
                              ? "Un-heart this look"
                              : "Heart this look"
                          }
                          onClick={() => toggleFavoriteToBackend(it)}
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
                            <span className={audienceClass}>
                              {audienceLabel}
                            </span>
                            {it.pinned && (
                              <span className="closet-chip closet-chip--lala">
                                Lala&apos;s pick
                              </span>
                            )}
                          </div>
                          <span className="closet-meta-text">
                            Added{" "}
                            {it.createdAt
                              ? new Date(it.createdAt).toLocaleDateString()
                              : "recently"}
                          </span>
                        </div>

                        {/* Fan-visible coin value */}
                        {it.coinValue != null && it.coinValue !== 0 && (
                          <div className="fan-coin-pill">
                            🪙 Worth {it.coinValue} coin
                            {it.coinValue === 1 ? "" : "s"}
                          </div>
                        )}

                        {/* category / subcategory chips */}
                        {(it.category || it.subcategory) && (
                          <div className="fan-closet-tags">
                            {it.category && (
                              <span className="fan-closet-tag">
                                {it.category}
                              </span>
                            )}
                            {it.subcategory && (
                              <span className="fan-closet-tag fan-closet-tag--soft">
                                {it.subcategory}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="closet-item__social">
                          {socialLine}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {hasMore && (
                <div className="closet-pagination">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                  >
                    {loading ? "Loading…" : "Load more looks"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* component-scoped styles (keep your existing styles const if you have one) */}
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

/* HERO AREA */
.closet-hero {
  border-radius: 24px;
  padding: 16px 18px 18px;
  margin-bottom: 14px;
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
  font-size:1.8rem;
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

/* FILTER BAR UNDER HERO */
.closet-filterBar {
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  margin: 0 0 12px;
  padding: 0 2px;
}

.closet-filterBar-left {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}

.closet-filterBar-right {
  font-size:0.8rem;
  color:#6b7280;
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

/* SORT TOGGLE (used inside filterBar) */
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
  display:flex;
  flex-direction:column;
  min-height: 120px;
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
  align-items:flex-start;
  justify-content:space-between;
  gap:6px;
}

.closet-item__meta-left {
  display:flex;
  flex-wrap: wrap;
  align-items:center;
  gap:4px;
  row-gap: 2px;
  max-width: 70%;
}

.closet-meta-text {
  font-size:0.75rem;
  color:#9ca3af;
  white-space: nowrap;
}

/* NEW: fan-side coin pill */
.fan-coin-pill {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #fef3c7;
  border: 1px solid #facc15;
  color: #92400e;
  gap: 4px;
}

.closet-item__social {
  margin-top:auto;
  padding-top:4px;
  font-size:0.8rem;
  color:#4b5563;
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

/* NEW: Lala's pick chip */
.closet-chip--lala {
  background:#f5f3ff;
  color:#7c3aed;
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

/* Fan-facing closet category chips */
.fan-closet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.fan-closet-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #111827;
}

.fan-closet-tag--soft {
  background: #f9fafb;
  color: #6b7280;
}
`;



