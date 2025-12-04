// site/src/routes/admin/ClosetLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSignedGetUrl } from "../../lib/sa";

// IMPORTANT: fallback public CDN for raw uploads (same as fan feed + admin upload)
const PUBLIC_UPLOADS_CDN = "https://d3fghr37bcpbig.cloudfront.net";

const GQL = {
  list: /* GraphQL */ `
    query AdminListClosetItems(
      $status: ClosetStatus
      $limit: Int
      $nextToken: String
    ) {
      adminListClosetItems(
        status: $status
        limit: $limit
        nextToken: $nextToken
      ) {
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
          coinValue
          createdAt
          updatedAt
          ownerSub
          scheduledAt
          episodeIds
        }
        nextToken
      }
    }
  `,
  approve: /* GraphQL */ `
    mutation AdminApproveItem($closetItemId: ID!) {
      adminApproveItem(closetItemId: $closetItemId) {
        id
        status
        updatedAt
        audience
        episodeIds
      }
    }
  `,
  reject: /* GraphQL */ `
    mutation AdminRejectItem($closetItemId: ID!, $reason: String) {
      adminRejectItem(closetItemId: $closetItemId, reason: $reason) {
        id
        status
        updatedAt
        episodeIds
      }
    }
  `,
  setAudience: /* GraphQL */ `
    mutation AdminSetAudience($closetItemId: ID!, $audience: ClosetAudience!) {
      adminSetClosetAudience(
        closetItemId: $closetItemId
        audience: $audience
      ) {
        id
        audience
        updatedAt
        episodeIds
      }
    }
  `,
  // update title / category / subcategory / coinValue / scheduledAt / episodeIds
  updateMeta: /* GraphQL */ `
    mutation AdminUpdateClosetItem($input: AdminUpdateClosetItemInput!) {
      adminUpdateClosetItem(input: $input) {
        id
        title
        category
        subcategory
        coinValue
        scheduledAt
        updatedAt
        episodeIds
      }
    }
  `,
  // Lala's picks: pin/unpin (same underlying mutation)
  pinHighlight: /* GraphQL */ `
    mutation AdminPinClosetItem($input: AdminUpdateClosetItemInput!) {
      adminUpdateClosetItem(input: $input) {
        id
        pinned
        scheduledAt
        episodeIds
      }
    }
  `,
  // NEW: publish approved looks to the fan closet
  publish: /* GraphQL */ `
    mutation AdminPublishItem($closetItemId: ID!) {
      adminPublishClosetItem(closetItemId: $closetItemId) {
        id
        status
        updatedAt
        scheduledAt
        episodeIds
      }
    }
  `,
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

const AUDIENCE_OPTIONS = [
  { value: "PUBLIC", label: "Fan + Bestie" },
  { value: "BESTIES", label: "Bestie only" },
  { value: "EXCLUSIVE", label: "Exclusive drop" },
];

const AUDIENCE_LABELS = {
  PUBLIC: "Fan + Bestie",
  BESTIES: "Bestie only",
  EXCLUSIVE: "Exclusive drop",
};

// Same category system as upload
const CATEGORY_OPTIONS = [
  { value: "", label: "Uncategorized" },
  { value: "Dresses", label: "Dresses" },
  { value: "Tops", label: "Tops" },
  { value: "Bottoms", label: "Bottoms" },
  { value: "Sets", label: "Matching sets" },
  { value: "Outerwear", label: "Outerwear" },
  { value: "Shoes", label: "Shoes" },
  { value: "Bags", label: "Bags" },
  { value: "Jewelry", label: "Jewelry" },
  { value: "Accessories", label: "Accessories" },
  { value: "Beauty", label: "Beauty / Perfume" },
];

// category filter options
const CATEGORY_FILTER_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "Dresses", label: "Dresses" },
  { value: "Tops", label: "Tops" },
  { value: "Bottoms", label: "Bottoms" },
  { value: "Sets", label: "Matching sets" },
  { value: "Outerwear", label: "Outerwear" },
  { value: "Shoes", label: "Shoes" },
  { value: "Bags", label: "Bags" },
  { value: "Jewelry", label: "Jewelry" },
  { value: "Accessories", label: "Accessories" },
  { value: "Beauty", label: "Beauty / Perfume" },
];

const SUBCATEGORY_BY_CATEGORY = {
  Dresses: [
    "Mini dress",
    "Midi dress",
    "Maxi dress",
    "Bodycon",
    "Slip dress",
    "Party dress",
  ],
  Tops: ["Crop top", "T-shirt", "Blouse", "Corset top", "Sweater", "Hoodie"],
  Bottoms: ["Jeans", "Trousers", "Shorts", "Skirt", "Leggings", "Cargo"],
  Sets: ["Skirt set", "Pant set", "Sweatsuit", "Lounge set"],
  Outerwear: ["Denim jacket", "Blazer", "Coat", "Bomber", "Puffer", "Cardigan"],
  Shoes: ["Heels", "Sneakers", "Boots", "Sandals", "Flats"],
  Bags: ["Shoulder bag", "Tote", "Mini bag", "Crossbody", "Clutch"],
  Jewelry: ["Necklace", "Earrings", "Bracelet", "Rings", "Body jewelry"],
  Accessories: ["Hat", "Scarf", "Belt", "Sunglasses", "Hair accessory"],
  Beauty: ["Perfume", "Body mist", "Lip product", "Face", "Eyes"],
};

// In "ALL" mode, we hide rejected items by default so the library feels clean.
const HIDE_REJECTED_IN_ALL = true;

function effectiveKey(item) {
  const k = item.mediaKey || item.rawMediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
}

/**
 * Build mediaUrl per item using signed URL, with fallback to public CDN.
 * IMPORTANT: we do NOT mutate/guess the key (no auto "closet/" prefix).
 * We just trust the key from mediaKey/rawMediaKey.
 */
async function hydrateItems(items) {
  return Promise.all(
    items.map(async (item) => {
      const key = effectiveKey(item);
      if (!key) return item;

      let url = null;

      try {
        url = await getSignedGetUrl(key);
        if (url) {
          console.log("[ClosetLibrary] signed URL ok", { key, url });
        }
      } catch (e) {
        console.warn("[ClosetLibrary] getSignedGetUrl failed → fallback", {
          key,
          error: e,
        });
      }

      if (!url && PUBLIC_UPLOADS_CDN) {
        const encodedKey = String(key)
          .replace(/^\/+/, "") // remove leading slashes only
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");

        url = PUBLIC_UPLOADS_CDN.replace(/\/+$/, "") + "/" + encodedKey;

        console.log("[ClosetLibrary] Fallback URL built", { key, url });
      }

      return { ...item, mediaUrl: url || null };
    })
  );
}

function humanStatusLabel(item) {
  const status = item.status || "UNKNOWN";
  const hasCutout = !!item.mediaKey;

  if (status === "PENDING" && !hasCutout && item.rawMediaKey) {
    return "processing bg";
  }
  if (status === "PENDING" && hasCutout) {
    return "ready to review";
  }
  if (status === "APPROVED") {
    return "approved";
  }
  if (status === "PUBLISHED") {
    return "live in fan closet";
  }
  return status.toLowerCase();
}

function getSubcategories(category) {
  return SUBCATEGORY_BY_CATEGORY[category] || [];
}

// Helpers for mapping AWSDateTime ⇄ <input type="date/time">
function toDateInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export default function ClosetLibrary() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [onlyPicks, setOnlyPicks] = useState(false); // Lala's picks filter
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState(null);

  // drawer selection + editable draft
  const [selected, setSelected] = useState(null);
  const [drawerDraft, setDrawerDraft] = useState(null);

  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const variables = {
        status: statusFilter === "ALL" ? null : statusFilter,
        limit: 100,
        nextToken: null,
      };

      const data = await window.sa.graphql(GQL.list, variables);
      const page = data?.adminListClosetItems;
      let rawItems = page?.items ?? [];

      if (statusFilter === "ALL" && HIDE_REJECTED_IN_ALL) {
        rawItems = rawItems.filter((i) => i.status !== "REJECTED");
      }

      const hydrated = await hydrateItems(rawItems);

      hydrated.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setItems(hydrated);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);

      if (selected) {
        const updated = hydrated.find((it) => it.id === selected.id);
        setSelected(updated || null);
        if (updated) {
          setDrawerDraft({
            title: updated.title || "",
            category: updated.category || "",
            subcategory: updated.subcategory || "",
            coinValue:
              updated.coinValue === null || updated.coinValue === undefined
                ? null
                : updated.coinValue,
            scheduleDate: toDateInputValue(updated.scheduledAt),
            scheduleTime: toTimeInputValue(updated.scheduledAt),
            episodesText: (updated.episodeIds || []).join(", "),
          });
        }
      }
    } catch (e) {
      console.error(e);
      setError(
        e?.message ||
          "Failed to load closet items. Check GraphQL / adminListClosetItems."
      );
    } finally {
      setLoading(false);
      setBusyId(null);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const id = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  // apply category filter + picks filter + search
  const filteredItems = useMemo(() => {
    let list = items;

    if (categoryFilter !== "ALL") {
      list = list.filter((item) => item.category === categoryFilter);
    }

    if (onlyPicks) {
      list = list.filter((item) => item.pinned);
    }

    if (!search.trim()) return list;

    const q = search.trim().toLowerCase();
    return list.filter((item) => (item.title || "").toLowerCase().includes(q));
  }, [items, search, categoryFilter, onlyPicks]);

  const totalCount = filteredItems.length;

  const autoLabel =
    lastUpdatedAt == null
      ? "—"
      : secondsSinceUpdate < 2
      ? "just now"
      : `${secondsSinceUpdate}s ago`;

  const currentFilterLabel =
    STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ||
    "All statuses";

  // ----- helpers -----

  function parseEpisodeText(text) {
    const raw = String(text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return raw;
  }

  function episodesEqual(a, b) {
    const aa = (a || []).map(String);
    const bb = (b || []).map(String);
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i += 1) {
      if (aa[i] !== bb[i]) return false;
    }
    return true;
  }

  // ----- actions -----

  async function approveItem(item) {
    if (
      !window.confirm(
        "Approve this look so it’s ready to publish to the fan closet?"
      )
    ) {
      return;
    }
    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.approve, {
        closetItemId: item.id,
      });

      const audience = item.audience || "PUBLIC";
      await window.sa.graphql(GQL.setAudience, {
        closetItemId: item.id,
        audience,
      });

      await loadItems();
      setSelected(null);
      setDrawerDraft(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to approve item.");
      setBusyId(null);
    }
  }

  async function publishItem(item) {
    if (
      !window.confirm(
        "Publish this look so it appears in the public fan closet feed?"
      )
    ) {
      return;
    }

    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.publish, {
        closetItemId: item.id,
      });

      await loadItems();
      setSelected(null);
      setDrawerDraft(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to publish item.");
      setBusyId(null);
    }
  }

  async function rejectItem(item, opts = {}) {
    const { deleteMode = false } = opts;
    const defaultPrompt = deleteMode
      ? "Delete this look from the closet library? This will mark it REJECTED and hide it from the feed."
      : "Reject this closet item? It will not appear in the fan closet.";
    if (!window.confirm(defaultPrompt)) return;

    let reason = null;
    if (!deleteMode) {
      reason = window.prompt("Reason for rejection? (optional)") || null;
    } else {
      reason = "Deleted from admin closet library";
    }

    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.reject, {
        closetItemId: item.id,
        reason,
      });

      if (statusFilter === "ALL" && HIDE_REJECTED_IN_ALL) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        setBusyId(null);
        setSelected(null);
        setDrawerDraft(null);
      } else {
        await loadItems();
        setSelected(null);
        setDrawerDraft(null);
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to reject/delete item.");
      setBusyId(null);
    }
  }

  async function updateAudience(item, audience) {
    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.setAudience, {
        closetItemId: item.id,
        audience,
      });
      await loadItems();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to update audience.");
      setBusyId(null);
    }
  }

  async function saveDrawerMeta() {
    if (!selected || !drawerDraft) return;

    const input = {};
    const trimmedTitle = (drawerDraft.title || "").trim();

    if (trimmedTitle !== (selected.title || "")) {
      input.title = trimmedTitle || null;
    }

    if ((drawerDraft.category || "") !== (selected.category || "")) {
      input.category = drawerDraft.category || null;
    }

    if ((drawerDraft.subcategory || "") !== (selected.subcategory || "")) {
      input.subcategory = drawerDraft.subcategory || null;
    }

    const selectedCoin =
      selected.coinValue === null || selected.coinValue === undefined
        ? null
        : selected.coinValue;

    const draftCoin =
      drawerDraft.coinValue === "" || drawerDraft.coinValue === null
        ? null
        : Number(drawerDraft.coinValue) || 0;

    if (draftCoin !== selectedCoin) {
      input.coinValue = draftCoin;
    }

    // schedule handling
    const prevScheduledAt = selected.scheduledAt || null;
    let nextScheduledAt = null;

    if (drawerDraft.scheduleDate) {
      const time = drawerDraft.scheduleTime || "00:00";
      const local = new Date(`${drawerDraft.scheduleDate}T${time}`);
      if (!Number.isNaN(local.getTime())) {
        nextScheduledAt = local.toISOString();
      }
    }

    if ((nextScheduledAt || null) !== (prevScheduledAt || null)) {
      input.scheduledAt = nextScheduledAt;
    }

    // episodes handling
    const prevEpisodes = (selected.episodeIds || []).map(String);
    const nextEpisodes = parseEpisodeText(drawerDraft.episodesText);

    if (!episodesEqual(prevEpisodes, nextEpisodes)) {
      // If empty, send [] to clear links
      input.episodeIds = nextEpisodes.length ? nextEpisodes : [];
    }

    if (!Object.keys(input).length) {
      return;
    }

    try {
      setBusyId(selected.id);

      // 👇 include id inside input
      await window.sa.graphql(GQL.updateMeta, {
        input: { id: selected.id, ...input },
      });

      await loadItems();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to save changes.");
      setBusyId(null);
    }
  }

  async function togglePinnedSelected() {
    if (!selected) return;

    const nextPinned = !selected.pinned;

    try {
      setBusyId(selected.id);

      const res = await window.sa.graphql(GQL.pinHighlight, {
        input: { id: selected.id, pinned: nextPinned },
      });

      const updated = res?.adminUpdateClosetItem;
      const pinnedValue =
        typeof updated?.pinned === "boolean" ? updated.pinned : nextPinned;

      setSelected((prev) =>
        prev && prev.id === selected.id ? { ...prev, pinned: pinnedValue } : prev
      );
      setItems((prev) =>
        prev.map((it) =>
          it.id === selected.id ? { ...it, pinned: pinnedValue } : it
        )
      );

      await loadItems();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to update Lala's pick flag.");
    } finally {
      setBusyId(null);
    }
  }

  function openDrawer(item) {
    setSelected(item);
    setDrawerDraft({
      title: item.title || "",
      category: item.category || "",
      subcategory: item.subcategory || "",
      coinValue:
        item.coinValue === null || item.coinValue === undefined
          ? null
          : item.coinValue,
      scheduleDate: toDateInputValue(item.scheduledAt),
      scheduleTime: toTimeInputValue(item.scheduledAt),
      episodesText: (item.episodeIds || []).join(", "),
    });
  }

  function closeDrawer() {
    setSelected(null);
    setDrawerDraft(null);
  }

  const now = new Date();

  return (
    <div className="closet-admin-page closet-library-page">
      <style>{styles}</style>

      {/* Header */}
      <header className="closet-admin-header closet-library-header">
        <div className="closet-admin-title-block">
          <span className="closet-admin-kicker">
            STYLING ADVENTURES WITH LALA
          </span>
          <h1>Closet library</h1>
          <p>
            Browse every approved and in-progress look in one place. Use filters
            to jump between drops, statuses, Lala&apos;s picks, and fan
            audiences.
          </p>
        </div>

        <div className="closet-admin-header-right">
          <div className="closet-library-pills">
            <span className="closet-admin-pill">Admin portal</span>
            <span className="closet-library-pill">
              Total looks · <strong>{totalCount}</strong>
            </span>
            <span className="closet-library-pill closet-library-pill--soft">
              Filter · {currentFilterLabel}
            </span>
          </div>
          <span className="closet-admin-count">
            Auto-updated <strong>{autoLabel}</strong>
          </span>
        </div>
      </header>

      {/* Main library card */}
      <section className="sa-card closet-library-card">
        <header className="closet-card-header">
          <div>
            <h2 className="closet-card-title">Closet library</h2>
            <p className="closet-card-sub">
              A gallery view of every closet item. Search by title or filter by
              status, category, and Lala&apos;s picks to quickly find what you
              need.
            </p>
          </div>
        </header>

        {/* Filters row */}
        <div className="closet-filters-row" style={{ marginBottom: 8 }}>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="closet-filter-input"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="closet-filter-input"
          >
            {CATEGORY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            className="closet-filter-input"
            placeholder="Search titles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Lala's picks + Refresh */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <label
              style={{
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={onlyPicks}
                onChange={(e) => setOnlyPicks(e.target.checked)}
              />
              Lala&apos;s picks only
            </label>

            <button
              type="button"
              className="closet-filter-refresh"
              onClick={loadItems}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* GRID HEADER */}
        <div className="closet-grid-header">
          <span className="closet-grid-title">
            Closet items · <strong>{totalCount}</strong>{" "}
            {totalCount === 1 ? "look" : "looks"}
          </span>
          <span className="closet-grid-hint">
            Showing newest first. Auto-updated {autoLabel}.
          </span>
        </div>

        {/* Status color legend */}
        <div className="closet-status-legend">
          <span className="closet-status-legend-label">Status legend</span>
          <span className="closet-status-legend-pill closet-status-pill closet-status-pill--pending">
            Pending / processing
          </span>
          <span className="closet-status-legend-pill closet-status-pill closet-status-pill--published">
            Approved / published
          </span>
          <span className="closet-status-legend-pill closet-status-pill closet-status-pill--rejected">
            Rejected
          </span>
        </div>

        {error && (
          <div className="closet-grid-error" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}

        {!loading && !error && totalCount === 0 && (
          <div className="closet-grid-empty" style={{ marginTop: 12 }}>
            No looks found for this filter yet. Try switching status, turning
            off Lala&apos;s pick filter, or clearing your search.
          </div>
        )}

        {loading && totalCount === 0 && !error && (
          <div className="closet-grid-empty" style={{ marginTop: 12 }}>
            Loading closet looks…
          </div>
        )}

        {totalCount > 0 && (
          <div
            className="closet-grid closet-grid--library"
            style={{ marginTop: 12 }}
          >
            {filteredItems.map((item) => {
              const status = item.status || "UNKNOWN";
              const label = humanStatusLabel(item);

              let statusClass = "closet-status-pill--default";
              if (status === "PUBLISHED" || status === "APPROVED")
                statusClass = "closet-status-pill--published";
              else if (status === "PENDING")
                statusClass = "closet-status-pill--pending";
              else if (status === "REJECTED")
                statusClass = "closet-status-pill--rejected";

              const audienceLabel =
                AUDIENCE_LABELS[item.audience] ||
                item.audience ||
                "Fan / Bestie";

              const isBusy = busyId === item.id;

              const categoryLabel =
                item.category || (item.subcategory ? "Uncategorized" : "");

              // schedule label
              let scheduleText = "";
              if (item.scheduledAt) {
                const dt = new Date(item.scheduledAt);
                if (!Number.isNaN(dt.getTime())) {
                  const localStr = dt.toLocaleString();
                  if (dt > now) {
                    scheduleText = `Drops ${localStr}`;
                  } else {
                    scheduleText = `Scheduled drop · ${localStr}`;
                  }
                }
              }

              const hasEpisodes =
                Array.isArray(item.episodeIds) && item.episodeIds.length > 0;

              return (
                <article
                  key={item.id}
                  className="closet-grid-card closet-grid-card--library"
                >
                  <div
                    className="closet-grid-thumb"
                    onClick={() => openDrawer(item)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.mediaUrl ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.title || "Closet item"}
                      />
                    ) : (
                      <span className="closet-grid-thumb-empty">
                        No preview
                      </span>
                    )}
                  </div>

                  <div className="closet-grid-body">
                    <div className="closet-grid-title-row">
                      <div className="closet-grid-main-title">
                        {item.title || "Untitled look"}
                      </div>
                      {item.pinned && (
                        <span className="closet-badge-new">
                          Lala&apos;s pick
                        </span>
                      )}
                    </div>

                    <div className="closet-grid-meta">
                      <span className={"closet-status-pill " + statusClass}>
                        {label}
                      </span>
                      <span className="closet-grid-audience">
                        {audienceLabel}
                      </span>
                    </div>

                    {scheduleText && (
                      <div className="closet-grid-schedule">
                        {scheduleText}
                      </div>
                    )}

                    {(categoryLabel || item.subcategory || item.pinned) && (
                      <div className="closet-grid-tags">
                        {item.pinned && (
                          <span className="closet-grid-tag closet-grid-tag--lala">
                            Lala&apos;s pick
                          </span>
                        )}
                        {categoryLabel && (
                          <span className="closet-grid-tag">
                            {categoryLabel}
                          </span>
                        )}
                        {item.subcategory && (
                          <span className="closet-grid-tag closet-grid-tag--soft">
                            {item.subcategory}
                          </span>
                        )}
                      </div>
                    )}

                    {hasEpisodes && (
                      <div className="closet-grid-episodes">
                        <span className="closet-grid-episodes-label">
                          Episodes:
                        </span>
                        <span className="closet-grid-episodes-list">
                          {item.episodeIds.join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Coin value pill */}
                    <div className="closet-grid-coinRow">
                      <span className="closet-coin-pill">
                        🪙{" "}
                        {item.coinValue != null
                          ? `${item.coinValue} coins`
                          : "No coin value"}
                      </span>
                    </div>

                    {/* Audience controls */}
                    <div className="closet-review-audience-row">
                      <label className="closet-review-label">Audience</label>
                      <select
                        className="sa-input closet-review-audience"
                        value={item.audience || "PUBLIC"}
                        disabled={isBusy}
                        onChange={(e) => updateAudience(item, e.target.value)}
                      >
                        {AUDIENCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="closet-grid-footer">
                      <span className="closet-grid-date">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                      <div className="closet-grid-actions">
                        <button
                          type="button"
                          className="closet-grid-link"
                          onClick={() => openDrawer(item)}
                        >
                          View
                        </button>

                        {item.status === "PENDING" && (
                          <button
                            type="button"
                            className="closet-grid-link"
                            disabled={isBusy}
                            onClick={() => approveItem(item)}
                          >
                            {isBusy ? "Saving…" : "Approve"}
                          </button>
                        )}

                        {item.status === "APPROVED" && (
                          <button
                            type="button"
                            className="closet-grid-link"
                            disabled={isBusy}
                            onClick={() => publishItem(item)}
                          >
                            {isBusy ? "Working…" : "Publish"}
                          </button>
                        )}

                        {item.status !== "REJECTED" && (
                          <button
                            type="button"
                            className="closet-grid-link closet-grid-link--danger"
                            disabled={isBusy}
                            onClick={() => rejectItem(item)}
                          >
                            {isBusy ? "Working…" : "Reject"}
                          </button>
                        )}

                        <button
                          type="button"
                          className="closet-grid-link closet-grid-link--danger"
                          disabled={isBusy}
                          onClick={() =>
                            rejectItem(item, { deleteMode: true })
                          }
                        >
                          {isBusy ? "Working…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Detail drawer */}
        {selected && (
          <div className="closet-drawer-backdrop" onClick={closeDrawer}>
            <aside
              className="closet-drawer"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="closet-drawer-close"
                onClick={closeDrawer}
              >
                ✕
              </button>

              <div className="closet-drawer-layout">
                <div className="closet-drawer-imageWrap">
                  <div className="closet-drawer-thumb">
                    {selected.mediaUrl ? (
                      <img
                        src={selected.mediaUrl}
                        alt={selected.title || "Closet item"}
                      />
                    ) : (
                      <span className="closet-grid-thumb-empty">
                        No preview
                      </span>
                    )}
                  </div>
                </div>

                <div className="closet-drawer-meta">
                  {/* Editable title */}
                  <div className="closet-drawer-field">
                    <label className="closet-drawer-label">Title</label>
                    <input
                      className="sa-input closet-drawer-titleInput"
                      value={drawerDraft?.title ?? ""}
                      disabled={busyId === selected.id}
                      onChange={(e) =>
                        setDrawerDraft((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="closet-drawer-row">
                    <span className="closet-drawer-label">Status</span>
                    <span className="closet-status-pill closet-status-pill--default">
                      {humanStatusLabel(selected)}
                    </span>
                  </div>

                  {/* Lala's pick toggle */}
                  <div className="closet-drawer-row">
                    <span className="closet-drawer-label">
                      Lala&apos;s pick
                    </span>
                    <button
                      type="button"
                      className="closet-drawer-chipButton"
                      disabled={busyId === selected.id}
                      onClick={togglePinnedSelected}
                    >
                      {selected.pinned ? "Unmark pick" : "Mark as pick"}
                    </button>
                  </div>

                  {/* Coin value editor */}
                  <div className="closet-drawer-field">
                    <label className="closet-drawer-label">Coin value</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="sa-input closet-drawer-titleInput"
                      value={drawerDraft?.coinValue ?? ""}
                      disabled={busyId === selected.id}
                      onChange={(e) =>
                        setDrawerDraft((prev) => ({
                          ...prev,
                          coinValue:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value) || 0,
                        }))
                      }
                    />
                    <div className="closet-drawer-metaText">
                      How many coins this item is worth in Lala&apos;s world.
                    </div>
                  </div>

                  {/* Category / subcategory selection */}
                  <div className="closet-drawer-row closet-drawer-row--stacked">
                    <div className="closet-drawer-field">
                      <label className="closet-drawer-label">Category</label>
                      <select
                        className="sa-input closet-drawer-audienceInput"
                        value={drawerDraft?.category || ""}
                        disabled={busyId === selected.id}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDrawerDraft((prev) => ({
                            ...prev,
                            category: val,
                            subcategory: "",
                          }));
                        }}
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="closet-drawer-field">
                      <label className="closet-drawer-label">
                        Subcategory
                      </label>
                      <select
                        className="sa-input closet-drawer-audienceInput"
                        value={drawerDraft?.subcategory || ""}
                        disabled={
                          busyId === selected.id || !drawerDraft?.category
                        }
                        onChange={(e) =>
                          setDrawerDraft((prev) => ({
                            ...prev,
                            subcategory: e.target.value,
                          }))
                        }
                      >
                        <option value="">
                          {drawerDraft?.category
                            ? "Select subcategory"
                            : "Choose a category first"}
                        </option>
                        {getSubcategories(drawerDraft?.category || "").map(
                          (sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Episodes */}
                  <div className="closet-drawer-field">
                    <label className="closet-drawer-label">
                      Episodes (IDs)
                    </label>
                    <input
                      className="sa-input closet-drawer-titleInput"
                      placeholder="ep-1, ep-2, ep-3"
                      value={drawerDraft?.episodesText || ""}
                      disabled={busyId === selected.id}
                      onChange={(e) =>
                        setDrawerDraft((prev) => ({
                          ...prev,
                          episodesText: e.target.value,
                        }))
                      }
                    />
                    <div className="closet-drawer-metaText">
                      Comma-separated list of episode IDs where this look
                      appears. Example:{" "}
                      <code>ep-101, ep-102, lala-special-1</code>.
                    </div>
                  </div>

                  {/* Audience */}
                  <div className="closet-drawer-row">
                    <span className="closet-drawer-label">Audience</span>
                    <select
                      className="sa-input closet-drawer-audienceInput"
                      value={selected.audience || "PUBLIC"}
                      disabled={busyId === selected.id}
                      onChange={(e) =>
                        updateAudience(selected, e.target.value)
                      }
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Schedule controls */}
                  <div className="closet-drawer-field">
                    <label className="closet-drawer-label">
                      Schedule (optional)
                    </label>
                    <div className="closet-drawer-twoCol">
                      <div>
                        <input
                          type="date"
                          className="sa-input"
                          value={drawerDraft?.scheduleDate || ""}
                          disabled={busyId === selected.id}
                          onChange={(e) =>
                            setDrawerDraft((prev) => ({
                              ...prev,
                              scheduleDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          className="sa-input"
                          value={drawerDraft?.scheduleTime || ""}
                          disabled={busyId === selected.id}
                          onChange={(e) =>
                            setDrawerDraft((prev) => ({
                              ...prev,
                              scheduleTime: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="closet-drawer-metaText">
                      Set a date and time for when this look should appear in
                      Lala&apos;s fan closet feed. Leave blank for immediate
                      availability.
                    </div>
                    {selected.scheduledAt && (
                      <div className="closet-drawer-metaText">
                        Currently scheduled for{" "}
                        {new Date(selected.scheduledAt).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="closet-drawer-row closet-drawer-row--meta">
                    <div>
                      <div className="closet-drawer-label">Created</div>
                      <div className="closet-drawer-metaText">
                        {selected.createdAt
                          ? new Date(selected.createdAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="closet-drawer-label">Updated</div>
                      <div className="closet-drawer-metaText">
                        {selected.updatedAt
                          ? new Date(selected.updatedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="closet-drawer-actions">
                    <button
                      type="button"
                      className="sa-btn closet-drawer-approve"
                      disabled={busyId === selected.id}
                      onClick={saveDrawerMeta}
                    >
                      {busyId === selected.id ? "Saving…" : "Save changes"}
                    </button>

                    {selected.status === "PENDING" && (
                      <button
                        type="button"
                        className="sa-btn closet-drawer-approve"
                        disabled={busyId === selected.id}
                        onClick={() => approveItem(selected)}
                      >
                        {busyId === selected.id ? "Saving…" : "Approve"}
                      </button>
                    )}

                    {selected.status === "APPROVED" && (
                      <button
                        type="button"
                        className="sa-btn closet-drawer-approve"
                        disabled={busyId === selected.id}
                        onClick={() => publishItem(selected)}
                      >
                        {busyId === selected.id ? "Saving…" : "Publish"}
                      </button>
                    )}

                    {selected.status !== "REJECTED" && (
                      <button
                        type="button"
                        className="sa-btn closet-drawer-reject"
                        disabled={busyId === selected.id}
                        onClick={() => rejectItem(selected)}
                      >
                        Reject
                      </button>
                    )}

                    <button
                      type="button"
                      className="sa-btn closet-drawer-delete"
                      disabled={busyId === selected.id}
                      onClick={() =>
                        rejectItem(selected, { deleteMode: true })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

/* Closet Library + Drawer styles (with status legend) */
const styles = /* css */ `
.closet-admin-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* HEADER -------------------------------------------------- */

.closet-admin-header {
  background:
    radial-gradient(circle at top left,#fce7f3,#f9fafb 60%),
    radial-gradient(circle at bottom right,#e0e7ff,#ffffff);
  border-radius: 26px;
  padding: 18px 22px;
  box-shadow: 0 18px 40px rgba(148,163,184,0.32);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.closet-admin-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-admin-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9ca3af;
  font-weight: 600;
}

.closet-admin-title-block h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.closet-admin-title-block p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #4b5563;
  max-width: 520px;
}

.closet-admin-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.closet-admin-pill {
  padding: 3px 10px;
  border-radius: 999px;
  background: #020617;
  color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.closet-admin-count {
  font-size: 12px;
  color: #6b7280;
}

.closet-library-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.closet-library-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: #eef2ff;
  color: #3730a3;
}

.closet-library-pill--soft {
  background: #f9fafb;
  color: #6b7280;
}

@media (max-width: 768px) {
  .closet-admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .closet-admin-header-right {
    align-items: flex-start;
  }
  .closet-library-pills {
    justify-content: flex-start;
  }
}

/* MAIN CARD ------------------------------------------------ */

.sa-card.closet-library-card {
  background: #f8f5ff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(148,163,184,0.28);
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.closet-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 6px;
}

.closet-card-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.closet-card-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* FILTERS ROW --------------------------------------------- */

.closet-filters-row {
  margin-top: 6px;
  display: grid;
  grid-template-columns: minmax(0,140px) minmax(0,1fr) 180px auto;
  gap: 8px;
  align-items: center;
}

.closet-filter-input {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 7px 12px;
  font-size: 13px;
  background: #f9fafb;
}

.closet-filter-refresh {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
}

.closet-filter-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .closet-filters-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* GRID ---------------------------------------------------- */

.closet-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 4px;
}

.closet-grid-title {
  font-size: 13px;
  color: #6b7280;
}

.closet-grid-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* STATUS LEGEND ------------------------------------------ */

.closet-status-legend {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.closet-status-legend-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
}

.closet-status-legend-pill {
  font-size: 10px;
  padding: 2px 8px;
}

.closet-grid-error {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
}

.closet-grid-empty {
  margin-top: 12px;
  font-size: 13px;
  color: #6b7280;
}

.closet-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(210px,1fr));
  gap: 12px;
}

.closet-grid--library {
  grid-template-columns: repeat(auto-fill,minmax(230px,1fr));
}

.closet-grid-card {
  background: #f4ebff;
  border-radius: 18px;
  padding: 8px;
  border: 1px solid #e5e0ff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 10px 26px rgba(148,163,184,0.4);
}

.closet-grid-card--library {
  background: #fdfbff;
}

/* Thumbnails */

.closet-grid-thumb {
  border-radius: 16px;
  background:
    radial-gradient(circle at top left, #f9fafb, #ede9fe),
    #ede9fe;
  overflow: hidden;
  height: 220px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.closet-grid-thumb img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.closet-grid-thumb-empty {
  font-size: 12px;
  color: #6b7280;
}

/* Card body */

.closet-grid-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-grid-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.closet-grid-main-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.closet-grid-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.closet-grid-audience {
  font-size: 11px;
  color: #6b7280;
}

/* schedule label */

.closet-grid-schedule {
  margin-top: 2px;
  font-size: 11px;
  color: #4b5563;
}

/* Category tags */

.closet-grid-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.closet-grid-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
}

.closet-grid-tag--soft {
  background: #f9fafb;
  color: #6b7280;
}

.closet-grid-tag--lala {
  background: #fef3c7;
  color: #92400e;
}

/* Episodes line */

.closet-grid-episodes {
  margin-top: 2px;
  font-size: 11px;
  color: #4b5563;
}

.closet-grid-episodes-label {
  font-weight: 600;
  margin-right: 4px;
}

.closet-grid-episodes-list {
  word-break: break-word;
}

/* Coin pill */

.closet-grid-coinRow {
  margin-top: 2px;
}

.closet-coin-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid #facc15;
  background: #fef9c3;
  color: #854d0e;
}

/* Status pills */

.closet-status-pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  text-transform: lowercase;
}

.closet-status-pill--default {
  background: #e5e7eb;
  color: #374151;
}
.closet-status-pill--pending {
  background: #fef3c7;
  color: #92400e;
}
.closet-status-pill--published {
  background: #ecfdf3;
  color: #166534;
}
.closet-status-pill--rejected {
  background: #fee2e2;
  color: #b91c1c;
}

/* Footer */

.closet-grid-footer {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.closet-grid-date {
  color: #9ca3af;
}

.closet-grid-actions {
  display: flex;
  gap: 6px;
}

.closet-grid-link {
  border: none;
  background: transparent;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 999px;
  cursor: pointer;
  color: #4b5563;
  background: rgba(249,250,251,0.9);
}

.closet-grid-link:hover {
  background: #eef2ff;
  color: #111827;
}

.closet-grid-link--danger {
  color: #b91c1c;
  background: #fef2e2;
}

.closet-grid-link--danger:hover {
  background: #fee2e2;
}

/* REVIEW / audience controls */

.closet-review-audience-row {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-review-label {
  font-size: 11px;
  font-weight: 600;
}

.closet-review-audience {
  max-width: 200px;
}

/* Drawer overlay ----------------------------------------- */

.closet-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 40;
}

.closet-drawer {
  width: 380px;
  max-width: 90vw;
  background: #fdfbff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -18px 0 40px rgba(15,23,42,0.35);
  padding: 16px 18px 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.closet-drawer-close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.closet-drawer-layout {
  margin-top: 6px;
  display: grid;
  grid-template-rows: auto auto;
  gap: 12px;
}

.closet-drawer-imageWrap {
  display: flex;
  justify-content: center;
}

.closet-drawer-thumb {
  border-radius: 18px;
  background:
    radial-gradient(circle at top left, #f9fafb, #ede9fe),
    #ede9fe;
  padding: 10px;
  width: 100%;
  max-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.closet-drawer-thumb img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.closet-drawer-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.closet-drawer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-drawer-titleInput {
  width: 100%;
}

.closet-drawer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.closet-drawer-row--meta {
  margin-top: 4px;
  align-items: flex-start;
}

.closet-drawer-row--stacked {
  align-items: flex-start;
}

.closet-drawer-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
}

.closet-drawer-metaText {
  font-size: 12px;
  color: #4b5563;
}

.closet-drawer-audienceInput {
  max-width: 220px;
}

/* NEW: drawer header + sections --------------------------- */

.closet-drawer-headerRow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.closet-drawer-headerMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-drawer-headerSide {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.closet-drawer-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.closet-drawer-sectionHeader h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.closet-drawer-sectionHeader p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #6b7280;
}

.closet-drawer-twoCol {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

@media (max-width: 480px) {
  .closet-drawer-twoCol {
    grid-template-columns: minmax(0, 1fr);
  }
}

.closet-drawer-unsaved {
  margin-top: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fffbeb;
  color: #b45309;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.closet-drawer-section--meta {
  margin-top: 6px;
}

/* ACTIONS ROW -------------------------------------------- */

.closet-drawer-actionsRow {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.closet-drawer-actionsRight {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */

.sa-btn {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.closet-drawer-approve {
  background: #4ade80;
  border-color: #22c55e;
}

.closet-drawer-reject {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

.closet-drawer-delete {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.closet-drawer-save {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #111827;
}

.closet-drawer-save:disabled {
  opacity: 0.6;
  cursor: default;
}

.closet-drawer-approvePrimary {
  background: #4ade80;
  border-color: #22c55e;
  color: #064e3b;
}

/* chip button for Lala's pick */

.closet-drawer-chipButton {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.closet-drawer-chipButton--active {
  background: #fef3c7;
  border-color: #facc15;
  color: #92400e;
}

/* shared pill input style */

.sa-input {
  width: 100%;
  box-sizing: border-box;
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:8px 14px;
  font-size:14px;
  background:#ffffff;
  outline:none;
}
.sa-input::placeholder { color:#c4c4d3; }
.sa-input:focus {
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}
`;
