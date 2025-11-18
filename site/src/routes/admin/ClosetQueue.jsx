// site/src/routes/admin/ClosetQueue.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { getSignedGetUrl } from "../../lib/sa";

const GQL = {
  list: /* GraphQL */ `
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
  approve: /* GraphQL */ `
    mutation Approve($id: ID!) {
      adminApproveItem(id: $id) {
        id
        status
        updatedAt
        audience
      }
    }
  `,
  reject: /* GraphQL */ `
    mutation Reject($id: ID!, $reason: String) {
      adminRejectItem(id: $id, reason: $reason) {
        id
        status
        reason
        updatedAt
      }
    }
  `,
  // only sets audience – called after approve or when editing an approved item
  setAudience: /* GraphQL */ `
    mutation SetAudience($id: ID!, $audience: ClosetAudience!) {
      adminSetClosetAudience(id: $id, audience: $audience) {
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

/**
 * For your stack, rawMediaKey is already the real S3 key
 * (e.g. "8c261459-3104-43fe-908d-38ada56f881c.jpg").
 * So just clean slashes and return it.
 */
function computeOriginalKey(item) {
  const raw = item.mediaKey || item.rawMediaKey;
  if (!raw) return null;
  return String(raw).replace(/^\/+/, "");
}

/**
 * Thumbnail key – for now, just reuse the original key
 * without adding any thumbs/ prefix.
 */
function computeThumbKey(item) {
  const orig = computeOriginalKey(item);
  if (!orig) return null;
  return String(orig).replace(/^\/+/, "");
}

/**
 * Build an S3 console URL for the ORIGINAL object so you can inspect it.
 */
function buildS3ConsoleUrl(item) {
  const cfg = window.__cfg || {};
  const bucket =
    cfg.uploadsBucket ||
    cfg.mediaBucket ||
    cfg.webBucket ||
    cfg.bucket ||
    cfg.BUCKET ||
    "";

  const region = cfg.region || "us-east-1";
  const origKey = computeOriginalKey(item);

  if (!bucket || !origKey) {
    console.warn("[ClosetQueue] Cannot build S3 console URL", {
      bucket,
      origKey,
      mediaKey: item.mediaKey,
      rawMediaKey: item.rawMediaKey,
      cfg,
    });
    return null;
  }

  const encodedBucket = encodeURIComponent(bucket);
  const encodedKey = encodeURIComponent(origKey);

  return `https://s3.console.aws.amazon.com/s3/object/${encodedBucket}?region=${region}&prefix=${encodedKey}`;
}

export default function ClosetQueue() {
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [sort, setSort] = useState("NEWEST"); // NEWEST | OLDEST
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const data = await window.sa.graphql(GQL.list);
      const baseList = (data?.adminListPending || []).map((it) => ({
        ...it,
        userId: it.userId || it.ownerSub || "",
        audience: it.audience || "PUBLIC",
      }));

      // Attach preview URLs using the shared helper – now via computeThumbKey
      const withMediaUrls = await Promise.all(
        baseList.map(async (it) => {
          const key = computeThumbKey(it);
          if (!key) return it;
          try {
            const mediaUrl = await getSignedGetUrl(key);
            return { ...it, mediaUrl: mediaUrl || null };
          } catch (e) {
            console.warn("[ClosetQueue] preview URL failed", e);
            return it;
          }
        })
      );

      setItems(withMediaUrls);
    } catch (e) {
      console.error(e);
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (window.sa?.ready) await window.sa.ready();
        setAuthReady(true);
        await refresh();
      } catch (e) {
        console.error(e);
        setErr(e?.message || String(e));
      }
    })();
  }, [refresh]);

  // ------- actions -------

  async function approve(id, audience) {
    try {
      setBusyId(id);
      const aud = audience || "PUBLIC";
      await window.sa.graphql(GQL.approve, { id });
      await window.sa.graphql(GQL.setAudience, { id, audience: aud });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id) {
    const reason = window.prompt("Reason (optional):") || null;
    if (!window.confirm("Reject this closet item?")) return;

    try {
      setBusyId(id);
      await window.sa.graphql(GQL.reject, { id, reason });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function saveAudience(id, audience) {
    try {
      setBusyId(id);
      await window.sa.graphql(GQL.setAudience, { id, audience });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  function updateLocalAudience(id, audience) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, audience } : it))
    );
  }

  // ------- derived list (filters + sort) -------

  const visibleItems = useMemo(() => {
    let list = [...items];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((it) =>
        (it.title || "").toLowerCase().includes(q)
      );
    }

    if (audienceFilter !== "ALL") {
      list = list.filter(
        (it) => (it.audience || "PUBLIC") === audienceFilter
      );
    }

    list.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return sort === "OLDEST" ? ta - tb : tb - ta;
    });

    return list;
  }, [items, search, audienceFilter, sort]);

  const pendingCount = items.length;

  return (
    <div className="admin-closet-queue">
      <style>{styles}</style>

      {/* HERO */}
      <header className="cq-hero">
        <div className="cq-hero-main">
          <div className="cq-kicker">Styling Adventures with Lala</div>
          <h1 className="cq-title">
            Closet queue <span className="cq-emoji">🧺</span>
          </h1>
          <p className="cq-sub">
            Approve or reject closet uploads, choose who can see them, and keep
            the fan closet feeling like a curated boutique.
          </p>
        </div>

        <div className="cq-hero-meta">
          <span className="cq-chip">Admin portal</span>
          <div className="cq-count">
            <span className="cq-count-label">Pending items</span>
            <span className="cq-count-value">{pendingCount}</span>
          </div>
          <button
            className="sa-btn sa-btn--ghost cq-hero-refresh"
            onClick={refresh}
            disabled={!authReady || loading}
          >
            {loading ? "Refreshing…" : "Refresh queue"}
          </button>
        </div>
      </header>

      {/* ERROR / AUTH NOTICE */}
      {!authReady && (
        <div className="cq-error">Auth not ready – checking session…</div>
      )}
      {err && (
        <div className="cq-error">
          <strong>Oops:</strong> {err}
        </div>
      )}

      {/* SHELL */}
      <section className="cq-shell">
        {/* LEFT: filters */}
        <aside className="cq-filters-card">
          <h2 className="cq-card-title">Review filters</h2>
          <p className="cq-card-sub">
            Narrow things down by audience or mood when you have a big queue.
          </p>

          <div className="cq-filters-grid">
            <label className="cq-field">
              <span className="cq-field-label">Search titles</span>
              <input
                className="sa-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Holiday glam"
              />
            </label>

            <label className="cq-field">
              <span className="cq-field-label">Audience</span>
              <select
                className="sa-input"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
              >
                <option value="ALL">All audiences</option>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="cq-field">
              <span className="cq-field-label">Sort by</span>
              <select
                className="sa-input"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
              </select>
            </label>
          </div>
        </aside>

        {/* RIGHT: queue grid */}
        <main className="cq-grid-card">
          <div className="cq-grid-header">
            <div>
              <h2 className="cq-card-title">Closet items grid</h2>
              <p className="cq-card-sub">
                One card per pending upload. Approve to send it into the closet,
                or reject with a note for your own records.
              </p>
            </div>
            <div className="cq-grid-meta">
              <span className="cq-grid-count">
                {visibleItems.length} shown
              </span>
            </div>
          </div>

          {loading && items.length === 0 && (
            <div className="cq-empty">Loading pending looks…</div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="cq-empty">
              No pending closet items match your filters right now.
            </div>
          )}

          {visibleItems.length > 0 && (
            <div className="cq-grid">
              {visibleItems.map((it) => {
                const isPending = it.status === "PENDING";
                const isApproved = it.status === "APPROVED";
                const s3ConsoleUrl = buildS3ConsoleUrl(it);

                return (
                  <article key={it.id} className="cq-card">
                    <div className="cq-thumb-wrap">
                      {it.mediaUrl ? (
                        <img
                          src={it.mediaUrl}
                          alt={it.title || "Closet item"}
                          className="cq-thumb"
                        />
                      ) : (
                        <div className="cq-thumb cq-thumb--empty">
                          No preview
                        </div>
                      )}
                      <span className="cq-status-pill">
                        {isPending ? "Pending" : it.status || "Unknown"}
                      </span>
                    </div>

                    <div className="cq-card-body">
                      <div className="cq-title-row">
                        <h3 className="cq-item-title">
                          {it.title || "(Untitled)"}
                        </h3>
                      </div>

                      <div className="cq-meta-row">
                        <span className="cq-meta-chip">
                          {(it.audience || "PUBLIC") === "PUBLIC"
                            ? "Fan + Bestie"
                            : (it.audience || "BESTIE") === "BESTIE"
                            ? "Bestie only"
                            : "Exclusive drop"}
                        </span>
                        <span className="cq-meta-text">
                          {it.createdAt
                            ? new Date(it.createdAt).toLocaleDateString()
                            : "Recently"}
                        </span>
                      </div>

                      <p className="cq-userline">
                        User <code>{it.userId || it.ownerSub || "—"}</code>
                      </p>

                      {it.reason && it.status === "REJECTED" && (
                        <p className="cq-reason">
                          Last rejection: {it.reason}
                        </p>
                      )}

                      {/* Audience + actions */}
                      <div className="cq-actions">
                        <div className="cq-actions-left">
                          <label
                            className="cq-field-label"
                            htmlFor={`aud-${it.id}`}
                          >
                            Audience
                          </label>
                          <select
                            id={`aud-${it.id}`}
                            value={it.audience || "PUBLIC"}
                            onChange={async (e) => {
                              const val = e.target.value;
                              updateLocalAudience(it.id, val);
                              if (isApproved) {
                                await saveAudience(it.id, val);
                              }
                            }}
                            className="sa-input cq-audience-select"
                          >
                            {AUDIENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {!it.mediaUrl && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginTop: 2,
                              }}
                            >
                              (No image URL yet)
                            </div>
                          )}
                        </div>

                        <div className="cq-actions-right">
                          {s3ConsoleUrl && (
                            <a
                              className="sa-btn sa-btn--ghost cq-s3-link"
                              href={s3ConsoleUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open in S3
                            </a>
                          )}

                          <button
                            className="sa-btn cq-approve-btn"
                            disabled={!isPending || busyId === it.id}
                            onClick={() => approve(it.id, it.audience)}
                          >
                            {busyId === it.id
                              ? "Saving…"
                              : isPending
                              ? "Approve"
                              : "Approved"}
                          </button>

                          <button
                            className="sa-link cq-reject-link"
                            onClick={() => reject(it.id)}
                            disabled={busyId === it.id}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

const styles = `
.admin-closet-queue {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

/* HERO */
.cq-hero {
  margin-top: 4px;
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(252, 231, 243, 0.95), rgba(255, 255, 255, 0.96)),
    radial-gradient(circle at bottom right, rgba(221, 214, 254, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 18px 40px rgba(148, 163, 184, 0.45);
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
@media (max-width: 840px) {
  .cq-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

.cq-hero-main {
  max-width: 620px;
}
.cq-kicker {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #6b7280;
  margin-bottom: 2px;
}
.cq-title {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cq-emoji {
  font-size: 22px;
}
.cq-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #4b5563;
}

.cq-hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
@media (max-width: 840px) {
  .cq-hero-meta {
    align-items: flex-start;
  }
}
.cq-chip {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.cq-count {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.cq-count-label {
  font-size: 11px;
  color: #6b7280;
}
.cq-count-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.cq-hero-refresh {
  font-size: 12px;
  padding-inline: 14px;
}

/* ERROR */
.cq-error {
  margin-bottom: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 13px;
}

/* SHELL */
.cq-shell {
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  gap: 18px;
}
@media (max-width: 900px) {
  .cq-shell {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* FILTERS CARD */
.cq-filters-card {
  background: #f9f5ff;
  border-radius: 20px;
  border: 1px solid rgba(209, 213, 219, 0.75);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
  padding: 14px 16px 16px;
}
.cq-card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.cq-card-sub {
  margin: 4px 0 10px;
  font-size: 13px;
  color: #6b7280;
}
.cq-filters-grid {
  display: grid;
  gap: 10px;
}
.cq-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cq-field-label {
  font-size: 11px;
  color: #6b7280;
}

/* GRID CARD */
.cq-grid-card {
  background: #f5f3ff;
  border-radius: 20px;
  border: 1px solid rgba(209, 213, 219, 0.75);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
  padding: 14px 16px 16px;
}
.cq-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}
.cq-grid-meta {
  font-size: 12px;
  color: #6b7280;
}
.cq-grid-count {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}

.cq-empty {
  padding: 18px 10px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

/* GRID */
.cq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 8px;
}

/* CARD */
.cq-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.3);
  display: flex;
  flex-direction: column;
}

/* thumb */
.cq-thumb-wrap {
  position: relative;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: linear-gradient(135deg, #e0f2fe, #fdf2ff);
  min-height: 160px;
}
.cq-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cq-thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9ca3af;
}
.cq-status-pill {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #fef3c7;
  color: #92400e;
  font-weight: 500;
}

/* body */
.cq-card-body {
  padding: 10px 12px 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cq-item-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.cq-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.cq-meta-chip {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
}
.cq-meta-text {
  font-size: 11px;
  color: #9ca3af;
}
.cq-userline {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}
.cq-reason {
  margin: 0;
  font-size: 11px;
  color: #9f1239;
}

/* actions */
.cq-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  margin-top: 6px;
}
.cq-actions-left {
  flex: 1 1 auto;
}
.cq-audience-select {
  font-size: 11px;
  padding-inline: 8px;
}
.cq-actions-right {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.cq-s3-link {
  font-size: 11px;
  padding-inline: 10px;
}
.cq-approve-btn {
  font-size: 11px;
  padding-inline: 12px;
}
.cq-reject-link {
  font-size: 11px;
  color: #b91c1c;
}
.cq-reject-link:hover {
  text-decoration: underline;
}
`;
