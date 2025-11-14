// site/src/routes/bestie/Closet.jsx
import React, { useCallback, useEffect, useState } from "react";
import TierTabs from "../../components/TierTabs";
import { getSA } from "../../lib/sa";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

// Simple helper so we don't crash on unknown statuses
const initialStats = { approved: 0, pending: 0, drafts: 0, rejected: 0 };

export default function BestieCloset() {
  const [stats, setStats] = useState(initialStats);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // inline “story” editor state
  const [editingId, setEditingId] = useState(null);
  const [storyDraft, setStoryDraft] = useState({
    title: "",
    season: "",
    vibes: "",
  });
  const [savingStory, setSavingStory] = useState(false);

  const hasItems = items && items.length > 0;

  const loadCloset = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const SA = await getSA();
      const res = await SA.gql(`
        query MyCloset {
          myCloset {
            id
            title
            status
            mediaKey
            createdAt
            audience
            storyTitle
            storySeason
            storyVibes
          }
        }
      `);

      const list = Array.isArray(res?.myCloset) ? res.myCloset : [];

      // hydrate with thumbnails
      const hydrated = await Promise.all(
        list.map(async (it) => {
          const thumbUrl = it.mediaKey
            ? await getThumbUrlForMediaKey(it.mediaKey)
            : null;
          return { ...it, thumbUrl };
        })
      );

      // compute stats
      const nextStats = hydrated.reduce(
        (acc, it) => {
          const s = (it.status || "").toUpperCase();
          if (s === "APPROVED" || s === "PUBLISHED") acc.approved += 1;
          else if (s === "PENDING") acc.pending += 1;
          else if (s === "REJECTED") acc.rejected += 1;
          else acc.drafts += 1;
          return acc;
        },
        { ...initialStats }
      );

      setItems(hydrated);
      setStats(nextStats);
    } catch (e) {
      console.error("[BestieCloset] loadCloset error", e);
      setErr(String(e?.message || e));
      setItems([]);
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCloset();
  }, [loadCloset]);

  // ----- story editor helpers -----
  function beginStoryEdit(item) {
    setEditingId(item.id);
    setStoryDraft({
      title: item.storyTitle || item.title || "",
      season: item.storySeason || "",
      vibes: Array.isArray(item.storyVibes)
        ? item.storyVibes.join(", ")
        : "",
    });
  }

  function cancelStoryEdit() {
    if (savingStory) return;
    setEditingId(null);
  }

  async function saveStoryDraft() {
    if (!editingId || savingStory) return;

    const trimmedTitle = storyDraft.title.trim();
    const trimmedSeason = storyDraft.season.trim();
    const vibesArr = storyDraft.vibes
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    setSavingStory(true);
    setErr("");

    // Optimistic local update
    setItems((prev) =>
      prev.map((it) =>
        it.id === editingId
          ? {
              ...it,
              storyTitle: trimmedTitle || null,
              storySeason: trimmedSeason || null,
              storyVibes: vibesArr,
            }
          : it
      )
    );

    try {
      const SA = await getSA();
      const res = await SA.gql(
        `
        mutation UpdateClosetItemStory($input: UpdateClosetItemStoryInput!) {
          updateClosetItemStory(input: $input) {
            id
            storyTitle
            storySeason
            storyVibes
          }
        }
      `,
        {
          input: {
            id: editingId,
            storyTitle: trimmedTitle || null,
            storySeason: trimmedSeason || null,
            storyVibes: vibesArr,
          },
        }
      );

      const updated = res?.updateClosetItemStory;
      if (updated?.id) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === updated.id
              ? {
                  ...it,
                  storyTitle: updated.storyTitle ?? null,
                  storySeason: updated.storySeason ?? null,
                  storyVibes: updated.storyVibes ?? [],
                }
              : it
          )
        );
      }
      setEditingId(null);
    } catch (e) {
      console.error("[BestieCloset] saveStoryDraft error", e);
      setErr(String(e?.message || e));
      // Optional: reload closet to avoid stale optimistic state
      // await loadCloset();
    } finally {
      setSavingStory(false);
    }
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 16px" }}>
      <TierTabs activeTier="Bestie" />

      <style>{`
        .closet-head {
          display:flex;
          flex-wrap:wrap;
          justify-content:space-between;
          gap:12px;
          margin-top:16px;
          margin-bottom:12px;
        }
        .closet-head h1 {
          margin:0;
          font-size:24px;
          letter-spacing:-0.02em;
        }
        .closet-sub {
          margin:4px 0 0;
          color:#6b7280;
          font-size:14px;
        }
        .closet-actions {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          align-items:flex-start;
        }
        .closet-btn {
          height:38px;
          padding:0 14px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-weight:600;
          cursor:pointer;
          font-size:14px;
        }
        .closet-btn.primary {
          background:#111827;
          color:#fff;
          border-color:#111827;
        }

        .closet-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:14px;
          margin-top:18px;
        }
        .closet-stat {
          background:#fff;
          border-radius:16px;
          border:1px solid #e5e7eb;
          padding:12px 14px;
        }
        .closet-stat label {
          display:block;
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:.08em;
          color:#9ca3af;
        }
        .closet-stat strong {
          display:block;
          font-size:20px;
          margin-top:2px;
        }

        .closet-panel {
          margin-top:20px;
          display:grid;
          grid-template-columns: minmax(0, 320px) minmax(0,1fr);
          gap:18px;
        }
        @media (max-width:900px){
          .closet-panel { grid-template-columns: minmax(0,1fr); }
        }
        .closet-card {
          background:#fff;
          border-radius:16px;
          border:1px solid #e5e7eb;
          padding:16px 18px;
        }
        .closet-card h2 {
          margin:0 0 6px;
          font-size:18px;
        }
        .closet-card p {
          margin:0 0 12px;
          color:#6b7280;
          font-size:14px;
        }

        .closet-empty {
          padding:24px 12px;
          text-align:center;
          color:#6b7280;
          font-size:14px;
        }

        .closet-items {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap:12px;
        }
        .closet-item {
          border-radius:14px;
          border:1px solid #e5e7eb;
          background:#fff;
          padding:10px;
          display:grid;
          gap:6px;
        }
        .closet-item-thumb {
          border-radius:10px;
          background:#f9fafb;
          height:160px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          color:#9ca3af;
          overflow:hidden;
        }
        .closet-item-thumb img {
          width:100%;
          height:100%;
          object-fit:cover;
        }
        .closet-item-title {
          font-size:14px;
          font-weight:600;
        }
        .closet-item-meta {
          font-size:12px;
          color:#6b7280;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }
        .closet-badge {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          border-radius:999px;
          padding:2px 8px;
          font-size:11px;
        }

        .closet-status-pill {
          border-radius:999px;
          padding:2px 8px;
          font-size:11px;
        }

        .closet-story-edit {
          margin-top:8px;
          padding-top:8px;
          border-top:1px dashed #e5e7eb;
          display:grid;
          gap:8px;
          font-size:13px;
        }
        .closet-story-edit label {
          font-size:12px;
          text-transform:uppercase;
          letter-spacing:.08em;
          color:#9ca3af;
          display:block;
          margin-bottom:2px;
        }
        .closet-story-edit input {
          width:100%;
          padding:6px 8px;
          border-radius:8px;
          border:1px solid #e5e7eb;
          font-size:13px;
        }
        .closet-story-actions {
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:4px;
        }
        .closet-story-btn {
          height:30px;
          padding:0 12px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-size:12px;
          cursor:pointer;
        }
        .closet-story-btn.primary {
          background:#111827;
          color:#fff;
          border-color:#111827;
        }
      `}</style>

      {/* Header row */}
      <div className="closet-head">
        <div>
          <h1>My Bestie Closet</h1>
          <p className="closet-sub">
            Upload outfits, name each look, and send them for approval to appear in Lala’s Closet.
          </p>
        </div>
        <div className="closet-actions">
          <button
            className="closet-btn primary"
            onClick={() => (window.location.href = "/fan/closet")}
          >
            + Create new look
          </button>
          <button
            className="closet-btn"
            onClick={() => (window.location.href = "/fan")}
          >
            Go to fan area
          </button>
        </div>
      </div>

      {err && (
        <div
          style={{
            marginTop: 8,
            marginBottom: 4,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          <strong>Oops:</strong> {err}
        </div>
      )}

      {/* Stats */}
      <div className="closet-grid">
        <div className="closet-stat">
          <label>Approved looks</label>
          <strong>{stats.approved}</strong>
        </div>
        <div className="closet-stat">
          <label>Pending review</label>
          <strong>{stats.pending}</strong>
        </div>
        <div className="closet-stat">
          <label>Drafts</label>
          <strong>{stats.drafts}</strong>
        </div>
        <div className="closet-stat">
          <label>Rejected</label>
          <strong>{stats.rejected}</strong>
        </div>
      </div>

      {/* Left: workflow tips / upload helper, Right: item list */}
      <div className="closet-panel">
        <section className="closet-card">
          <h2>How closet uploads work</h2>
          <p>
            1. Click <strong>Create new look</strong> to upload from the fan area.<br />
            2. Give each look a name and short description.<br />
            3. Your upload goes into the approval queue.<br />
            4. Once approved, it appears for fans under Lala’s Closet.
          </p>

          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Later we can add inline upload here (without leaving the Bestie tab) once the
            API shape for creator uploads is finalized.
          </p>
        </section>

        <section className="closet-card">
          <h2>Your looks</h2>
          {loading && !hasItems && (
            <div className="closet-empty">Loading your closet…</div>
          )}

          {!loading && !hasItems && (
            <div className="closet-empty">
              You don’t have any looks yet. Start by uploading your first outfit from the fan area.
            </div>
          )}

          {hasItems && (
            <div className="closet-items">
              {items.map((item) => {
                const status = (item.status || "").toUpperCase();
                let statusColor = "#6b7280";
                let statusBg = "#f3f4f6";
                if (status === "APPROVED" || status === "PUBLISHED") {
                  statusColor = "#166534";
                  statusBg = "#dcfce7";
                } else if (status === "PENDING") {
                  statusColor = "#92400e";
                  statusBg = "#ffedd5";
                } else if (status === "REJECTED") {
                  statusColor = "#b91c1c";
                  statusBg = "#fee2e2";
                }

                const storyLabel =
                  item.storyTitle ||
                  (Array.isArray(item.storyVibes) &&
                    item.storyVibes.length > 0 &&
                    item.storyVibes.join(", "));

                return (
                  <article key={item.id} className="closet-item">
                    <div className="closet-item-thumb">
                      {item.thumbUrl ? (
                        <img src={item.thumbUrl} alt={item.title || "Look"} />
                      ) : (
                        "No preview"
                      )}
                    </div>

                    <div className="closet-item-title">
                      {item.title || "Untitled look"}
                    </div>

                    <div className="closet-item-meta">
                      <span
                        className="closet-status-pill"
                        style={{ background: statusBg, color: statusColor }}
                      >
                        {status || "DRAFT"}
                      </span>
                      <span
                        className="closet-badge"
                        style={{ background: "#eef2ff", color: "#4338ca" }}
                      >
                        {item.audience || "Bestie only"}
                      </span>
                    </div>

                    {storyLabel && (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Story: <strong>{storyLabel}</strong>
                        {item.storySeason && (
                          <>
                            {" "}
                            · <span>{item.storySeason}</span>
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="closet-btn"
                      style={{
                        marginTop: 6,
                        width: "100%",
                        height: 32,
                        fontSize: 12,
                      }}
                      onClick={() => beginStoryEdit(item)}
                      disabled={savingStory && editingId === item.id}
                    >
                      {editingId === item.id
                        ? savingStory
                          ? "Saving story…"
                          : "Editing story…"
                        : "Save look as story"}
                    </button>

                    {editingId === item.id && (
                      <div className="closet-story-edit">
                        <div>
                          <label htmlFor={`story-title-${item.id}`}>
                            Story title
                          </label>
                          <input
                            id={`story-title-${item.id}`}
                            value={storyDraft.title}
                            onChange={(e) =>
                              setStoryDraft((d) => ({
                                ...d,
                                title: e.target.value,
                              }))
                            }
                            placeholder="e.g. Holiday Glam Closet Confession"
                          />
                        </div>
                        <div>
                          <label htmlFor={`story-season-${item.id}`}>
                            Season / drop
                          </label>
                          <input
                            id={`story-season-${item.id}`}
                            value={storyDraft.season}
                            onChange={(e) =>
                              setStoryDraft((d) => ({
                                ...d,
                                season: e.target.value,
                              }))
                            }
                            placeholder="e.g. Holiday 2025, Spring Drop 1"
                          />
                        </div>
                        <div>
                          <label htmlFor={`story-vibes-${item.id}`}>
                            Vibe tags (comma separated)
                          </label>
                          <input
                            id={`story-vibes-${item.id}`}
                            value={storyDraft.vibes}
                            onChange={(e) =>
                              setStoryDraft((d) => ({
                                ...d,
                                vibes: e.target.value,
                              }))
                            }
                            placeholder="e.g. cozy, monochrome, night-out"
                          />
                        </div>
                        <div className="closet-story-actions">
                          <button
                            type="button"
                            className="closet-story-btn"
                            onClick={cancelStoryEdit}
                            disabled={savingStory}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="closet-story-btn primary"
                            onClick={saveStoryDraft}
                            disabled={savingStory}
                          >
                            Save story
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
