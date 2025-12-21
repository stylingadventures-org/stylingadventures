// site/src/routes/bestie/BestieCloset.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import { signedUpload } from "../../lib/sa";
import { getThumbUrlForMediaKey } from "../../lib/thumbs";

/**
 * GraphQL operations for Bestie Closet backend.
 */
const GQL = {
  list: /* GraphQL */ `
    query BestieClosetItems($limit: Int, $nextToken: String) {
      bestieClosetItems(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          mediaKey
          rawMediaKey
          category
          subcategory
          colorTags
          season
          notes
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  `,
  create: /* GraphQL */ `
    mutation BestieCreateClosetItem($input: BestieCreateClosetItemInput!) {
      bestieCreateClosetItem(input: $input) {
        id
        title
        mediaKey
        rawMediaKey
        category
        subcategory
        colorTags
        season
        notes
        createdAt
        updatedAt
      }
    }
  `,
  update: /* GraphQL */ `
    mutation BestieUpdateClosetItem($id: ID!, $input: BestieUpdateClosetItemInput!) {
      bestieUpdateClosetItem(id: $id, input: $input) {
        id
        title
        mediaKey
        rawMediaKey
        category
        subcategory
        colorTags
        season
        notes
        createdAt
        updatedAt
      }
    }
  `,
  delete: /* GraphQL */ `
    mutation BestieDeleteClosetItem($id: ID!) {
      bestieDeleteClosetItem(id: $id) {
        id
      }
    }
  `,
  analytics: /* GraphQL */ `
    mutation LogGameEvent($input: LogGameEventInput!) {
      logGameEvent(input: $input) {
        success
      }
    }
  `,
};

const CATEGORY_OPTIONS = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Outerwear",
  "Sets",
  "Shoes",
  "Bags",
  "Jewelry",
  "Accessories",
  "Beauty",
];

const SUBCATEGORY_OPTIONS = [
  "Basics",
  "Blazer",
  "Button-up",
  "T-shirt",
  "Tank",
  "Sweater",
  "Cardigan",
  "Jeans",
  "Trousers",
  "Shorts",
  "Skirt",
  "Mini skirt",
  "Midi skirt",
  "Maxi skirt",
  "Mini dress",
  "Midi dress",
  "Maxi dress",
  "Heels",
  "Flats",
  "Sneakers",
  "Boots",
  "Crossbody bag",
  "Shoulder bag",
  "Tote bag",
  "Backpack",
  "Jewelry",
  "Accessory",
];

const SEASON_OPTIONS = ["All seasons", "Spring", "Summer", "Fall", "Winter"];

const VISIBILITY_OPTIONS = [
  { value: "ALL", label: "All pieces" },
  { value: "PRIVATE", label: "Private only" },
  { value: "BESTIE", label: "Bestie-only" },
  { value: "PUBLIC", label: "Public on profile" },
];

function normaliseVisibility(v) {
  const raw = (v || "PRIVATE").toUpperCase();
  if (raw === "BESTIE" || raw === "BESTIES_ONLY") return "BESTIE";
  if (raw === "PUBLIC") return "PUBLIC";
  return "PRIVATE";
}

function prettyDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * Light analytics helper – best-effort, non-blocking.
 * Uses existing logGameEvent mutation.
 */
async function trackClosetEvent(type, metadata) {
  try {
    if (window.sa?.ready) {
      await window.sa.ready();
    }
    if (!window.sa?.graphql) return;
    await window.sa.graphql(GQL.analytics, {
      input: {
        type,
        metadata: metadata || {},
      },
    });
  } catch {
    // best-effort only – ignore errors
  }
}

export default function BestieCloset() {
  const [searchParams, setSearchParams] = useSearchParams();
  const client = useApolloClient();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filterText, setFilterText] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("ALL");
  const [filterSeason, setFilterSeason] = useState("All seasons");
  const [sortMode, setSortMode] = useState("UPDATED_DESC"); // UPDATED_DESC | CREATED_DESC | TITLE
  const [filterCategory, setFilterCategory] = useState("ALL");

  // upload form state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadSubcategory, setUploadSubcategory] = useState("");
  const [uploadColors, setUploadColors] = useState("");
  const [uploadSeason, setUploadSeason] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState("PRIVATE");
  const [uploadBusy, setUploadBusy] = useState(false);
  const uploadFileInputRef = useRef(null);

  // editor state for an existing item
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // simple “outfit rack” – selected piece IDs
  const [selectedIds, setSelectedIds] = useState([]);

  // optional deep-link: ?highlight=<id>
  const highlightId = searchParams.get("highlight") || null;

  // ---- load closet from backend ---------------------------------

  async function loadCloset({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
      setErr("");
    }
    try {
      let nextToken = null;
      const collected = [];

      // simple pagination loop
      do {
        const res = await client.query({
          query: gql`
            query BestieClosetItems($limit: Int, $nextToken: String) {
              bestieClosetItems(limit: $limit, nextToken: $nextToken) {
                items {
                  id
                  title
                  mediaKey
                  rawMediaKey
                  category
                  subcategory
                  colorTags
                  season
                  notes
                  visibility
                  createdAt
                  updatedAt
                }
                nextToken
              }
            }
          `,
          variables: {
            limit: 50,
            nextToken,
          },
        });
        const page = res?.data?.bestieClosetItems;
        const pageItems = page?.items || [];
        collected.push(...pageItems);
        nextToken = page?.nextToken || null;
      } while (nextToken);

      // hydrate thumbs
      const hydrated = await Promise.all(
        collected.map(async (it) => {
          const key = it.mediaKey || it.rawMediaKey;
          if (!key) return it;
          try {
            const url = await getThumbUrlForMediaKey(key);
            return { ...it, thumbUrl: url || null };
          } catch (e) {
            console.warn("[BestieCloset] thumb fetch failed", e);
            return it;
          }
        }),
      );

      hydrated.sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });

      setItems(hydrated);

      // keep editor in sync if open
      if (editing) {
        const fresh = hydrated.find((x) => x.id === editing.id);
        setEditing(fresh || null);
        if (fresh) {
          setEditDraft({
            title: fresh.title || "",
            category: fresh.category || "",
            subcategory: fresh.subcategory || "",
            colorTags: (fresh.colorTags || []).join(", "),
            season: fresh.season || "",
            notes: fresh.notes || "",
            visibility: normaliseVisibility(fresh.visibility),
          });
        }
      }
    } catch (e) {
      console.error("[BestieCloset] load error", e);
      setErr(e?.message || "Failed to load your closet.");
    } finally {
      if (!silent) setLoading(false);
      setBusyId(null);
    }
  }

  useEffect(() => {
    if (client) {
      loadCloset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // ---- filtered / sorted items -----------------------------------

  const filteredItems = useMemo(() => {
    let list = items.slice();

    if (filterVisibility !== "ALL") {
      list = list.filter(
        (it) => normaliseVisibility(it.visibility) === filterVisibility,
      );
    }

    if (filterSeason !== "All seasons") {
      list = list.filter((it) => (it.season || "") === filterSeason);
    }

    if (filterCategory !== "ALL") {
      list = list.filter((it) => (it.category || "") === filterCategory);
    }

    const q = filterText.trim().toLowerCase();
    if (q) {
      list = list.filter((it) => {
        const hay = [
          it.title || "",
          it.category || "",
          it.subcategory || "",
          (it.notes || "").toString(),
          ...(it.colorTags || []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortMode === "TITLE") {
        return (a.title || "").localeCompare(b.title || "");
      }
      const getTime = (x) =>
        new Date(
          sortMode === "CREATED_DESC"
            ? x.createdAt || 0
            : x.updatedAt || x.createdAt || 0,
        ).getTime();
      return getTime(b) - getTime(a);
    });

    return list;
  }, [
    items,
    filterText,
    filterVisibility,
    filterSeason,
    sortMode,
    filterCategory,
  ]);

  // ---- mood-board stats / helpers --------------------------------

  const totalCount = filteredItems.length;

  const recentShowcase = filteredItems.slice(0, 3);

  const topColors = useMemo(() => {
    const all = [];
    items.forEach((it) => {
      (it.colorTags || []).forEach((c) => all.push(c.toLowerCase()));
    });
    const counts = new Map();
    all.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [items]);

  const publicCount = items.filter(
    (it) => normaliseVisibility(it.visibility) === "PUBLIC",
  ).length;

  // ---- upload flow ------------------------------------------------

  function resetUploadForm() {
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadFile(null);
    setUploadPreviewUrl(null);
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
    setUploadTitle("");
    setUploadCategory("");
    setUploadSubcategory("");
    setUploadColors("");
    setUploadSeason("");
    setUploadNotes("");
    setUploadVisibility("PRIVATE");
    setUploadBusy(false);
  }

  function handleUploadFileChange(e) {
    const file = e.target.files?.[0] || null;
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadPreviewUrl(url);
    } else {
      setUploadPreviewUrl(null);
    }
  }

  function handleRemoveUploadPhoto() {
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl);
    }
    setUploadPreviewUrl(null);
    setUploadFile(null);
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadFile) {
      alert("Pick a photo of your piece first.");
      return;
    }
    if (!uploadCategory) {
      alert("Choose a category so we can help you find this piece later.");
      return;
    }

    try {
      setUploadBusy(true);
      setErr("");

      if (window.sa?.ready) {
        await window.sa.ready();
      }

      // 1) Put the file into S3 via signedUpload
      const up = await signedUpload(uploadFile, {
        keyHint: "bestie-closet",
        kind: "bestie-closet",
      });

      // 2) Create the Bestie closet item via GraphQL
      const input = {
        title: uploadTitle || uploadFile.name,
        rawMediaKey: up.key,
        category: uploadCategory || null,
        subcategory: uploadSubcategory || null,
        colorTags: uploadColors
          ? uploadColors
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
        season: uploadSeason || null,
        notes: uploadNotes || null,
        visibility: normaliseVisibility(uploadVisibility),
      };

      const res = await window.sa.graphql(GQL.create, { input });
      const created = res?.bestieCreateClosetItem;
      if (!created) {
        throw new Error("Upload succeeded but closet item was not created.");
      }

      // optimistic prepend + thumb hydrate
      let thumbUrl = null;
      const key = created.mediaKey || created.rawMediaKey;
      if (key) {
        try {
          thumbUrl = await getThumbUrlForMediaKey(key);
        } catch {
          // ignore
        }
      }

      const nextItem = { ...created, thumbUrl };
      setItems((prev) => [nextItem, ...prev]);
      setUploadOpen(false);
      resetUploadForm();

      trackClosetEvent("BESTIE_CLOSET_UPLOAD", {
        itemId: created.id,
        category: created.category,
        subcategory: created.subcategory,
        season: created.season,
        visibility: normaliseVisibility(created.visibility),
      });
    } catch (e) {
      console.error("[BestieCloset] upload error", e);
      setErr(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploadBusy(false);
    }
  }

  // ---- edit / delete ----------------------------------------------

  function openEditor(item) {
    setEditing(item);
    setEditDraft({
      title: item.title || "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      colorTags: (item.colorTags || []).join(", "),
      season: item.season || "",
      notes: item.notes || "",
      visibility: normaliseVisibility(item.visibility),
    });
  }

  function closeEditor() {
    setEditing(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editing || !editDraft) return;

    const input = {
      title: editDraft.title || null,
      category: editDraft.category || null,
      subcategory: editDraft.subcategory || null,
      colorTags: editDraft.colorTags
        ? editDraft.colorTags
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      season: editDraft.season || null,
      notes: editDraft.notes || null,
      visibility: normaliseVisibility(editDraft.visibility),
    };

    try {
      setBusyId(editing.id);
      const res = await window.sa.graphql(GQL.update, {
        id: editing.id,
        input,
      });
      const updated = res?.bestieUpdateClosetItem || {
        ...editing,
        ...input,
      };

      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)),
      );
      closeEditor();

      trackClosetEvent("BESTIE_CLOSET_EDIT", {
        itemId: updated.id,
        category: updated.category,
        subcategory: updated.subcategory,
        season: updated.season,
        visibility: normaliseVisibility(updated.visibility),
      });
    } catch (e) {
      console.error("[BestieCloset] save error", e);
      alert(e?.message || "Failed to save changes.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm("Delete this piece from your closet?")) return;

    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.delete, { id: item.id });
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      if (editing && editing.id === item.id) {
        closeEditor();
      }

      trackClosetEvent("BESTIE_CLOSET_DELETE", {
        itemId: item.id,
        category: item.category,
        subcategory: item.subcategory,
      });
    } catch (e) {
      console.error("[BestieCloset] delete error", e);
      alert(e?.message || "Failed to delete item.");
    } finally {
      setBusyId(null);
    }
  }

  // ---- outfit rack / selection -----------------------------------

  function toggleSelected(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearOutfit() {
    setSelectedIds([]);
  }

  function sendOutfitToContent() {
    if (!selectedIds.length) return;
    const qs = `closetIds=${selectedIds.map(encodeURIComponent).join(",")}`;
    trackClosetEvent("BESTIE_CLOSET_OUTFIT_SEND", {
      itemIds: selectedIds,
      count: selectedIds.length,
    });
    window.location.assign(`/bestie/content?${qs}`);
  }

  // ---- link single piece to content builder ----------------------

  function openInContent(item) {
    setSearchParams({ closetId: item.id });
    trackClosetEvent("BESTIE_CLOSET_USE_IN_CONTENT", {
      itemId: item.id,
      category: item.category,
      subcategory: item.subcategory,
    });
    window.location.assign(
      `/bestie/content?closetId=${encodeURIComponent(item.id)}`,
    );
  }

  const selectedCount = selectedIds.length;
  const selectedLabel =
    selectedCount === 1
      ? "1 piece in outfit rack"
      : `${selectedCount} pieces in outfit rack`;

  return (
    <div className="bestie-closet-page">
      {/* HERO – digital closet mood board */}
      <header className="bc-mood-hero">
        <div className="bc-mood-hero-inner">
          <div className="bc-mood-hero-left">
            <div className="bc-mood-pill">Bestie closet</div>
            <h1 className="bc-mood-title">
              Your digital closet paradise 🧺✨
            </h1>
            <p className="bc-mood-sub">
              Capture the pieces you actually own, mix and match outfits, and
              turn your wardrobe into a living mood board for content, style,
              and every Bestie era.
            </p>

            <div className="bc-mood-actions">
  <button
    type="button"
    className="bc-btn bc-btn-primary"
    onClick={() => setUploadOpen(true)}
  >
    + Add a new piece
  </button>
  <Link to="/bestie/content" className="bc-btn bc-btn-ghost">
    Plan outfits & Bestie stories →
  </Link>
</div>


            <div className="bc-mood-stats">
              <div className="bc-mood-stat">
                <div className="bc-mood-stat-label">Pieces saved</div>
                <div className="bc-mood-stat-value">{totalCount}</div>
              </div>
              <div className="bc-mood-stat">
                <div className="bc-mood-stat-label">Public on profile</div>
                <div className="bc-mood-stat-value">{publicCount}</div>
              </div>
              <div className="bc-mood-stat">
                <div className="bc-mood-stat-label">Closet colors</div>
                <div className="bc-mood-color-row">
                  {topColors.length === 0 && (
                    <span className="bc-mood-tag">TBD</span>
                  )}
                  {topColors.map((c) => (
                    <span key={c} className="bc-mood-color-chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mood board preview column */}
          <div className="bc-mood-board">
            <div className="bc-mood-board-header">
              <span className="bc-mood-board-label">Today&apos;s board</span>
              <span className="bc-mood-board-sub">
                Latest pieces you&apos;ve added
              </span>
            </div>

            <div className="bc-mood-board-grid">
              {recentShowcase.length === 0 && (
                <div className="bc-mood-board-empty">
                  <span role="img" aria-label="empty closet">
                    🧺
                  </span>
                  <p>Start your board by adding your first piece.</p>
                </div>
              )}

              {recentShowcase.map((it, idx) => (
                <article
                  key={it.id}
                  className={`bc-mood-card bc-mood-card--${idx}`}
                >
                  <div className="bc-mood-card-thumbWrap">
                    {it.thumbUrl ? (
                      <img
                        src={it.thumbUrl}
                        alt={it.title || "Closet piece"}
                        className="bc-mood-card-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <div className="bc-mood-card-thumb bc-mood-card-thumb--empty">
                        Photo coming soon…
                      </div>
                    )}
                  </div>
                  <div className="bc-mood-card-meta">
                    <div className="bc-mood-card-title">
                      {it.title || "Untitled piece"}
                    </div>
                    <div className="bc-mood-card-tags">
                      {it.category && <span>{it.category}</span>}
                      {it.subcategory && <span>{it.subcategory}</span>}
                      {it.season && <span>{it.season}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="bc-mood-board-footer">
              <span className="bc-mood-chip">
                ✨ Send any piece into Bestie content to storyboard reels &amp;
                carousels.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN – filters + closet grid */}
      <main className="bc-main">
        {err && (
          <div className="bc-notice bc-notice--error">
            <strong>Oops:</strong> {err}
          </div>
        )}
        {loading && (
          <div className="bc-loading">Loading your closet pieces…</div>
        )}

        <section className="bc-shell">
          {/* Toolbar row */}
          <header className="bc-shell-header">
            <div>
              <h2 className="bc-shell-title">Your closet library</h2>
              <p className="bc-shell-sub">
                Search, filter, and pull pieces into outfits or content. This is
                your HQ for every fit you love.
              </p>
            </div>
            <div className="bc-shell-header-actions">
              <button
                type="button"
                className="bc-btn bc-btn-ghost"
                onClick={() => loadCloset({ silent: false })}
                disabled={loading}
              >
                {loading ? "Refreshing…" : "Refresh closet"}
              </button>
            </div>
          </header>

          {/* Outfit rack */}
          {selectedCount > 0 && (
            <div className="bc-outfit-rack">
              <div className="bc-outfit-rack-left">
                <span className="bc-outfit-label">Outfit rack</span>
                <span className="bc-outfit-count">{selectedLabel}</span>
              </div>
              <div className="bc-outfit-rack-actions">
                <button
                  type="button"
                  className="bc-btn bc-btn-primary bc-btn-sm"
                  onClick={sendOutfitToContent}
                >
                  Send outfit to Bestie content
                </button>
                <button
                  type="button"
                  className="bc-btn bc-btn-ghost bc-btn-sm"
                  onClick={clearOutfit}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Filters + search */}
          <div className="bc-filters">
            <div className="bc-filters-main">
              <div className="bc-search-wrap">
                <input
                  className="bc-input bc-input--search"
                  placeholder="Search by title, color, category, or note…"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>

              <div className="bc-filter-pills">
                <button
                  type="button"
                  className={
                    "bc-filter-pill" +
                    (filterCategory === "ALL" ? " bc-filter-pill--on" : "")
                  }
                  onClick={() => setFilterCategory("ALL")}
                >
                  All
                </button>
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={
                      "bc-filter-pill" +
                      (filterCategory === c ? " bc-filter-pill--on" : "")
                    }
                    onClick={() => setFilterCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="bc-filters-side">
              <select
                className="bc-input"
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
              >
                {VISIBILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                className="bc-input"
                value={filterSeason}
                onChange={(e) => setFilterSeason(e.target.value)}
              >
                {SEASON_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                className="bc-input"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
              >
                <option value="UPDATED_DESC">Recently worn / updated</option>
                <option value="CREATED_DESC">Newest added</option>
                <option value="TITLE">A → Z</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredItems.length === 0 && !loading && (
            <div className="bc-empty">
              <span role="img" aria-label="empty closet">
                🧺
              </span>{" "}
              No pieces match that filter yet. Try clearing search or upload a
              new item.
            </div>
          )}

          {filteredItems.length > 0 && (
            <div className="bc-grid">
              {filteredItems.map((it) => {
                const isBusy = busyId === it.id;
                const visibility = normaliseVisibility(it.visibility);
                const highlighted = highlightId && highlightId === it.id;
                const selected = selectedIds.includes(it.id);

                return (
                  <article
                    key={it.id}
                    className={
                      "bc-card" +
                      (highlighted ? " bc-card--highlight" : "") +
                      (selected ? " bc-card--selected" : "")
                    }
                  >
                    <div className="bc-card-thumbWrap">
                      {it.thumbUrl ? (
                        <img
                          src={it.thumbUrl}
                          alt={it.title || "Closet piece"}
                          className="bc-card-thumb"
                          loading="lazy"
                        />
                      ) : (
                        <div className="bc-card-thumb bc-card-thumb--empty">
                          Photo processing…
                        </div>
                      )}

                      <span className="bc-chip bc-chip--visibility">
                        {visibility === "PUBLIC"
                          ? "Public"
                          : visibility === "BESTIE"
                          ? "Bestie-only"
                          : "Private"}
                      </span>
                      <button
                        type="button"
                        className={
                          "bc-select-chip" +
                          (selected ? " bc-select-chip--on" : "")
                        }
                        onClick={() => toggleSelected(it.id)}
                      >
                        {selected ? "In outfit" : "Add to outfit"}
                      </button>
                    </div>

                    <div className="bc-card-body">
                      <div className="bc-card-titleRow">
                        <h3 className="bc-card-title">
                          {it.title || "Untitled piece"}
                        </h3>
                      </div>

                      <div className="bc-card-tags">
                        {it.category && (
                          <span className="bc-tag">{it.category}</span>
                        )}
                        {it.subcategory && (
                          <span className="bc-tag bc-tag--soft">
                            {it.subcategory}
                          </span>
                        )}
                        {it.season && (
                          <span className="bc-tag bc-tag--soft">
                            {it.season}
                          </span>
                        )}
                        {(it.colorTags || []).slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="bc-tag bc-tag--color bc-tag--soft"
                          >
                            {c}
                          </span>
                        ))}
                        {it.colorTags && it.colorTags.length > 3 && (
                          <span className="bc-tag bc-tag--soft">
                            +{it.colorTags.length - 3}
                          </span>
                        )}
                      </div>

                      {it.notes && (
                        <p className="bc-card-notes">
                          {String(it.notes).slice(0, 110)}
                          {String(it.notes).length > 110 ? "…" : ""}
                        </p>
                      )}

                      <div className="bc-card-footer">
                        <span className="bc-card-date">
                          Added {prettyDate(it.createdAt)}
                        </span>
                        <div className="bc-card-actions">
                          <button
                            type="button"
                            className="bc-link"
                            onClick={() => openEditor(it)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="bc-link"
                            onClick={() => openInContent(it)}
                          >
                            Use in content
                          </button>
                          <button
                            type="button"
                            className="bc-link bc-link--danger"
                            disabled={isBusy}
                            onClick={() => deleteItem(it)}
                          >
                            {isBusy ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Upload drawer / modal */}
      {uploadOpen && (
        <div
          className="bc-drawer-backdrop"
          onClick={() => {
            if (!uploadBusy) {
              setUploadOpen(false);
              resetUploadForm();
            }
          }}
        >
          <aside className="bc-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="bc-drawer-close"
              onClick={() => {
                if (!uploadBusy) {
                  setUploadOpen(false);
                  resetUploadForm();
                }
              }}
            >
              ✕
            </button>

            <h2 className="bc-drawer-title">Add a new closet piece</h2>
            <p className="bc-drawer-sub">
              Upload a clear photo on a plain background if you can. You can
              always edit tags, notes, and visibility later.
            </p>

            <form className="bc-drawer-form" onSubmit={handleUploadSubmit}>
              <div className="bc-field">
                <label className="bc-label">Photo</label>
                <input
                  ref={uploadFileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploadBusy}
                  onChange={handleUploadFileChange}
                />
                {uploadPreviewUrl && (
                  <div className="bc-upload-preview">
                    <div className="bc-upload-preview-thumbWrap">
                      <img
                        src={uploadPreviewUrl}
                        alt={uploadTitle || "Closet piece preview"}
                      />
                    </div>
                    <div className="bc-upload-preview-meta">
                      <div className="bc-upload-preview-title">
                        {uploadTitle || uploadFile?.name || "Untitled piece"}
                      </div>
                      <div className="bc-upload-preview-tags">
                        {uploadCategory && (
                          <span className="bc-tag">{uploadCategory}</span>
                        )}
                        {uploadSubcategory && (
                          <span className="bc-tag bc-tag--soft">
                            {uploadSubcategory}
                          </span>
                        )}
                        {uploadVisibility && (
                          <span className="bc-tag bc-tag--soft">
                            {normaliseVisibility(uploadVisibility) === "PUBLIC"
                              ? "Public"
                              : normaliseVisibility(uploadVisibility) ===
                                "BESTIE"
                              ? "Bestie-only"
                              : "Private"}
                          </span>
                        )}
                        {uploadColors &&
                          uploadColors
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((c) => (
                              <span
                                key={c}
                                className="bc-tag bc-tag--color bc-tag--soft"
                              >
                                {c}
                              </span>
                            ))}
                      </div>
                      <button
                        type="button"
                        className="bc-btn bc-btn-ghost bc-btn-sm bc-upload-preview-clear"
                        onClick={handleRemoveUploadPhoto}
                        disabled={uploadBusy}
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bc-field">
                <label className="bc-label">Title / nickname</label>
                <input
                  className="bc-input"
                  placeholder="e.g. Pink satin mini skirt"
                  value={uploadTitle}
                  disabled={uploadBusy}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              <div className="bc-field-row">
                <div className="bc-field">
                  <label className="bc-label">Category *</label>
                  <select
                    className="bc-input"
                    value={uploadCategory}
                    disabled={uploadBusy}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    <option value="">Select a category…</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bc-field">
                  <label className="bc-label">Sub-category</label>
                  <select
                    className="bc-input"
                    value={uploadSubcategory}
                    disabled={uploadBusy}
                    onChange={(e) => setUploadSubcategory(e.target.value)}
                  >
                    <option value="">Select a sub-category…</option>
                    {SUBCATEGORY_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bc-field-row">
                <div className="bc-field">
                  <label className="bc-label">Season (optional)</label>
                  <select
                    className="bc-input"
                    value={uploadSeason}
                    disabled={uploadBusy}
                    onChange={(e) => setUploadSeason(e.target.value)}
                  >
                    <option value="">All seasons</option>
                    {SEASON_OPTIONS.filter((s) => s !== "All seasons").map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div className="bc-field">
                <label className="bc-label">Color tags</label>
                <input
                  className="bc-input"
                  placeholder="pink, black, metallic, denim…"
                  value={uploadColors}
                  disabled={uploadBusy}
                  onChange={(e) => setUploadColors(e.target.value)}
                />
                <div className="bc-help">
                  Separate with commas – we&apos;ll use this for search.
                </div>
              </div>

              <div className="bc-field">
                <label className="bc-label">Notes / story</label>
                <textarea
                  className="bc-input bc-input--textarea"
                  rows={3}
                  placeholder="Where do you usually wear this? Any styling ideas you want to remember?"
                  value={uploadNotes}
                  disabled={uploadBusy}
                  onChange={(e) => setUploadNotes(e.target.value)}
                />
              </div>

              <div className="bc-field">
                <label className="bc-label">Visibility</label>
                <select
                  className="bc-input"
                  value={uploadVisibility}
                  disabled={uploadBusy}
                  onChange={(e) => setUploadVisibility(e.target.value)}
                >
                  <option value="PRIVATE">Private (only me)</option>
                  <option value="BESTIE">
                    Bestie-only (Lala + Bestie content)
                  </option>
                  <option value="PUBLIC">Public on my profile</option>
                </select>
                <div className="bc-help">
                  You can change this anytime from the closet grid.
                </div>
              </div>

              <div className="bc-drawer-actions">
                <button
                  type="submit"
                  className="bc-btn bc-btn-primary"
                  disabled={uploadBusy}
                >
                  {uploadBusy ? "Uploading…" : "Save to my closet"}
                </button>
                <button
                  type="button"
                  className="bc-btn bc-btn-ghost"
                  disabled={uploadBusy}
                  onClick={() => {
                    setUploadOpen(false);
                    resetUploadForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* Edit drawer */}
      {editing && editDraft && (
        <div className="bc-drawer-backdrop" onClick={closeEditor}>
          <aside className="bc-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="bc-drawer-close"
              onClick={closeEditor}
            >
              ✕
            </button>

            <h2 className="bc-drawer-title">Edit closet piece</h2>

            <div className="bc-field">
              <label className="bc-label">Title / nickname</label>
              <input
                className="bc-input"
                value={editDraft.title}
                onChange={(e) =>
                  setEditDraft((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="bc-field-row">
              <div className="bc-field">
                <label className="bc-label">Category</label>
                <select
                  className="bc-input"
                  value={editDraft.category}
                  onChange={(e) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">Uncategorized</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bc-field">
                <label className="bc-label">Sub-category</label>
                <select
                  className="bc-input"
                  value={editDraft.subcategory}
                  onChange={(e) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      subcategory: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {editDraft.subcategory
                      ? `Keep as "${editDraft.subcategory}"`
                      : "Select a sub-category…"}
                  </option>
                  {SUBCATEGORY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bc-field-row">
              <div className="bc-field">
                <label className="bc-label">Season (optional)</label>
                <select
                  className="bc-input"
                  value={editDraft.season}
                  onChange={(e) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      season: e.target.value,
                    }))
                  }
                >
                  <option value="">All seasons</option>
                  {SEASON_OPTIONS.filter((s) => s !== "All seasons").map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="bc-field">
              <label className="bc-label">Color tags</label>
              <input
                className="bc-input"
                value={editDraft.colorTags}
                onChange={(e) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    colorTags: e.target.value,
                  }))
                }
              />
            </div>

            <div className="bc-field">
              <label className="bc-label">Notes / story</label>
              <textarea
                className="bc-input bc-input--textarea"
                rows={3}
                value={editDraft.notes}
                onChange={(e) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="bc-field">
              <label className="bc-label">Visibility</label>
              <select
                className="bc-input"
                value={editDraft.visibility}
                onChange={(e) =>
                  setEditDraft((prev) => ({
                    ...prev,
                    visibility: e.target.value,
                  }))
                }
              >
                <option value="PRIVATE">Private (only me)</option>
                <option value="BESTIE">Bestie-only</option>
                <option value="PUBLIC">Public on my profile</option>
              </select>
            </div>

            <div className="bc-drawer-actions">
              <button
                type="button"
                className="bc-btn bc-btn-primary"
                disabled={busyId === editing.id}
                onClick={saveEdit}
              >
                {busyId === editing.id ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="bc-btn bc-btn-ghost"
                onClick={closeEditor}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.bestie-closet-page {
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* === HERO / MOOD BOARD ================================================== */

.bc-mood-hero {
  border-radius:24px;
  padding:18px 20px 20px;
  background:
    radial-gradient(circle at top left,#fce7f3 0,#ede9fe 35%,#e0f2fe 80%),
    linear-gradient(135deg,#fdf2ff,#e0f2fe);
  box-shadow:0 20px 50px rgba(244,114,182,0.32);
}

.bc-mood-hero-inner {
  display:grid;
  grid-template-columns:minmax(0,1.7fr) minmax(0,1.3fr);
  gap:20px;
  align-items:stretch;
}

.bc-mood-hero-left {
  display:flex;
  flex-direction:column;
  gap:12px;
}

.bc-mood-pill {
  display:inline-flex;
  align-items:center;
  padding:4px 11px;
  border-radius:999px;
  font-size:0.68rem;
  letter-spacing:0.16em;
  text-transform:uppercase;
  background:rgba(236,72,153,0.1);
  color:#be185d;
  border:1px solid rgba(244,114,182,0.5);
  box-shadow:0 8px 24px rgba(236,72,153,0.35);
}

.bc-mood-title {
  margin:2px 0 0;
  font-size:1.7rem;
  letter-spacing:-0.02em;
  color:#111827;
}

.bc-mood-sub {
  margin:4px 0 0;
  font-size:0.96rem;
  color:#4b5563;
}

.bc-mood-actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:4px;
}

.bc-mood-stats {
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:10px;
}

.bc-mood-stat {
  background:rgba(255,255,255,0.98);
  border-radius:16px;
  padding:9px 11px;
  border:1px solid rgba(252,231,243,0.9);
  box-shadow:0 12px 26px rgba(244,114,182,0.28);
}

.bc-mood-stat-label {
  font-size:0.75rem;
  color:#9f1239;
}

.bc-mood-stat-value {
  margin-top:2px;
  font-size:1.15rem;
  font-weight:700;
  color:#111827;
}

/* Mood board – now pastel + bright */

.bc-mood-board {
  background:
    radial-gradient(circle at top,#fef9c3,#ffedd5),
    linear-gradient(135deg,#fee2e2,#fce7f3);
  color:#7c2d12;
  border-radius:20px;
  padding:11px 12px 12px;
  border:1px solid rgba(251,191,36,0.7);
  box-shadow:0 18px 40px rgba(251,146,60,0.45);
  display:flex;
  flex-direction:column;
  gap:8px;
}

.bc-mood-board-header {
  display:flex;
  flex-direction:column;
  gap:2px;
}

.bc-mood-board-label {
  font-size:0.75rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:#b45309;
}

.bc-mood-board-sub {
  font-size:0.86rem;
  color:#7c2d12;
}

.bc-mood-board-grid {
  margin-top:6px;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:6px;
}

.bc-mood-board-empty {
  grid-column:1 / -1;
  border-radius:14px;
  padding:12px;
  border:1px dashed rgba(248,113,113,0.6);
  background:rgba(255,255,255,0.9);
  text-align:center;
  font-size:0.86rem;
  color:#7f1d1d;
}

.bc-mood-card {
  border-radius:16px;
  overflow:hidden;
  position:relative;
  background:radial-gradient(circle at top,#f9a8d4,#fb7185);
  box-shadow:0 14px 30px rgba(244,114,182,0.6);
  display:flex;
  flex-direction:column;
  min-height:110px;
}

.bc-mood-card-thumbWrap {
  flex:1 1 auto;
}

.bc-mood-card-thumb {
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.bc-mood-card-thumb--empty {
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#fee2e2;
  padding:10px;
}

.bc-mood-card-meta {
  padding:6px 7px 7px;
  background:linear-gradient(to top,rgba(30,64,175,0.95),rgba(59,130,246,0.7));
}

.bc-mood-card-title {
  font-size:0.8rem;
  font-weight:600;
  color:#eff6ff;
}

.bc-mood-card-tags {
  margin-top:2px;
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  font-size:0.7rem;
  color:#bfdbfe;
}

.bc-mood-board-footer {
  margin-top:6px;
}

.bc-mood-chip {
  display:inline-flex;
  align-items:center;
  padding:4px 8px;
  border-radius:999px;
  font-size:0.78rem;
  background:rgba(255,255,255,0.96);
  border:1px solid rgba(244,114,182,0.6);
  color:#9d174d;
  box-shadow:0 8px 18px rgba(244,114,182,0.4);
}

.bc-mood-color-row {
  margin-top:4px;
  display:flex;
  flex-wrap:wrap;
  gap:4px;
}

.bc-mood-tag,
.bc-mood-color-chip {
  border-radius:999px;
  padding:2px 8px;
  font-size:0.72rem;
  background:#fdf2ff;
  color:#581c87;
  border:1px solid #e9d5ff;
}

/* === MAIN SHELL =================================================== */

.bc-main {
  margin-top:4px;
}

.bc-shell {
  background:#ffffff;
  border-radius:22px;
  border:1px solid #e5e7eb;
  padding:14px 14px 16px;
  box-shadow:0 14px 32px rgba(148,163,184,0.18);
}

.bc-shell-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  margin-bottom:10px;
  flex-wrap:wrap;
}

.bc-shell-title {
  margin:0;
  font-size:1.14rem;
}

.bc-shell-sub {
  margin:4px 0 0;
  font-size:0.86rem;
  color:#6b7280;
}

.bc-shell-header-actions {
  display:flex;
  gap:8px;
}

/* Outfit rack */

.bc-outfit-rack {
  margin-bottom:10px;
  margin-top:4px;
  border-radius:14px;
  border:1px solid #ffe4e6;
  background:#fff1f2;
  padding:7px 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.bc-outfit-rack-left {
  display:flex;
  align-items:baseline;
  gap:8px;
  flex-wrap:wrap;
}

.bc-outfit-label {
  font-size:0.8rem;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#be123c;
}

.bc-outfit-count {
  font-size:0.86rem;
  color:#4b5563;
}

.bc-outfit-rack-actions {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

/* Filters */

.bc-filters {
  margin-top:4px;
  margin-bottom:8px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  align-items:flex-start;
}

.bc-filters-main {
  flex:1 1 260px;
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:5px;
}

.bc-search-wrap {
  width:100%;
}

.bc-filter-pills {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.bc-filters-side {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

/* Grid */

.bc-grid {
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:10px;
}

.bc-card {
  border-radius:18px;
  border:1px solid #fee2e2;
  background:linear-gradient(145deg,#ffffff,#fff7fb);
  box-shadow:0 12px 30px rgba(248,113,113,0.22);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}

.bc-card--highlight {
  box-shadow:0 0 0 2px #4f46e5,0 20px 45px rgba(79,70,229,0.55);
}

.bc-card--selected {
  box-shadow:0 0 0 2px #ec4899,0 20px 45px rgba(236,72,153,0.5);
}

.bc-card-thumbWrap {
  position:relative;
}

.bc-card-thumb {
  width:100%;
  display:block;
  aspect-ratio:3/4;
  object-fit:cover;
}

.bc-card-thumb--empty {
  aspect-ratio:3/4;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#6b7280;
  background:radial-gradient(circle at top,#e0e7ff,#fdf2ff);
}

.bc-chip {
  position:absolute;
  left:8px;
  top:8px;
  border-radius:999px;
  padding:2px 8px;
  font-size:0.7rem;
  background:rgba(15,23,42,0.88);
  color:#f9fafb;
}

.bc-select-chip {
  position:absolute;
  right:8px;
  bottom:8px;
  border-radius:999px;
  padding:3px 9px;
  font-size:0.7rem;
  border:none;
  cursor:pointer;
  background:rgba(255,255,255,0.95);
  color:#111827;
  box-shadow:0 6px 16px rgba(148,163,184,0.4);
  transition:
    background 0.12s ease,
    color 0.12s ease,
    transform 0.04s ease,
    box-shadow 0.12s ease;
}
.bc-select-chip--on {
  background:linear-gradient(135deg,#ec4899,#f97316);
  color:#fff7ed;
  box-shadow:0 10px 24px rgba(248,113,113,0.65);
  transform:translateY(-1px);
}

.bc-card-body {
  padding:9px 10px 11px;
  display:flex;
  flex-direction:column;
  gap:6px;
}

.bc-card-title {
  margin:0;
  font-size:0.92rem;
  font-weight:700;
  color:#111827;
}

.bc-card-tags {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  align-items:center;
}

.bc-card-notes {
  margin:0;
  font-size:0.8rem;
  color:#4b5563;
}

.bc-card-footer {
  margin-top:4px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
}

.bc-card-date {
  font-size:0.75rem;
  color:#9ca3af;
}

.bc-card-actions {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

/* Pills, tags, buttons */

.bc-tag {
  border-radius:999px;
  padding:2px 8px;
  font-size:0.73rem;
  background:#fdf2ff;
  border:1px solid #e5e7eb;
  color:#4b5563;
}
.bc-tag--soft {
  background:#eef2ff;
  border-color:#e5e7eb;
  color:#4b5563;
}
.bc-tag--color {
  font-style:italic;
}

.bc-btn {
  appearance:none;
  border-radius:999px;
  padding:7px 13px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  color:#111827;
  cursor:pointer;
  font-size:0.86rem;
  font-weight:500;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  text-decoration:none;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.bc-btn:hover {
  background:#fdf2ff;
  border-color:#f9a8d4;
  box-shadow:0 8px 18px rgba(244,114,182,0.4);
}
.bc-btn:active {
  transform:translateY(1px);
  box-shadow:none;
}
.bc-btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#ec4899;
  color:#ffffff;
  box-shadow:0 10px 24px rgba(129,140,248,0.55);
}
.bc-btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.bc-btn-ghost {
  background:#ffffff;
  border-color:#e5e7eb;
  color:#4b5563;
}
.bc-btn-sm {
  padding:5px 11px;
  font-size:0.78rem;
}

/* Text links in card footer */
.bc-link {
  border:none;
  background:none;
  padding:0;
  margin:0;
  font-size:0.78rem;
  color:#4f46e5;
  cursor:pointer;
  text-decoration:none;
}
.bc-link:hover {
  text-decoration:underline;
}
.bc-link--danger {
  color:#b91c1c;
}

/* Inputs */

.bc-input {
  width:100%;
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:6px 11px;
  font-size:0.85rem;
  outline:none;
  background:#ffffff;
}
.bc-input:focus {
  border-color:#f472b6;
  box-shadow:0 0 0 1px rgba(244,114,182,0.5);
}
.bc-input--search {
  border-radius:999px;
  background:#f9fafb;
}
.bc-input--textarea {
  border-radius:12px;
  resize:vertical;
}

/* Filter pills */

.bc-filter-pill {
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:3px 10px;
  font-size:0.8rem;
  background:#f9fafb;
  cursor:pointer;
}
.bc-filter-pill--on {
  background:linear-gradient(135deg,#4f46e5,#ec4899);
  color:#f9fafb;
  border-color:transparent;
}

/* Drawer shared */

.bc-drawer-backdrop {
  position:fixed;
  inset:0;
  background:linear-gradient(135deg,rgba(244,114,182,0.65),rgba(129,140,248,0.55));
  display:flex;
  align-items:flex-end;
  justify-content:center;
  z-index:60;
}
.bc-drawer {
  position:relative;
  width:100%;
  max-width:520px;
  max-height:90vh;
  background:#ffffff;
  border-radius:20px 20px 0 0;
  padding:16px 16px 18px;
  box-shadow:0 -18px 40px rgba(15,23,42,0.45);
  overflow:auto;
}
.bc-drawer-close {
  position:absolute;
  right:18px;
  top:14px;
  border:none;
  background:rgba(249,250,251,0.9);
  border-radius:999px;
  width:26px;
  height:26px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}
.bc-drawer-title {
  margin:0 0 4px;
  font-size:1.1rem;
}
.bc-drawer-sub {
  margin:0 0 10px;
  font-size:0.87rem;
  color:#4b5563;
}
.bc-drawer-form {
  display:flex;
  flex-direction:column;
  gap:10px;
}
.bc-field {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.bc-field-row {
  display:flex;
  gap:8px;
  flex-wrap:wrap;
}
.bc-label {
  font-size:0.8rem;
  color:#374151;
}
.bc-help {
  font-size:0.75rem;
  color:#6b7280;
}
.bc-drawer-actions {
  margin-top:4px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

/* Upload preview inside drawer */

.bc-upload-preview {
  margin-top:8px;
  display:flex;
  gap:10px;
  align-items:flex-start;
  border-radius:16px;
  border:1px dashed #fecaca;
  background:#fff7fb;
  padding:8px 9px;
}

.bc-upload-preview-thumbWrap {
  flex:0 0 82px;
  border-radius:14px;
  overflow:hidden;
  background:#f3f4f6;
}

.bc-upload-preview-thumbWrap img {
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.bc-upload-preview-meta {
  flex:1;
  display:flex;
  flex-direction:column;
  gap:4px;
}

.bc-upload-preview-title {
  font-size:0.9rem;
  font-weight:600;
  color:#111827;
}

.bc-upload-preview-tags {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
}

.bc-upload-preview-clear {
  align-self:flex-start;
}

/* Notices */

.bc-notice {
  padding:8px 10px;
  border-radius:10px;
  font-size:0.88rem;
  margin-bottom:8px;
}
.bc-notice--error {
  border:1px solid #fecaca;
  background:#fef2f2;
  color:#7f1d1d;
}

.bc-loading {
  font-size:0.88rem;
  color:#6b7280;
  margin-bottom:8px;
}

.bc-empty {
  margin-top:10px;
  padding:10px 12px;
  border-radius:14px;
  border:1px dashed #fecaca;
  background:#fff1f2;
  font-size:0.85rem;
  color:#7f1d1d;
}

/* Responsive tweaks */

@media (max-width:900px) {
  .bc-mood-hero-inner {
    grid-template-columns:minmax(0,1fr);
  }
}

@media (max-width:720px) {
  .bc-shell {
    padding:12px 11px 13px;
  }
  .bc-filters {
    flex-direction:column;
  }
  .bc-filters-side {
    width:100%;
  }
}

@media (max-width:480px) {
  .bc-mood-title {
    font-size:1.45rem;
  }
  .bc-mood-stats {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
  .bc-grid {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
`;
