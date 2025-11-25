// site/src/routes/bestie/Closet.jsx
import React, { useCallback, useEffect, useState } from "react";
import { getSA } from "../../lib/sa";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

// Simple helper so we don't crash on unknown statuses
const initialStats = { approved: 0, pending: 0, drafts: 0, rejected: 0 };

// Clothing category options for the filter
const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "TOPS", label: "Tops" },
  { value: "BOTTOMS", label: "Bottoms" },
  { value: "DRESSES", label: "Dresses" },
  { value: "SHOES", label: "Shoes" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "OTHER", label: "Other" },
];

/**
 * Heuristic category detector.
 *
 * - If you later add an explicit field (e.g. item.pieceCategory),
 *   prefer that and fall back to these string matches.
 */
function deriveCategory(item) {
  // If backend adds a field, prefer it:
  const explicit =
    (item.pieceCategory ||
      item.category ||
      item.type ||
      item.kind ||
      "").toString();

  const source =
    explicit ||
    [
      item.title,
      item.storyTitle,
      item.storySeason,
      Array.isArray(item.storyVibes) ? item.storyVibes.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const s = source.toLowerCase();

  if (s.match(/\b(top|tee|t\-shirt|shirt|blouse|sweater|hoodie)\b/)) {
    return "TOPS";
  }
  if (s.match(/\b(jeans|pants|trousers|shorts|skirt|bottom)\b/)) {
    return "BOTTOMS";
  }
  if (s.match(/\b(dress|gown)\b/)) {
    return "DRESSES";
  }
  if (s.match(/\b(heel|shoe|sneaker|boot|sandal|loafer)\b/)) {
    return "SHOES";
  }
  if (
    s.match(
      /\b(bag|purse|hat|belt|scarf|earring|necklace|ring|accessor(y|ies))\b/
    )
  ) {
    return "ACCESSORIES";
  }

  return "OTHER";
}

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

  // filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const hasItems = items && items.length > 0;
  const totalPieces = items.length;
  const styledLooks = stats.approved; // you can change this mapping later

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

      // hydrate with thumbnails + category
      const hydrated = await Promise.all(
        list.map(async (it) => {
          const thumbUrl = it.mediaKey
            ? await getThumbUrlForMediaKey(it.mediaKey)
            : null;
          const category = deriveCategory(it);
          return { ...it, thumbUrl, category };
        })
      );

      // compute stats by status
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
      vibes: Array.isArray(item.storyVibes) ? item.storyVibes.join(", ") : "",
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
              category: deriveCategory({
                ...it,
                storyTitle: trimmedTitle || null,
                storySeason: trimmedSeason || null,
                storyVibes: vibesArr,
              }),
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
                  category: deriveCategory({
                    ...it,
                    storyTitle: updated.storyTitle ?? null,
                    storySeason: updated.storySeason ?? null,
                    storyVibes: updated.storyVibes ?? [],
                  }),
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

  // ---- filters: category + search ----
  const visibleItems = hasItems
    ? items.filter((it) => {
        // category filter
        if (categoryFilter !== "ALL" && it.category !== categoryFilter) {
          return false;
        }

        // search filter
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          (it.title || "").toLowerCase().includes(q) ||
          (it.storyTitle || "").toLowerCase().includes(q) ||
            (Array.isArray(it.storyVibes)
              ? it.storyVibes.join(" ").toLowerCase()
              : ""
            ).includes(q)
        );
      })
    : [];

  return (
    <div className="bestie-closet-page">
      <style>{`
        .bestie-closet-page {
          display:flex;
          flex-direction:column;
          gap:20px;
        }

        /* TYPOGRAPHY / GENERAL */
        .bc-title-main {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
        }
        .bc-sub-main {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          max-width: 540px;
        }

        .bc-pill-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          color:#9ca3af;
          margin-bottom: 2px;
        }
        .bc-pill-stat-value {
          font-size: 18px;
          font-weight: 700;
          color:#111827;
        }
        .bc-section-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 4px;
        }
        .bc-section-sub {
          margin: 0;
          font-size: 13px;
          color:#6b7280;
        }

        /* HERO */
        .bc-hero {
          display:flex;
          flex-wrap:wrap;
          justify-content:space-between;
          gap:16px;
          padding:18px 20px;
          border-radius:24px;
          background:linear-gradient(135deg, #fce7f3, #ede9fe);
          border:1px solid rgba(229,231,235,0.8);
          box-shadow:0 18px 40px rgba(15,23,42,0.06);
        }
        .bc-hero-left {
          min-width:260px;
        }
        .bc-hero-right {
          display:flex;
          gap:10px;
          align-items:flex-start;
        }
        .bc-stat-card {
          min-width:120px;
          border-radius:16px;
          padding:10px 12px;
          background:rgba(255,255,255,0.9);
          border:1px solid rgba(229,231,235,0.9);
          box-shadow:0 10px 20px rgba(15,23,42,0.05);
        }

        /* GENERIC SECTION CARD */
        .bc-card {
          border-radius:24px;
          background:#fdfcff;
          border:1px solid rgba(229,231,235,0.8);
          box-shadow:0 18px 40px rgba(15,23,42,0.04);
          padding:18px 20px 20px;
        }

        /* ADD NEW PIECES */
        .bc-add-row {
          display:flex;
          flex-wrap:wrap;
          align-items:flex-end;
          justify-content:space-between;
          gap:12px;
          margin-top:10px;
        }
        .bc-primary-btn {
          height:40px;
          padding:0 22px;
          border-radius:999px;
          border:none;
          background:#a855f7;
          color:#fff;
          font-size:14px;
          font-weight:600;
          cursor:pointer;
          box-shadow:0 14px 32px rgba(168,85,247,0.45);
          transition:transform .05s ease, box-shadow .15s ease, background .15s ease;
        }
        .bc-primary-btn:hover {
          background:#9333ea;
          box-shadow:0 16px 40px rgba(147,51,234,0.5);
          transform:translateY(-1px);
        }
        .bc-primary-btn:active {
          transform:translateY(1px);
          box-shadow:0 10px 24px rgba(147,51,234,0.4);
        }
        .bc-link-quiet {
          font-size:13px;
          color:#6b21a8;
          cursor:pointer;
          text-decoration:underline;
          text-underline-offset:2px;
          white-space:nowrap;
        }
        .bc-add-helper {
          margin-top:10px;
          font-size:12px;
          color:#6b7280;
        }

        /* CLOSET SECTION */
        .bc-closet-header {
          display:flex;
          flex-direction:column;
          gap:8px;
          margin-bottom:10px;
        }
        .bc-closet-filters {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
        }
        .bc-filter-select,
        .bc-filter-search {
          flex:1 1 150px;
          min-width:0;
          height:36px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          padding:0 12px;
          font-size:13px;
          color:#4b5563;
        }
        .bc-filter-search {
          display:flex;
          align-items:center;
        }
        .bc-filter-search input {
          border:none;
          outline:none;
          background:transparent;
          font-size:13px;
          width:100%;
          color:#4b5563;
        }
        .bc-filter-search span {
          margin-right:4px;
          font-size:13px;
          color:#9ca3af;
        }

        .bc-closet-top-row {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin:12px 0 8px;
          font-size:13px;
        }
        .bc-closet-count {
          color:#4b5563;
        }
        .bc-refresh-btn {
          height:30px;
          padding:0 12px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          font-size:11px;
          cursor:pointer;
        }

        .bc-closet-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));
          gap:14px;
        }

        /* ITEM CARD */
        .bc-item-card {
          border-radius:20px;
          background:#ffffff;
          border:1px solid rgba(229,231,235,0.95);
          box-shadow:0 12px 26px rgba(15,23,42,0.04);
          padding:10px 10px 12px;
          display:grid;
          grid-template-rows:auto auto 1fr auto;
          gap:6px;
        }
        .bc-item-thumb {
          border-radius:16px;
          background:linear-gradient(135deg,#e0f2fe,#fdf2ff);
          height:160px;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          font-size:12px;
          color:#9ca3af;
        }
        .bc-item-thumb img {
          width:100%;
          height:100%;
          object-fit:cover;
        }
        .bc-item-title-row {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:6px;
        }
        .bc-item-title {
          font-weight:600;
          font-size:13px;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }
        .bc-status-dot {
          font-size:9px;
          padding:2px 6px;
          border-radius:999px;
          background:#f3f4f6;
          color:#6b7280;
          text-transform:uppercase;
          letter-spacing:.12em;
        }
        .bc-item-category {
          display:inline-flex;
          align-items:center;
          padding:2px 9px;
          border-radius:999px;
          background:#fef3c7;
          color:#92400e;
          font-size:10px;
          text-transform:uppercase;
          letter-spacing:.12em;
          margin-top:2px;
        }
        .bc-item-story {
          font-size:11px;
          color:#4b5563;
          margin-top:4px;
        }
        .bc-item-vibes {
          margin-top:4px;
          display:flex;
          flex-wrap:wrap;
          gap:4px;
        }
        .bc-vibe-pill {
          padding:2px 8px;
          border-radius:999px;
          background:#eef2ff;
          color:#4338ca;
          font-size:10px;
        }
        .bc-item-btn {
          margin-top:8px;
          height:32px;
          border-radius:999px;
          border:none;
          background:#a855f7;
          color:#fff;
          font-size:12px;
          font-weight:600;
          cursor:pointer;
        }
        .bc-item-btn[disabled] {
          opacity:0.6;
          cursor:default;
        }

        /* Story inline editor */
        .bc-story-edit {
          margin-top:8px;
          padding-top:8px;
          border-top:1px dashed #e5e7eb;
          display:grid;
          gap:6px;
          font-size:12px;
        }
        .bc-story-edit label {
          display:block;
          font-size:10px;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:#9ca3af;
          margin-bottom:2px;
        }
        .bc-story-edit input {
          width:100%;
          padding:6px 8px;
          border-radius:8px;
          border:1px solid #e5e7eb;
          font-size:12px;
        }
        .bc-story-actions {
          display:flex;
          justify-content:flex-end;
          gap:6px;
          margin-top:4px;
        }
        .bc-story-btn {
          height:28px;
          padding:0 10px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-size:11px;
          cursor:pointer;
        }
        .bc-story-btn.primary {
          background:#111827;
          color:#fff;
          border-color:#111827;
        }

        /* EMPTY / ERROR */
        .bc-empty {
          padding:18px 10px;
          text-align:center;
          font-size:13px;
          color:#6b7280;
        }
        .bc-error {
          margin-top:4px;
          margin-bottom:2px;
          padding:10px 12px;
          border-radius:10px;
          border:1px solid #fecaca;
          background:#fee2e2;
          color:#991b1b;
          font-size:13px;
        }

        @media (max-width: 768px) {
          .bc-hero {
            padding:16px 14px;
          }
          .bc-card {
            padding:16px 14px 18px;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="bc-hero">
        <div className="bc-hero-left">
          <h1 className="bc-title-main">Your pieces, styled with Lala ✨</h1>
          <p className="bc-sub-main">
            Save real pieces from your wardrobe so I can pull looks, drops, and
            styling ideas just for you.
          </p>
        </div>
        <div className="bc-hero-right">
          <div className="bc-stat-card">
            <div className="bc-pill-stat-label">Pieces added</div>
            <div className="bc-pill-stat-value">{totalPieces}</div>
          </div>
          <div className="bc-stat-card">
            <div className="bc-pill-stat-label">Looks we&apos;ve styled</div>
            <div className="bc-pill-stat-value">{styledLooks}</div>
          </div>
        </div>
      </section>

      {err && (
        <div className="bc-error">
          <strong>Oops:</strong> {err}
        </div>
      )}

      {/* ADD NEW PIECES SECTION */}
      <section className="bc-card">
        <header>
          <h2 className="bc-section-title">Add new pieces</h2>
          <p className="bc-section-sub">
            Upload photos from your phone, name each piece, and add a quick note
            so I know how you love to wear it.
          </p>
        </header>

        <div className="bc-add-row">
          <button
            type="button"
            className="bc-primary-btn"
            onClick={() => (window.location.href = "/fan/closet")}
          >
            Add a new piece
          </button>
          <div
            className="bc-link-quiet"
            onClick={() => (window.location.href = "/fan/closet")}
          >
            View upload history
          </div>
        </div>

        <p className="bc-add-helper">
          We&apos;ll send you to the upload screen. Once your upload finishes,
          your pieces will appear in your closet below.
        </p>
      </section>

      {/* CLOSET SECTION */}
      <section className="bc-card">
        <div className="bc-closet-header">
          <div>
            <h2 className="bc-section-title">Your closet</h2>
            <p className="bc-section-sub">
              Filter by category or vibe tags to find pieces fast. Tap any item
              to add style notes.
            </p>
          </div>

          <div className="bc-closet-filters">
            <select
              className="bc-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="bc-filter-search">
              <span>🔍</span>
              <input
                placeholder="Search by piece name or notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bc-closet-top-row">
          <div className="bc-closet-count">
            {visibleItems.length > 0
              ? `Showing ${visibleItems.length} piece${
                  visibleItems.length === 1 ? "" : "s"
                }`
              : hasItems
              ? "No pieces match this filter"
              : "No pieces yet"}
          </div>
          <button type="button" className="bc-refresh-btn" onClick={loadCloset}>
            Refresh closet
          </button>
        </div>

        {/* CONTENT */}
        {loading && !hasItems && (
          <div className="bc-empty">Loading your closet…</div>
        )}

        {!loading && !hasItems && (
          <div className="bc-empty">
            Your closet is empty… for now 👀 <br />
            Start by adding 3–5 pieces you wear all the time. I&apos;ll use
            them to build your first looks.
          </div>
        )}

        {visibleItems.length > 0 && (
          <div className="bc-closet-grid">
            {visibleItems.map((item) => {
              const status = (item.status || "").toUpperCase();
              let statusLabel = "DRAFT";
              let statusClass = "bc-status-dot";

              if (status === "APPROVED" || status === "PUBLISHED") {
                statusLabel = "READY";
              } else if (status === "PENDING") {
                statusLabel = "PENDING";
              } else if (status === "REJECTED") {
                statusLabel = "REVIEW";
              }

              const categoryLabel =
                CATEGORY_OPTIONS.find((opt) => opt.value === item.category)
                  ?.label || "Other";

              const vibesArray = Array.isArray(item.storyVibes)
                ? item.storyVibes
                : [];

              const hasStory =
                item.storyTitle || item.storySeason || vibesArray.length > 0;

              return (
                <article key={item.id} className="bc-item-card">
                  <div className="bc-item-thumb">
                    {item.thumbUrl ? (
                      <img src={item.thumbUrl} alt={item.title || "Closet"} />
                    ) : (
                      "No preview yet"
                    )}
                  </div>

                  <div className="bc-item-title-row">
                    <div className="bc-item-title">
                      {item.title || "Untitled piece"}
                    </div>
                    <div className={statusClass}>{statusLabel}</div>
                  </div>

                  <div className="bc-item-category">{categoryLabel}</div>

                  <div className="bc-item-story">
                    {hasStory ? (
                      <>
                        <strong>
                          {item.storyTitle || "Style story"}
                        </strong>
                        {item.storySeason && (
                          <>
                            {" · "}
                            <span>{item.storySeason}</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        No style notes yet — tell me when you wear this or what
                        you&apos;re stuck styling.
                      </>
                    )}
                  </div>

                  {vibesArray.length > 0 && (
                    <div className="bc-item-vibes">
                      {vibesArray.slice(0, 4).map((v) => (
                        <span key={v} className="bc-vibe-pill">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="bc-item-btn"
                    onClick={() => beginStoryEdit(item)}
                    disabled={savingStory && editingId === item.id}
                  >
                    {editingId === item.id
                      ? savingStory
                        ? "Saving style notes…"
                        : "Editing style notes…"
                      : hasStory
                      ? "Edit style notes"
                      : "Add style notes"}
                  </button>

                  {editingId === item.id && (
                    <div className="bc-story-edit">
                      <div>
                        <label htmlFor={`story-title-${item.id}`}>
                          Story name
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
                          placeholder="e.g. Date-night blazer look"
                        />
                      </div>
                      <div>
                        <label htmlFor={`story-season-${item.id}`}>
                          When do you wear this?
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
                          placeholder="e.g. Fall / winter, holiday events"
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
                          placeholder="e.g. cozy, glam, neutral tones"
                        />
                      </div>
                      <div className="bc-story-actions">
                        <button
                          type="button"
                          className="bc-story-btn"
                          onClick={cancelStoryEdit}
                          disabled={savingStory}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="bc-story-btn primary"
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
  );
}
