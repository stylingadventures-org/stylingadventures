// site/src/routes/bestie/Closet.jsx
import React, { useCallback, useEffect, useState } from "react";
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

  // simple client-side search
  const [search, setSearch] = useState("");

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
    } finally {
      setSavingStory(false);
    }
  }

  // filter by simple search
  const visibleItems = hasItems
    ? items.filter((it) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (it.title || "").toLowerCase().includes(q) ||
          (it.storyTitle || "").toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="bestie-closet">
      <style>{`
        .bestie-closet {
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        /* TOP TITLE */
        .bestie-closet-title {
          font-size:22px;
          font-weight:700;
          letter-spacing:-0.02em;
          margin:0 0 4px;
        }
        .bestie-closet-sub {
          margin:0 0 4px;
          font-size:14px;
          color:#6b7280;
        }

        /* TWO-PANEL SHELL */
        .bestie-closet-shell {
          display:grid;
          grid-template-columns:minmax(0,320px) minmax(0,1fr);
          gap:18px;
        }
        @media (max-width:900px){
          .bestie-closet-shell {
            grid-template-columns:minmax(0,1fr);
          }
        }

        .closet-pane {
          background:#f9f5ff;
          border-radius:24px;
          border:1px solid rgba(209,213,219,0.7);
          box-shadow:0 18px 40px rgba(15,23,42,0.06);
          padding:16px 18px 18px;
        }
        .closet-pane--right {
          background:#f5f3ff;
        }

        .closet-pane-header {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:8px;
          margin-bottom:14px;
        }
        .closet-pane-title {
          margin:0;
          font-size:18px;
          font-weight:600;
          letter-spacing:-0.01em;
        }
        .closet-pane-caption {
          margin:4px 0 0;
          font-size:13px;
          color:#6b7280;
        }

        /* LEFT UPLOAD CARD */
        .closet-upload-drop {
          border-radius:18px;
          border:1px dashed rgba(148,163,184,0.7);
          background:rgba(255,255,255,0.9);
          padding:20px 14px;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          gap:8px;
          margin-bottom:14px;
        }
        .closet-upload-icon {
          width:40px;
          height:40px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#ede9fe;
          color:#4c1d95;
          font-size:20px;
        }
        .closet-upload-label {
          font-size:14px;
          font-weight:600;
        }
        .closet-upload-hint {
          font-size:12px;
          color:#6b7280;
        }

        .closet-upload-btn {
          margin-top:6px;
          height:38px;
          padding:0 18px;
          border-radius:999px;
          border:none;
          background:#a855f7;
          color:#fff;
          font-weight:600;
          font-size:14px;
          cursor:pointer;
          box-shadow:0 12px 26px rgba(168,85,247,0.35);
          transition:transform .04s ease, box-shadow .15s ease, background .15s ease;
        }
        .closet-upload-btn:hover {
          background:#9333ea;
          box-shadow:0 14px 30px rgba(147,51,234,0.4);
          transform:translateY(-1px);
        }
        .closet-upload-btn:active {
          transform:translateY(1px);
          box-shadow:0 8px 18px rgba(147,51,234,0.3);
        }

        /* SMALL STATS IN LEFT PANE */
        .closet-stats-grid {
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:10px;
          margin-top:4px;
        }
        .closet-stat-chip {
          border-radius:14px;
          background:rgba(255,255,255,0.9);
          border:1px solid rgba(229,231,235,0.9);
          padding:8px 10px;
        }
        .closet-stat-chip label {
          display:block;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:#9ca3af;
          margin-bottom:2px;
        }
        .closet-stat-chip strong {
          font-size:16px;
          font-weight:700;
          color:#111827;
        }

        /* RIGHT DASHBOARD */
        .closet-filters-row {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-bottom:12px;
        }
        .closet-filter-select,
        .closet-filter-search {
          flex:1 1 150px;
          min-width:0;
          height:34px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          padding:0 12px;
          font-size:13px;
          color:#4b5563;
        }

        .closet-items-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          margin-bottom:8px;
        }
        .closet-items-title {
          font-size:14px;
          font-weight:600;
        }
        .closet-items-link {
          font-size:12px;
          color:#4c1d95;
          text-decoration:none;
        }

        .closet-items-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(170px,1fr));
          gap:12px;
        }

        .closet-item-card {
          border-radius:16px;
          border:1px solid rgba(229,231,235,0.95);
          background:#ffffff;
          padding:10px;
          display:grid;
          gap:6px;
        }
        .closet-item-thumb {
          border-radius:12px;
          background:linear-gradient(135deg,#e0f2fe,#fdf2ff);
          height:150px;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          font-size:12px;
          color:#9ca3af;
        }
        .closet-item-thumb img {
          width:100%;
          height:100%;
          object-fit:cover;
        }
        .closet-item-title {
          font-weight:600;
          font-size:13px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .closet-item-meta {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:6px;
          font-size:11px;
        }
        .closet-status-pill {
          border-radius:999px;
          padding:2px 8px;
          font-weight:500;
        }
        .closet-audience-pill {
          border-radius:999px;
          padding:2px 8px;
          background:#eef2ff;
          color:#4338ca;
          white-space:nowrap;
        }

        .closet-item-story {
          font-size:11px;
          color:#6b7280;
        }

        .closet-item-edit-btn {
          margin-top:4px;
          height:30px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          font-size:11px;
          font-weight:500;
          cursor:pointer;
        }

        /* Story inline editor */
        .closet-story-edit {
          margin-top:8px;
          padding-top:8px;
          border-top:1px dashed #e5e7eb;
          display:grid;
          gap:6px;
          font-size:12px;
        }
        .closet-story-edit label {
          display:block;
          font-size:10px;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:#9ca3af;
          margin-bottom:2px;
        }
        .closet-story-edit input {
          width:100%;
          padding:6px 8px;
          border-radius:8px;
          border:1px solid #e5e7eb;
          font-size:12px;
        }
        .closet-story-actions {
          display:flex;
          justify-content:flex-end;
          gap:6px;
          margin-top:4px;
        }
        .closet-story-btn {
          height:28px;
          padding:0 10px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-size:11px;
          cursor:pointer;
        }
        .closet-story-btn.primary {
          background:#111827;
          color:#fff;
          border-color:#111827;
        }

        .closet-empty {
          padding:18px 10px;
          text-align:center;
          font-size:13px;
          color:#6b7280;
        }

        .closet-error {
          margin-top:8px;
          margin-bottom:4px;
          padding:10px 12px;
          border-radius:10px;
          border:1px solid #fecaca;
          background:#fee2e2;
          color:#991b1b;
          font-size:13px;
        }
      `}</style>

      {/* Page title (inside the main Bestie layout card) */}
      <header>
        <h1 className="bestie-closet-title">Lala&apos;s Closet – Bestie uploads</h1>
        <p className="bestie-closet-sub">
          Manage outfits you&apos;ve submitted for Lala. Approvals here flow into
          the fan-facing closet experience.
        </p>
      </header>

      {err && (
        <div className="closet-error">
          <strong>Oops:</strong> {err}
        </div>
      )}

      <div className="bestie-closet-shell">
        {/* LEFT: upload helper + stats */}
        <section className="closet-pane">
          <div className="closet-pane-header">
            <div>
              <h2 className="closet-pane-title">Closet upload</h2>
              <p className="closet-pane-caption">
                Upload from the fan area today. A native Bestie uploader can live here later.
              </p>
            </div>
          </div>

          <div className="closet-upload-drop">
            <div className="closet-upload-icon">☁︎</div>
            <div className="closet-upload-label">Choose a file in Fan Closet</div>
            <div className="closet-upload-hint">
              Use the fan closet to add photos. They&apos;ll show up here automatically.
            </div>
            <button
              className="closet-upload-btn"
              type="button"
              onClick={() => (window.location.href = "/fan/closet")}
            >
              Open fan closet upload
            </button>
          </div>

          <div className="closet-stats-grid">
            <div className="closet-stat-chip">
              <label>Approved</label>
              <strong>{stats.approved}</strong>
            </div>
            <div className="closet-stat-chip">
              <label>Pending</label>
              <strong>{stats.pending}</strong>
            </div>
            <div className="closet-stat-chip">
              <label>Drafts</label>
              <strong>{stats.drafts}</strong>
            </div>
            <div className="closet-stat-chip">
              <label>Rejected</label>
              <strong>{stats.rejected}</strong>
            </div>
          </div>
        </section>

        {/* RIGHT: dashboard + grid */}
        <section className="closet-pane closet-pane--right">
          <div className="closet-pane-header">
            <div>
              <h2 className="closet-pane-title">Closet dashboard</h2>
              <p className="closet-pane-caption">
                Review looks, track status, and turn uploads into named stories.
              </p>
            </div>
          </div>

          {/* Filter row */}
          <div className="closet-filters-row">
            <select
              disabled
              className="closet-filter-select"
              defaultValue="all"
            >
              <option value="all">All categories (coming soon)</option>
            </select>
            <input
              className="closet-filter-search"
              placeholder="Search title or story…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Items header */}
          <div className="closet-items-header">
            <div className="closet-items-title">
              Closet items grid{visibleItems.length ? ` · ${visibleItems.length}` : ""}
            </div>
            <button
              type="button"
              className="closet-story-btn"
              style={{ borderRadius: 999 }}
              onClick={loadCloset}
            >
              Refresh
            </button>
          </div>

          {/* Items grid */}
          {loading && !hasItems && (
            <div className="closet-empty">Loading your closet…</div>
          )}

          {!loading && !hasItems && (
            <div className="closet-empty">
              You don&apos;t have any looks yet. Upload from the fan closet to see them here.
            </div>
          )}

          {visibleItems.length > 0 && (
            <div className="closet-items-grid">
              {visibleItems.map((item) => {
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
                  <article key={item.id} className="closet-item-card">
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
                      <span className="closet-audience-pill">
                        {item.audience || "Bestie only"}
                      </span>
                    </div>

                    {storyLabel && (
                      <div className="closet-item-story">
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
                      className="closet-item-edit-btn"
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
                            placeholder="e.g. Holiday Glam Drop"
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
