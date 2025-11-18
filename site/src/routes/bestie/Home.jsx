// site/src/routes/bestie/Home.jsx
import React, { useCallback, useEffect, useState } from "react";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

const GQL = {
  topLooks: /* GraphQL */ `
    query TopClosetLooks($limit: Int) {
      topClosetLooks(limit: $limit) {
        id
        title
        storyTitle
        favoriteCount
        mediaKey
      }
    }
  `,
};

async function fallbackGraphql(query, variables) {
  const url =
    window.sa?.cfg?.appsyncUrl ||
    (window.__SA__ && window.__SA__.appsyncUrl);
  const idToken =
    localStorage.getItem("sa:idToken") ||
    localStorage.getItem("idToken") ||
    (window.sa?.session && window.sa.session.idToken);

  if (!url || !idToken) throw new Error("Not signed in");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: idToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export default function BestieHome() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [topLook, setTopLook] = useState(null);

  const runGql = useCallback(async (q, v) => {
    if (window.sa?.graphql) return window.sa.graphql(q, v);
    return fallbackGraphql(q, v);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await runGql(GQL.topLooks, { limit: 1 });
        const first = data?.topClosetLooks?.[0];

        if (first) {
          const thumbUrl = await getThumbUrlForMediaKey(first.mediaKey);
          setTopLook({
            ...first,
            thumbUrl: thumbUrl || null,
          });
        } else {
          setTopLook(null);
        }
      } catch (e) {
        setErr(String(e.message || e));
        setTopLook(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [runGql]);

  return (
    <div className="bestie-home">
      {/* Page title */}
      <header className="bh-header">
        <h1 className="bh-title">Lala&apos;s Closet</h1>
      </header>

      {err && <div className="bh-notice bh-notice--error">{err}</div>}

      {/* ==== TOP ROW: HERO ================================================= */}
      <section className="bh-hero">
        {/* Left: welcome copy */}
        <div className="bh-hero-left">
          <div className="bh-hero-greeting">
            <span className="bh-hero-emoji">👋</span>
            <span>Hey Bestie, welcome back!</span>
          </div>
          <p className="bh-hero-text">
            Closet total, saved outfits, and new drops will all live here.
            You get early access to styles before everyone else.
          </p>

          <div className="bh-hero-cta-row">
            <button className="bh-btn bh-btn-primary">✨ Style Me, Bestie</button>
            <button className="bh-btn bh-btn-ghost">View All Outfits</button>
          </div>
        </div>

        {/* Right: outfit preview card */}
        <div className="bh-hero-right">
          <div className="bh-outfit-card">
            <div className="bh-outfit-figures">
              {/* Simple pastel placeholder “outfit” shapes */}
              <div className="bh-outfit-piece bh-outfit-top" />
              <div className="bh-outfit-piece bh-outfit-bag" />
              <div className="bh-outfit-piece bh-outfit-hat" />
              <div className="bh-outfit-piece bh-outfit-shoes" />
            </div>
            <button className="bh-btn bh-btn-primary bh-outfit-cta">
              ✨ Style Me, Bestie
            </button>
          </div>
        </div>
      </section>

      {/* ==== GRID: 2 COLUMNS ============================================== */}
      <section className="bh-grid">
        {/* Closet Stats (placeholder for now) */}
        <article className="bh-card">
          <h2 className="bh-card-title">Closet Stats</h2>
          <div className="bh-stats-body">
            <div className="bh-stats-pie" />
            <ul className="bh-stats-list">
              <li>
                <span className="bh-dot bh-dot-top" />
                Tops <span className="bh-stat-count">– 15</span>
              </li>
              <li>
                <span className="bh-dot bh-dot-bottom" />
                Bottoms <span className="bh-stat-count">– 12</span>
              </li>
              <li>
                <span className="bh-dot bh-dot-dress" />
                Dresses <span className="bh-stat-count">– 8</span>
              </li>
              <li>
                <span className="bh-dot bh-dot-shoes" />
                Shoes <span className="bh-stat-count">– 20</span>
              </li>
              <li>
                <span className="bh-dot bh-dot-acc" />
                Accessories <span className="bh-stat-count">– 20</span>
              </li>
            </ul>
          </div>
        </article>

        {/* Just In / Spotlight Look */}
        <article className="bh-card">
          <div className="bh-card-header-row">
            <h2 className="bh-card-title">Just In</h2>
            <a href="/fan/closet-feed" className="bh-link-arrow">
              View all →
            </a>
          </div>
          <p className="bh-card-sub">
            {topLook
              ? "Just added: community favorites this week."
              : "New pieces will appear here as you add to your closet."}
          </p>

          <div className="bh-justin-row">
            {loading && !topLook && (
              <div className="bh-skeleton-row" />
            )}

            {topLook && (
              <div className="bh-spotlight">
                <div className="bh-spotlight-thumb">
                  {topLook.thumbUrl ? (
                    <img
                      src={topLook.thumbUrl}
                      alt={
                        topLook.storyTitle ||
                        topLook.title ||
                        "Closet look"
                      }
                    />
                  ) : (
                    <div className="bh-spotlight-placeholder">
                      Lala&apos;s look
                    </div>
                  )}
                </div>
                <div className="bh-spotlight-meta">
                  <div className="bh-spotlight-title">
                    {topLook.storyTitle ||
                      topLook.title ||
                      "Untitled look"}
                  </div>
                  <div className="bh-spotlight-caption">
                    ❤️ {topLook.favoriteCount || 0}{" "}
                    {topLook.favoriteCount === 1 ? "like" : "likes"} from
                    the community.
                  </div>
                </div>
              </div>
            )}

            {!loading && !topLook && !err && (
              <div className="bh-spotlight-empty">
                Once Lala&apos;s looks start getting ❤️&apos;s, you&apos;ll see
                the hottest outfits show up here first.
              </div>
            )}
          </div>
        </article>

        {/* Lala's Daily Tip */}
        <article className="bh-card">
          <h2 className="bh-card-title">Lala&apos;s Daily Tip</h2>
          <p className="bh-card-sub">
            Don&apos;t sleep on those white jeans – they&apos;re calling for a
            remix. Add a pastel top and one bold accessory. ✨
          </p>
          <button className="bh-btn bh-btn-ghost">See style tips</button>
        </article>

        {/* Outfit Planner */}
        <article className="bh-card">
          <h2 className="bh-card-title">Outfit Planner</h2>
          <p className="bh-card-sub">Today&apos;s look preview.</p>
          <div className="bh-planner-preview">
            <div className="bh-outfit-piece bh-planner-top" />
            <div className="bh-outfit-piece bh-planner-bag" />
          </div>
          <div className="bh-planner-actions">
            <button className="bh-btn bh-btn-ghost">Open Next Fit</button>
            <button className="bh-btn bh-btn-primary">
              Open Full Planner
            </button>
          </div>
        </article>
      </section>

      {/* Bottom full-width CTAs */}
      <section className="bh-bottom-row">
        <button className="bh-btn bh-btn-soft">
          Upload New Item
        </button>
        <button className="bh-btn bh-btn-soft bh-btn-soft--primary">
          Open Full Planner
        </button>
      </section>

      {/* ==== LOCAL STYLES =================================================== */}
      <style>{`
        .bestie-home {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .bh-header {
          margin-bottom: 4px;
        }
        .bh-title {
          margin: 0;
          font-size: 1.7rem;
          font-weight: 700;
          color: #111827;
        }

        .bh-notice {
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.9rem;
        }
        .bh-notice--error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #7f1d1d;
        }

        /* HERO */
        .bh-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 18px;
          padding: 18px 18px 16px;
          border-radius: 24px;
          border: 1px solid rgba(248,250,252,0.9);
          background: linear-gradient(
            135deg,
            #fdf2ff,
            #eef2ff
          );
          box-shadow: 0 18px 40px rgba(15,23,42,0.06);
        }

        .bh-hero-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bh-hero-greeting {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 1.1rem;
        }
        .bh-hero-emoji {
          font-size: 1.4rem;
        }

        .bh-hero-text {
          margin: 0;
          font-size: 0.95rem;
          color: #4b5563;
          max-width: 420px;
        }

        .bh-hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
        }

        .bh-hero-right {
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
        }

        .bh-outfit-card {
          width: 100%;
          max-width: 260px;
          border-radius: 20px;
          padding: 14px 14px 12px;
          background: #f9fafb;
          box-shadow: 0 14px 32px rgba(148,163,184,0.35);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
        }

        .bh-outfit-figures {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: 68px;
          gap: 8px;
        }

        .bh-outfit-piece {
          border-radius: 16px;
          background: #e5e7eb;
        }
        .bh-outfit-top {
          grid-column: span 2;
          background: linear-gradient(135deg,#e9d5ff,#fee2e2);
        }
        .bh-outfit-bag {
          background: linear-gradient(135deg,#fee2e2,#fef3c7);
        }
        .bh-outfit-hat {
          background: linear-gradient(135deg,#fef3c7,#e0f2fe);
        }
        .bh-outfit-shoes {
          background: linear-gradient(135deg,#e0f2fe,#e9d5ff);
        }

        .bh-outfit-cta {
          width: 100%;
          margin-top: 4px;
        }

        /* GRID */
        .bh-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
        }

        .bh-card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e5e7eb;
          padding: 14px 14px 16px;
          box-shadow: 0 10px 30px rgba(15,23,42,0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bh-card-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 600;
          color: #111827;
        }

        .bh-card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .bh-card-sub {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .bh-link-arrow {
          font-size: 0.85rem;
          color: #7c3aed;
          text-decoration: none;
        }
        .bh-link-arrow:hover {
          text-decoration: underline;
        }

        /* Closet Stats */
        .bh-stats-body {
          margin-top: 6px;
          display: grid;
          grid-template-columns: 140px minmax(0, 1fr);
          gap: 10px;
          align-items: center;
        }

        .bh-stats-pie {
          width: 120px;
          height: 120px;
          border-radius: 999px;
          background: conic-gradient(
            #a855f7 0 75deg,
            #22c55e 75deg 150deg,
            #f97316 150deg 220deg,
            #06b6d4 220deg 310deg,
            #e5e7eb 310deg 360deg
          );
          box-shadow: 0 10px 25px rgba(148,163,184,0.4);
        }

        .bh-stats-list {
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 0.85rem;
          color: #4b5563;
          display: grid;
          gap: 4px;
        }

        .bh-stat-count {
          color: #6b7280;
        }

        .bh-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          margin-right: 6px;
        }
        .bh-dot-top { background:#a855f7; }
        .bh-dot-bottom { background:#22c55e; }
        .bh-dot-dress { background:#f97316; }
        .bh-dot-shoes { background:#06b6d4; }
        .bh-dot-acc { background:#e5e7eb; }

        /* Just In */
        .bh-justin-row {
          margin-top: 6px;
        }

        .bh-skeleton-row {
          height: 80px;
          border-radius: 16px;
          background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);
          background-size: 400% 100%;
          animation: bh-shimmer 1.2s ease-in-out infinite;
        }

        .bh-spotlight {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .bh-spotlight-thumb {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          overflow: hidden;
          background: linear-gradient(135deg,#dbeafe,#f9fafb);
          flex-shrink: 0;
        }
        .bh-spotlight-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bh-spotlight-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .bh-spotlight-meta {
          flex: 1;
          min-width: 0;
        }
        .bh-spotlight-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .bh-spotlight-caption {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .bh-spotlight-empty {
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* Planner */
        .bh-planner-preview {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }
        .bh-planner-top {
          flex: 2;
          background: linear-gradient(135deg,#e9d5ff,#bfdbfe);
        }
        .bh-planner-bag {
          flex: 1;
          background: linear-gradient(135deg,#fee2e2,#fef3c7);
        }

        .bh-planner-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        /* Bottom row */
        .bh-bottom-row {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* Buttons */
        .bh-btn {
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 0.92rem;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition:
            background 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.04s ease,
            border-color 0.15s ease;
        }
        .bh-btn-primary {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: #ffffff;
          box-shadow: 0 10px 28px rgba(139,92,246,0.6);
        }
        .bh-btn-primary:hover {
          background: #7c3aed;
          border-color: #7c3aed;
          transform: translateY(-1px);
        }
        .bh-btn-ghost {
          background: transparent;
          border-color: #e5e7eb;
          color: #4b5563;
        }
        .bh-btn-ghost:hover {
          background: #f3f4ff;
        }

        .bh-btn-soft {
          flex: 1;
          background: #f3e8ff;
          border-color: transparent;
          color: #4b5563;
        }
        .bh-btn-soft--primary {
          background: #c4b5fd;
          color: #111827;
        }

        @keyframes bh-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }

        @media (max-width: 900px) {
          .bh-hero {
            grid-template-columns: minmax(0, 1fr);
          }
          .bh-hero-right {
            justify-content: flex-start;
          }
          .bh-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          .bh-title {
            font-size: 1.4rem;
          }
          .bh-outfit-card {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
