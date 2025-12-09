// site/src/routes/creator/Library.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { graphql } from "../../lib/sa";

const LIST_QUERY = `
  query CreatorCabinets {
    creatorCabinets {
      id
      name
      assetCount
      updatedAt
    }
  }
`;

const CREATE_MUTATION = `
  mutation CreateCreatorCabinet($name: String!) {
    createCreatorCabinet(input: { name: $name }) {
      id
      name
      assetCount
      updatedAt
    }
  }
`;

function normaliseCount(cabinet) {
  if (!cabinet) return 0;
  return (
    cabinet.assetCount ??
    cabinet.totalAssets ??
    cabinet.assets ??
    0
  );
}

function formatUpdatedAt(value) {
  if (!value) return "Never updated";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Updated recently";
  return `Updated ${d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function CreatorLibrary() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [cabinets, setCabinets] = useState([]);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");

  // ----- Data loading -----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await graphql(LIST_QUERY);
        if (cancelled) return;
        setCabinets(data?.creatorCabinets || []);
      } catch (e) {
        console.error("[CreatorLibrary] load error", e);
        if (!cancelled) {
          setError("We couldn’t load your cabinets. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCabinets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cabinets;
    return cabinets.filter((c) =>
      (c.name || "").toLowerCase().includes(term)
    );
  }, [cabinets, search]);

  const totalAssets = useMemo(
    () => filteredCabinets.reduce((sum, c) => sum + normaliseCount(c), 0),
    [filteredCabinets]
  );

  // ----- Actions -----
  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setError("");

    try {
      const data = await graphql(CREATE_MUTATION, { name });
      const created = data?.createCreatorCabinet;
      if (created) {
        setCabinets((prev) => [created, ...prev]);
        setNewName("");
      }
    } catch (e) {
      console.error("[CreatorLibrary] create error", e);
      setError("We couldn’t create that cabinet. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleOpen(cabinetId) {
    if (!cabinetId) return;
    navigate(`/creator/library/${encodeURIComponent(cabinetId)}`);
  }

  // ----- Render -----
  return (
    <section className="creator-library">
      <style>{styles}</style>

      <header className="lib-header">
        <div>
          <h2 className="lib-title">Filing cabinets</h2>
          <p className="lib-sub">
            Organize your reference photos, finished looks, and episode assets.
            Later this will connect directly to S3 + search.
          </p>
        </div>
      </header>

      {/* Top bar: create + stats + search */}
      <div className="lib-top-row">
        <form className="lib-new" onSubmit={handleCreate}>
          <label className="lib-label" htmlFor="new-cabinet-name">
            Create new cabinet
          </label>
          <div className="lib-new-row">
            <input
              id="new-cabinet-name"
              type="text"
              className="lib-input"
              placeholder="e.g. Winter street style"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="lib-btn lib-btn-primary"
              disabled={creating || !newName.trim()}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>

        <div className="lib-meta">
          <div className="lib-stat">
            <div className="lib-stat-label">Cabinets</div>
            <div className="lib-stat-value">{filteredCabinets.length}</div>
          </div>
          <div className="lib-stat">
            <div className="lib-stat-label">Assets</div>
            <div className="lib-stat-value">{totalAssets}</div>
          </div>
          <div className="lib-search-wrap">
            <label htmlFor="cabinet-search" className="lib-label">
              Search
            </label>
            <input
              id="cabinet-search"
              type="search"
              className="lib-input"
              placeholder="Search cabinets by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="lib-alert-error">{error}</div>}

      {loading ? (
        <div className="lib-empty">Loading your cabinets…</div>
      ) : filteredCabinets.length === 0 ? (
        <div className="lib-empty">
          <h3>No cabinets yet</h3>
          <p>
            Start by creating your first cabinet. Use them to group reference
            photos, closet looks, or assets by episode.
          </p>
        </div>
      ) : (
        <ul className="lib-grid">
          {filteredCabinets.map((cabinet) => {
            const count = normaliseCount(cabinet);
            return (
              <li key={cabinet.id} className="lib-card">
                <div className="lib-card-main">
                  <div className="lib-card-title">
                    {cabinet.name || "Untitled cabinet"}
                  </div>
                  <div className="lib-card-meta">
                    {count} asset{count === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="lib-card-footer">
                  <div className="lib-card-updated">
                    {formatUpdatedAt(cabinet.updatedAt)}
                  </div>
                  <button
                    type="button"
                    className="lib-btn lib-btn-secondary"
                    onClick={() => handleOpen(cabinet.id)}
                  >
                    Open
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const styles = `
.creator-library {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header */

.lib-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.lib-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #0f172a;
}

.lib-sub {
  margin: 4px 0 0;
  font-size: 0.88rem;
  color: #6b7280;
  max-width: 540px;
}

/* Top row: create + stats + search */

.lib-top-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.3fr);
  gap: 16px;
  align-items: flex-end;
}

@media (max-width: 900px) {
  .lib-top-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

.lib-new {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lib-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.lib-new-row {
  display: flex;
  gap: 8px;
}

.lib-input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 8px 12px;
  font-size: 0.88rem;
  color: #111827;
  background: #ffffff;
}

.lib-input::placeholder {
  color: #9ca3af;
}

/* Meta stats + search */

.lib-meta {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.4fr);
  gap: 10px;
  align-items: flex-end;
}

@media (max-width: 640px) {
  .lib-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.lib-stat {
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.lib-stat-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.lib-stat-value {
  margin-top: 3px;
  font-size: 1.02rem;
  font-weight: 600;
  color: #111827;
}

.lib-search-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Buttons */

.lib-btn {
  border-radius: 999px;
  border: none;
  font-size: 0.84rem;
  padding: 7px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.lib-btn-primary {
  background: #111827;
  color: #f9fafb;
}

.lib-btn-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.lib-btn-secondary {
  background: #f9fafb;
  color: #111827;
  border: 1px solid #e5e7eb;
}

/* States */

.lib-alert-error {
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 0.86rem;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.lib-empty {
  border-radius: 16px;
  border: 1px dashed #d1d5db;
  padding: 18px 16px;
  background: #f9fafb;
  text-align: left;
}

.lib-empty h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.lib-empty p {
  margin: 0;
  font-size: 0.88rem;
  color: #6b7280;
}

/* Grid of cabinet cards */

.lib-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.lib-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 12px 13px 10px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lib-card-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lib-card-title {
  font-size: 0.96rem;
  font-weight: 600;
  color: #111827;
}

.lib-card-meta {
  font-size: 0.82rem;
  color: #6b7280;
}

.lib-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lib-card-updated {
  font-size: 0.78rem;
  color: #9ca3af;
}
`;
