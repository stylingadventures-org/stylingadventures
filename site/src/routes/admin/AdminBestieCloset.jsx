import React, { useEffect, useMemo, useState } from "react";
import { getSignedGetUrl } from "../../lib/sa";

const GQL = {
  // Backend: Query.adminListBestieClosetItems -> BestieClosetItemConnection
  list: /* GraphQL */ `
    query AdminListBestieClosetItems(
      $limit: Int
      $nextToken: String
      $search: String
      $ownerSub: ID
    ) {
      adminListBestieClosetItems(
        limit: $limit
        nextToken: $nextToken
        search: $search
        ownerSub: $ownerSub
      ) {
        items {
          id
          title
          status
          mediaKey
          rawMediaKey
          category
          subcategory
          tags
          ownerSub
          ownerName
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  `,
};

function effectiveKey(item) {
  const k = item.mediaKey || item.rawMediaKey || null;
  if (!k) return null;
  return String(k).replace(/^\/+/, "");
}

export default function AdminBestieCloset() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      if (window.sa?.ready) {
        await window.sa.ready();
      }

      const data = await window.sa.graphql(GQL.list, {
        limit: 200,
        nextToken: null,
        search: search.trim() || null,
        ownerSub: ownerFilter.trim() || null,
      });

      const page = data?.adminListBestieClosetItems;
      const raw = page?.items ?? [];

      const hydrated = await Promise.all(
        raw.map(async (item) => {
          const key = effectiveKey(item);
          if (!key) return item;
          try {
            const url = await getSignedGetUrl(key);
            return { ...item, mediaUrl: url || null };
          } catch (e) {
            console.warn("[AdminBestieCloset] getSignedGetUrl failed", e);
            return item;
          }
        }),
      );

      hydrated.sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      });

      setItems(hydrated);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);
    } catch (e) {
      console.error(e);
      setError(
        e?.message ||
          "Failed to load Bestie closet items. Wire adminListBestieClosetItems in the backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const id = setInterval(
      () =>
        setSecondsSinceUpdate(
          Math.floor((Date.now() - lastUpdatedAt) / 1000),
        ),
      1000,
    );
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  const totalCount = items.length;
  const autoLabel =
    lastUpdatedAt == null
      ? "—"
      : secondsSinceUpdate < 2
      ? "just now"
      : `${secondsSinceUpdate}s ago`;

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((it) =>
        (it.title || "").toLowerCase().includes(q),
      );
    }
    if (ownerFilter.trim()) {
      const q = ownerFilter.trim().toLowerCase();
      list = list.filter(
        (it) =>
          (it.ownerSub || "").toLowerCase().includes(q) ||
          (it.ownerName || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, search, ownerFilter]);

  const filteredCount = filtered.length;

  // ---- lightweight analytics (client-side) ------------------------

  const analytics = useMemo(() => {
    if (!items.length) {
      return {
        uniqueUsers: 0,
        uploads7d: 0,
        topCategory: "—",
      };
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const userSet = new Set();
    const catCounts = new Map();
    let uploads7d = 0;

    for (const it of items) {
      if (it.ownerSub) userSet.add(it.ownerSub);
      if (it.category) {
        const k = it.category;
        catCounts.set(k, (catCounts.get(k) || 0) + 1);
      }
      const t = new Date(it.createdAt || 0).getTime();
      if (!Number.isNaN(t) && t >= sevenDaysAgo) uploads7d += 1;
    }

    let topCategory = "—";
    let topCount = 0;
    for (const [cat, count] of catCounts.entries()) {
      if (count > topCount) {
        topCount = count;
        topCategory = cat;
      }
    }

    return {
      uniqueUsers: userSet.size,
      uploads7d,
      topCategory,
    };
  }, [items]);

  return (
    <div className="closet-admin-page">
      <style>{styles}</style>

      {/* Header */}
      <header className="closet-admin-header">
        <div className="closet-admin-title-block">
          <span className="closet-admin-kicker">
            STYLING ADVENTURES • BESTIE
          </span>
          <h1>Bestie closet library</h1>
          <p>
            Browse everything Besties are uploading into their personal closets.
            Use this view for moderation, insights, and future analytics.
          </p>
        </div>

        <div className="closet-admin-header-right">
          <div className="closet-library-pills">
            <span className="closet-admin-pill">Admin portal</span>
            <span className="closet-library-pill">
              Total items · <strong>{totalCount}</strong>
            </span>
            <span className="closet-library-pill closet-library-pill--soft">
              Visible · <strong>{filteredCount}</strong>
            </span>
          </div>
          <span className="closet-admin-count">
            Auto-updated <strong>{autoLabel}</strong>
          </span>
        </div>
      </header>

      {/* Quick analytics row */}
      <section className="sa-card closet-analytics-card">
        <div className="closet-analytics-grid">
          <div className="closet-analytics-metric">
            <div className="closet-analytics-label">
              Active Besties (seen here)
            </div>
            <div className="closet-analytics-value">
              {analytics.uniqueUsers}
            </div>
          </div>
          <div className="closet-analytics-metric">
            <div className="closet-analytics-label">
              Uploads in last 7 days
            </div>
            <div className="closet-analytics-value">
              {analytics.uploads7d}
            </div>
          </div>
          <div className="closet-analytics-metric">
            <div className="closet-analytics-label">
              Top category
            </div>
            <div className="closet-analytics-value">
              {analytics.topCategory}
            </div>
          </div>
        </div>
      </section>

      {/* Main card */}
      <section className="sa-card closet-library-card">
        <header className="closet-card-header">
          <div>
            <h2 className="closet-card-title">Bestie closet uploads</h2>
            <p className="closet-card-sub">
              Read-only view of Bestie closet pieces. Search by title or user,
              and skim categories to spot trends.
            </p>
          </div>
          <button
            type="button"
            className="closet-filter-refresh"
            onClick={loadItems}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {/* Filters */}
        <div className="closet-filters-row" style={{ marginTop: 8 }}>
          <input
            className="closet-filter-input"
            placeholder="Search titles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="closet-filter-input"
            placeholder="Filter by user (sub or name)…"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
          />
        </div>

        {error && (
          <div className="closet-grid-error" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}

        {!loading && !error && filteredCount === 0 && (
          <div className="closet-grid-empty" style={{ marginTop: 12 }}>
            No Bestie uploads match this filter yet.
          </div>
        )}

        {loading && filteredCount === 0 && !error && (
          <div className="closet-grid-empty" style={{ marginTop: 12 }}>
            Loading Bestie closet items…
          </div>
        )}

        {filteredCount > 0 && (
          <div
            className="closet-grid closet-grid--library"
            style={{ marginTop: 12 }}
          >
            {filtered.map((item) => (
              <article
                key={item.id}
                className="closet-grid-card closet-grid-card--library"
              >
                <div className="closet-grid-thumb">
                  {item.mediaUrl ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title || "Bestie closet item"}
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
                      {item.title || "Untitled piece"}
                    </div>
                  </div>

                  <div className="closet-grid-meta">
                    <span className="closet-status-pill closet-status-pill--default">
                      Bestie closet
                    </span>
                    <span className="closet-grid-audience">
                      {item.ownerName || "Unknown user"}
                    </span>
                  </div>

                  <div className="closet-grid-tags">
                    {item.category && (
                      <span className="closet-grid-tag">
                        {item.category}
                      </span>
                    )}
                    {item.subcategory && (
                      <span className="closet-grid-tag closet-grid-tag--soft">
                        {item.subcategory}
                      </span>
                    )}
                    {Array.isArray(item.tags) &&
                      item.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="closet-grid-tag closet-grid-tag--soft"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>

                  <div className="closet-grid-footer">
                    <span className="closet-grid-date">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </span>
                    <div className="closet-grid-actions">
                      <span className="closet-grid-link closet-grid-link--muted">
                        ownerSub: {item.ownerSub || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = `
.closet-admin-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:16px;
}
.closet-admin-title-block h1 {
  margin:4px 0;
}
.closet-admin-kicker {
  font-size:11px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:#9ca3af;
}
.closet-admin-header-right {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:6px;
}
.closet-library-pills {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  justify-content:flex-end;
}
.closet-admin-pill,
.closet-library-pill {
  padding:4px 10px;
  border-radius:999px;
  font-size:11px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
}
.closet-library-pill--soft {
  background:#eff6ff;
  border-color:#bfdbfe;
}
.closet-admin-count {
  font-size:11px;
  color:#6b7280;
}

/* analytics row */
.closet-analytics-card {
  margin-bottom:12px;
}
.closet-analytics-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:10px;
}
.closet-analytics-metric {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.closet-analytics-label {
  font-size:11px;
  color:#6b7280;
}
.closet-analytics-value {
  font-size:1.1rem;
  font-weight:600;
}

/* reuse existing closet-library styles from Admin Closet page */
`;

