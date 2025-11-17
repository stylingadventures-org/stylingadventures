// site/src/routes/admin/ClosetUpload.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { signedUpload, getSignedGetUrl } from "../../lib/sa"; // proxies to window.signedUpload + presign helper

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
  // Form fields (shared across uploads)
  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("");
  const [vibes, setVibes] = useState("");

  // Files + preview
  const [files, setFiles] = useState([]); // Array<File>
  const [previewUrl, setPreviewUrl] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadDetails, setUploadDetails] = useState([]); // per-file result lines

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Admin list state
  const [items, setItems] = useState([]); // merged pending + published + mediaUrl
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
        (f) => !existingNames.has(f.name + f.size),
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
    e.preventDefault();
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
          baseTitle || file.name.replace(/\.[a-z0-9]+$/i, "") || "Untitled look";

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
              created.createdAt,
            ).toLocaleString()}`,
          );
        } else {
          results.push(
            `⚠ Created item for “${itemTitle}”, but GraphQL response was empty.`,
          );
        }
      }

      setUploadMsg(
        `Finished uploading ${total} item${total > 1 ? "s" : ""}. ` +
          "Background removal will run shortly, then you can approve them from the Closet queue.",
      );
      setUploadDetails(results);

      clearFiles();
      setTitle("");

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

      // Presign image URLs for thumbnails
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
        }),
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

  // ------- Delete (soft delete via reject) -------

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Delete (reject) this closet item? This cannot be undone.",
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
    <div className="sa-layout-stack closet-admin-page" style={{ gap: 24 }}>
      <style>{`
        .closet-admin-page {
          max-width: 1120px;
          margin: 0 auto;
        }

        .closet-admin-header {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:16px;
          padding:16px 18px;
          border-radius:18px;
          background:
            radial-gradient(circle at top left, #fce7f3 0, #f9fafb 50%, #eef2ff 100%);
          border:1px solid #e5e7eb;
        }

        .closet-admin-header-title {
          display:flex;
          flex-direction:column;
          gap:4px;
        }

        .closet-admin-kicker {
          font-size:11px;
          letter-spacing:.12em;
          text-transform:uppercase;
          color:#6b7280;
          font-weight:600;
        }

        .closet-admin-header h2 {
          font-size:22px;
          margin:0;
          display:flex;
          align-items:center;
          gap:8px;
        }

        .closet-admin-header h2 span.emoji {
          font-size:24px;
        }

        .closet-admin-header p {
          margin:0;
          font-size:13px;
          color:#4b5563;
          max-width:620px;
        }

        .closet-admin-header-actions {
          display:flex;
          flex-direction:column;
          gap:8px;
          align-items:flex-end;
        }

        .closet-admin-badge {
          font-size:11px;
          padding:2px 10px;
          border-radius:999px;
          background:#111827;
          color:#fff;
          text-transform:uppercase;
          letter-spacing:.14em;
        }

        .closet-card-title {
          display:flex;
          align-items:center;
          gap:8px;
        }

        .closet-card-title span.kicker {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:22px;
          height:22px;
          border-radius:999px;
          background:#111827;
          color:#fff;
          font-size:12px;
        }

        .closet-card-title h3 {
          margin:0;
          font-size:17px;
        }

        .closet-sub {
          margin:0;
          font-size:13px;
          color:#6b7280;
        }

        .closet-upload-meta {
          font-size:11px;
          color:#6b7280;
        }

        .closet-table-title {
          font-weight:500;
        }

        .closet-status-pill {
          display:inline-flex;
          align-items:center;
          padding:2px 8px;
          border-radius:999px;
          font-size:11px;
          text-transform:capitalize;
          border:1px solid transparent;
        }

        @media (max-width: 780px) {
          .closet-admin-header {
            flex-direction:column;
            align-items:flex-start;
          }
          .closet-admin-header-actions {
            align-items:flex-start;
          }
        }
      `}</style>

      {/* Header */}
      <header className="closet-admin-header">
        <div className="closet-admin-header-title">
          <span className="closet-admin-kicker">Admin • Lala&apos;s Closet</span>
          <h2>
            <span className="emoji">👗</span>Lala&apos;s Closet Studio
          </h2>
          <p>
            Upload raw looks, tag the vibes, and send them into the magic
            machine. Backgrounds are cleaned up in the cloud and approved
            items flow into the fan-facing closet feed.
          </p>
        </div>

        <div className="closet-admin-header-actions">
          <span className="closet-admin-badge">Admin view</span>
          <Link to="/admin/closet" className="sa-btn sa-btn--ghost">
            Open review queue
          </Link>
        </div>
      </header>

      {/* Card: Upload form */}
      <section className="sa-card">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            <div className="closet-card-title">
              <span className="kicker">1</span>
              <h3>Add new looks to Lala&apos;s Closet</h3>
            </div>
            <p className="closet-sub" style={{ marginTop: 4 }}>
              Drop in one or many images. Each file becomes its own closet item.
              Use a base title + tags to keep things consistent across a batch.
            </p>
            <p className="closet-upload-meta">
              Pro tip: group uploads by drop or storyline so fans see a cohesive
              moment in the feed.
            </p>
          </div>
        </header>

        {uploadMsg && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#eef2ff",
              border: "1px solid #e5e7eb",
              fontSize: 13,
            }}
          >
            {uploadMsg}
            {uploadDetails.length > 0 && (
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {uploadDetails.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 18,
            display: "grid",
            gap: 16,
            maxWidth: 760,
          }}
        >
          {/* Title / Season / Vibes */}
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Base title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sa-input"
              placeholder="Optional: e.g. Pink blazer with silver buttons"
            />
            <span className="sa-muted" style={{ fontSize: 11 }}>
              If left blank, each item will use its filename as the title.
            </span>
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Season / chapter (optional)
              </span>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="sa-input"
                placeholder="e.g. Season 1, Drop 3"
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Vibes / tags (optional)
              </span>
              <input
                type="text"
                value={vibes}
                onChange={(e) => setVibes(e.target.value)}
                className="sa-input"
                placeholder="e.g. pink, night out, cozy"
              />
            </label>
          </div>

          {/* Drag & drop area + hidden file input */}
          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Images</span>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                borderRadius: 14,
                border: isDragging ? "2px solid #6366f1" : "1px dashed #d1d5db",
                padding: 24,
                textAlign: "center",
                cursor: "pointer",
                background: isDragging ? "#eef2ff" : "#f9fafb",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <p style={{ margin: 0, fontSize: 14 }}>
                <strong>Drag & drop</strong> images here, or{" "}
                <span style={{ textDecoration: "underline" }}>click to browse</span>
              </p>
              <p className="sa-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                We&apos;ll upload each file and create a separate closet item for it.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />

            {files.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {files.length} file{files.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    className="sa-link"
                    onClick={clearFiles}
                    style={{ fontSize: 11 }}
                  >
                    Clear
                  </button>
                </div>
                <ul
                  style={{
                    listStyle: "disc",
                    paddingLeft: 18,
                    margin: 0,
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                >
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

            <span className="sa-muted" style={{ fontSize: 11 }}>
              Raw images are stored first. A Step Functions flow handles background
              cleanup, then approved looks appear in the fan closet.
            </span>
          </div>

          {/* Preview of first file */}
          {previewUrl && (
            <div
              style={{
                marginTop: 4,
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <p className="sa-muted" style={{ fontSize: 12, marginTop: 0 }}>
                This is the first image in your batch. Fans will see the cleaned,
                approved version in their closet feed.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="sa-btn"
            disabled={uploading || !files.length}
            style={{ marginTop: 8, alignSelf: "flex-start" }}
          >
            {uploading
              ? `Uploading ${files.length} look${
                  files.length > 1 ? "s" : ""
                }…`
              : files.length
              ? `Create ${files.length} closet look${
                  files.length > 1 ? "s" : ""
                }`
              : "Create closet looks"}
          </button>
        </form>
      </section>

      {/* Card: Closet items table / search */}
      <section className="sa-card">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div>
            <div className="closet-card-title">
              <span className="kicker">2</span>
              <h3>Closet inventory</h3>
            </div>
            <p className="closet-sub" style={{ marginTop: 4 }}>
              Browse, search, and manage items across all statuses. Items marked
              <strong> New</strong> were created in the last 24 hours.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="sa-btn sa-btn--ghost"
              onClick={loadItems}
              disabled={itemsLoading}
            >
              {itemsLoading ? "Refreshing…" : "Refresh list"}
            </button>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
            marginTop: 12,
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-input"
            placeholder="Search by title…"
            style={{ maxWidth: 260 }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sa-input"
            style={{ width: 180 }}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {itemsError && (
          <div
            style={{
              marginBottom: 8,
              padding: "6px 8px",
              borderRadius: 8,
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13,
            }}
          >
            {itemsError}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th style={{ padding: "6px 4px" }}>Title</th>
                <th style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                  Status
                </th>
                <th style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                  Created
                </th>
                <th style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                  Updated
                </th>
                <th style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                  Owner
                </th>
                <th style={{ padding: "6px 4px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "10px 4px",
                      color: "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    {itemsLoading
                      ? "Loading items…"
                      : "No items match your filters yet."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <td style={{ padding: "6px 4px", maxWidth: 260 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        {/* Thumbnail */}
                        {item.mediaUrl && (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              overflow: "hidden",
                              flexShrink: 0,
                              background: "#f3f4f6",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <img
                              src={item.mediaUrl}
                              alt={item.title || "Closet item"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>
                        )}

                        {/* Title + badges */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            minWidth: 0,
                          }}
                        >
                          <span
                            className="closet-table-title"
                            style={{
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {item.title}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {isNew(item.createdAt) && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "1px 6px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  background: "#eef2ff",
                                  color: "#4f46e5",
                                  fontWeight: 500,
                                }}
                              >
                                New
                              </span>
                            )}
                            {item.reason && item.status === "REJECTED" && (
                              <span
                                className="sa-muted"
                                style={{ fontSize: 11 }}
                                title={item.reason}
                              >
                                Reason: {item.reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                      <span
                        className="closet-status-pill"
                        style={{
                          background:
                            item.status === "PUBLISHED"
                              ? "#ecfdf3"
                              : item.status === "PENDING"
                              ? "#fef3c7"
                              : item.status === "REJECTED"
                              ? "#fee2e2"
                              : "#e5e7eb",
                          color:
                            item.status === "PUBLISHED"
                              ? "#166534"
                              : item.status === "PENDING"
                              ? "#92400e"
                              : item.status === "REJECTED"
                              ? "#b91c1c"
                              : "#374151",
                          borderColor:
                            item.status === "PUBLISHED"
                              ? "#bbf7d0"
                              : item.status === "PENDING"
                              ? "#fde68a"
                              : item.status === "REJECTED"
                              ? "#fecaca"
                              : "transparent",
                        }}
                      >
                        {item.status?.toLowerCase() || "unknown"}
                      </span>
                    </td>
                    <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ padding: "6px 4px", whiteSpace: "nowrap" }}>
                      <span className="sa-muted">
                        {item.ownerSub || item.userId || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        type="button"
                        className="sa-link"
                        onClick={() =>
                          window.open(
                            `/fan/closet-feed?highlight=${item.id}`,
                            "_blank",
                          )
                        }
                        style={{ marginRight: 8, fontSize: 12 }}
                      >
                        View as fan
                      </button>
                      <button
                        type="button"
                        className="sa-link sa-link--danger"
                        onClick={() => handleDelete(item.id)}
                        style={{ fontSize: 12 }}
                      >
                        Delete / reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
