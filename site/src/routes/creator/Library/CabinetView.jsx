// site/src/routes/creator/Library/CabinetView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { graphql } from "../../../lib/sa";

//
// ─────────────────────────────────────────────────────────────
// GraphQL
// ─────────────────────────────────────────────────────────────
// NOTE: If any field / resolver names differ in your API,
// tweak the queries/mutations here accordingly.
//

// Assets for a specific cabinet
const GET_ASSETS = `
  query GetCreatorCabinetAssets($cabinetId: ID!) {
    creatorCabinetAssets(cabinetId: $cabinetId) {
      items {
        id
        cabinetId
        folderId
        kind
        title
        s3Key
        contentType
        createdAt
      }
    }
  }
`;

// Folders for the cabinet
const GET_FOLDERS = `
  query GetCreatorCabinetFolders($cabinetId: ID!) {
    creatorCabinetFolders(cabinetId: $cabinetId) {
      id
      cabinetId
      name
    }
  }
`;

// Upload URL for a new asset
const CREATE_UPLOAD_URL = `
  mutation CreateAssetUpload($input: CreateCreatorAssetUploadInput!) {
    createCreatorAssetUpload(input: $input) {
      uploadUrl
      asset {
        id
        cabinetId
        folderId
        kind
        title
        s3Key
        contentType
        createdAt
      }
    }
  }
`;

// Delete a single asset (schema returns Boolean!)
const DELETE_ASSET = `
  mutation DeleteCreatorAsset($id: ID!, $cabinetId: ID!) {
    deleteCreatorAsset(id: $id, cabinetId: $cabinetId)
  }
`;

// Multi-move asset between folders
const MOVE_ASSET = `
  mutation MoveCreatorAsset($input: MoveCreatorAssetInput!) {
    moveCreatorAsset(input: $input) {
      id
      folderId
    }
  }
`;

// Rename asset (inline title edit)
const UPDATE_ASSET = `
  mutation UpdateCreatorAsset($input: UpdateCreatorAssetInput!) {
    updateCreatorAsset(input: $input) {
      id
      title
      updatedAt
    }
  }
`;

// Folder CRUD
const CREATE_FOLDER = `
  mutation CreateCreatorFolder($input: CreateCreatorFolderInput!) {
    createCreatorFolder(input: $input) {
      id
      name
      cabinetId
    }
  }
`;

const RENAME_FOLDER = `
  mutation RenameCreatorFolder($input: RenameCreatorFolderInput!) {
    renameCreatorFolder(input: $input) {
      id
      name
    }
  }
`;

// --- helpers ------------------------------------------------

function s3PublicUrl(key) {
  return `https://${import.meta.env.VITE_UPLOADS_BUCKET}.s3.amazonaws.com/${key}`;
}

function isImage(contentType) {
  return contentType && contentType.startsWith("image/");
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Small util for toggling selection in a Set
function toggleInSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

//
// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
//

export default function CreatorCabinetView() {
  const { cabinetId } = useParams();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [filter, setFilter] = useState("");

  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [renamingFolderName, setRenamingFolderName] = useState("");

  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingAssetTitle, setEditingAssetTitle] = useState("");

  const [selectedIds, setSelectedIds] = useState(new Set());

  // ─── Load data ────────────────────────────────────────────

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [assetData, folderData] = await Promise.all([
        graphql(GET_ASSETS, { cabinetId }),
        graphql(GET_FOLDERS, { cabinetId }),
      ]);

      setAssets(assetData?.creatorCabinetAssets?.items ?? []);
      setFolders(folderData?.creatorCabinetFolders ?? []);
    } catch (err) {
      console.error("[CreatorCabinetView] load error:", err);
      setError("We couldn’t load this cabinet. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [cabinetId]);

  // ─── Derived lists ────────────────────────────────────────

  const filteredAssets = useMemo(() => {
    let items = assets;

    if (activeFolderId === "__unfiled__") {
      items = items.filter((a) => !a.folderId);
    } else if (activeFolderId && activeFolderId !== "__all__") {
      items = items.filter((a) => a.folderId === activeFolderId);
    }

    const term = filter.trim().toLowerCase();
    if (!term) return items;

    return items.filter((a) =>
      (a.title || a.s3Key || "").toString().toLowerCase().includes(term),
    );
  }, [assets, activeFolderId, filter]);

  const assetCount = filteredAssets.length;

  // ───────────────────────────────────────────────────────────
  // Upload
  // ───────────────────────────────────────────────────────────

  function handleFileSelect(e) {
    setFiles(Array.from(e.target.files || []));
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) {
      setFiles((prev) => [...prev, ...dropped]);
    }
  }

  function suppressDefault(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleUploadClick() {
    if (!files.length) return;
    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const input = {
          cabinetId,
          folderId:
            activeFolderId && activeFolderId !== "__all__"
              ? activeFolderId
              : null,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          kind: "PHOTO", // default; update if you want VIDEO/OTHER detection
        };

        const { createCreatorAssetUpload } = await graphql(
          CREATE_UPLOAD_URL,
          { input },
        );

        const { uploadUrl, asset } = createCreatorAssetUpload;

        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        setAssets((prev) => [...prev, asset]);
      }

      setFiles([]);
    } catch (err) {
      console.error("[CreatorCabinetView] upload error:", err);
      setError(
        "We couldn’t upload one or more files. Check the console and adjust mutation fields if needed.",
      );
    } finally {
      setUploading(false);
    }
  }

  // ───────────────────────────────────────────────────────────
  // Folders
  // ───────────────────────────────────────────────────────────

  async function handleCreateFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;

    try {
      const { createCreatorFolder } = await graphql(CREATE_FOLDER, {
        input: { cabinetId, name },
      });
      setFolders((prev) => [...prev, createCreatorFolder]);
      setNewFolderName("");
      setActiveFolderId(createCreatorFolder.id);
    } catch (err) {
      console.error("[CreatorCabinetView] create folder error:", err);
      setError("We couldn’t create that folder.");
    }
  }

  function startRenameFolder(folder) {
    setRenamingFolderId(folder.id);
    setRenamingFolderName(folder.name || "");
  }

  async function commitRenameFolder() {
    const name = renamingFolderName.trim();
    if (!renamingFolderId || !name) {
      setRenamingFolderId(null);
      setRenamingFolderName("");
      return;
    }

    try {
      const { renameCreatorFolder } = await graphql(RENAME_FOLDER, {
        input: { id: renamingFolderId, cabinetId, name },
      });

      setFolders((prev) =>
        prev.map((f) =>
          f.id === renameCreatorFolder.id ? renameCreatorFolder : f,
        ),
      );
    } catch (err) {
      console.error("[CreatorCabinetView] rename folder error:", err);
      setError("We couldn’t rename that folder.");
    } finally {
      setRenamingFolderId(null);
      setRenamingFolderName("");
    }
  }

  async function handleMoveAsset(assetId, destinationFolderId) {
    try {
      const { moveCreatorAsset } = await graphql(MOVE_ASSET, {
        input: {
          id: assetId,
          cabinetId,
          destinationFolderId: destinationFolderId || null,
        },
      });

      setAssets((prev) =>
        prev.map((a) =>
          a.id === moveCreatorAsset.id
            ? { ...a, folderId: moveCreatorAsset.folderId }
            : a,
        ),
      );
    } catch (err) {
      console.error("[CreatorCabinetView] move asset error:", err);
      setError("We couldn’t move that asset.");
    }
  }

  // ───────────────────────────────────────────────────────────
  // Inline asset rename
  // ───────────────────────────────────────────────────────────

  function startRenameAsset(asset) {
    setEditingAssetId(asset.id);
    setEditingAssetTitle(asset.title || "");
  }

  async function commitRenameAsset() {
    const title = editingAssetTitle.trim();

    if (!editingAssetId) {
      setEditingAssetId(null);
      setEditingAssetTitle("");
      return;
    }

    try {
      const { updateCreatorAsset } = await graphql(UPDATE_ASSET, {
        input: {
          id: editingAssetId,
          cabinetId,
          title: title || null,
        },
      });

      setAssets((prev) =>
        prev.map((a) =>
          a.id === updateCreatorAsset.id
            ? { ...a, title: updateCreatorAsset.title }
            : a,
        ),
      );
    } catch (err) {
      console.error("[CreatorCabinetView] rename asset error:", err);
      setError("We couldn’t rename that asset.");
    } finally {
      setEditingAssetId(null);
      setEditingAssetTitle("");
    }
  }

  // ───────────────────────────────────────────────────────────
  // Delete (single + multi)
  // ───────────────────────────────────────────────────────────

  async function deleteSingle(id) {
    try {
      await graphql(DELETE_ASSET, { id, cabinetId });
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error("[CreatorCabinetView] delete error:", err);
      setError("We couldn’t delete that asset.");
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.size) return;
    if (!window.confirm("Delete selected assets? This can’t be undone.")) {
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) => graphql(DELETE_ASSET, { id, cabinetId })),
      );
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("[CreatorCabinetView] bulk delete error:", err);
      setError("We couldn’t delete one or more assets.");
    }
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => toggleInSet(prev, id));
  }

  function selectAllVisible() {
    setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
  }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <section className="cabinet-view">
      <style>{styles}</style>

      <button className="cv-back" onClick={() => navigate("/creator/library")}>
        ← Back to filing cabinets
      </button>

      <header className="cv-header">
        <div>
          <h2>Cabinet assets</h2>
          <p className="cv-sub">
            Upload reference photos, finished looks, and episode assets for this
            cabinet. These will later plug into stories and episodes.
          </p>
        </div>

        <div className="cv-header-right">
          <div className="cv-stat">
            <div className="cv-stat-label">Assets</div>
            <div className="cv-stat-value">{assetCount}</div>
          </div>

          <div className="cv-search">
            <label className="cv-label">Filter</label>
            <input
              type="search"
              placeholder="Search assets by name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Layout: folders column + main column */}
      <div className="cv-layout">
        {/* Folders column */}
        <aside className="cv-folders">
          <div className="cv-folders-header">Folders</div>

          <button
            type="button"
            className={
              activeFolderId === "__all__" || !activeFolderId
                ? "cv-folder-pill cv-folder-pill--active"
                : "cv-folder-pill"
            }
            onClick={() => setActiveFolderId("__all__")}
          >
            All assets
          </button>

          <button
            type="button"
            className={
              activeFolderId === "__unfiled__"
                ? "cv-folder-pill cv-folder-pill--active"
                : "cv-folder-pill"
            }
            onClick={() => setActiveFolderId("__unfiled__")}
          >
            Unfiled
          </button>

          <div className="cv-folder-list">
            {folders.map((folder) =>
              renamingFolderId === folder.id ? (
                <form
                  key={folder.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitRenameFolder();
                  }}
                >
                  <input
                    autoFocus
                    className="cv-folder-rename-input"
                    value={renamingFolderName}
                    onChange={(e) => setRenamingFolderName(e.target.value)}
                    onBlur={commitRenameFolder}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setRenamingFolderId(null);
                        setRenamingFolderName("");
                      }
                    }}
                  />
                </form>
              ) : (
                <button
                  key={folder.id}
                  type="button"
                  className={
                    activeFolderId === folder.id
                      ? "cv-folder-pill cv-folder-pill--active"
                      : "cv-folder-pill"
                  }
                  onClick={() => setActiveFolderId(folder.id)}
                  onDoubleClick={() => startRenameFolder(folder)}
                >
                  {folder.name || "Untitled folder"}
                </button>
              ),
            )}
          </div>

          <form className="cv-folder-new" onSubmit={handleCreateFolder}>
            <input
              type="text"
              placeholder="New folder…"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button type="submit" disabled={!newFolderName.trim()}>
              +
            </button>
          </form>
        </aside>

        {/* Main column */}
        <div className="cv-main">
          {/* Upload panel with drag & drop */}
          <div
            className={dragActive ? "cv-upload cv-upload--drag" : "cv-upload"}
            onDragEnter={(e) => {
              suppressDefault(e);
              setDragActive(true);
            }}
            onDragOver={suppressDefault}
            onDragLeave={(e) => {
              suppressDefault(e);
              setDragActive(false);
            }}
            onDrop={handleDrop}
          >
            <div className="cv-upload-top">
              <div>
                <h3>Upload assets</h3>
                <p className="cv-sub">
                  Drag and drop images here, or choose files. They’ll go into
                  this cabinet
                  {activeFolderId && activeFolderId !== "__all__"
                    ? " and the selected folder."
                    : "."}
                </p>
              </div>

              <div className="cv-upload-controls">
                <input type="file" multiple onChange={handleFileSelect} />
                <button
                  type="button"
                  className="cv-btn-primary"
                  disabled={uploading || !files.length}
                  onClick={handleUploadClick}
                >
                  {uploading ? "Uploading…" : "Upload to cabinet"}
                </button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="cv-upload-files">
                {files.length} file{files.length === 1 ? "" : "s"} ready to
                upload
              </div>
            )}
          </div>

          {/* Bulk actions + errors */}
          <div className="cv-toolbar">
            <div>
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    className="cv-btn-danger"
                    onClick={handleDeleteSelected}
                  >
                    Delete selected ({selectedIds.size})
                  </button>
                  <button
                    type="button"
                    className="cv-btn-ghost"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear selection
                  </button>
                </>
              )}
            </div>

            <div className="cv-toolbar-right">
              {filteredAssets.length > 0 && (
                <button
                  type="button"
                  className="cv-btn-ghost"
                  onClick={selectAllVisible}
                >
                  Select all in view
                </button>
              )}
            </div>
          </div>

          {error && <div className="cv-error">{error}</div>}

          {loading ? (
            <div className="cv-empty">Loading assets…</div>
          ) : filteredAssets.length === 0 ? (
            <div className="cv-empty">
              <h3>No assets yet</h3>
              <p>
                Upload your first set of looks or reference images for this
                cabinet.
              </p>
            </div>
          ) : (
            <ul className="cv-grid">
              {filteredAssets.map((asset) => {
                const url = s3PublicUrl(asset.s3Key);
                const isSelected = selectedIds.has(asset.id);
                const currentlyEditing = editingAssetId === asset.id;

                return (
                  <li key={asset.id} className="cv-card">
                    <div className="cv-card-top">
                      <label className="cv-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(asset.id)}
                        />
                        <span />
                      </label>

                      {/* folder selector for move */}
                      <select
                        className="cv-folder-select"
                        value={asset.folderId || ""}
                        onChange={(e) =>
                          handleMoveAsset(asset.id, e.target.value || null)
                        }
                      >
                        <option value="">Unfiled</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name || "Untitled folder"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="cv-thumb-wrap">
                      {isImage(asset.contentType) ? (
                        <img
                          className="cv-thumb"
                          src={url}
                          alt={asset.title || asset.s3Key}
                          loading="lazy"
                        />
                      ) : (
                        <div className="cv-thumb cv-thumb-placeholder">
                          FILE
                        </div>
                      )}
                    </div>

                    <div className="cv-card-body">
                      <div className="cv-kind">{asset.kind}</div>

                      {currentlyEditing ? (
                        <input
                          className="cv-title-input"
                          value={editingAssetTitle}
                          autoFocus
                          onChange={(e) =>
                            setEditingAssetTitle(e.target.value)
                          }
                          onBlur={commitRenameAsset}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRenameAsset();
                            } else if (e.key === "Escape") {
                              setEditingAssetId(null);
                              setEditingAssetTitle("");
                            }
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          className="cv-title-button"
                          onClick={() => startRenameAsset(asset)}
                        >
                          {asset.title || asset.s3Key}
                        </button>
                      )}

                      <div className="cv-meta-line">
                        {formatDate(asset.createdAt)} •{" "}
                        {asset.contentType || "Unknown type"}
                      </div>
                    </div>

                    <div className="cv-card-footer">
                      <button
                        type="button"
                        className="cv-btn-danger cv-btn-small"
                        onClick={() => {
                          if (window.confirm("Delete this asset?")) {
                            deleteSingle(asset.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

//
// ─────────────────────────────────────────────────────────────
// Styles (Pinterest / masonry grid + layout)
// ─────────────────────────────────────────────────────────────
//

const styles = `
.cabinet-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cv-back {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #4b5563;
  cursor: pointer;
  padding: 0;
}

.cv-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.cv-sub {
  margin: 4px 0 0;
  font-size: 0.86rem;
  color: #6b7280;
}

.cv-header-right {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.cv-stat {
  padding: 8px 12px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.cv-stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.cv-stat-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: #111827;
}

.cv-search {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cv-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.cv-search input {
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  font-size: 0.86rem;
}

.cv-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .cv-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Folders column */

.cv-folders {
  background: #f9fafb;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cv-folders-header {
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin-bottom: 2px;
}

.cv-folder-pill {
  text-align: left;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 10px;
  font-size: 0.86rem;
  background: transparent;
  cursor: pointer;
  color: #4b5563;
}

.cv-folder-pill--active {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}

.cv-folder-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.cv-folder-new {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.cv-folder-new input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  font-size: 0.84rem;
}

.cv-folder-new button {
  border-radius: 999px;
  border: none;
  padding: 4px 8px;
  background: #111827;
  color: #f9fafb;
  cursor: pointer;
}

.cv-folder-rename-input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  font-size: 0.84rem;
}

/* Main column */

.cv-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cv-upload {
  background: #ffffff;
  border-radius: 16px;
  border: 1px dashed #d1d5db;
  padding: 12px 14px;
  box-shadow: 0 8px 18px rgba(15,23,42,0.04);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.cv-upload--drag {
  border-color: #6366f1;
  background: #eef2ff;
}

.cv-upload-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.cv-upload-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cv-upload-controls input[type="file"] {
  font-size: 0.78rem;
}

.cv-upload-files {
  margin-top: 8px;
  font-size: 0.82rem;
  color: #6b7280;
}

/* Buttons */

.cv-btn-primary {
  border-radius: 999px;
  border: none;
  padding: 7px 14px;
  background: #111827;
  color: #f9fafb;
  font-size: 0.84rem;
  cursor: pointer;
}

.cv-btn-danger {
  border-radius: 999px;
  border: 1px solid #fecaca;
  padding: 6px 12px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.84rem;
  cursor: pointer;
}

.cv-btn-small {
  padding: 4px 10px;
  font-size: 0.8rem;
}

.cv-btn-ghost {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 5px 10px;
  background: transparent;
  color: #4b5563;
  font-size: 0.82rem;
  cursor: pointer;
}

/* Toolbar */

.cv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.cv-toolbar-right {
  display: flex;
  gap: 8px;
}

/* Messages */

.cv-error {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  font-size: 0.86rem;
}

.cv-empty {
  margin-top: 8px;
  border-radius: 16px;
  border: 1px dashed #d1d5db;
  padding: 16px 14px;
  background: #f9fafb;
}

.cv-empty h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

/* Masonry / Pinterest-style grid */

.cv-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  column-count: 3;
  column-gap: 12px;
}

@media (max-width: 1200px) {
  .cv-grid {
    column-count: 2;
  }
}

@media (max-width: 700px) {
  .cv-grid {
    column-count: 1;
  }
}

.cv-card {
  break-inside: avoid;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 20px rgba(15,23,42,0.06);
  padding: 10px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cv-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cv-checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #6b7280;
}

.cv-checkbox-wrap input {
  width: 14px;
  height: 14px;
}

.cv-folder-select {
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 2px 6px;
  font-size: 0.78rem;
}

/* Thumbnails */

.cv-thumb-wrap {
  margin-top: 4px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.cv-thumb {
  display: block;
  width: 100%;
  height: auto;
}

.cv-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Card body */

.cv-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.cv-kind {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}

.cv-title-button {
  text-align: left;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  font-size: 0.94rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
}

.cv-title-input {
  border-radius: 6px;
  border: 1px solid #d1d5db;
  padding: 3px 6px;
  font-size: 0.9rem;
}

.cv-meta-line {
  font-size: 0.78rem;
  color: #6b7280;
}

.cv-card-footer {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
}
`;
