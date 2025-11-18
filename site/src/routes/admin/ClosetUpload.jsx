// site/src/routes/admin/ClosetUpload.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { signedUpload, getSignedGetUrl } from "../../lib/sa"; // upload helper + public URL helper

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const GRID_PREVIEW_LIMIT = 6;

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

  const fileInputRef = useRef(null);

  // ------- File handling / preview -------

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

      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const baseTitle = title.trim();
        const itemTitle =
          baseTitle ||
          file.name.replace(/\.[a-z0-9]+$/i, "") ||
          "Untitled look";

        results.push(`Uploading “${itemTitle}”…`);

        const up = await signedUpload(file); // { key, bucket, url, ... }
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
        `Finished uploading ${total} item${total > 1 ? "s" : ""}. Background removal will run shortly, then you can approve them from the Closet queue.`
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

  // ------- Admin list: load + filter (with thumbnails) -------

  async function loadItems() {
    setItemsLoading(true);
    setItemsError("");
    try {
      const [pendingData, publishedData] = await Promise.all([
        window.sa.graphql(GQL.listPending, {}),
        window.sa.graphql(GQL.listPublished, {}),
      ]);

      const pending = pendingData?.adminListPending ?? [];
      const published = publishedData?.closetFeed ?? [];

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
          const key = item.mediaKey || item.rawMediaKey || null;
          if (!key) return item;
          try {
            const url = await getSignedGetUrl(key);
            return { ...item, mediaUrl: url };
          } catch (e) {
            console.warn("[ClosetUpload] presign failed", e);
            return item;
          }
        })
      );

      setItems(hydrated);
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
        id,
        reason: "Deleted from admin upload page",
      });
      await loadItems();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete item.");
    }
  }

  // ------- Render -------

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
        <section className="sa-card closet-upload-card">
          <header className="closet-card-header">
            <div>
              <h2 className="closet-card-title">Closet upload</h2>
              <p className="closet-card-sub">
                Drop in photos from shoots or collabs. Each file becomes its own
                closet item.
              </p>
            </div>
          </header>

          {/* Dropzone styled like “Choose a file…” tile */}
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

          {/* Meta fields below dropzone */}
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
            Raw images are stored first. A Step Functions flow handles
            background cleanup, then you can approve them in the review queue.
          </p>
        </section>

        {/* RIGHT: Dashboard panel (preview-style) */}
        <section className="sa-card closet-dashboard-card">
          <header className="closet-card-header">
            <div>
              <h2 className="closet-card-title">Closet dashboard</h2>
              <p className="closet-card-sub">
                Filter, search, and peek at what fans will see in the closet.
              </p>
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

                  let statusLabel = status.toLowerCase();
                  let statusClass = "closet-status-pill--default";
                  if (status === "PUBLISHED")
                    statusClass = "closet-status-pill--published";
                  else if (status === "PENDING")
                    statusClass = "closet-status-pill--pending";
                  else if (status === "REJECTED")
                    statusClass = "closet-status-pill--rejected";

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

const styles = `
.closet-admin-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

/* Header banner */

.closet-admin-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  padding:16px 20px;
  border-radius:24px;
  background:
    radial-gradient(circle at top left, rgba(252,231,243,0.95), rgba(249,250,251,0.98)),
    radial-gradient(circle at bottom right, rgba(224,231,255,0.95), rgba(255,255,255,1));
  border:1px solid #e5e7eb;
  box-shadow:0 18px 40px rgba(148,163,184,0.32);
  margin-bottom:18px;
}

.closet-admin-title-block {
  display:flex;
  flex-direction:column;
  gap:4px;
}

.closet-admin-kicker {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.16em;
  color:#9ca3af;
  font-weight:600;
}

.closet-admin-header h1 {
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

.closet-admin-header p {
  margin:2px 0 0;
  font-size:13px;
  color:#4b5563;
  max-width:520px;
}

.closet-admin-header-right {
  display:flex;
  flex-direction:column;
  gap:8px;
  align-items:flex-end;
}
.closet-admin-pill {
  font-size:11px;
  padding:2px 10px;
  border-radius:999px;
  background:#111827;
  color:#fff;
  text-transform:uppercase;
  letter-spacing:.14em;
}
.closet-admin-count {
  font-size:12px;
  color:#4b5563;
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

/* Two-column shell */

.closet-admin-shell {
  display:grid;
  grid-template-columns:minmax(0, 320px) minmax(0, 1fr);
  gap:18px;
}
@media (max-width: 900px) {
  .closet-admin-shell {
    grid-template-columns:minmax(0, 1fr);
  }
}

/* Shared card header */

.closet-card-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:10px;
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

/* Upload card styles */

.closet-upload-card {
  background:#fdfbff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 36px rgba(148,163,184,0.28);
  padding:16px 18px 18px;
}

/* Dropzone tile */

.closet-dropzone {
  margin-top:8px;
  border-radius:18px;
  border:1px dashed #d1d5db;
  padding:20px 14px;
  background:#fbf4ff;
  text-align:center;
  cursor:pointer;
  transition:border-color .15s ease, background .15s ease, box-shadow .15s ease;
}
.closet-dropzone--active {
  border-color:#a855f7;
  background:#f3e8ff;
  box-shadow:0 0 0 2px rgba(168,85,247,0.15);
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

/* Upload fields */

.closet-upload-fields {
  margin-top:14px;
  display:grid;
  gap:10px;
}
.closet-field {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.closet-field-label {
  font-size:12px;
  color:#6b7280;
}
.closet-field-hint {
  font-size:11px;
  color:#9ca3af;
}
.closet-upload-row {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
@media (max-width: 720px) {
  .closet-upload-row {
    grid-template-columns:1fr;
  }
}

/* File summary + preview */

.closet-file-summary {
  margin-top:10px;
  padding:8px 10px;
  border-radius:12px;
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
  max-height:100px;
  overflow-y:auto;
}

.closet-preview-row {
  margin-top:10px;
  display:flex;
  gap:12px;
  align-items:flex-start;
}
.closet-preview-frame {
  width:132px;
  height:132px;
  border-radius:14px;
  overflow:hidden;
  border:1px solid #e5e7eb;
  background:#f3f4f6;
  flex-shrink:0;
}
.closet-preview-img {
  width:100%;
  height:100%;
  object-fit:cover;
}
.closet-preview-caption {
  font-size:12px;
  color:#6b7280;
  margin:0;
}

/* Upload status + button */

.closet-upload-status {
  margin-top:10px;
  padding:8px 10px;
  border-radius:10px;
  background:#eef2ff;
  border:1px solid #e5e7eb;
  font-size:12px;
}
.closet-upload-status ul {
  margin:4px 0 0;
  padding-left:18px;
}

.closet-upload-btn {
  margin-top:12px;
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
}
.closet-footer-note {
  margin-top:10px;
  font-size:11px;
  color:#9ca3af;
}

/* Dashboard card */

.closet-dashboard-card {
  background:#f8f5ff;
  border-radius:20px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 36px rgba(148,163,184,0.28);
  padding:16px 18px 18px;
}

/* Filters row */

.closet-filters-row {
  margin-top:8px;
  margin-bottom:10px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.closet-filter-input {
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
.closet-filter-refresh {
  border-radius:999px;
  padding:0 14px;
  height:34px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  font-size:13px;
  cursor:pointer;
}
.closet-filter-refresh:disabled {
  opacity:0.7;
  cursor:not-allowed;
}

/* Grid */

.closet-grid-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:8px;
}
.closet-grid-title {
  font-size:13px;
  color:#6b7280;
}

.closet-grid-error {
  margin-bottom:8px;
  padding:8px 10px;
  border-radius:10px;
  background:#fef2f2;
  color:#b91c1c;
  font-size:12px;
}
.closet-grid-empty {
  padding:14px 10px;
  font-size:13px;
  color:#6b7280;
}

.closet-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
  gap:14px;
  margin-top:4px;
}

.closet-grid-card {
  background:#f4ebff;
  border-radius:18px;
  padding:10px;
  border:1px solid #e5e0ff;
  display:flex;
  flex-direction:column;
  gap:6px;
  box-shadow:0 10px 26px rgba(148,163,184,0.4);
}

.closet-grid-thumb {
  border-radius:14px;
  overflow:hidden;
  background:#ede9fe;
  height:150px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.closet-grid-thumb img {
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
.closet-grid-thumb-empty {
  font-size:12px;
  color:#6b7280;
}

.closet-grid-body {
  display:flex;
  flex-direction:column;
  gap:4px;
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
  overflow:hidden;
  text-overflow:ellipsis;
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
  gap:6px;
}
.closet-grid-audience {
  font-size:11px;
  color:#6b7280;
}

.closet-status-pill {
  border-radius:999px;
  padding:2px 8px;
  font-size:11px;
  border:1px solid transparent;
  text-transform:capitalize;
}
.closet-status-pill--default {
  background:#e5e7eb;
  color:#374151;
}
.closet-status-pill--published {
  background:#ecfdf3;
  border-color:#bbf7d0;
  color:#166534;
}
.closet-status-pill--pending {
  background:#fef3c7;
  border-color:#fde68a;
  color:#92400e;
}
.closet-status-pill--rejected {
  background:#fee2e2;
  border-color:#fecaca;
  color:#b91c1c;
}

.closet-grid-footer {
  margin-top:4px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
}
.closet-grid-date {
  font-size:11px;
  color:#9ca3af;
}
.closet-grid-actions {
  display:flex;
  gap:6px;
}
.closet-grid-link {
  border:none;
  background:transparent;
  padding:0;
  font-size:11px;
  text-decoration:underline;
  cursor:pointer;
  color:#4b5563;
}
.closet-grid-link--danger {
  color:#b91c1c;
}

/* Footer under preview grid */

.closet-grid-footer-row {
  margin-top:10px;
  padding-top:8px;
  border-top:1px dashed rgba(209,213,219,0.7);
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  font-size:12px;
}
.closet-grid-summary {
  color:#6b7280;
}
.closet-grid-cta {
  font-size:12px;
  text-decoration:none;
  padding:6px 12px;
  border-radius:999px;
  border:1px solid #4c1d95;
  color:#4c1d95;
  background:#f5f3ff;
}
.closet-grid-cta:hover {
  background:#ede9fe;
}
`;
