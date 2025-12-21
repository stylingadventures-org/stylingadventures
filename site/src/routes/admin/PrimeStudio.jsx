// site/src/routes/admin/PrimeStudio.jsx
import React, { useState } from "react";

export default function PrimeStudio() {
  const [episodes, setEpisodes] = useState([
    { id: 1, season: 1, episode: 1, title: "Pilot", status: "published", airDate: "2025-01-15" },
    { id: 2, season: 1, episode: 2, title: "First Fit", status: "published", airDate: "2025-01-22" },
    { id: 3, season: 1, episode: 3, title: "Confidence Check", status: "draft", airDate: null },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showForm, setShowForm] = useState(false);

  const handleNew = () => {
    setEditingId(null);
    setEditForm({
      season: 1,
      episode: (Math.max(...episodes.map(e => e.episode), 0) + 1),
      title: "",
      status: "draft",
      airDate: null,
    });
    setShowForm(true);
  };

  const handleEdit = (ep) => {
    setEditingId(ep.id);
    setEditForm({ ...ep });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingId) {
      setEpisodes(episodes.map(ep => ep.id === editingId ? { ...editForm, id: editingId } : ep));
    } else {
      setEpisodes([...episodes, { ...editForm, id: Math.max(...episodes.map(e => e.id), 0) + 1 }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this episode?")) {
      setEpisodes(episodes.filter(ep => ep.id !== id));
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <style>{`
        .ps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .ps-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #0f172a;
        }

        .ps-btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #4f46e5;
          color: white;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
        }

        .ps-btn:hover {
          background: #4338ca;
          box-shadow: 0 4px 12px rgba(79,70,229,0.3);
        }

        .ps-btn-secondary {
          background: #f3f4f6;
          color: #0f172a;
          border-color: #d1d5db;
        }

        .ps-btn-secondary:hover {
          background: #e5e7eb;
        }

        .ps-list {
          display: grid;
          gap: 12px;
        }

        .ps-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .ps-card:hover {
          border-color: #cbd5f5;
          box-shadow: 0 4px 12px rgba(79,70,229,0.1);
        }

        .ps-card-info {
          flex: 1;
        }

        .ps-card-title {
          font-weight: 600;
          font-size: 15px;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .ps-card-meta {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .ps-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-right: 8px;
        }

        .ps-badge-published {
          background: #d1fae5;
          color: #065f46;
        }

        .ps-badge-draft {
          background: #fef3c7;
          color: #92400e;
        }

        .ps-actions {
          display: flex;
          gap: 8px;
        }

        .ps-action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          background: #f3f4f6;
          color: #0f172a;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ps-action-btn:hover {
          background: #e5e7eb;
        }

        .ps-action-btn-delete {
          color: #dc2626;
        }

        .ps-action-btn-delete:hover {
          background: #fee2e2;
        }

        .ps-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .ps-modal-content {
          background: white;
          border-radius: 12px;
          padding: 28px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .ps-modal h2 {
          margin: 0 0 20px;
          font-size: 22px;
          color: #0f172a;
        }

        .ps-form-group {
          margin-bottom: 20px;
        }

        .ps-form-group label {
          display: block;
          font-weight: 500;
          font-size: 14px;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .ps-form-group input,
        .ps-form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .ps-form-group input:focus,
        .ps-form-group select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
        }

        .ps-modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 28px;
        }

        .ps-info {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          color: #1e40af;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="ps-header">
        <h1>🎬 Prime Studio</h1>
        <button className="ps-btn" onClick={handleNew}>
          + New Episode
        </button>
      </div>

      <div className="ps-info">
        📌 Prime Studio is the creative control center. Create, edit, and publish episodes here. Only accessible to Prime group members.
      </div>

      <div className="ps-list">
        {episodes.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "40px 0" }}>
            No episodes yet. Create your first one!
          </p>
        ) : (
          episodes.map(ep => (
            <div key={ep.id} className="ps-card">
              <div className="ps-card-info">
                <p className="ps-card-title">
                  S{String(ep.season).padStart(2, "0")}E{String(ep.episode).padStart(2, "0")} · {ep.title}
                </p>
                <p className="ps-card-meta">
                  <span className={`ps-badge ${ep.status === 'published' ? 'ps-badge-published' : 'ps-badge-draft'}`}>
                    {ep.status}
                  </span>
                  {ep.airDate ? `Airs: ${ep.airDate}` : "No air date set"}
                </p>
              </div>
              <div className="ps-actions">
                <button className="ps-action-btn" onClick={() => handleEdit(ep)}>
                  Edit
                </button>
                <button className="ps-action-btn ps-action-btn-delete" onClick={() => handleDelete(ep.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="ps-modal" onClick={() => setShowForm(false)}>
          <div className="ps-modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? "Edit Episode" : "New Episode"}</h2>

            <div className="ps-form-group">
              <label>Season</label>
              <input
                type="number"
                value={editForm.season || 1}
                onChange={e => setEditForm({...editForm, season: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            <div className="ps-form-group">
              <label>Episode</label>
              <input
                type="number"
                value={editForm.episode || 1}
                onChange={e => setEditForm({...editForm, episode: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            <div className="ps-form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Episode title"
                value={editForm.title || ""}
                onChange={e => setEditForm({...editForm, title: e.target.value})}
              />
            </div>

            <div className="ps-form-group">
              <label>Status</label>
              <select value={editForm.status || "draft"} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="ps-form-group">
              <label>Air Date (optional)</label>
              <input
                type="date"
                value={editForm.airDate || ""}
                onChange={e => setEditForm({...editForm, airDate: e.target.value})}
              />
            </div>

            <div className="ps-modal-footer">
              <button className="ps-btn ps-btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="ps-btn" onClick={handleSave}>
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
