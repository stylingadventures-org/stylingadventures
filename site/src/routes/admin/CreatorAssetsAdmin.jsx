// site/src/routes/admin/CreatorAssetsAdmin.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";

const GQL = {
  // Reuse the same user listing API as /admin/users
  listUsers: /* GraphQL */ `
    query Users($search: String, $limit: Int, $nextToken: String) {
      adminListUsers(search: $search, limit: $limit, nextToken: $nextToken) {
        items { id email role tier createdAt updatedAt }
        nextToken
      }
    }
  `,

  // New admin listing of creator assets by user (ownerSub)
  listCreatorAssets: /* GraphQL */ `
    query AdminListCreatorAssetsByUser(
      $ownerSub: ID!,
      $cabinetId: ID,
      $folderId: ID,
      $moderationStatus: String,
      $includeSoftDeleted: Boolean,
      $limit: Int,
      $nextToken: String
    ) {
      adminListCreatorAssetsByUser(
        ownerSub: $ownerSub,
        cabinetId: $cabinetId,
        folderId: $folderId,
        moderationStatus: $moderationStatus,
        includeSoftDeleted: $includeSoftDeleted,
        limit: $limit,
        nextToken: $nextToken
      ) {
        items {
          id
          cabinetId
          folderId
          ownerSub
          kind
          category
          title
          notes
          tags
          s3Key
          contentType
          createdAt
          updatedAt

          moderationStatus
          moderationReason
          moderatedBy
          moderatedAt
        }
        nextToken
      }
    }
  `,

  // Soft delete (mark as SOFT_DELETED)
  softDelete: /* GraphQL */ `
    mutation AdminSoftDeleteCreatorAsset($input: AdminSoftDeleteCreatorAssetInput!) {
      adminSoftDeleteCreatorAsset(input: $input) {
        id
        cabinetId
        moderationStatus
        moderationReason
        moderatedBy
        moderatedAt
        updatedAt
      }
    }
  `,

  // Restore (back to ACTIVE)
  restore: /* GraphQL */ `
    mutation AdminRestoreCreatorAsset($input: AdminRestoreCreatorAssetInput!) {
      adminRestoreCreatorAsset(input: $input) {
        id
        cabinetId
        moderationStatus
        moderationReason
        moderatedBy
        moderatedAt
        updatedAt
      }
    }
  `,

  // Reject / inappropriate (wrapper around adminModerateCreatorAsset)
  reject: /* GraphQL */ `
    mutation AdminRejectCreatorAsset($input: AdminRejectCreatorAssetInput!) {
      adminRejectCreatorAsset(input: $input) {
        id
        cabinetId
        moderationStatus
        moderationReason
        moderatedBy
        moderatedAt
        updatedAt
      }
    }
  `,
};

// Helper: build S3 URL for creator media
function s3PublicUrl(key) {
  if (!key) return null;
  // You can change this to your CloudFront domain if needed
  const bucket = import.meta.env.VITE_CREATOR_MEDIA_BUCKET || import.meta.env.VITE_UPLOADS_BUCKET;
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

function isImage(contentType) {
  return contentType && contentType.startsWith("image/");
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const MODERATION_FILTERS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active only" },
  { value: "REJECTED", label: "Rejected" },
  { value: "INAPPROPRIATE", label: "Inappropriate" },
  { value: "SOFT_DELETED", label: "Soft deleted" },
];

export default function CreatorAssetsAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();

  // User search / selection
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState({ items: [], nextToken: null });
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Asset listing
  const [assetsPage, setAssetsPage] = useState({ items: [], nextToken: null });
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetsError, setAssetsError] = useState("");

  // Filters
  const [moderationFilter, setModerationFilter] = useState("ALL");
  const [includeSoftDeleted, setIncludeSoftDeleted] = useState(true);

  // For inline “reject” reason
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // On first load: optionally pre-select user from ?ownerSub=
  useEffect(() => {
    const ownerSubFromUrl = searchParams.get("ownerSub");
    if (ownerSubFromUrl && !selectedUser) {
      setSelectedUser({
        id: ownerSubFromUrl,
        email: "(from URL param)",
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = useCallback(
    async (token = null) => {
      if (!window.sa?.graphql) return;
      setLoadingUsers(true);
      try {
        if (window.sa.ready) {
          await window.sa.ready().catch(() => {});
        }
        const res = await window.sa.graphql(GQL.listUsers, {
          search: userQuery || null,
          limit: 10,
          nextToken: token,
        });
        setUserPage(res?.adminListUsers || { items: [], nextToken: null });
      } catch (e) {
        console.error("[CreatorAssetsAdmin] load users error", e);
        setUserPage({ items: [], nextToken: null });
      } finally {
        setLoadingUsers(false);
      }
    },
    [userQuery],
  );

  // Load users on first mount and whenever search is triggered
  useEffect(() => {
    (async () => {
      await fetchUsers(null);
    })();
  }, [fetchUsers]);

  // Load assets for selected user + filters
  const fetchAssets = useCallback(
    async (user, token = null) => {
      if (!user?.id || !window.sa?.graphql) return;
      setLoadingAssets(true);
      setAssetsError("");

      try {
        if (window.sa.ready) {
          await window.sa.ready().catch(() => {});
        }

        // Map UI filter to backend
        const moderationStatusVar =
          moderationFilter === "ALL" ? null : moderationFilter;

        const res = await window.sa.graphql(GQL.listCreatorAssets, {
          ownerSub: user.id,
          cabinetId: null,
          folderId: null,
          moderationStatus: moderationStatusVar,
          includeSoftDeleted,
          limit: 100,
          nextToken: token,
        });

        const page = res?.adminListCreatorAssetsByUser || {
          items: [],
          nextToken: null,
        };

        setAssetsPage(page);
      } catch (e) {
        console.error("[CreatorAssetsAdmin] load assets error", e);
        setAssetsPage({ items: [], nextToken: null });
        setAssetsError(e?.message || String(e));
      } finally {
        setLoadingAssets(false);
      }
    },
    [moderationFilter, includeSoftDeleted],
  );

  // When a user is selected or filters change, reload assets
  useEffect(() => {
    if (selectedUser) {
      fetchAssets(selectedUser, null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("ownerSub", selectedUser.id);
        return next;
      });
    }
  }, [selectedUser, moderationFilter, includeSoftDeleted, fetchAssets, setSearchParams]);

  async function handleSoftDelete(asset) {
    if (!selectedUser) return;
    const reason =
      window.prompt(
        "Reason for soft delete? (optional – shown internally)",
        "Admin soft delete",
      ) || null;

    try {
      const res = await window.sa.graphql(GQL.softDelete, {
        input: {
          cabinetId: asset.cabinetId,
          id: asset.id,
          reason,
        },
      });

      const updated = res?.adminSoftDeleteCreatorAsset;
      if (updated?.id) {
        setAssetsPage((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === updated.id ? { ...it, ...updated } : it,
          ),
        }));
      }
    } catch (e) {
      console.error("[CreatorAssetsAdmin] soft delete error", e);
      window.alert(e?.message || String(e));
    }
  }

  async function handleRestore(asset) {
    try {
      const res = await window.sa.graphql(GQL.restore, {
        input: {
          cabinetId: asset.cabinetId,
          id: asset.id,
        },
      });

      const updated = res?.adminRestoreCreatorAsset;
      if (updated?.id) {
        setAssetsPage((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === updated.id ? { ...it, ...updated } : it,
          ),
        }));
      }
    } catch (e) {
      console.error("[CreatorAssetsAdmin] restore error", e);
      window.alert(e?.message || String(e));
    }
  }

  function startReject(asset) {
    setRejectingId(asset.id);
    setRejectReason(asset.moderationReason || "");
  }

  async function commitReject(asset) {
    const reason = rejectReason.trim() || null;

    try {
      const res = await window.sa.graphql(GQL.reject, {
        input: {
          cabinetId: asset.cabinetId,
          id: asset.id,
          moderationReason: reason,
        },
      });

      const updated = res?.adminRejectCreatorAsset;
      if (updated?.id) {
        setAssetsPage((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === updated.id ? { ...it, ...updated } : it,
          ),
        }));
      }
    } catch (e) {
      console.error("[CreatorAssetsAdmin] reject error", e);
      window.alert(e?.message || String(e));
    } finally {
      setRejectingId(null);
      setRejectReason("");
    }
  }

  const chosen = selectedUser;
  const assets = assetsPage.items || [];
  const activeFilter = moderationFilter;

  return (
    <div className="admin-creatorAssets">
      <style>{styles}</style>

      {/* HERO */}
      <section className="aca-hero">
        <div className="aca-hero-main">
          <span className="aca-kicker">Admin · Creator uploads</span>
          <h1 className="aca-title">Creator Asset Moderation</h1>
          <p className="aca-sub">
            Search a creator by email or ID, review everything they&apos;ve
            uploaded, and keep Lala&apos;s world safe with soft deletes and
            moderation tags.
          </p>
        </div>

        <div className="aca-hero-side">
          <div className="aca-pill">
            <span className="aca-pill-label">Assets in view</span>
            <span className="aca-pill-count">{assets.length}</span>
          </div>
          {chosen && (
            <div className="aca-userBadge">
              <div className="aca-userBadge-email">{chosen.email}</div>
              <div className="aca-userBadge-id">sub: {chosen.id}</div>
            </div>
          )}
        </div>
      </section>

      {/* USER SEARCH */}
      <section className="aca-userSearch">
        <div className="aca-userSearch-top">
          <div className="aca-userSearch-left">
            <label className="aca-label">Search creator</label>
            <div className="aca-userSearch-row">
              <input
                className="aca-input"
                placeholder="Type an email or user ID…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={loadingUsers}
                onClick={() => fetchUsers(null)}
              >
                {loadingUsers ? "Searching…" : "Search"}
              </button>
            </div>
            <p className="aca-hint">
              Tip: start with their email. If you already know the sub, paste it
              and press Search.
            </p>
          </div>

          <div className="aca-userList">
            {loadingUsers && !userPage.items.length && (
              <div className="aca-userList-empty">Loading users…</div>
            )}

            {!loadingUsers && !userPage.items.length && (
              <div className="aca-userList-empty">
                No users found for that search yet.
              </div>
            )}

            {userPage.items.length > 0 && (
              <ul className="aca-userList-list">
                {userPage.items.map((u) => {
                  const isActive = chosen && chosen.id === u.id;
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        className={
                          "aca-userItem" +
                          (isActive ? " aca-userItem--active" : "")
                        }
                        onClick={() => setSelectedUser(u)}
                      >
                        <div className="aca-userItem-email">
                          {u.email || "(no email)"}
                        </div>
                        <div className="aca-userItem-meta">
                          <span>id: {u.id}</span>
                          <span>role: {u.role || "FAN"}</span>
                          <span>tier: {u.tier || "FREE"}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* FILTERS + STATUS BAR */}
      <section className="aca-filters">
        <div className="aca-filters-left">
          <label className="aca-label">Moderation filter</label>
          <div className="aca-filterRow">
            <select
              className="aca-select"
              value={activeFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
              disabled={!chosen}
            >
              {MODERATION_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="aca-checkboxLabel">
              <input
                type="checkbox"
                checked={includeSoftDeleted}
                onChange={(e) => setIncludeSoftDeleted(e.target.checked)}
                disabled={!chosen}
              />
              <span>Include soft deleted</span>
            </label>
          </div>
        </div>

        <div className="aca-filters-right">
          {assetsError && (
            <div className="aca-error">
              ⚠ {assetsError}
            </div>
          )}
          {chosen && !assetsError && (
            <div className="aca-status">
              Reviewing uploads for{" "}
              <span className="aca-status-email">{chosen.email}</span>
            </div>
          )}
        </div>
      </section>

      {/* ASSET GRID */}
      <section className="aca-gridSection">
        {loadingAssets && !assets.length && chosen && (
          <div className="aca-loading">Loading creator assets…</div>
        )}

        {chosen && !loadingAssets && !assets.length && !assetsError && (
          <div className="aca-empty">
            No creator assets found for this user yet.
          </div>
        )}

        {!chosen && (
          <div className="aca-empty">
            Choose a creator on the left to load their uploads.
          </div>
        )}

        {chosen && assets.length > 0 && (
          <div className="aca-masonry">
            {assets.map((asset) => {
              const url = s3PublicUrl(asset.s3Key);
              const status = (asset.moderationStatus || "ACTIVE").toUpperCase();
              const isSoftDeleted = status === "SOFT_DELETED";
              const isRejected = status === "REJECTED";
              const isInappropriate = status === "INAPPROPRIATE";

              let statusClass = "aca-status-pill--active";
              let statusLabel = "Active";

              if (isSoftDeleted) {
                statusClass = "aca-status-pill--softDeleted";
                statusLabel = "Soft deleted";
              } else if (isRejected) {
                statusClass = "aca-status-pill--rejected";
                statusLabel = "Rejected";
              } else if (isInappropriate) {
                statusClass = "aca-status-pill--inappropriate";
                statusLabel = "Inappropriate";
              }

              return (
                <article key={asset.id} className="aca-card">
                  <div className="aca-card-media">
                    {url && isImage(asset.contentType) ? (
                      <img
                        src={url}
                        alt={asset.title || asset.s3Key}
                        loading="lazy"
                      />
                    ) : (
                      <div className="aca-card-placeholder">
                        {asset.contentType || "File"}
                      </div>
                    )}
                    <div className={`aca-status-pill ${statusClass}`}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className="aca-card-body">
                    <div className="aca-card-title">
                      {asset.title || "(untitled)"}
                    </div>
                    <div className="aca-card-meta">
                      <span>cab: {asset.cabinetId}</span>
                      {asset.folderId && <span>folder: {asset.folderId}</span>}
                    </div>

                    {(asset.category || asset.kind) && (
                      <div className="aca-card-tags">
                        {asset.kind && (
                          <span className="aca-tag aca-tag--kind">
                            {asset.kind}
                          </span>
                        )}
                        {asset.category && (
                          <span className="aca-tag aca-tag--category">
                            {asset.category}
                          </span>
                        )}
                      </div>
                    )}

                    {Array.isArray(asset.tags) && asset.tags.length > 0 && (
                      <div className="aca-card-tagRow">
                        {asset.tags.slice(0, 4).map((t) => (
                          <span key={t} className="aca-tag aca-tag--soft">
                            {t}
                          </span>
                        ))}
                        {asset.tags.length > 4 && (
                          <span className="aca-tag aca-tag--soft">
                            +{asset.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {asset.moderationReason && (
                      <div className="aca-card-reason">
                        <span className="aca-card-reason-label">Reason:</span>{" "}
                        {asset.moderationReason}
                      </div>
                    )}

                    <div className="aca-card-dates">
                      <span>
                        Uploaded: {formatDateTime(asset.createdAt)}
                      </span>
                      <span>
                        Updated: {formatDateTime(asset.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="aca-card-actions">
                    <Link
                      to={`/creator/library/cabinet/${asset.cabinetId}?asset=${asset.id}`}
                      className="btn btn-ghost btn-sm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View in cabinet ↗
                    </Link>

                    <div className="aca-card-rightActions">
                      {!isSoftDeleted && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSoftDelete(asset)}
                        >
                          Soft delete
                        </button>
                      )}

                      {isSoftDeleted && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRestore(asset)}
                        >
                          Restore
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => startReject(asset)}
                      >
                        Tag rejected
                      </button>
                    </div>
                  </div>

                  {rejectingId === asset.id && (
                    <div className="aca-rejectPanel">
                      <label className="aca-rejectLabel">
                        Rejection reason (visible internally)
                      </label>
                      <textarea
                        className="aca-rejectInput"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="aca-rejectButtons">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => commitReject(asset)}
                        >
                          Save rejection
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                        >
                          Cancel
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

const styles = `
.admin-creatorAssets {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO */
.aca-hero {
  border-radius:22px;
  padding:16px 18px;
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  flex-wrap:wrap;
  background:
    radial-gradient(circle at top left, rgba(252,231,243,0.96), rgba(249,250,251,0.98)),
    radial-gradient(circle at bottom right, rgba(224,231,255,0.95), #ffffff);
  border:1px solid #e5e7eb;
  box-shadow:0 18px 38px rgba(148,163,184,0.34);
}
.aca-hero-main {
  max-width:520px;
}
.aca-kicker {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.16em;
  color:#9ca3af;
  font-weight:600;
}
.aca-title {
  margin:2px 0 4px;
  font-size:1.4rem;
  letter-spacing:-0.02em;
}
.aca-sub {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
}
.aca-hero-side {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:8px;
}
.aca-pill {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 10px;
  border-radius:999px;
  background:#eff6ff;
  border:1px solid #dbeafe;
}
.aca-pill-label {
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#1d4ed8;
}
.aca-pill-count {
  font-size:0.9rem;
  font-weight:600;
  color:#111827;
}
.aca-userBadge {
  min-width:220px;
  border-radius:14px;
  padding:8px 10px;
  background:rgba(255,255,255,0.9);
  border:1px solid #e5e7eb;
  box-shadow:0 10px 24px rgba(148,163,184,0.32);
}
.aca-userBadge-email {
  font-size:0.86rem;
  font-weight:600;
  word-break:break-all;
}
.aca-userBadge-id {
  font-size:0.75rem;
  color:#6b7280;
}

/* USER SEARCH */
.aca-userSearch {
  border-radius:16px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:10px 12px;
}
.aca-userSearch-top {
  display:flex;
  gap:12px;
}
@media (max-width: 900px) {
  .aca-userSearch-top {
    flex-direction:column;
  }
}
.aca-userSearch-left {
  flex:1;
}
.aca-label {
  display:block;
  font-size:0.7rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#9ca3af;
  margin-bottom:4px;
}
.aca-userSearch-row {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.aca-input {
  flex:1;
  min-width:0;
  border-radius:999px;
  border:1px solid #d1d5db;
  padding:8px 12px;
  font-size:0.9rem;
  background:#ffffff;
}
.aca-input:focus {
  outline:none;
  border-color:#4f46e5;
  box-shadow:0 0 0 1px rgba(79,70,229,0.2);
}
.aca-hint {
  margin:4px 0 0;
  font-size:0.78rem;
  color:#9ca3af;
}

.aca-userList {
  width:260px;
  max-height:220px;
  overflow:auto;
  border-radius:12px;
  border:1px dashed #d1d5db;
  background:#ffffff;
}
.aca-userList-empty {
  padding:10px;
  font-size:0.8rem;
  color:#9ca3af;
}
.aca-userList-list {
  list-style:none;
  margin:0;
  padding:0;
}
.aca-userItem {
  width:100%;
  padding:8px 10px;
  border:none;
  background:transparent;
  text-align:left;
  cursor:pointer;
  border-bottom:1px solid #f3f4f6;
}
.aca-userItem:last-child {
  border-bottom:none;
}
.aca-userItem:hover {
  background:#f9fafb;
}
.aca-userItem--active {
  background:#eef2ff;
}
.aca-userItem-email {
  font-size:0.86rem;
  font-weight:600;
  word-break:break-all;
}
.aca-userItem-meta {
  margin-top:2px;
  font-size:0.75rem;
  color:#6b7280;
  display:flex;
  flex-wrap:wrap;
  gap:4px 8px;
}

/* FILTERS */
.aca-filters {
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  gap:10px;
}
.aca-filters-left {
  flex:1;
}
.aca-filterRow {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}
.aca-select {
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#ffffff;
  padding:6px 10px;
  font-size:0.85rem;
}
.aca-checkboxLabel {
  display:inline-flex;
  align-items:center;
  gap:4px;
  font-size:0.8rem;
  color:#4b5563;
}
.aca-filters-right {
  display:flex;
  align-items:center;
  gap:8px;
}
.aca-error {
  font-size:0.8rem;
  color:#b91c1c;
}
.aca-status {
  font-size:0.8rem;
  color:#6b7280;
}
.aca-status-email {
  font-weight:600;
  color:#111827;
}

/* ASSET GRID / MASONRY */
.aca-gridSection {
  min-height:120px;
}
.aca-loading,
.aca-empty {
  font-size:0.9rem;
  color:#4b5563;
  padding:10px 2px;
}

.aca-masonry {
  column-count: 4;
  column-gap: 14px;
}
@media (max-width: 1200px) {
  .aca-masonry { column-count: 3; }
}
@media (max-width: 900px) {
  .aca-masonry { column-count: 2; }
}
@media (max-width: 600px) {
  .aca-masonry { column-count: 1; }
}

.aca-card {
  break-inside: avoid;
  margin-bottom:14px;
  border-radius:18px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  box-shadow:0 10px 22px rgba(148,163,184,0.28);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.aca-card-media {
  position:relative;
  background:#f9fafb;
}
.aca-card-media img {
  width:100%;
  display:block;
  object-fit:cover;
}
.aca-card-placeholder {
  height:180px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.8rem;
  color:#6b7280;
}
.aca-status-pill {
  position:absolute;
  left:8px;
  top:8px;
  font-size:0.7rem;
  padding:3px 9px;
  border-radius:999px;
  background:#e5e7eb;
  color:#111827;
}
.aca-status-pill--active {
  background:#ecfdf5;
  color:#166534;
}
.aca-status-pill--softDeleted {
  background:#fef2f2;
  color:#b91c1c;
}
.aca-status-pill--rejected {
  background:#fef3c7;
  color:#92400e;
}
.aca-status-pill--inappropriate {
  background:#fee2e2;
  color:#b91c1c;
}

.aca-card-body {
  padding:9px 10px 8px;
  display:flex;
  flex-direction:column;
  gap:4px;
}
.aca-card-title {
  font-size:0.9rem;
  font-weight:600;
}
.aca-card-meta {
  font-size:0.75rem;
  color:#9ca3af;
  display:flex;
  gap:6px;
  flex-wrap:wrap;
}
.aca-card-tags {
  display:flex;
  gap:4px;
  flex-wrap:wrap;
}
.aca-card-tagRow {
  display:flex;
  gap:4px;
  flex-wrap:wrap;
}
.aca-tag {
  font-size:0.7rem;
  border-radius:999px;
  padding:3px 7px;
}
.aca-tag--kind {
  background:#eef2ff;
  color:#4338ca;
}
.aca-tag--category {
  background:#ecfdf5;
  color:#166534;
}
.aca-tag--soft {
  background:#f3f4f6;
  color:#4b5563;
}

.aca-card-reason {
  margin-top:2px;
  font-size:0.78rem;
  color:#7f1d1d;
}
.aca-card-reason-label {
  font-weight:600;
}
.aca-card-dates {
  margin-top:4px;
  font-size:0.75rem;
  color:#9ca3af;
  display:flex;
  flex-direction:column;
}

/* card actions */
.aca-card-actions {
  padding:8px 10px 9px;
  border-top:1px dashed #e5e7eb;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
}
.aca-card-rightActions {
  display:flex;
  gap:4px;
  flex-wrap:wrap;
}

/* Reject inline panel */
.aca-rejectPanel {
  border-top:1px dashed #e5e7eb;
  padding:8px 10px;
  background:#fef2f2;
}
.aca-rejectLabel {
  display:block;
  font-size:0.75rem;
  color:#7f1d1d;
  margin-bottom:2px;
}
.aca-rejectInput {
  width:100%;
  min-height:60px;
  border-radius:10px;
  border:1px solid #fecaca;
  padding:6px 8px;
  font-size:0.85rem;
  resize:vertical;
}
.aca-rejectButtons {
  margin-top:6px;
  display:flex;
  gap:6px;
  justify-content:flex-end;
}

/* BUTTONS */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:7px 14px;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.85rem;
  font-weight:500;
}
.btn-sm {
  padding:6px 11px;
  font-size:0.8rem;
}
.btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.btn:active {
  transform:translateY(1px);
}
.btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.btn-ghost {
  background:#ffffff;
  color:#374151;
}
.btn-danger {
  background:#fee2e2;
  border-color:#fecaca;
  color:#b91c1c;
}
.btn-danger:hover {
  background:#fecaca;
}
`;


