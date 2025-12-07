// site/src/routes/creator/Library.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { graphql } from "../../lib/sa";

/**
 * Backed by:
 *
 *   query {
 *     creatorCabinets {
 *       id
 *       name
 *       assetCount
 *       updatedAt
 *     }
 *   }
 *
 *   mutation CreateCreatorCabinet($name: String!) {
 *     createCreatorCabinet(input: { name: $name }) {
 *       id
 *       name
 *       assetCount
 *       updatedAt
 *     }
 *   }
 */

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
  // assetCount is the field your schema definitely has;
  // totalAssets / assets are safety fallbacks.
  return (
    cabinet.assetCount ??
    cabinet.totalAssets ??
    cabinet.assets ??
    0
  );
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
      (c.name || "").toLowerCase().includes(term),
    );
  }, [cabinets, search]);

  const totalAssets = useMemo(
    () => cabinets.reduce((sum, c) => sum + normaliseCount(c), 0),
    [cabinets],
  );

  // ----- Actions -----
  async function handleCreate(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    setError("");

    try {
      const data = await graphql(CREATE_MUTATION, { name: trimmed });
      const created = data?.createCreatorCabinet;
      if (created) {
        // Prepend so the new one is visible at the top
        setCabinets((prev) => [created, ...prev]);
        setNewName("");
      }
    } catch (e) {
      console.error("[CreatorLibrary] create error", e);
      setError("Couldn’t create that cabinet. Please try again.");
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
    <section className="section section-tight">
      <header className="section-header">
        <h2 className="section-title">Filing cabinets</h2>
        <p className="section-subtitle">
          Organize your reference photos, finished looks, and episode assets.
          Later this will connect directly to S3 + search.
        </p>
      </header>

      {/* New cabinet + stats + search bar */}
      <div
        className="creator-library-bar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", gap: "0.5rem", flexGrow: 1, maxWidth: 420 }}
        >
          <div style={{ flexGrow: 1 }}>
            <label
              htmlFor="new-cabinet-name"
              className="field-label"
              style={{ display: "block", marginBottom: 4 }}
            >
              New cabinet name
            </label>
            <input
              id="new-cabinet-name"
              type="text"
              className="input"
              placeholder="Winter street style"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating || !newName.trim()}
            style={{ marginBottom: 0 }}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 260,
          }}
        >
          <div className="muted">
            {cabinets.length} cabinets • {totalAssets} assets
          </div>
          <input
            type="search"
            className="input"
            placeholder="Search cabinets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* List / empty state */}
      {loading ? (
        <p className="muted">Loading cabinets…</p>
      ) : filteredCabinets.length === 0 ? (
        <div className="creator-library-empty">
          <p className="muted">No cabinets yet.</p>
          <p className="muted">
            Create your first cabinet to organize episode assets.
          </p>
        </div>
      ) : (
        <ul className="creator-library-list">
          {filteredCabinets.map((cabinet) => {
            const count = normaliseCount(cabinet);
            return (
              <li
                key={cabinet.id}
                className="creator-library-row card card-ghost"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.9rem 1.1rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <div className="creator-library-row-title">
                    {cabinet.name || "Untitled cabinet"}
                  </div>
                  <div className="creator-library-row-meta muted">
                    {count} asset{count === 1 ? "" : "s"}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleOpen(cabinet.id)}
                >
                  Open
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const styles = `
.creator-shell {
  max-width: 1120px;
  margin: 0 auto 40px;
  padding: 10px 12px 32px;
}

.creator-header {
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  background: radial-gradient(circle at 0 0, #f9fafb, #f3f4f6 50%, #e5e7eb);
  padding: 14px 16px 10px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.15);
}

.creator-header-main {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.creator-logo-block {
  display: flex;
  gap: 12px;
  align-items: center;
}

.creator-logo-pill {
  border-radius: 999px;
  padding: 8px 11px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #111827;
  color: #f9fafb;
}

.creator-logo-text h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.creator-logo-text p {
  margin: 0;
  margin-top: 2px;
  font-size: 0.86rem;
  color: #6b7280;
}

.creator-header-meta {
  display: flex;
  gap: 6px;
  align-items: center;
}

.creator-pill {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 4px 10px;
  font-size: 0.75rem;
  color: #374151;
}

/* Nav */

.creator-nav {
  margin-top: 10px;
  padding-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.4);
}

.creator-nav-item {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.84rem;
  border: 1px solid transparent;
  background: transparent;
  color: #4b5563;
  text-decoration: none;
  cursor: pointer;
}
.creator-nav-item:hover {
  background: rgba(17, 24, 39, 0.04);
}
.creator-nav-item--active {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}

/* Main */

.creator-main {
  margin-top: 14px;
}

/* Responsive */

@media (max-width: 720px) {
  .creator-header-main {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;