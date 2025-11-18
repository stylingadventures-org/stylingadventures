// site/src/routes/fan/ClosetFeed.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSignedGetUrl } from "../../lib/sa";

const GQL_FEED = /* GraphQL */ `
  query ClosetFeedSimple {
    closetFeed {
      id
      title
      status
      audience
      mediaKey
      rawMediaKey
      createdAt
    }
  }
`;

export default function ClosetFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // “Newest / Most loved” toggle (client-only for now)
  const [sort, setSort] = useState("NEWEST");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        const res = await window.sa.graphql(GQL_FEED);
        const raw = res?.closetFeed || [];

        // Only show APPROVED + PUBLIC in fan view
        const visible = raw.filter((it) => {
          const statusOk = it.status === "APPROVED";
          const audience = it.audience || "PUBLIC";
          const audienceOk = audience === "PUBLIC";
          return statusOk && audienceOk;
        });

        // attach a usable media key
        const withKeys = visible.map((it) => ({
          ...it,
          effectiveKey: it.mediaKey || it.rawMediaKey || null,
        }));

        // build public URLs with new helper
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

        hydrated.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
          if (sort === "NEWEST") return bTime - aTime;
          // placeholder for MOST_LOVED (same as newest for now)
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
              {items.map((it) => (
                <article key={it.id} className="closet-item">
                  <div className="closet-item__thumbWrap">
                    {it.mediaUrl ? (
                      <img
                        src={it.mediaUrl}
                        alt={it.title || "Closet item"}
                        className="closet-item__thumb"
                      />
                    ) : (
                      <div className="closet-item__thumb closet-item__thumb--empty">
                        Look coming soon…
                      </div>
                    )}

                    <button
                      type="button"
                      className="closet-heart"
                      aria-label="Heart this look (coming soon)"
                    >
                      ♡
                    </button>
                  </div>

                  <div className="closet-item__body">
                    <div className="closet-item__title">
                      {it.title || "Untitled look"}
                    </div>
                    <div className="closet-item__meta">
                      <span className="closet-chip">Closet look</span>
                      <span className="closet-meta-text">
                        Added{" "}
                        {it.createdAt
                          ? new Date(it.createdAt).toLocaleDateString()
                          : "recently"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
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

.closet-item__thumbWrap {
  position:relative;
  border-radius:14px;
  overflow:hidden;
  background:linear-gradient(135deg,#fce7f3,#e0e7ff);
}

.closet-item__thumb {
  display:block;
  width:100%;
  height:210px;
  object-fit:cover;
}
.closet-item__thumb--empty {
  height:210px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#6b7280;
}

.closet-heart {
  position:absolute;
  right:8px;
  top:8px;
  width:28px;
  height:28px;
  border-radius:999px;
  border:none;
  background:rgba(255,255,255,0.85);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  font-size:0.9rem;
  color:#ec4899;
  box-shadow:0 4px 10px rgba(0,0,0,0.08);
}
.closet-heart:hover {
  background:#fecdd3;
}

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

.closet-meta-text {
  font-size:0.75rem;
  color:#9ca3af;
}

.closet-chip {
  font-size:0.7rem;
  border-radius:999px;
  padding:4px 8px;
  background:#fef9c3;
  color:#92400e;
  border:1px solid #facc15;
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
