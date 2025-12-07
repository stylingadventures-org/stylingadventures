// site/src/routes/creator/Cabinet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { graphql } from "../../lib/sa";

const demoAssets = [
  {
    id: "d1",
    title: "Holiday glam B-roll",
    category: "B-roll",
    kind: "VIDEO",
    mediaKey: "demo/holiday-glam.mp4",
  },
  {
    id: "d2",
    title: "Closet flatlay",
    category: "Thumbnails",
    kind: "PHOTO",
    mediaKey: "demo/flatlay.jpg",
  },
  {
    id: "d3",
    title: "Behind the scenes selfie",
    category: "BTS",
    kind: "PHOTO",
    mediaKey: "demo/bts-selfie.jpg",
  },
];

export default function Cabinet() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canGraphQL =
    typeof window !== "undefined" &&
    !!(window.sa?.graphql || window.__cfg?.appsyncUrl);

  useEffect(() => {
    (async () => {
      if (!canGraphQL) {
        // local demo grouping
        const map = new Map();
        demoAssets.forEach((a) => {
          const cat = a.category || "Unsorted";
          if (!map.has(cat)) map.set(cat, []);
          map.get(cat).push(a);
        });
        setGroups(
          Array.from(map.entries()).map(([category, assets]) => ({
            category,
            assets,
          })),
        );
        return;
      }

      try {
        setLoading(true);
        setErr("");
        const data = await graphql(`
          query CreatorCabinet {
            creatorCabinet {
              groups {
                category
                assets {
                  id
                  title
                  description
                  category
                  kind
                  mediaKey
                  createdAt
                }
              }
            }
          }
        `);
        setGroups(data?.creatorCabinet?.groups ?? []);
      } catch (e) {
        console.error(e);
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [canGraphQL]);

  const totalAssets = useMemo(
    () => groups.reduce((sum, g) => sum + (g.assets?.length || 0), 0),
    [groups],
  );

  return (
    <div className="creator-shell">
      <div className="creator-head">
        <div>
          <h1 className="creator-title">Filing cabinet</h1>
          <p className="creator-sub">
            Store and reuse your photos &amp; videos across stories,
            closet looks, and posts.
          </p>
        </div>
        <div className="creator-head-meta">
          <span className="pill-soft">
            {loading ? "Syncing…" : `${totalAssets} assets`}
          </span>
        </div>
      </div>

      {err && <div className="creator-error">Error: {err}</div>}

      <div className="creator-cabinet-grid">
        {groups.map((g) => (
          <section key={g.category} className="creator-cabinet-section">
            <header className="creator-cabinet-section-head">
              <h2>{g.category}</h2>
              <span>{g.assets?.length || 0} item(s)</span>
            </header>
            <div className="creator-asset-rail">
              {g.assets.map((asset) => (
                <article
                  key={asset.id}
                  className="creator-asset-card"
                >
                  <div className="creator-asset-thumb">
                    <span className="creator-asset-kind">
                      {asset.kind === "VIDEO" ? "🎬" : "📸"}
                    </span>
                  </div>
                  <div className="creator-asset-main">
                    <div className="creator-asset-title">
                      {asset.title || "(untitled)"}
                    </div>
                    <div className="creator-asset-meta">
                      <span>{asset.kind}</span>
                      {asset.createdAt && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(
                              asset.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="creator-asset-actions">
                    <button
                      type="button"
                      className="creator-btn-ghost"
                      onClick={() =>
                        alert("Attach picker is wired from flows below.")
                      }
                    >
                      Attach
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {!groups.length && !loading && (
          <div className="creator-empty">
            <p>No assets yet.</p>
            <p className="creator-empty-sub">
              Upload a look or clip from the creator tools to see it
              here.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .creator-shell {
          display:flex;
          flex-direction:column;
          gap:14px;
        }
        .creator-head {
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-end;
        }
        .creator-title {
          margin:0;
          font-size:1.4rem;
          letter-spacing:-0.03em;
        }
        .creator-sub {
          margin:4px 0 0;
          font-size:0.9rem;
          color:#6b7280;
        }
        .creator-head-meta {
          display:flex;
          align-items:center;
          gap:8px;
        }
        .pill-soft {
          padding:4px 10px;
          border-radius:999px;
          background:#eef2ff;
          color:#4338ca;
          font-size:0.8rem;
        }
        .creator-error {
          border-radius:10px;
          border:1px solid #fecaca;
          background:#fef2f2;
          padding:8px 10px;
          font-size:0.85rem;
          color:#7f1d1d;
        }
        .creator-cabinet-grid {
          display:flex;
          flex-direction:column;
          gap:12px;
        }
        .creator-cabinet-section {
          border-radius:14px;
          border:1px solid #e5e7eb;
          background:#ffffff;
          padding:10px 12px 12px;
        }
        .creator-cabinet-section-head {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          margin-bottom:8px;
        }
        .creator-cabinet-section-head h2 {
          margin:0;
          font-size:1rem;
        }
        .creator-cabinet-section-head span {
          font-size:0.8rem;
          color:#6b7280;
        }
        .creator-asset-rail {
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .creator-asset-card {
          display:grid;
          grid-template-columns:80px minmax(0,1fr) auto;
          gap:8px;
          border-radius:10px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          padding:6px;
        }
        .creator-asset-thumb {
          border-radius:8px;
          background:linear-gradient(135deg,#e5e7eb,#f3f4f6);
          display:flex;
          align-items:flex-end;
          justify-content:flex-end;
          padding:4px;
        }
        .creator-asset-kind {
          font-size:1.1rem;
        }
        .creator-asset-main {
          display:flex;
          flex-direction:column;
          gap:2px;
        }
        .creator-asset-title {
          font-size:0.9rem;
          font-weight:600;
        }
        .creator-asset-meta {
          font-size:0.78rem;
          color:#6b7280;
          display:flex;
          gap:4px;
          align-items:center;
        }
        .creator-asset-actions {
          display:flex;
          align-items:center;
        }
        .creator-btn-ghost {
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#ffffff;
          color:#374151;
          font-size:0.8rem;
          padding:5px 10px;
          cursor:pointer;
        }
        .creator-empty {
          padding:14px 12px;
          border-radius:14px;
          border:1px dashed #e5e7eb;
          background:#f9fafb;
          text-align:center;
        }
        .creator-empty-sub {
          margin:4px 0 0;
          font-size:0.85rem;
          color:#6b7280;
        }
      `}</style>
    </div>
  );
}
