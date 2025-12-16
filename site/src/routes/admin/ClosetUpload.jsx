// site/src/routes/admin/ClosetUpload.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getIdToken, getSignedGetUrl, signedUpload } from "../../lib/sa";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const AUTO_REFRESH_MS = 20_000;

// ---------- config helpers (window.__cfg + window.sa bridge) ----------
function readCfg() {
  // window.__cfg is set by public/sa.js
  const jsonCfg = window.__cfg || {};
  const compatCfg = window.sa?.cfg || window.sa?.config || {};
  return { ...jsonCfg, ...compatCfg };
}

function normalizeBaseUrl(u) {
  return String(u || "").trim().replace(/\/+$/, "");
}

function encodeKeyForUrl(key) {
  return String(key || "")
    .replace(/^\/+/, "")
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

// Prefer config-driven URLs
const PUBLIC_UPLOADS_CDN = normalizeBaseUrl(
  readCfg().cloudFrontUrl ||
    readCfg().publicUploadsCdn ||
    readCfg().uploadsCdn ||
    "https://d3fghr37bcpbig.cloudfront.net",
);

// ✅ Admin REST API (BestiesClosetStack HttpApi)
const ADMIN_API_BASE = normalizeBaseUrl(
  readCfg().adminApiUrl ||
    // legacy fallback
    "https://asf706c16e.execute-api.us-east-1.amazonaws.com",
);

// ---------- auth helpers ----------
function pickSubFromWindow() {
  // Most common places your app stores Cognito/JWT identity
  const cfg = readCfg();
  const fromSa =
    window.sa?.session?.idTokenPayload?.sub ||
    window.sa?.session?.sub ||
    window.sa?.user?.sub ||
    window.sa?.userId;

  const fromCfg =
    cfg?.idTokenPayload?.sub ||
    cfg?.session?.sub ||
    cfg?.user?.sub ||
    cfg?.userId;

  return fromSa || fromCfg || null;
}

function getFallbackUserId() {
  return pickSubFromWindow() || "admin-upload";
}

async function getAuthHeader() {
  const token = await getIdToken().catch(() => null);
  if (!token) return {};

  // If token already has Bearer prefix, keep it. Otherwise add it.
  const value = String(token).startsWith("Bearer ") ? String(token) : `Bearer ${token}`;
  return { Authorization: value };
}

// ---------- REST helpers ----------
async function fetchJsonOrText(url, options) {
  const res = await fetch(url, options);
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    // Keep body for easier debugging in UI
    throw new Error(text || `Request failed: HTTP ${res.status}`);
  }

  try {
    return text ? JSON.parse(text) : { ok: true };
  } catch {
    return { ok: true };
  }
}

async function startFanUploadWorkflow(payload) {
  const auth = await getAuthHeader();
  return fetchJsonOrText(`${ADMIN_API_BASE}/admin/fan/closet/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...auth,
    },
    body: JSON.stringify(payload),
  });
}

async function sendWorkflowDecision({ approvalId, decision, reason }) {
  const auth = await getAuthHeader();
  return fetchJsonOrText(`${ADMIN_API_BASE}/admin/closet/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...auth,
    },
    body: JSON.stringify({
      approvalId,
      decision,
      ...(reason ? { reason } : {}),
    }),
  });
}

// ---------- UI helpers ----------
function isNew(createdAt) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ONE_DAY_MS;
}

// Heuristic only (NOT truth): does the key *look like* a cutout output?
function looksLikeCutoutKey(mediaKey) {
  if (!mediaKey) return false;
  const mk = String(mediaKey);
  return /removed-bg\.(png|webp)$/i.test(mk) || /\/processed\//i.test(mk) || /cutout/i.test(mk);
}

// IMPORTANT: don't assume bg removed unless image actually has transparency.
// We verify by sampling alpha in the browser.
async function detectTransparencyFromUrl(url) {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return false;

    const blob = await res.blob();
    if (!/image\/(png|webp)/i.test(blob.type || "")) return false;

    const bmp = await createImageBitmap(blob);

    // Downscale for speed (max 128px on long edge)
    const max = 128;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(bmp, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // Sample every N pixels; any alpha < 250 means transparency exists.
    const stride = 4;
    const step = 8;
    const jump = stride * step;

    for (let i = 3; i < data.length; i += jump) {
      if (data[i] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function randomId() {
  const g = window.crypto;
  if (g?.randomUUID) return g.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Prefer verified cutout when available, otherwise raw photo.
async function hydrateItems(items) {
  const cfg = readCfg();

  const base = normalizeBaseUrl(
    cfg.thumbsCdn ||
      cfg.uploadsCdn ||
      cfg.uploadsUrl ||
      cfg.uploadsOrigin ||
      cfg.assetsBaseUrl ||
      cfg.mediaBaseUrl ||
      PUBLIC_UPLOADS_CDN ||
      "",
  );

  const buildCdnUrl = (key) => (base && key ? `${base}/${encodeKeyForUrl(key)}` : null);

  return Promise.all(
    items.map(async (item) => {
      const rawKey = item.rawMediaKey ? String(item.rawMediaKey).replace(/^\/+/, "") : null;
      const cutoutKey = item.mediaKey ? String(item.mediaKey).replace(/^\/+/, "") : null;

      let rawUrl = null;
      let cutoutUrl = null;

      try {
        if (rawKey) rawUrl = await getSignedGetUrl(rawKey);
      } catch {
        rawUrl = null;
      }
      if (!rawUrl && rawKey) rawUrl = buildCdnUrl(rawKey);

      try {
        if (cutoutKey) cutoutUrl = await getSignedGetUrl(cutoutKey);
      } catch {
        cutoutUrl = null;
      }
      if (!cutoutUrl && cutoutKey) cutoutUrl = buildCdnUrl(cutoutKey);

      const cutoutKeyLooksRight =
        !!cutoutKey && cutoutKey !== rawKey && looksLikeCutoutKey(cutoutKey);

      let cutoutVerified = false;
      if (cutoutKeyLooksRight && cutoutUrl) {
        cutoutVerified = await detectTransparencyFromUrl(cutoutUrl);
      }

      const chosenUrl = cutoutVerified ? cutoutUrl : rawUrl || cutoutUrl || null;

      return {
        ...item,
        rawUrl: rawUrl || null,
        cutoutUrl: cutoutUrl || null,
        cutoutKeyLooksRight,
        cutoutVerified,
        mediaUrl: chosenUrl,
      };
    }),
  );
}

function humanStatusLabel(item) {
  const status = item.status || "UNKNOWN";
  const hasAnyImage = !!(item.mediaKey || item.rawMediaKey);

  if (status === "PENDING" && !hasAnyImage) return "processing bg";
  if (status === "PENDING" && hasAnyImage) {
    if (item.cutoutVerified) return "cutout ready";
    if (item.cutoutKeyLooksRight && !item.cutoutVerified) return "processing cutout";
    return "waiting for cutout";
  }

  return String(status).toLowerCase();
}

// ---------- GraphQL ----------
const GQL = {
  listPending: /* GraphQL */ `
    query AdminListPending($limit: Int, $nextToken: String) {
      adminListPending(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          status
          audience
          mediaKey
          rawMediaKey
          category
          subcategory
          createdAt
          updatedAt
          ownerSub
          pinned
          favoriteCount
        }
        nextToken
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
      adminSetClosetAudience(closetItemId: $closetItemId, audience: $audience) {
        audience
      }
    }
  `,
};

const AUDIENCE_OPTIONS = [
  { value: "PUBLIC", label: "Fan + Bestie" },
  { value: "BESTIE", label: "Bestie only" },
  { value: "EXCLUSIVE", label: "Exclusive drop" },
];

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

const SUBCATEGORY_BY_CATEGORY = {
  Dresses: ["Mini dress", "Midi dress", "Maxi dress", "Bodycon", "Slip dress", "Party dress"],
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

export default function ClosetUpload() {
  // Form fields
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("");
  const [vibes, setVibes] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // Files + preview
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadDetails, setUploadDetails] = useState([]);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Review queue state (PENDING only)
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Auto-update timer
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  const fileInputRef = useRef(null);

  // ------- Preview -------
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
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const unique = Array.from(newFiles).filter((f) => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...unique];
    });
  }

  function clearFiles() {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileInputChange(e) {
    const list = e.target.files;
    if (list?.length) addFiles(list);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }

  // ------- Review queue load (PENDING only) -------
  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");
    try {
      await (window.sa?.ready?.() || Promise.resolve());

      const pendingData = await window.sa.graphql(GQL.listPending, { limit: 120, nextToken: null });
      const pending = pendingData?.adminListPending?.items ?? [];

      const hydrated = await hydrateItems(pending);

      hydrated.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setItems(hydrated);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setItemsError(err?.message || "Failed to load pending closet items.");
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => loadItems(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastUpdatedAt) return undefined;
    const id = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  const pendingItems = useMemo(() => items.filter((it) => it.status === "PENDING"), [items]);
  const pendingCount = pendingItems.length;

  // ------- Upload submit (multi-file) -------
  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
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

      const ownerSub = pickSubFromWindow() || getFallbackUserId();
      const userId = getFallbackUserId();

      // eslint-disable-next-line no-console
      console.log("[ClosetUpload] identity", { ownerSub, userId, ADMIN_API_BASE });

      setUploadMsg(`Uploading ${total} item${total > 1 ? "s" : ""}…`);

      for (let idx = 0; idx < files.length; idx += 1) {
        const file = files[idx];

        const baseTitle = title.trim();
        const itemTitle = baseTitle || file.name.replace(/\.[a-z0-9]+$/i, "") || "Untitled look";

        results.push(`Uploading “${itemTitle}”…`);

        const ext =
          (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

        const uploadKey = `${randomId()}.${ext}`;

        // 1) Upload raw image
        const up = await signedUpload(file, { key: uploadKey, kind: "closet" });
        const rawMediaKey = up.key;

        // 2) Start workflow
        const approvalId = randomId();

        // ✅ include ownerSub so backend doesn't need to infer it
        const startPayload = {
          id: approvalId,
          ownerSub, // <--- REQUIRED by your backend
          userId,
          s3Key: rawMediaKey,
          title: itemTitle,
          ...(season.trim() ? { season: season.trim() } : {}),
          ...(vibes.trim() ? { vibes: vibes.trim() } : {}),
          ...(category ? { category } : {}),
          ...(subcategory ? { subcategory } : {}),
        };

        const started = await startFanUploadWorkflow(startPayload);

        results.push(`✔ Queued “${itemTitle}” for review (id: ${approvalId.slice(0, 8)}…).`);
        // eslint-disable-next-line no-console
        console.log("[ClosetUpload] startFanUploadWorkflow ok", { approvalId, started });
      }

      setUploadMsg(
        `Finished uploading ${total} item${total > 1 ? "s" : ""}. They’re now in the review queue on the right.`,
      );
      setUploadDetails(results);

      clearFiles();
      setTitle("");
      setSeason("");
      setVibes("");
      setCategory("");
      setSubcategory("");

      await loadItems();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setUploadMsg(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  // ------- Actions (Review queue: PENDING only) -------
  function updateLocalAudience(id, audience) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, audience } : it)));
  }

  async function saveAudience(id, audience) {
    try {
      setBusyId(id);
      await window.sa.graphql(GQL.setAudience, { closetItemId: id, audience });
      await loadItems();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err?.message || "Failed to save audience.");
    } finally {
      setBusyId(null);
    }
  }

  async function approveItem(item) {
    if (!item?.id) return;

    try {
      setBusyId(item.id);
      await sendWorkflowDecision({ approvalId: item.id, decision: "APPROVE" });

      // Ensure audience is set (defaults to PUBLIC)
      const audience = item.audience || "PUBLIC";
      await window.sa.graphql(GQL.setAudience, { closetItemId: item.id, audience });

      await loadItems();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err?.message || "Failed to approve item.");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectItem(item, opts = {}) {
    const { deleteMode = false } = opts;

    const reason =
      deleteMode ? "Deleted from admin upload page" : window.prompt("Reason for rejection? (optional)") || null;

    const confirmText = deleteMode ? "Delete this closet item? This cannot be undone." : "Reject this closet item?";
    if (!window.confirm(confirmText)) return;

    try {
      setBusyId(item.id);
      await sendWorkflowDecision({ approvalId: item.id, decision: "REJECT", reason });

      await loadItems();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert(err?.message || "Failed to reject/delete item.");
    } finally {
      setBusyId(null);
    }
  }

  const autoLabel =
    lastUpdatedAt == null ? "—" : secondsSinceUpdate < 2 ? "just now" : `${secondsSinceUpdate}s ago`;

  const currentSubcats = SUBCATEGORY_BY_CATEGORY[category] || [];

  return (
    <div className="closet-admin-page">
      <style>{closetUploadStyles}</style>

      <header className="closet-admin-header">
        <div className="closet-admin-title-block">
          <span className="closet-admin-kicker">STYLING ADVENTURES WITH LALA</span>
          <h1>
            Admin Closet Studio{" "}
            <span className="closet-admin-emoji" role="img" aria-label="dress">
              👗
            </span>
          </h1>
          <p>Upload new looks, keep the closet tidy, and make the fan side feel like a curated boutique.</p>
        </div>

        <div className="closet-admin-header-right">
          <span className="closet-admin-pill">ADMIN PORTAL</span>
          <div className="closet-admin-count-block">
            <span className="closet-admin-count">
              Pending in queue: <strong>{pendingCount}</strong>
            </span>
            <span className="closet-admin-count">
              Auto-updated <strong>{autoLabel}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="closet-admin-shell">
        {/* LEFT */}
        <section className="sa-card closet-upload-card">
          <header className="closet-card-header">
            <div>
              <h2 className="closet-card-title">Upload new looks</h2>
              <p className="closet-card-sub">
                Drag in outfit photos from your camera roll, add a title, and send them into the approval workflow.
              </p>
            </div>
          </header>

          <div
            className={"closet-dropzone" + (isDragging ? " closet-dropzone--active" : "")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
          >
            <div className="closet-drop-icon">⬆️</div>
            <div className="closet-drop-title">Drop outfit images here</div>
            <div className="closet-drop-text">Or click to select from your computer. JPG / PNG, up to a few at a time.</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileInputChange}
            />
          </div>

          {files.length > 0 && (
            <div className="closet-file-summary">
              <div className="closet-file-summary-header">
                <span>
                  {files.length} file{files.length === 1 ? "" : "s"} ready to upload
                </span>
                <button type="button" className="sa-link" onClick={clearFiles} disabled={uploading}>
                  Clear
                </button>
              </div>

              <ul className="closet-file-list">
                {files.map((f) => (
                  <li key={`${f.name}:${f.size}`}>
                    {f.name} <span className="sa-muted">({Math.round(f.size / 1024)} KB)</span>
                  </li>
                ))}
              </ul>

              <div className="closet-preview-row">
                <div className="closet-preview-frame">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="closet-preview-img" />
                  ) : (
                    <span className="sa-muted">Preview</span>
                  )}
                </div>
                <p className="closet-preview-caption">
                  The first image is used for thumbnail preview. Uploading multiple files creates multiple workflow items.
                </p>
              </div>
            </div>
          )}

          <div className="closet-upload-fields">
            <div className="closet-field">
              <label className="closet-field-label">Title (optional)</label>
              <input
                className="sa-input"
                placeholder="Name this look…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="closet-field-hint">If left blank, we&apos;ll use the file name as the title.</div>
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
                  <option value="">{category ? "Select subcategory" : "Choose a category first"}</option>
                  {currentSubcats.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {uploadMsg && (
            <div className="closet-upload-status">
              {uploadMsg}
              {uploadDetails.length > 0 && (
                <ul>
                  {uploadDetails.map((line, i) => (
                    <li key={String(i)}>{line}</li>
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
                ? `Upload ${files.length} look${files.length === 1 ? "" : "s"} to workflow`
                : "Add images to upload"}
          </button>

          <div className="closet-footer-note">
            After upload, each item runs segmentation/moderation/PII and then waits for your approval.
          </div>
        </section>

        {/* RIGHT: Simplified Review Queue (PENDING only) */}
        <section className="sa-card closet-dashboard-card">
          <div className="closet-dashboard-header">
            <div>
              <h2 className="closet-card-title">Review queue</h2>
              <p className="closet-card-sub">
                Pending only. Approve is enabled when the cutout is verified (transparency check).
              </p>
            </div>

            <div className="closet-auto-meta">
              <div className="closet-auto-block">
                <span className="closet-auto-label">Updated</span>
                <span className="closet-auto-value">{autoLabel}</span>
              </div>
              <button
                type="button"
                className="closet-filter-refresh"
                onClick={loadItems}
                disabled={itemsLoading}
                title="Refresh pending queue"
              >
                {itemsLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {itemsError && <div className="closet-grid-error">{itemsError}</div>}

          {!itemsLoading && !itemsError && (
            <div className="closet-queue-meta">
              <span className="closet-queue-count">
                <strong>{pendingCount}</strong> pending
              </span>
              <span className="closet-queue-updated">{autoLabel}</span>
            </div>
          )}

          {!itemsLoading && !itemsError && pendingCount === 0 && (
            <div className="closet-grid-empty" style={{ marginTop: 10 }}>
              No pending looks right now. Upload a new look on the left to start the workflow.
            </div>
          )}

          {pendingCount > 0 && (
            <div className="closet-grid closet-grid--review" style={{ marginTop: 10 }}>
              {pendingItems.map((item) => {
                const isBusy = busyId === item.id;
                const label = humanStatusLabel(item);

                const approveEnabled = !!item.cutoutVerified;
                const showNew = isNew(item.createdAt);

                // pills shown on thumbnail (matches your screenshots vibe)
                const pillA = item.cutoutVerified ? "cutout ready" : item.cutoutKeyLooksRight ? "processing cutout" : "waiting for cutout";

                return (
                  <article key={item.id} className="closet-grid-card">
                    <div className="closet-grid-thumb">
                      <div className="closet-review-pills">
                        {showNew && <span className="closet-badge-new">NEW</span>}
                        <span className="closet-bg-pill">{pillA}</span>
                      </div>

                      {item.mediaUrl ? (
                        <img src={item.mediaUrl} alt={item.title || "Closet item"} />
                      ) : (
                        <span className="closet-grid-thumb-empty">No preview yet</span>
                      )}

                      {!approveEnabled && (
                        <div className="closet-review-progress">
                          <div className="closet-review-progress-track">
                            <div className="closet-review-progress-fill" style={{ width: "42%" }} />
                          </div>
                          <div className="closet-review-progress-label">
                            {label === "processing cutout" ? "processing cutout…" : "waiting for cutout…"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="closet-grid-body">
                      <div className="closet-grid-title-row">
                        <div className="closet-grid-main-title">{item.title || item.id}</div>
                        <span className="pill-soft">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</span>
                      </div>

                      <div className="closet-grid-meta">
                        <span className="closet-grid-audience">fan upload</span>
                        <span className="closet-status-pill closet-status-pill--pending">{label}</span>
                      </div>

                      <div className="closet-review-audience-row">
                        <label className="closet-review-label">Audience</label>
                        <select
                          className="sa-input closet-review-audience"
                          value={item.audience || "PUBLIC"}
                          disabled={isBusy}
                          onChange={(e) => {
                            const next = e.target.value;
                            updateLocalAudience(item.id, next);
                            // audience saves instantly
                            saveAudience(item.id, next);
                          }}
                        >
                          {AUDIENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="closet-review-hint">Audience saves instantly.</div>
                      </div>

                      <div className="closet-review-actions">
                        <button
                          type="button"
                          className="closet-review-approve"
                          disabled={!approveEnabled || isBusy}
                          onClick={() => approveItem(item)}
                          title={approveEnabled ? "Approve this look" : "Approve turns on once the cutout is verified"}
                        >
                          {isBusy ? "Working…" : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="closet-grid-link closet-grid-link--danger"
                          disabled={isBusy}
                          onClick={() => rejectItem(item)}
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          className="closet-grid-link closet-grid-link--danger"
                          disabled={isBusy}
                          onClick={() => rejectItem(item, { deleteMode: true })}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="closet-footer-note" style={{ marginTop: 6 }}>
                        Approve turns on once the background is removed and verified (transparency check).
                      </div>
                    </div>
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

/**
 * ✅ Single stylesheet only (no duplicates)
 */
const closetUploadStyles = /* css */ `
.closet-admin-page{max-width:1120px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:16px}
.sa-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 10px 26px rgba(148,163,184,.25)}
.closet-admin-header{background:radial-gradient(circle at top left,#fce7f3,#f9fafb 60%),radial-gradient(circle at bottom right,#e0e7ff,#fff);border-radius:26px;padding:18px 22px;box-shadow:0 18px 40px rgba(148,163,184,.28);display:flex;justify-content:space-between;gap:16px}
.closet-admin-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#9ca3af;font-weight:600}
.closet-admin-title-block h1{margin:0;font-size:22px;letter-spacing:-.02em}
.closet-admin-title-block p{margin:2px 0 0;font-size:13px;color:#4b5563;max-width:560px}
.closet-admin-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.closet-admin-pill{padding:3px 10px;border-radius:999px;background:#020617;color:#f9fafb;font-size:11px;letter-spacing:.14em}
.closet-admin-count{font-size:12px;color:#6b7280}
.closet-admin-shell{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:980px){.closet-admin-shell{grid-template-columns:1fr}}
.closet-upload-card,.closet-dashboard-card{padding:16px 18px 18px}
.closet-card-title{margin:0;font-size:17px;font-weight:600}
.closet-card-sub{margin:4px 0 0;font-size:13px;color:#6b7280}
.closet-dropzone{margin-top:10px;border:1px dashed #c7d2fe;border-radius:18px;padding:18px;background:#f8f5ff;cursor:pointer;text-align:center}
.closet-dropzone--active{border-color:#a855f7;box-shadow:0 0 0 2px rgba(168,85,247,.15) inset}
.closet-drop-icon{font-size:22px}
.closet-drop-title{margin-top:6px;font-weight:600}
.closet-drop-text{margin-top:4px;font-size:12px;color:#6b7280}
.sa-input{width:100%;box-sizing:border-box;border-radius:999px;border:1px solid #e5e7eb;padding:8px 14px;font-size:14px;background:#fff;outline:none}
.sa-input:focus{border-color:#a855f7;box-shadow:0 0 0 1px rgba(168,85,247,.25)}
.closet-upload-fields{margin-top:12px;display:flex;flex-direction:column;gap:10px}
.closet-upload-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.closet-upload-row{grid-template-columns:1fr}}
.closet-field-label{font-size:12px;font-weight:600;color:#374151}
.closet-field-hint{margin-top:4px;font-size:12px;color:#6b7280}
.closet-upload-btn{margin-top:12px;width:100%;border:none;border-radius:999px;padding:12px 14px;font-size:14px;font-weight:600;cursor:pointer;background:#a855f7;color:#fff}
.closet-upload-btn:disabled{opacity:.6;cursor:not-allowed}
.sa-link{border:none;background:transparent;color:#7c3aed;cursor:pointer;font-size:12px}
.sa-muted{color:#9ca3af}
.closet-file-summary{margin-top:10px;border:1px solid #e5e7eb;border-radius:16px;padding:10px;background:#fafafa}
.closet-file-summary-header{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.closet-file-list{margin:8px 0 0;padding-left:18px;font-size:12px;color:#4b5563}
.closet-preview-row{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center;margin-top:10px}
.closet-preview-frame{height:120px;border-radius:14px;background:#eef2ff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.closet-preview-img{max-width:100%;max-height:100%;object-fit:contain}
.closet-preview-caption{margin:0;font-size:12px;color:#6b7280}
.closet-footer-note{margin-top:10px;font-size:12px;color:#6b7280}

/* RIGHT PANEL */
.closet-dashboard-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.closet-auto-meta{display:flex;align-items:flex-end;gap:10px}
.closet-auto-block{display:flex;flex-direction:column;align-items:flex-end}
.closet-auto-label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.12em}
.closet-auto-value{font-size:12px;color:#4b5563}
.closet-filter-refresh{border-radius:999px;border:1px solid #e5e7eb;background:#fff;padding:7px 14px;font-size:13px;cursor:pointer}
.closet-filter-refresh:disabled{opacity:.7;cursor:not-allowed}
.closet-grid{margin-top:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.closet-grid--review{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.closet-grid-card{border:1px solid #e5e7eb;border-radius:18px;padding:8px;background:#fff;box-shadow:0 10px 26px rgba(148,163,184,.22);display:flex;flex-direction:column;gap:8px}
.closet-grid-thumb{border-radius:16px;background:radial-gradient(circle at top left,#f9fafb,#ede9fe),#ede9fe;overflow:hidden;height:220px;padding:10px;display:flex;align-items:center;justify-content:center;position:relative}
.closet-grid-thumb img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.closet-grid-thumb-empty{font-size:12px;color:#6b7280}
.closet-grid-body{display:flex;flex-direction:column;gap:6px}
.closet-grid-title-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
.closet-grid-main-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.closet-badge-new{font-size:10px;padding:2px 8px;border-radius:999px;background:#fef3c7;color:#92400e}
.pill-soft{font-size:10px;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#3730a3}
.closet-grid-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px}
.closet-grid-audience{color:#6b7280}
.closet-status-pill{border-radius:999px;padding:2px 8px;font-size:11px;text-transform:lowercase}
.closet-status-pill--default{background:#e5e7eb;color:#374151}
.closet-status-pill--pending{background:#fef3c7;color:#92400e}
.closet-grid-error{padding:8px 10px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:12px}
.closet-grid-empty{font-size:13px;color:#6b7280}
.closet-grid-link{border:none;background:rgba(249,250,251,.9);padding:6px 10px;font-size:12px;border-radius:999px;cursor:pointer;color:#4b5563}
.closet-grid-link--danger{color:#b91c1c;background:#fef2f2}
.closet-review-pills{position:absolute;top:10px;left:10px;display:flex;gap:6px;flex-wrap:wrap}
.closet-bg-pill{font-size:10px;padding:2px 8px;border-radius:999px;background:#f3f4f6;color:#374151}
.closet-review-progress{position:absolute;bottom:10px;left:10px;right:10px;display:flex;flex-direction:column;gap:6px}
.closet-review-progress-track{height:6px;border-radius:999px;background:rgba(17,24,39,.12);overflow:hidden}
.closet-review-progress-fill{height:100%;background:#a855f7}
.closet-review-progress-label{font-size:11px;color:#4b5563}
.closet-review-audience-row{margin-top:6px;display:flex;flex-direction:column;gap:6px}
.closet-review-label{font-size:11px;font-weight:600}
.closet-review-audience{max-width:240px}
.closet-review-hint{font-size:12px;color:#6b7280}
.closet-review-actions{display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap}
.closet-review-approve{border:none;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;background:#4ade80;color:#064e3b}
.closet-review-approve:disabled{opacity:.6;cursor:not-allowed}
.closet-queue-meta{margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6b7280}
`;
