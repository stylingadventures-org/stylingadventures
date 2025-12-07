// site/src/ui/CreatorAssetPicker.jsx
import React, { useEffect, useState } from "react";
import { graphql } from "../lib/sa";

export default function CreatorAssetPicker({ onPick, onClose }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await graphql(`
          query CreatorCabinetForPicker {
            creatorCabinet {
              groups {
                category
                assets {
                  id
                  title
                  kind
                  mediaKey
                }
              }
            }
          }
        `);
        setGroups(data?.creatorCabinet?.groups ?? []);
      } catch (e) {
        setErr(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="cap-backdrop">
      <div className="cap-panel">
        <header className="cap-head">
          <h2>Select from cabinet</h2>
          <button type="button" onClick={onClose}>
            ✕
          </button>
        </header>
        {loading && <p className="cap-sub">Loading…</p>}
        {err && <p className="cap-err">Error: {err}</p>}

        <div className="cap-body">
          {groups.map((g) => (
            <section key={g.category} className="cap-group">
              <h3>{g.category}</h3>
              <div className="cap-grid">
                {g.assets.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="cap-card"
                    onClick={() => {
                      onPick?.(a);
                      onClose?.();
                    }}
                  >
                    <div className="cap-thumb">
                      {a.kind === "VIDEO" ? "🎬" : "📸"}
                    </div>
                    <div className="cap-title">
                      {a.title || "(untitled)"}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style>{`
        .cap-backdrop {
          position:fixed;
          inset:0;
          background:rgba(15,23,42,0.45);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index:80;
        }
        .cap-panel {
          width:min(640px, 100% - 32px);
          max-height:80vh;
          border-radius:16px;
          background:#ffffff;
          border:1px solid #e5e7eb;
          box-shadow:0 24px 60px rgba(15,23,42,0.35);
          display:flex;
          flex-direction:column;
        }
        .cap-head {
          padding:10px 14px;
          border-bottom:1px solid #e5e7eb;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
        }
        .cap-head h2 {
          margin:0;
          font-size:1rem;
        }
        .cap-body {
          padding:10px 14px 12px;
          overflow:auto;
        }
        .cap-group {
          margin-bottom:10px;
        }
        .cap-group h3 {
          margin:0 0 6px;
          font-size:0.9rem;
        }
        .cap-grid {
          display:flex;
          flex-wrap:wrap;
          gap:6px;
        }
        .cap-card {
          border-radius:10px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          padding:6px;
          display:flex;
          flex-direction:column;
          align-items:flex-start;
          gap:4px;
          width:130px;
          cursor:pointer;
        }
        .cap-thumb {
          border-radius:8px;
          background:linear-gradient(135deg,#e5e7eb,#f3f4f6);
          width:100%;
          aspect-ratio:4/3;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:1.3rem;
        }
        .cap-title {
          font-size:0.8rem;
          text-align:left;
        }
        .cap-sub {
          padding:8px 14px;
          font-size:0.86rem;
        }
        .cap-err {
          padding:8px 14px;
          font-size:0.86rem;
          color:#b91c1c;
        }
      `}</style>
    </div>
  );
}
