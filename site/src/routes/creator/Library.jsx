// site/src/routes/creator/Library.jsx
import React, { useMemo, useState } from "react";

const demoFolders = [
  {
    id: "cab1",
    name: "Winter street style",
    count: 24,
    updatedAt: "2025-01-05T12:00:00Z",
  },
  {
    id: "cab2",
    name: "Holiday glam drop",
    count: 18,
    updatedAt: "2025-01-03T09:12:00Z",
  },
  {
    id: "cab3",
    name: "Episode 3 BTS",
    count: 12,
    updatedAt: "2024-12-28T16:30:00Z",
  },
];

export default function CreatorLibrary() {
  const [search, setSearch] = useState("");
  const [folders, setFolders] = useState(demoFolders);
  const [newName, setNewName] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, search]);

  const handleCreate = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    setFolders((prev) => [
      {
        id: `cab-${Date.now()}`,
        name,
        count: 0,
        updatedAt: now,
      },
      ...prev,
    ]);
    setNewName("");
  };

  return (
    <section className="creator-library">
      <style>{styles}</style>

      <div className="creator-card">
        <div className="lib-head">
          <div>
            <h2>Filing cabinets</h2>
            <p className="lib-sub">
              Organize your reference photos, finished looks, and episode
              assets. Later this will connect directly to S3 + search.
            </p>
          </div>
          <form onSubmit={handleCreate} className="lib-create">
            <input
              className="lib-input"
              placeholder="New cabinet name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" className="lib-btn" disabled={!newName.trim()}>
              Create
            </button>
          </form>
        </div>

        <div className="lib-search-row">
          <input
            className="lib-input lib-input--wide"
            placeholder="Search cabinets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="lib-grid">
          {filtered.map((f) => (
            <article key={f.id} className="lib-card">
              <div className="lib-icon">🗂</div>
              <div className="lib-main">
                <div className="lib-name">{f.name}</div>
                <div className="lib-meta">
                  {f.count} asset{f.count === 1 ? "" : "s"} • updated{" "}
                  {new Date(f.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="lib-actions">
                <button
                  type="button"
                  className="lib-link"
                  onClick={() =>
                    alert("Asset browser coming soon – S3 + thumbnails.")
                  }
                >
                  Open
                </button>
                <button
                  type="button"
                  className="lib-link lib-link--muted"
                  onClick={() =>
                    alert("Rename / delete / share controls coming soon.")
                  }
                >
                  …
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="lib-empty">
              No cabinets match “{search}”. Try a different name.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = `
.creator-card {
  background:#f9fafb;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:14px;
  box-shadow:0 10px 24px rgba(15,23,42,0.08);
}

.creator-library h2 {
  margin:0 0 4px;
  font-size:1rem;
}
.lib-sub {
  margin:0;
  font-size:0.86rem;
  color:#6b7280;
}

.lib-head {
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}

.lib-create {
  display:flex;
  gap:6px;
  flex-wrap:wrap;
}
.lib-input {
  border-radius:999px;
  border:1px solid #d1d5db;
  padding:6px 10px;
  font-size:0.86rem;
}
.lib-input:focus {
  outline:none;
  border-color:#111827;
}
.lib-input--wide {
  width:100%;
  border-radius:999px;
}
.lib-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.86rem;
  padding:6px 12px;
  cursor:pointer;
}
.lib-btn:disabled {
  opacity:0.6;
  cursor:default;
}

.lib-search-row {
  margin-top:10px;
}

.lib-grid {
  margin-top:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.lib-card {
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  gap:8px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  background:#f3f4f6;
}
.lib-icon {
  font-size:1.2rem;
  align-self:center;
}
.lib-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.lib-name {
  font-size:0.92rem;
  font-weight:600;
}
.lib-meta {
  font-size:0.8rem;
  color:#6b7280;
}
.lib-actions {
  display:flex;
  align-items:center;
  gap:6px;
}
.lib-link {
  background:transparent;
  border:none;
  padding:0;
  font-size:0.82rem;
  color:#111827;
  cursor:pointer;
}
.lib-link--muted {
  color:#9ca3af;
}
.lib-empty {
  margin-top:6px;
  font-size:0.86rem;
  color:#6b7280;
}
`;
