// site/src/routes/admin/ClosetUpload.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
import { signedUpload, getSignedGetUrl } from "../../lib/sa";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GRID_PREVIEW_LIMIT = 6;

// how often to auto-refresh the dashboard (ms)
const POLL_INTERVAL_MS = 15_000;

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
        createdAt
        updatedAt
      }
    }
  `,
  listPending: /* GraphQL */ `
    query AdminListPending {
      adminListPending {
        id
        title
        status
        mediaKey
        rawMediaKey
        createdAt
        updatedAt
        userId
        ownerSub
        reason
        audience
      }
    }
  `,
  listPublished: /* GraphQL */ `
    query ClosetFeedAdminView {
      closetFeed {
        id
        title
        status
        mediaKey
        rawMediaKey
        createdAt
        updatedAt
        ownerSub
        audience
      }
    }
  `,
  rejectAsDelete: /* GraphQL */ `
    mutation AdminRejectItem($id: ID!, $reason: String) {
      adminRejectItem(id: $id, reason: $reason) {
        id
        status
        reason
      }
    }
  `,
};

/** Prefer cleaned mediaKey; fallback to rawMediaKey if cutout not ready. */
function effectiveKey(item) {
  const k = item.mediaKey || item.rawMediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
}

/** “12s ago” / “2m ago” style. */
function formatAgo(now, then) {
  if (!then) return "—";
  const diff = Math.max(0, now - then);
  if (diff < 5000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function ClosetUpload() {
  // Form fields
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("");
  const [vibes, setVibes] = useState("");

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

  // dashboard auto-updated timer
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fileInputRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /*  File handling / preview                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!files.length) {
      setPreviewUrl("");
      return;
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

  /* ------------------------------------------------------------------ */
  /*  Upload submit (multi-file)                                       */
  /* ------------------------------------------------------------------ */

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

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const baseTitle = title.trim();
        const itemTitle =
          baseTitle ||
          file.name.replace(/\.[a-z0-9]+$/i, "") ||
          "Untitled look";

        results.push(`Uploading “${itemTitle}”…`);

        // Upload raw file to uploads bucket
        const up = await signedUpload(file);
        const rawMediaKey = up.key;

        const input = {
          title: itemTitle,
          rawMediaKey,
          ...(season.trim() ? { season: season.trim() } : {}),
          ...(vibes.trim() ? { vibes: vibes.trim() } : {}),
        };

        const data = await window.sa.graphql(GQL.create, { input });
        const created = data?.adminCreateClosetItem;

        if (created) {
          results.push(
            `✔ Created “${created.title}” (status: ${created.status}) at ${new Date(
              created.createdAt
            ).toLocaleString()}`
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
        }. Background removal will run shortly, then you can approve them from the Closet queue.`
      );
      setUploadDetails(results);

      clearFiles();
      setTitle("");
      setSeason("");
      setVibes("");

      await loadItems();
    } catch (err) {
      console.error(err);
      setUploadMsg(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Admin list: load + filter (with thumbnails)                       */
  /* ------------------------------------------------------------------ */

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    setItemsError("");
    try {
      const [pendingData, publishedData] = await Promise.all([
        window.sa.graphql(GQL.listPending, {}),
        window.sa.graphql(GQL.listPublished, {}),
      ]);

      const pending = pendingData?.adminListPending ?? [];

      // closetFeed may be list OR page
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

      const hydrated = await Promise.all(
        merged.map(async (item) => {
          const key = effectiveKey(item);
          if (!key) return item;
          try {
            const url = await getSignedGetUrl(key);
            return { ...item, mediaUrl: url || null };
          } catch (e) {
            console.warn("[ClosetUpload] getSignedGetUrl failed", e);
            return item;
          }
        })
      );

      setItems(hydrated);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error(err);
      setItemsError(err?.message || "Failed to load closet items.");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // auto-polling for background-removal completion
  useEffect(() => {
    const id = setInterval(() => {
      loadItems();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadItems]);

  // live clock for “Auto-updated Xs ago”
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (item.title || "").toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  const itemCount = filteredItems.length;
  const previewItems = filteredItems.slice(0, GRID_PREVIEW_LIMIT);
  const hasMore = itemCount > GRID_PREVIEW_LIMIT;

  const autoUpdatedText = formatAgo(now, lastUpdated);

  /* ------------------------------------------------------------------ */
  /*  Delete (soft delete via reject)                                   */
  /* ------------------------------------------------------------------ */

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
        id,
        reason: "Deleted from admin upload page",
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete item.");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="closet-admin-page">
      <style>{styles}</style>

      {/* Header banner */}
      <header className="closet-admin-header">
        <div className="closet-admin-title-block">
          <span className="closet-admin-kicker">
            Styling Adventures with Lala
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
          <span className="closet-admin-pill">Admin portal</span>
          <span className="closet-admin-count">
            Closet items: <strong>{items.length}</strong>
          </span>
          <Link to="/admin/closet" className="sa-btn sa-btn--ghost">
            Open review queue
          </Link>
        </div>
      </header>

      {/* Two-column studio layout */}
      <div className="closet-admin-shell">
        {/* LEFT: Upload panel */}
        <section
          className="sa-card closet-upload-card"
          style={{
            maxHeight: 540,
            overflowY: "auto",
          }}
        >
          <header className="closet-card-header">
            <div>
              <h2 className="closet-card-title">Closet upload</h2>
              <p className="closet-card-sub">
                Drop in photos from shoots or collabs. Each file becomes its own
                closet item.
              </p>
            </div>
          </header>

          {/* Dropzone */}
          <div
            className={
              "closet-dropzone" + (isDragging ? " closet-dropzone--active" : "")
            }
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="closet-drop-icon">＋</div>
            <div className="closet-drop-title">Choose a file…</div>
            <div className="closet-drop-text">
              Drag & drop or click to browse. You can add multiple images at
              once.
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          {/* Meta fields */}
          <div className="closet-upload-fields">
            <label className="closet-field">
              <span className="closet-field-label">Base title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="sa-input"
                placeholder="e.g. Pastel knit set"
              />
              <span className="closet-field-hint">
                If blank, we’ll use each filename as the item title.
              </span>
            </label>

            <div className="closet-upload-row">
              <label className="closet-field">
                <span className="closet-field-label">Season / chapter</span>
                <input
                  type="text"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="sa-input"
                  placeholder="e.g. Holiday Drop"
                />
              </label>

              <label className="closet-field">
                <span className="closet-field-label">Vibes / tags</span>
                <input
                  type="text"
                  value={vibes}
                  onChange={(e) => setVibes(e.target.value)}
                  className="sa-input"
                  placeholder="e.g. cozy, barbiecore"
                />
              </label>
            </div>
          </div>

          {/* Selected files summary + preview */}
          {files.length > 0 && (
            <div className="closet-file-summary">
              <div className="closet-file-summary-header">
                <span>
                  {files.length} file{files.length > 1 ? "s" : ""} ready to
                  upload
                </span>
                <button
                  type="button"
                  className="sa-link"
                  onClick={clearFiles}
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
            </div>
          )}

          {previewUrl && (
            <div className="closet-preview-row">
              <div className="closet-preview-frame">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="closet-preview-img"
                />
              </div>
              <p className="closet-preview-caption">
                First look in your batch. Fans will see the cleaned, approved
                version in their closet feed.
              </p>
            </div>
          )}

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
            onClick={handleSubmit}
            className="closet-upload-btn"
            disabled={uploading || !files.length}
          >
            {uploading
              ? `Uploading ${files.length} look${
                  files.length > 1 ? "s" : ""
                }…`
              : files.length
              ? `Upload ${files.length} look${
                  files.length > 1 ? "s" : ""
                } to closet`
              : "Upload to closet"}
          </button>

          <p className="closet-footer-note">
            Raw images are stored first. A background-removal worker converts
            them into cutouts, then you can approve them in the review queue.
          </p>
        </section>

        {/* RIGHT: Dashboard panel */}
        <section className="sa-card closet-dashboard-card">
          <header
            className="closet-card-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <h2 className="closet-card-title">Closet dashboard</h2>
              <p className="closet-card-sub">
                Filter, search, and peek at what fans will see in the closet.
              </p>
            </div>
            <div className="closet-auto-wrap">
              <div className="closet-auto-label">Auto-updated</div>
              <div className="closet-auto-value">{autoUpdatedText}</div>
            </div>
          </header>

          {/* Filters row */}
          <div className="closet-filters-row">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="closet-filter-input"
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

            <select className="closet-filter-input" disabled>
              <option>Sort by newest (default)</option>
            </select>

            <button
              type="button"
              className="closet-filter-refresh"
              onClick={loadItems}
              disabled={itemsLoading}
            >
              {itemsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="closet-grid-header">
            <span className="closet-grid-title">
              Closet items grid · <strong>{itemCount}</strong>{" "}
              {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          {itemsError && (
            <div className="closet-grid-error">{itemsError}</div>
          )}

          {itemCount === 0 && !itemsLoading && !itemsError && (
            <div className="closet-grid-empty">
              No items match your filters yet. Try clearing search or upload a
              new look on the left.
            </div>
          )}

          {itemsLoading && itemCount === 0 && (
            <div className="closet-grid-empty">Loading closet items…</div>
          )}

          {itemCount > 0 && (
            <>
              <div className="closet-grid">
                {previewItems.map((item) => {
                  const status = item.status || "UNKNOWN";
                  const isNewFlag = isNew(item.createdAt);
                  const hasCutout = !!item.mediaKey;

                  // unified labels with queue page
                  let statusLabel = status.toLowerCase();
                  let statusClass = "closet-status-pill--default";
                  if (status === "PUBLISHED")
                    statusClass = "closet-status-pill--published";
                  else if (status === "PENDING")
                    statusClass = "closet-status-pill--pending";
                  else if (status === "REJECTED")
                    statusClass = "closet-status-pill--rejected";

                  if (status === "PENDING" && !hasCutout) {
                    statusLabel = "Processing Bg";
                  } else if (status === "PENDING" && hasCutout) {
                    statusLabel = "Ready to review";
                  }

                  return (
                    <article key={item.id} className="closet-grid-card">
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
                          {isNewFlag && (
                            <span className="closet-badge-new">New</span>
                          )}
                        </div>

                        <div className="closet-grid-meta">
                          <span
                            className={"closet-status-pill " + statusClass}
                          >
                            {statusLabel}
                          </span>
                          <span className="closet-grid-audience">
                            {item.audience || "Fan / Bestie"}
                          </span>
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
                              className="closet-grid-link"
                              onClick={() =>
                                window.open(
                                  `/fan/closet-feed?highlight=${item.id}`,
                                  "_blank"
                                )
                              }
                            >
                              View
                            </button>
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

              {(hasMore || itemCount > previewItems.length) && (
                <div className="closet-grid-footer-row">
                  <span className="closet-grid-summary">
                    Showing first{" "}
                    <strong>
                      {Math.min(GRID_PREVIEW_LIMIT, itemCount)}
                    </strong>{" "}
                    of <strong>{itemCount}</strong> item
                    {itemCount === 1 ? "" : "s"}.
                  </span>
                  <Link to="/admin/closet" className="closet-grid-cta">
                    View full closet queue →
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* Keep colours soft + same vibe; mostly layout + pills. */
const styles = `
.closet-admin-page {
  padding: 8px 0 32px;
}

.closet-admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 22px;
  margin-bottom: 18px;
  border-radius: 26px;
  background: linear-gradient(90deg, #fdf2ff, #eef2ff);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.09);
  color: #0f172a;
}

.closet-admin-title-block h1 {
  margin: 4px 0 6px;
  font-size: 22px;
}

.closet-admin-title-block p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.closet-admin-kicker {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9ca3af;
}

.closet-admin-emoji {
  font-size: 22px;
}

.closet-admin-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 13px;
}

.closet-admin-pill {
  padding: 4px 12px;
  border-radius: 999px;
  background: #020617;
  color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.closet-admin-count {
  color: #4b5563;
}

.closet-admin-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 1.05fr);
  gap: 18px;
}

/* Cards */
.sa-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 24px;
  padding: 16px 18px 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.09);
}

.closet-card-header {
  margin-bottom: 12px;
}

.closet-card-title {
  margin: 0;
  font-size: 18px;
}

.closet-card-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

/* Upload panel */
.closet-dropzone {
  border-radius: 22px;
  border: 1px dashed #e5e7eb;
  padding: 34px 12px;
  text-align: center;
  background: #faf5ff;
  color: #6b7280;
  cursor: pointer;
  margin-bottom: 16px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.closet-dropzone--active {
  background: #eef2ff;
  border-color: #a855f7;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.4);
}
.closet-drop-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 20px;
  color: #6d28d9;
}

.closet-drop-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #111827;
}
.closet-drop-text {
  font-size: 13px;
  color: #6b7280;
}

.closet-upload-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.closet-upload-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.closet-field-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
  margin-bottom: 4px;
}

.closet-field-hint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #9ca3af;
}

.closet-file-summary {
  background: #f3f4ff;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 13px;
  color: #374151;
  margin-bottom: 10px;
}
.closet-file-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.closet-file-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
}

.closet-preview-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.closet-preview-frame {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.closet-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.closet-preview-caption {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.closet-upload-status {
  margin: 8px 0;
  padding: 8px 10px;
  border-radius: 12px;
  background: #eff6ff;
  font-size: 12px;
  color: #1f2937;
}
.closet-upload-status ul {
  margin: 4px 0 0;
  padding-left: 18px;
}

.closet-upload-btn {
  margin-top: 4px;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  background: linear-gradient(90deg, #a855f7, #6366f1);
  color: #f9fafb;
  box-shadow: 0 12px 30px rgba(129, 140, 248, 0.6);
}
.closet-upload-btn:disabled {
  opacity: 0.5;
  box-shadow: none;
  cursor: default;
}

.closet-footer-note {
  margin-top: 6px;
  font-size: 11px;
  color: #9ca3af;
}

/* Dashboard */
.closet-filters-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 210px 90px;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.closet-filter-input {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  font-size: 13px;
  background: #f9fafb;
}
.closet-filter-refresh {
  border-radius: 999px;
  border: 1px solid #111827;
  padding: 6px 12px;
  font-size: 13px;
  background: #111827;
  color: #f9fafb;
  cursor: pointer;
}

.closet-auto-wrap {
  text-align: right;
  font-size: 11px;
  color: #9ca3af;
}
.closet-auto-label {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  display: block;
}
.closet-auto-value {
  font-size: 11px;
  color: #4b5563;
}

/* Grid */
.closet-grid-header {
  margin-bottom: 6px;
  font-size: 13px;
}
.closet-grid-title {
  color: #4b5563;
}
.closet-grid-error {
  margin: 6px 0;
  font-size: 13px;
  color: #b91c1c;
}
.closet-grid-empty {
  padding: 18px 10px;
  font-size: 13px;
  color: #6b7280;
}

.closet-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.closet-grid-card {
  border-radius: 20px;
  border: 1px solid #f3e8ff;
  background: #fdf4ff;
  padding: 10px;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 10px;
}

.closet-grid-thumb {
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.closet-grid-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.closet-grid-thumb-empty {
  font-size: 12px;
  color: #9ca3af;
}

.closet-grid-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.closet-grid-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.closet-grid-main-title {
  font-weight: 600;
  font-size: 14px;
}
.closet-badge-new {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
}

.closet-grid-meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.closet-status-pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}
.closet-status-pill--default {
  background: #f3f4f6;
  color: #4b5563;
}
.closet-status-pill--pending {
  background: #fef3c7;
  color: #92400e;
}
.closet-status-pill--published {
  background: #dcfce7;
  color: #166534;
}
.closet-status-pill--rejected {
  background: #fee2e2;
  color: #b91c1c;
}
.closet-grid-audience {
  font-size: 12px;
  color: #6b7280;
}

.closet-grid-footer {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #9ca3af;
}
.closet-grid-actions {
  display: flex;
  gap: 10px;
}
.closet-grid-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}
.closet-grid-link--danger {
  color: #b91c1c;
}

.closet-grid-footer-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.closet-grid-cta {
  font-size: 12px;
  text-decoration: none;
  color: #4f46e5;
}

/* Responsive */
@media (max-width: 960px) {
  .closet-admin-shell {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .closet-filters-row {
    grid-template-columns: minmax(0, 1fr);
  }
  .closet-grid-card {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;
