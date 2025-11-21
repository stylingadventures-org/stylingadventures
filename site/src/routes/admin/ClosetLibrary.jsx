// site/src/routes/admin/ClosetLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSignedGetUrl } from "../../lib/sa";

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
          createdAt
          updatedAt
          ownerSub
        }
        nextToken
      }
    }
  `,
  approve: /* GraphQL */ `
    mutation AdminApproveItem($id: ID!) {
      adminApproveItem(id: $id) {
        id
        status
        updatedAt
        audience
      }
    }
  `,
  reject: /* GraphQL */ `
    mutation AdminRejectItem($id: ID!, $reason: String) {
      adminRejectItem(id: $id, reason: $reason) {
        id
        status
        reason
        updatedAt
      }
    }
  `,
  setAudience: /* GraphQL */ `
    mutation AdminSetAudience($id: ID!, $audience: ClosetAudience!) {
      adminSetClosetAudience(id: $id, audience: $audience) {
        id
        audience
        updatedAt
      }
    }
  `,
};

const STATUS_OPTIONS = [
  { value: "ALL",       label: "All statuses" },
  { value: "PENDING",   label: "Pending" },
  { value: "APPROVED",  label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED",  label: "Rejected" },
];

const AUDIENCE_OPTIONS = [
  { value: "PUBLIC",    label: "Fan + Bestie" },
  { value: "BESTIE",    label: "Bestie only" },
  { value: "EXCLUSIVE", label: "Exclusive drop" },
];

const AUDIENCE_LABELS = {
  PUBLIC: "Fan + Bestie",
  BESTIE: "Bestie only",
  EXCLUSIVE: "Exclusive drop",
};

// In "ALL" mode, we hide rejected items by default so the library feels clean.
const HIDE_REJECTED_IN_ALL = true;

function effectiveKey(item) {
  const k = item.mediaKey || item.rawMediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
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
  return status.toLowerCase();
}

export default function ClosetLibrary() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // which item is busy (approve / reject / delete / save audience)
  const [busyId, setBusyId] = useState(null);

  // detail drawer selection
  const [selected, setSelected] = useState(null);

  // "last refreshed" tracking
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

      // In "ALL" mode, hide rejected items by default so they don't clutter.
      if (statusFilter === "ALL" && HIDE_REJECTED_IN_ALL) {
        rawItems = rawItems.filter((i) => i.status !== "REJECTED");
      }

      const hydrated = await Promise.all(
        rawItems.map(async (item) => {
          const key = effectiveKey(item);
          if (!key) return item;
          try {
            const url = await getSignedGetUrl(key);
            return { ...item, mediaUrl: url || null };
          } catch (e) {
            console.warn("[ClosetLibrary] getSignedGetUrl failed", e);
            return item;
          }
        })
      );

      // newest first
      hydrated.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setItems(hydrated);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);

      // keep drawer selection in sync if open
      if (selected) {
        const updated = hydrated.find((it) => it.id === selected.id);
        setSelected(updated || null);
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

  // initial + whenever status filter changes
  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // live "auto-updated Xs ago" label
  useEffect(() => {
    if (!lastUpdatedAt) return;
    const id = setInterval(() => {
      setSecondsSinceUpdate(
        Math.floor((Date.now() - lastUpdatedAt) / 1000)
      );
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) =>
      (item.title || "").toLowerCase().includes(q)
    );
  }, [items, search]);

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

  // ----- actions -----

  async function approveItem(item) {
    if (!window.confirm("Approve this look and make it eligible for the fan closet?")) {
      return;
    }
    try {
      setBusyId(item.id);
      await window.sa.graphql(GQL.approve, { id: item.id });

      // If it doesn't have an explicit audience yet, default to PUBLIC.
      const audience = item.audience || "PUBLIC";
      await window.sa.graphql(GQL.setAudience, {
        id: item.id,
        audience,
      });

      await loadItems();
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to approve item.");
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
        id: item.id,
        reason,
      });

      // After reject, if we're in "ALL" mode with hide-rejected, just remove locally.
      if (statusFilter === "ALL" && HIDE_REJECTED_IN_ALL) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        setBusyId(null);
        setSelected(null);
      } else {
        await loadItems();
        setSelected(null);
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
        id: item.id,
        audience,
      });
      await loadItems();
      // keep drawer selection in sync
      const updated = items.find((it) => it.id === item.id);
      setSelected(updated || null);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to update audience.");
      setBusyId(null);
    }
  }

  function openDrawer(item) {
    setSelected(item);
  }

  function closeDrawer() {
    setSelected(null);
  }

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
            to jump between drops, statuses, and fan audiences.
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
              status to quickly find what you need.
            </p>
          </div>
        </header>

        {/* Filters row */}
        <div className="closet-filters-row" style={{ marginBottom: 8 }}>
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
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="closet-grid-header">
          <span className="closet-grid-title">
            Closet items · <strong>{totalCount}</strong>{" "}
            {totalCount === 1 ? "look" : "looks"}
          </span>
          <span className="closet-grid-hint">
            Showing newest first. Auto-updated {autoLabel}.
          </span>
        </div>

        {error && (
          <div className="closet-grid-error" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}

        {!loading && !error && totalCount === 0 && (
          <div className="closet-grid-empty" style={{ marginTop: 12 }}>
            No looks found for this filter yet. Try switching status or clearing
            your search.
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
                    </div>

                    <div className="closet-grid-meta">
                      <span
                        className={"closet-status-pill " + statusClass}
                      >
                        {label}
                      </span>
                      <span className="closet-grid-audience">
                        {audienceLabel}
                      </span>
                    </div>

                    {/* Audience / status controls */}
                    <div className="closet-review-audience-row">
                      <label className="closet-review-label">
                        Audience
                      </label>
                      <select
                        className="sa-input closet-review-audience"
                        value={item.audience || "PUBLIC"}
                        disabled={isBusy}
                        onChange={(e) =>
                          updateAudience(item, e.target.value)
                        }
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
                        {/* VIEW now opens inline drawer instead of window.open */}
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

                        {/* “Delete” = reject + hide from default views */}
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
          <div
            className="closet-drawer-backdrop"
            onClick={closeDrawer}
          >
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
                  <h3 className="closet-drawer-title">
                    {selected.title || "Untitled look"}
                  </h3>

                  <div className="closet-drawer-row">
                    <span className="closet-drawer-label">Status</span>
                    <span className="closet-status-pill closet-status-pill--default">
                      {humanStatusLabel(selected)}
                    </span>
                  </div>

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

                  <div className="closet-drawer-row closet-drawer-row--meta">
                    <div>
                      <div className="closet-drawer-label">Created</div>
                      <div className="closet-drawer-metaText">
                        {selected.createdAt
                          ? new Date(
                              selected.createdAt
                            ).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="closet-drawer-label">Updated</div>
                      <div className="closet-drawer-metaText">
                        {selected.updatedAt
                          ? new Date(
                              selected.updatedAt
                            ).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="closet-drawer-actions">
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

/* Closet Library + Drawer styles */
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

/* Thumbnails – show full image, centered */

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
  background: #fef2f2;
}

.closet-grid-link--danger:hover {
  background: #fee2e2;
}

/* REVIEW / audience controls reused here */

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
  width: 360px;
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

.closet-drawer-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 600;
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
  max-width: 200px;
}

.closet-drawer-actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

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
`;
