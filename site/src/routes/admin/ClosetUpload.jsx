// site/src/routes/admin/ClosetUpload.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { signedUpload, getSignedGetUrl } from "../../lib/sa";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GRID_PREVIEW_LIMIT = 6;

// IMPORTANT: fallback public CDN for raw uploads (same as fan/admin library)
const PUBLIC_UPLOADS_CDN = "https://d3fghr37bcpbig.cloudfront.net";

function isNew(createdAt) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ONE_DAY_MS;
}

const GQL = {
  create: /* GraphQL */ `
    mutation AdminCreateClosetItem($input: AdminCreateClosetItemInput!) {
      adminCreateClosetItem(input: $input) {
        id
        title
        status
        audience
        mediaKey
        rawMediaKey
        category
        subcategory
        coinValue
        createdAt
        updatedAt
      }
    }
  `,
  // adminListPending now returns a connection (items + nextToken)
  listPending: /* GraphQL */ `
    query AdminListPending($limit: Int, $nextToken: String) {
      adminListPending(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          status
          mediaKey
          rawMediaKey
          createdAt
          updatedAt
          ownerSub
          audience
          category
          subcategory
          coinValue
        }
        nextToken
      }
    }
  `,
  // closetFeed returns a connection (items + nextToken)
  listPublished: /* GraphQL */ `
    query ClosetFeedAdminView($limit: Int, $nextToken: String) {
      closetFeed(sort: NEWEST, limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          status
          mediaKey
          rawMediaKey
          createdAt
          updatedAt
          ownerSub
          audience
          category
          subcategory
          coinValue
        }
        nextToken
      }
    }
  `,
  // used for "Delete" on activity grid – we still send a reason string,
  // but do NOT request `reason` back in the selection set
  rejectAsDelete: /* GraphQL */ `
    mutation AdminRejectItem($closetItemId: ID!, $reason: String) {
      adminRejectItem(closetItemId: $closetItemId, reason: $reason) {
        id
        status
      }
    }
  `,
  approve: /* GraphQL */ `
    mutation Approve($closetItemId: ID!) {
      adminApproveItem(closetItemId: $closetItemId) {
        id
        status
        updatedAt
        audience
      }
    }
  `,
  // review-mode reject – again, no `reason` field in the return type
  reject: /* GraphQL */ `
    mutation Reject($closetItemId: ID!, $reason: String) {
      adminRejectItem(closetItemId: $closetItemId, reason: $reason) {
        id
        status
        updatedAt
      }
    }
  `,
  setAudience: /* GraphQL */ `
    mutation SetAudience($closetItemId: ID!, $audience: ClosetAudience!) {
      adminSetClosetAudience(
        closetItemId: $closetItemId
        audience: $audience
      ) {
        audience
      }
    }
  `,
};

const AUDIENCE_OPTIONS = [
  { value: "PUBLIC", label: "Fan + Bestie" },
  { value: "BESTIES", label: "Bestie only" },
  { value: "EXCLUSIVE", label: "Exclusive drop" },
];

// High-level closet categories
const CATEGORY_OPTIONS = [
  { value: "", label: "Select category" },
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

// Subcategories per category
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

// NOTE: prefer rawMediaKey first (matches ClosetLibrary)
function effectiveKey(item) {
  const k = item.rawMediaKey || item.mediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
}

/**
 * Build mediaUrl per item using signed URL, with fallback to public CDN.
 * We just trust the key from rawMediaKey/mediaKey – no auto "closet/" prefix.
 */
async function hydrateItems(items) {
  return Promise.all(
    items.map(async (item) => {
      const key = effectiveKey(item);
      if (!key) return { ...item, mediaUrl: null };

      let url = null;

      try {
        url = await getSignedGetUrl(key);
        if (url) {
          // eslint-disable-next-line no-console
          console.log("[ClosetUpload] signed URL ok", { key, url });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[ClosetUpload] getSignedGetUrl failed → fallback", {
          key,
          error: err,
        });
      }

      if (!url && PUBLIC_UPLOADS_CDN) {
        const encodedKey = String(key)
          .replace(/^\/+/, "") // strip only leading slashes
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");

        url = PUBLIC_UPLOADS_CDN.replace(/\/+$/, "") + "/" + encodedKey;
        // eslint-disable-next-line no-console
        console.log("[ClosetUpload] Fallback URL built:", { key, url });
      }

      return { ...item, mediaUrl: url || null };
    })
  );
}

function humanStatusLabel(item) {
  const status = item.status || "UNKNOWN";
  const hasCutout = !!item.mediaKey;
  const hasAnyImage = !!(item.mediaKey || item.rawMediaKey);

  // If we're pending but *no* image key yet, treat as still processing
  if (status === "PENDING" && !hasAnyImage) {
    return "processing bg";
  }

  // In this dev stack we treat rawMediaKey as “good enough” to review
  if (status === "PENDING" && hasAnyImage) {
    return hasCutout ? "cutout ready" : "ready to review";
  }

  return status.toLowerCase();
}

function randomId() {
  const g = window.crypto;
  if (g?.randomUUID) return g.randomUUID();
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function ClosetUpload() {
  // Form fields
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("");
  const [vibes, setVibes] = useState("");
  const [coinValue, setCoinValue] = useState(""); // string so "" can mean "unset"

  // NEW: categorization fields
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // Files + preview
  const [files, setFiles] = useState([]); // Array<File>
  const [previewUrl, setPreviewUrl] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadDetails, setUploadDetails] = useState([]);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Admin list state
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | PUBLISHED | REJECTED

  // Review-state (merged queue)
  const [viewMode, setViewMode] = useState("ACTIVITY"); // ACTIVITY | REVIEW
  const [busyId, setBusyId] = useState(null);

  // Auto-update timer
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  const fileInputRef = useRef(null);

  // ------- File handling / preview -------

  useEffect(() => {
    if (!files.length) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  function addFiles(newFiles) {
    if (!newFiles?.length) return;
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name + f.size));
      const unique = Array.from(newFiles).filter(
        (f) => !existingNames.has(f.name + f.size)
      );
      return [...prev, ...unique];
    });
  }

  function handleFileInputChange(e) {
    const list = e.target.files;
    if (!list) return;
    addFiles(list);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }

  function clearFiles() {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ------- Upload submit (multi-file) -------

  async function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setUploadMsg("");
    setUploadDetails([]);

    if (!files.length) {
      setUploadMsg("Please add at least one image.");
      return;
    }

    try {
      setUploading(true);
      const total = files.length;
      const results = [];

      setUploadMsg(`Uploading ${total} item${total > 1 ? "s" : ""}…`);

      for (let idx = 0; idx < files.length; idx += 1) {
        const file = files[idx];
        const baseTitle = title.trim();
        const itemTitle =
          baseTitle ||
          file.name.replace(/\.[a-z0-9]+$/i, "") ||
          "Untitled look";

        results.push(`Uploading “${itemTitle}”…`);

        // Build a simple filename; the uploads Lambda will prefix with `closet/`
        const ext =
          (file.name.split(".").pop() || "jpg")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "jpg";
        const uploadKey = `${randomId()}.${ext}`;

        const up = await signedUpload(file, {
          key: uploadKey,
          kind: "closet",
        });
        const rawMediaKey = up.key; // e.g. "closet/…jpg"

        const input = {
          title: itemTitle,
          rawMediaKey,
          ...(season.trim() ? { season: season.trim() } : {}),
          ...(vibes.trim() ? { vibes: vibes.trim() } : {}),
          ...(category ? { category } : {}),
          ...(subcategory ? { subcategory } : {}),
          coinValue: coinValue === "" ? null : Number(coinValue) || 0,
        };

        const data = await window.sa.graphql(GQL.create, { input });
        const created = data?.adminCreateClosetItem;

        if (created) {
          results.push(
            `✔ Created “${created.title}” (status: ${
              created.status
            }) at ${new Date(created.createdAt).toLocaleString()}`
          );
        } else {
          results.push(
            `⚠ Created item for “${itemTitle}”, but GraphQL response was empty.`
          );
        }
      }

      setUploadMsg(
        `Finished uploading ${total} item${
          total > 1 ? "s" : ""
        }. Background removal will run shortly, then you can approve them from the Closet dashboard.`
      );
      setUploadDetails(results);

      clearFiles();
      setTitle("");
      setSeason("");
      setVibes("");
      setCategory("");
      setSubcategory("");
      setCoinValue(""); // reset to empty string

      await loadItems();
      setViewMode("REVIEW"); // jump to review after an upload
    } catch (err) {
      console.error(err);
      setUploadMsg(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  // ------- Admin list: load + filter (with thumbnails) -------

  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");
    try {
      const [pendingData, publishedData] = await Promise.all([
        window.sa.graphql(GQL.listPending, {}),
        window.sa.graphql(GQL.listPublished, {
          limit: 40,
          nextToken: null,
        }),
      ]);

      // adminListPending is a connection
      const pendingPage = pendingData?.adminListPending;
      const pending = pendingPage?.items ?? [];

      // closetFeed is a connection
      let published = [];
      const cf = publishedData?.closetFeed;
      if (Array.isArray(cf)) {
        published = cf;
      } else if (cf && Array.isArray(cf.items)) {
        published = cf.items;
      }

      const byId = {};
      for (const item of pending) {
        byId[item.id] = { ...item };
      }
      for (const item of published) {
        byId[item.id] = { ...byId[item.id], ...item };
      }

      const merged = Object.values(byId).sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      const hydrated = await hydrateItems(merged);

      setItems(hydrated);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);
    } catch (err) {
      console.error(err);
      setItemsError(err?.message || "Failed to load closet items.");
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  // polling every ~20s
  useEffect(() => {
    const id = setInterval(() => {
      loadItems();
    }, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live "auto-updated Xs ago" timer
  useEffect(() => {
    if (!lastUpdatedAt) return undefined;
    const id = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter !== "ALL" && item.status !== statusFilter) {
          return false;
        }
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (item.title || "").toLowerCase().includes(q);
      }),
    [items, search, statusFilter]
  );

  // For review mode: always pending-only, regardless of statusFilter
  const pendingItems = useMemo(
    () =>
      items.filter((item) => {
        if (item.status !== "PENDING") return false;
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (item.title || "").toLowerCase().includes(q);
      }),
    [items, search]
  );

  const itemCount = filteredItems.length;
  const previewItems = filteredItems.slice(0, GRID_PREVIEW_LIMIT);
  const hasMore = itemCount > GRID_PREVIEW_LIMIT;

  // ------- Delete (soft delete via reject) -------

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Delete (reject) this closet item? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await window.sa.graphql(GQL.rejectAsDelete, {
        closetItemId: id,
        reason: "Deleted from admin upload page",
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete item.");
    }
  }

  // ------- Review actions (approve / reject / audience) -------

  function updateLocalAudience(id, audience) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, audience } : it))
    );
  }

  async function saveAudience(id, audience) {
    try {
      setBusyId(id);
      await window.sa.graphql(GQL.setAudience, {
        closetItemId: id,
        audience,
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to save audience.");
    } finally {
      setBusyId(null);
    }
  }

  async function approveItem(item) {
    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.approve, { closetItemId: item.id });
      const audience = item.audience || "PUBLIC";
      await window.sa.graphql(GQL.setAudience, {
        closetItemId: item.id,
        audience,
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to approve item.");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectItem(item) {
    const reason = window.prompt("Reason for rejection? (optional)") || null;
    if (!window.confirm("Reject this closet item?")) return;

    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.reject, {
        closetItemId: item.id,
        reason,
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to reject item.");
    } finally {
      setBusyId(null);
    }
  }

  // ------- Render -------

  const autoLabel =
    lastUpdatedAt == null
      ? "—"
      : secondsSinceUpdate < 2
      ? "just now"
      : `${secondsSinceUpdate}s ago`;

  const isReviewMode = viewMode === "REVIEW";
  const reviewList = pendingItems;

  const currentSubcats = SUBCATEGORY_BY_CATEGORY[category] || [];

  return (
    <div className="closet-admin-page">
      <style>{closetUploadStyles}</style>

      {/* Header banner */}
      <header className="closet-admin-header">
        <div className="closet-admin-title-block">
          <span className="closet-admin-kicker">
            STYLING ADVENTURES WITH LALA
          </span>
          <h1>
            Admin Closet Studio{" "}
            <span className="closet-admin-emoji" role="img" aria-label="dress">
              👗
            </span>
          </h1>
          <p>
            Upload new looks, keep the closet tidy, and make the fan side feel
            like a curated boutique.
          </p>
        </div>

        <div className="closet-admin-header-right">
          <span className="closet-admin-pill">ADMIN PORTAL</span>
          <div className="closet-admin-count-block">
            <span className="closet-admin-count">
              Closet items: <strong>{items.length}</strong>
            </span>
            <span className="closet-admin-count">
              Auto-updated <strong>{autoLabel}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Two-column studio layout */}
      <div className="closet-admin-shell">
        {/* LEFT: Upload panel */}
        <section className="sa-card closet-upload-card">
          <header className="closet-card-header">
            <div>
              <h2 className="closet-card-title">Upload new looks</h2>
              <p className="closet-card-sub">
                Drag in outfit photos from your camera roll, add a title, and
                send them into the background-removal queue.
              </p>
            </div>
          </header>

          {/* Dropzone */}
          <div
            className={
              "closet-dropzone" +
              (isDragging ? " closet-dropzone--active" : "")
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="closet-drop-icon">⬆️</div>
            <div className="closet-drop-title">Drop outfit images here</div>
            <div className="closet-drop-text">
              Or click to select from your computer. JPG / PNG, up to a few at
              a time.
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
          </div>

          {/* File summary + preview */}
          {files.length > 0 && (
            <div className="closet-file-summary">
              <div className="closet-file-summary-header">
                <span>
                  {files.length} file{files.length === 1 ? "" : "s"} ready to
                  upload
                </span>
                <button
                  type="button"
                  className="sa-link"
                  onClick={clearFiles}
                  disabled={uploading}
                >
                  Clear
                </button>
              </div>
              <ul className="closet-file-list">
                {files.map((f) => (
                  <li key={f.name + f.size}>
                    {f.name}{" "}
                    <span className="sa-muted">
                      ({Math.round(f.size / 1024)} KB)
                    </span>
                  </li>
                ))}
              </ul>
              <div className="closet-preview-row">
                <div className="closet-preview-frame">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="closet-preview-img"
                    />
                  ) : (
                    <span className="sa-muted">Preview</span>
                  )}
                </div>
                <p className="closet-preview-caption">
                  The first image will be used for the thumbnail preview. You
                  can upload multiple items in one batch – each file becomes its
                  own closet item.
                </p>
              </div>
            </div>
          )}

          {/* Upload form fields */}
          <div className="closet-upload-fields">
            <div className="closet-field">
              <label className="closet-field-label">Title (optional)</label>
              <input
                className="sa-input"
                placeholder="Name this look…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="closet-field-hint">
                If left blank, we&apos;ll use the file name as the title.
              </div>
            </div>

            <div className="closet-upload-row">
              <div className="closet-field">
                <label className="closet-field-label">Season (optional)</label>
                <input
                  className="sa-input"
                  placeholder="e.g. Spring 2025"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                />
              </div>
              <div className="closet-field">
                <label className="closet-field-label">Vibes (optional)</label>
                <input
                  className="sa-input"
                  placeholder="e.g. Date night, brunch, red carpet"
                  value={vibes}
                  onChange={(e) => setVibes(e.target.value)}
                />
              </div>
            </div>

            {/* Category + subcategory */}
            <div className="closet-upload-row">
              <div className="closet-field">
                <label className="closet-field-label">Category</label>
                <select
                  className="sa-input"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory("");
                  }}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="closet-field">
                <label className="closet-field-label">Subcategory</label>
                <select
                  className="sa-input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={!category}
                >
                  <option value="">
                    {category ? "Select subcategory" : "Choose a category first"}
                  </option>
                  {currentSubcats.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Coin value */}
            <div className="closet-field">
              <label className="closet-field-label">Coin value</label>
              <input
                type="number"
                min="0"
                step="1"
                className="sa-input"
                placeholder="Optional – how many coins this look is worth"
                value={coinValue}
                onChange={(e) => setCoinValue(e.target.value)}
              />
              <div className="closet-field-hint">
                Fans can earn + spend coins in Lala&apos;s world. Leave blank
                for no coin value yet.
              </div>
            </div>
          </div>

          {/* Upload status + button */}
          {uploadMsg && (
            <div className="closet-upload-status">
              {uploadMsg}
              {uploadDetails.length > 0 && (
                <ul>
                  {uploadDetails.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button
            type="button"
            className="closet-upload-btn"
            disabled={uploading || files.length === 0}
            onClick={handleSubmit}
          >
            {uploading
              ? "Uploading looks…"
              : files.length
              ? `Upload ${files.length} look${
                  files.length === 1 ? "" : "s"
                } to queue`
              : "Add images to upload"}
          </button>

          <div className="closet-footer-note">
            Background removal runs automatically after upload. Once items are
            ready, you can approve them on the right and choose their audience.
          </div>
        </section>

        {/* RIGHT: Activity / Review dashboard */}
        <section className="sa-card closet-dashboard-card">
          <div className="closet-dashboard-header">
            <div>
              <h2 className="closet-card-title">Closet activity</h2>
              <p className="closet-card-sub">
                See what&apos;s in the queue, what&apos;s live in the fan
                closet, and quickly approve or reject new uploads.
              </p>
            </div>
            <div className="closet-auto-meta">
              <div className="closet-auto-block">
                <span className="closet-auto-label">Auto-update</span>
                <span className="closet-auto-value">{autoLabel}</span>
              </div>
              <button
                type="button"
                className="closet-filter-refresh"
                onClick={loadItems}
                disabled={itemsLoading}
              >
                {itemsLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="closet-tabs">
            <button
              type="button"
              className={
                "closet-tab" +
                (viewMode === "ACTIVITY" ? " closet-tab--active" : "")
              }
              onClick={() => setViewMode("ACTIVITY")}
            >
              Activity
              <span className="closet-tab-count">{items.length}</span>
            </button>
            <button
              type="button"
              className={
                "closet-tab" +
                (viewMode === "REVIEW" ? " closet-tab--active" : "")
              }
              onClick={() => setViewMode("REVIEW")}
            >
              Review queue
              <span className="closet-tab-count">{pendingItems.length}</span>
            </button>
          </div>

          {/* Filters row */}
          <div className="closet-filters-row" style={{ marginTop: 10 }}>
            <select
              className="closet-filter-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={isReviewMode}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              className="closet-filter-input"
              placeholder="Search titles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="closet-filter-pill">
              Showing{" "}
              <strong>{isReviewMode ? pendingItems.length : itemCount}</strong>{" "}
              looks
            </div>
          </div>

          {/* Error */}
          {itemsError && (
            <div className="closet-grid-error" style={{ marginTop: 8 }}>
              {itemsError}
            </div>
          )}

          {/* ACTIVITY GRID */}
          {!isReviewMode && (
            <>
              {itemCount === 0 && !itemsLoading && !itemsError && (
                <div className="closet-grid-empty" style={{ marginTop: 12 }}>
                  No closet activity yet. Once you upload looks, they&apos;ll
                  appear here.
                </div>
              )}

              <div className="closet-grid" style={{ marginTop: 10 }}>
                {previewItems.map((item) => {
                  const status = item.status || "UNKNOWN";
                  const label = humanStatusLabel(item);

                  let statusClass = "closet-status-pill--default";
                  if (status === "PUBLISHED")
                    statusClass = "closet-status-pill--published";
                  else if (status === "PENDING")
                    statusClass = "closet-status-pill--pending";
                  else if (status === "REJECTED")
                    statusClass = "closet-status-pill--rejected";

                  return (
                    <article
                      key={item.id}
                      className="closet-grid-card closet-grid-card--activity"
                    >
                      <div className="closet-grid-thumb">
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
                          {isNew(item.createdAt) && (
                            <span className="closet-badge-new">New</span>
                          )}
                        </div>
                        <div className="closet-grid-meta">
                          <span
                            className={"closet-status-pill " + statusClass}
                          >
                            {label}
                          </span>
                          {item.audience && (
                            <span className="closet-grid-audience">
                              {item.audience.toLowerCase()}
                            </span>
                          )}
                        </div>
                        <div className="closet-grid-footer">
                          <span className="closet-grid-date">
                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                          <div className="closet-grid-actions">
                            <button
                              type="button"
                              className="closet-grid-link closet-grid-link--danger"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {hasMore && (
                <div className="closet-grid-footer-row">
                  Showing {previewItems.length} of {itemCount} looks. Use the
                  Closet Library page to browse everything.
                </div>
              )}
            </>
          )}

          {/* REVIEW GRID */}
          {isReviewMode && (
            <>
              {reviewList.length === 0 && !itemsLoading && !itemsError && (
                <div className="closet-grid-empty" style={{ marginTop: 12 }}>
                  Nothing pending review right now. Upload new looks on the left
                  to start a fresh batch.
                </div>
              )}

              <div className="closet-grid closet-grid--review">
                {reviewList.map((item) => {
                  const readyForReview = !!(
                    item.mediaKey || item.rawMediaKey
                  );
                  const hasCutout = !!item.mediaKey;
                  const hasAnyImage = !!(item.mediaKey || item.rawMediaKey);
                  const isBusy = busyId === item.id;

                  const audienceVal = item.audience || "PUBLIC";

                  return (
                    <article
                      key={item.id}
                      className="closet-grid-card closet-grid-card--review"
                    >
                      <div className="closet-grid-thumb">
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

                        <div className="closet-review-pills">
                          {!hasAnyImage && (
                            <span className="closet-bg-pill">
                              Processing background…
                            </span>
                          )}
                          {hasAnyImage && !hasCutout && (
                            <span className="closet-bg-pill closet-bg-pill--ready">
                              Original photo
                            </span>
                          )}
                          {hasCutout && (
                            <span className="closet-bg-pill closet-bg-pill--ready">
                              Cutout ready
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="closet-grid-body closet-grid-body--review">
                        <div className="closet-grid-title-row">
                          <div className="closet-grid-main-title">
                            {item.title || "Untitled look"}
                          </div>
                          {isNew(item.createdAt) && (
                            <span className="closet-badge-new">New</span>
                          )}
                        </div>

                        <div className="closet-grid-meta closet-grid-meta--review">
                          <span className="pill-soft">
                            {item.category || "Uncategorized"}
                          </span>
                          <span className="closet-grid-audience">
                            {audienceVal.toLowerCase()}
                          </span>
                        </div>

                        <div className="closet-review-audience-row">
                          <label className="closet-review-label">
                            Audience
                          </label>
                          <select
                            className="sa-input closet-review-audience"
                            value={audienceVal}
                            disabled={isBusy}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateLocalAudience(item.id, val);
                              saveAudience(item.id, val);
                            }}
                          >
                            {AUDIENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="closet-review-hint">
                            Choose whether this look is visible to all fans,
                            besties only, or saved for a special drop.
                          </div>
                        </div>

                        <div className="closet-review-actions">
                          <button
                            type="button"
                            className="closet-review-approve"
                            disabled={isBusy || !readyForReview}
                            onClick={() => approveItem(item)}
                          >
                            {isBusy
                              ? "Working…"
                              : readyForReview
                              ? "Approve look"
                              : "Waiting on bg…"}
                          </button>

                          <button
                            type="button"
                            className="closet-review-reject sa-link"
                            disabled={isBusy}
                            onClick={() => rejectItem(item)}
                          >
                            Reject
                          </button>
                        </div>

                        <div className="closet-grid-footer-row">
                          Uploaded{" "}
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const closetUploadStyles = /* css */ `
  ${/* your existing CSS unchanged – kept exactly as you pasted */""}
` + `
.closet-admin-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HEADER -------------------------------------------------- */

.closet-admin-header {
  background:
    radial-gradient(circle at top left,#fce7f3,#f9fafb 60%),
    radial-gradient(circle at bottom right,#e0e7ff,#ffffff);
  border-radius:26px;
  padding:18px 22px;
  box-shadow:0 18px 40px rgba(148,163,184,0.32);
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
}

.closet-admin-title-block {
  display:flex;
  flex-direction:column;
  gap:4px;
}

.closet-admin-kicker {
  font-size:11px;
  letter-spacing:0.18em;
  text-transform:uppercase;
  color:#9ca3af;
  font-weight:600;
}

.closet-admin-title-block h1 {
  margin:0;
  font-size:22px;
  letter-spacing:-0.02em;
  display:flex;
  align-items:center;
  gap:6px;
}

.closet-admin-emoji {
  font-size:22px;
}

.closet-admin-title-block p {
  margin:2px 0 0;
  font-size:13px;
  color:#4b5563;
  max-width:520px;
}

.closet-admin-header-right {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:8px;
}

.closet-admin-pill {
  padding:3px 10px;
  border-radius:999px;
  background:#020617;
  color:#f9fafb;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.14em;
}

.closet-admin-count-block {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:2px;
}

.closet-admin-count {
  font-size:12px;
  color:#6b7280;
}

@media (max-width: 768px) {
  .closet-admin-header {
    flex-direction:column;
    align-items:flex-start;
  }
  .closet-admin-header-right {
    align-items:flex-start;
  }
}

/* SHELL -------------------------------------------------- */

.closet-admin-shell {
  display:grid;
  grid-template-columns:minmax(0, 340px) minmax(0, 1fr);
  gap:18px;
}

@media (max-width: 960px) {
  .closet-admin-shell {
    grid-template-columns:minmax(0,1fr);
  }
}

/* SHARED CARD HEADER ------------------------------------- */

.closet-card-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:10px;
}

.closet-card-title {
  margin:0;
  font-size:17px;
  font-weight:600;
}

.closet-card-sub {
  margin:4px 0 0;
  font-size:13px;
  color:#6b7280;
}

/* UPLOAD CARD -------------------------------------------- */

.closet-upload-card {
  background:#fdfbff;
  border-radius:22px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 36px rgba(148,163,184,0.28);
  padding:16px 18px 18px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* Dropzone */

.closet-dropzone {
  margin-top:4px;
  border-radius:20px;
  padding:26px 18px;
  border:1px dashed #d1d5db;
  background:#fbf4ff;
  text-align:center;
  cursor:pointer;
  transition:border-color .15s ease, background .15s ease, box-shadow .15s ease, transform .08s ease;
}

.closet-dropzone--active {
  border-color:#a855f7;
  background:#f3e8ff;
  box-shadow:0 0 0 2px rgba(168,85,247,0.18);
  transform:translateY(-1px);
}

.closet-drop-icon {
  width:34px;
  height:34px;
  margin:0 auto 6px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#ede9fe;
  color:#6d28d9;
  font-size:18px;
}

.closet-drop-title {
  font-size:14px;
  font-weight:600;
}

.closet-drop-text {
  margin-top:2px;
  font-size:12px;
  color:#6b7280;
}

/* Upload fields --------------- */

.closet-upload-fields {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #e5e7eb;
  display: grid;
  gap: 12px;
}

.closet-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.closet-field-label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.closet-field-hint {
  font-size: 11px;
  color: #9ca3af;
}

.closet-upload-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 720px) {
  .closet-upload-row {
    grid-template-columns: 1fr;
  }
}

/* pill inputs */
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

.sa-input::placeholder {
  color:#c4c4d3;
}

.sa-input:focus {
  border-color:#a855f7;
  box-shadow:0 0 0 1px rgba(168,85,247,0.25);
}

/* File summary + preview */

.closet-file-summary {
  margin-top:8px;
  padding:8px 10px;
  border-radius:14px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  font-size:12px;
}

.closet-file-summary-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:4px;
}

.closet-file-list {
  list-style:disc;
  padding-left:18px;
  margin:0;
  max-height:110px;
  overflow-y:auto;
}

.sa-muted {
  color:#9ca3af;
}

.closet-preview-row {
  margin-top:8px;
  display:flex;
  gap:10px;
  align-items:flex-start;
}

.closet-preview-frame {
  width:160px;
  height:160px;
  border-radius:18px;
  overflow:hidden;
  border:1px solid #e5e7eb;
  background:linear-gradient(135deg,#fdf2ff,#e0f2fe);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  padding:8px;
}

/* upgraded to better handle arbitrary aspect ratios */
.closet-preview-img {
  max-width:100%;
  max-height:100%;
  width:auto;
  height:auto;
  object-fit:contain;
  display:block;
}

.closet-preview-caption {
  font-size:12px;
  color:#6b7280;
  margin:0;
}

.closet-upload-status {
  margin-top:10px;
  padding:8px 10px;
  border-radius:12px;
  background:#eef2ff;
  border:1px solid #e5e7eb;
  font-size:12px;
}

.closet-upload-status ul {
  margin:4px 0 0;
  padding-left:18px;
}

.closet-upload-btn {
  margin-top:10px;
  width:100%;
  border:none;
  border-radius:999px;
  height:40px;
  font-size:14px;
  font-weight:600;
  cursor:pointer;
  background:linear-gradient(135deg,#a855f7,#6366f1);
  color:#fff;
  box-shadow:0 14px 30px rgba(129,140,248,0.6);
  transition:transform .05s ease, box-shadow .15s ease, opacity .15s ease;
}

.closet-upload-btn:hover:enabled {
  transform:translateY(-1px);
  box-shadow:0 18px 38px rgba(129,140,248,0.7);
}

.closet-upload-btn:disabled {
  opacity:0.7;
  cursor:not-allowed;
  box-shadow:none;
}

.closet-footer-note {
  margin-top:8px;
  font-size:11px;
  color:#9ca3af;
}

/* DASHBOARD CARD ----------------------------------------- */

.closet-dashboard-card {
  background:#f8f5ff;
  border-radius:22px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 36px rgba(148,163,184,0.28);
  padding:16px 18px 18px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.closet-dashboard-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
}

.closet-auto-meta {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:6px;
}

.closet-auto-block {
  font-size:11px;
  text-align:right;
}

.closet-auto-label {
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#9ca3af;
  display:block;
}

.closet-auto-value {
  font-weight:600;
  font-size:12px;
}

.closet-admin-viewlink {
  font-size:11px;
  color:#4f46e5;
  text-decoration:none;
}

.closet-admin-viewlink:hover {
  text-decoration:underline;
}

/* Tabs --------------------------------------------------- */

.closet-tabs {
  margin-top:10px;
  display:inline-flex;
  padding:3px;
  border-radius:999px;
  background:#f3f4ff;
  box-shadow:inset 0 0 0 1px rgba(148,163,184,0.35);
}

.closet-tab {
  border-radius:999px;
  border:none;
  padding:6px 12px;
  font-size:11px;
  cursor:pointer;
  background:transparent;
  color:#6b7280;
  display:flex;
  align-items:center;
  gap:6px;
}

.closet-tab--active {
  background:#ffffff;
  color:#111827;
  box-shadow:0 3px 9px rgba(148,163,184,0.35);
}

.closet-tab-count {
  min-width:16px;
  height:16px;
  padding:0 4px;
  border-radius:999px;
  background:#eef2ff;
  font-size:10px;
  display:flex;
  align-items:center;
  justify-content:center;
}

/* Filters row */

.closet-filters-row {
  margin-top:10px;
  display:grid;
  grid-template-columns:minmax(0,140px) minmax(0,1fr) 180px auto;
  gap:8px;
  align-items:center;
}

.closet-filter-input {
  border-radius:999px;
  border:1px solid #e5e7eb;
  padding:7px 12px;
  font-size:13px;
  background:#f9fafb;
}

.closet-filter-refresh {
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  padding:7px 14px;
  font-size:13px;
  cursor:pointer;
}

.closet-filter-refresh:disabled {
  opacity:0.7;
  cursor:not-allowed;
}

.closet-filter-pill {
  font-size:12px;
  color:#6b7280;
  padding:7px 12px;
  border-radius:999px;
  background:#f3f4ff;
  border:1px solid #e5e7eb;
}

@media (max-width: 720px) {
  .closet-filters-row {
    grid-template-columns:minmax(0,1fr);
  }
}

/* GRID – Shared ------------------------------------------ */

.closet-grid-header {
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  margin-top:6px;
}

.closet-grid-header--review {
  align-items:center;
}

.closet-grid-title {
  font-size:13px;
  color:#6b7280;
}

.closet-grid-hint {
  font-size:12px;
  color:#9ca3af;
}

.closet-grid-error {
  margin-top:8px;
  padding:8px 10px;
  border-radius:10px;
  background:#fef2f2;
  color:#b91c1c;
  font-size:12px;
}

.closet-grid-empty {
  margin-top:12px;
  font-size:13px;
  color:#6b7280;
}

.closet-grid {
  margin-top:10px;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:12px;
}

.closet-grid--review {
  grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
}

.closet-grid-card {
  background:#f4ebff;
  border-radius:18px;
  padding:8px;
  border:1px solid #e5e0ff;
  display:flex;
  flex-direction:column;
  gap:6px;
  box-shadow:0 10px 26px rgba(148,163,184,0.4);
}

.closet-grid-card--review {
  background:#fef9ff;
}

/* Thumbs */

.closet-grid-thumb {
  position:relative;
  border-radius:16px;
  background:linear-gradient(135deg,#fdf2ff,#e0f2fe);
  overflow:hidden;
  height:220px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px;
  cursor:pointer;
  transition:transform .08s ease, box-shadow .15s ease;
}

.closet-grid-thumb:hover {
  transform:translateY(-1px);
  box-shadow:0 10px 24px rgba(148,163,184,0.35);
}

.closet-grid-thumb img {
  max-width:100%;
  max-height:100%;
  width:auto;
  height:auto;
  object-fit:contain;
  display:block;
}

.closet-grid-thumb-empty {
  font-size:12px;
  color:#6b7280;
}

/* Pills on image (review mode) */

.closet-review-pills {
  position:absolute;
  left:10px;
  top:10px;
  display:flex;
  gap:6px;
}

.closet-bg-pill {
  padding:2px 7px;
  border-radius:999px;
  background:#fee2e2;
  color:#b91c1c;
  font-size:10px;
}

.closet-bg-pill--ready {
  background:#dcfce7;
  color:#166534;
}

/* Grid body */

.closet-grid-body {
  display:flex;
  flex-direction:column;
  gap:4px;
}

.closet-grid-body--review {
  padding-top:2px;
}

.closet-grid-title-row {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
}

.closet-grid-main-title {
  font-size:13px;
  font-weight:600;
  white-space:nowrap;
  text-overflow:ellipsis;
  overflow:hidden;
}

.closet-badge-new {
  font-size:10px;
  padding:2px 6px;
  border-radius:999px;
  background:#fef3c7;
  color:#92400e;
}

.closet-grid-meta {
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:11px;
}

.closet-grid-meta--review {
  margin-top:2px;
}

.closet-grid-audience {
  font-size:11px;
  color:#6b7280;
}

/* Category tags */

.closet-grid-tags {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  margin-top:2px;
}

.closet-grid-tag {
  font-size:10px;
  padding:2px 8px;
  border-radius:999px;
  background:#eef2ff;
  color:#3730a3;
}

.closet-grid-tag--soft {
  background:#f9fafb;
  color:#6b7280;
}

/* Status pills */

.closet-status-pill {
  border-radius:999px;
  padding:2px 8px;
  font-size:11px;
  text-transform:lowercase;
}

.closet-status-pill--default {
  background:#e5e7eb;
  color:#374151;
}
.closet-status-pill--pending {
  background:#fef3c7;
  color:#92400e;
}
.closet-status-pill--published {
  background:#ecfdf3;
  color:#166534;
}
.closet-status-pill--rejected {
  background:#fee2e2;
  color:#b91c1c;
}

/* Grid footer */

.closet-grid-footer {
  margin-top:4px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:11px;
}

.closet-grid-date {
  color:#9ca3af;
}

.closet-grid-actions {
  display:flex;
  gap:6px;
}

.closet-grid-link {
  border:none;
  background:transparent;
  padding:2px 6px;
  font-size:11px;
  border-radius:999px;
  cursor:pointer;
  color:#4b5563;
  background:rgba(249,250,251,0.9);
}

.closet-grid-link:hover {
  background:#eef2ff;
  color:#111827;
}

.closet-grid-link--danger {
  color:#b91c1c;
  background:#fef2f2;
}

.closet-grid-link--danger:hover {
  background:#fee2e2;
}

.closet-grid-footer-row {
  margin-top:8px;
  font-size:12px;
  color:#6b7280;
}

/* REVIEW controls ---------------------------------------- */

.closet-review-audience-row {
  margin-top:6px;
  display:flex;
  flex-direction:column;
  gap:4px;
}

.closet-review-label {
  font-size:11px;
  font-weight:600;
}

.closet-review-audience {
  max-width:200px;
}

.closet-review-hint {
  margin-top:4px;
  font-size:11px;
  color:#9ca3af;
}

.closet-review-actions {
  margin-top:8px;
  display:flex;
  gap:8px;
  align-items:center;
}

.closet-review-approve {
  border-radius:999px;
  padding:6px 14px;
  border:none;
  background:#4ade80;
  font-size:13px;
  cursor:pointer;
}

.closet-review-reject {
  font-size:12px;
  color:#b91c1c;
}

/* Utility pills */

.pill-soft {
  padding:2px 8px;
  border-radius:999px;
  background:#eef2ff;
}

/* Tiny button + link helpers ---------------------------- */

.sa-link {
  border:none;
  background:none;
  padding:0;
  font-size:13px;
  color:#4f46e5;
  text-decoration:underline;
  cursor:pointer;
}

.sa-btn {
  border-radius:999px;
  border:1px solid transparent;
  padding:6px 12px;
  font-size:13px;
  cursor:pointer;
}
`;

