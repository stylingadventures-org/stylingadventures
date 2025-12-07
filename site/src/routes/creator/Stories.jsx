// site/src/routes/creator/Stories.jsx
import React, { useState } from "react";
import CreatorAssetPicker from "../../ui/CreatorAssetPicker.jsx";

const initialStories = [
  {
    id: "st1",
    title: "Holiday Glam Drop teaser",
    status: "SCHEDULED",
    when: "Fri • 5:00 PM",
    attachedCount: 3,
  },
  {
    id: "st2",
    title: "Episode 3: BTS mirror checks",
    status: "DRAFT",
    when: "Unscheduled",
    attachedCount: 1,
  },
];

export default function CreatorStories() {
  const [stories, setStories] = useState(initialStories);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWhen, setNewWhen] = useState("");
  const [newStatus, setNewStatus] = useState("DRAFT");
  const [newAttached, setNewAttached] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  function handleNewStory() {
    setComposerOpen(true);
  }

  function handleComposerCancel() {
    setComposerOpen(false);
    setNewTitle("");
    setNewWhen("");
    setNewStatus("DRAFT");
    setNewAttached([]);
  }

  function handleAttach(asset) {
    setNewAttached((prev) => {
      if (!asset?.id) return prev;
      if (prev.some((a) => a.id === asset.id)) return prev;
      return [...prev, asset];
    });
    setShowPicker(false);
  }

  function handleComposerSave() {
    if (!newTitle.trim()) {
      alert("Give your story a title first.");
      return;
    }

    const story = {
      id: `local-${Date.now()}`,
      title: newTitle.trim(),
      status: newStatus,
      when: newWhen || "Unscheduled",
      attachedCount: newAttached.length,
    };

    setStories((prev) => [story, ...prev]);
    // TODO: later call backend createStory + schedule with attached asset IDs
    handleComposerCancel();
  }

  function openStory(s) {
    alert(
      `Here we’ll show attached closet items + creator assets + schedule controls.\n\nStory: ${s.title}`,
    );
  }

  return (
    <section className="creator-stories">
      <style>{styles}</style>

      <div className="creator-card">
        <div className="stories-head">
          <div>
            <h2>Story planner</h2>
            <p className="stories-sub">
              Connect closet looks and creator assets into sequences for drops,
              episodes, and events. This will later wire into the Besties story
              workflow + Step Functions.
            </p>
          </div>
          <button
            type="button"
            className="stories-btn"
            onClick={handleNewStory}
          >
            New story
          </button>
        </div>

        {composerOpen && (
          <div className="stories-composer">
            <div className="stories-composer-row">
              <label className="stories-label">
                Title
                <input
                  className="stories-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. S2 drop: Neon nights"
                />
              </label>
            </div>
            <div className="stories-composer-row stories-composer-row--split">
              <label className="stories-label">
                Status
                <select
                  className="stories-input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </label>
              <label className="stories-label">
                When
                <input
                  className="stories-input"
                  value={newWhen}
                  onChange={(e) => setNewWhen(e.target.value)}
                  placeholder="e.g. Fri • 5:00 PM"
                />
              </label>
            </div>

            <div className="stories-composer-row">
              <label className="stories-label">
                Attach creator media
                {newAttached.length > 0 && (
                  <span className="stories-label-meta">
                    {newAttached.length} attached
                  </span>
                )}
              </label>
              {newAttached.length === 0 && (
                <div className="stories-empty">
                  Attach refs, BTS stills, or thumbnails from your filing
                  cabinets to plan visuals for this story.
                </div>
              )}
              {newAttached.length > 0 && (
                <div className="stories-attach-strip">
                  {newAttached.map((a) => (
                    <div key={a.id} className="stories-attach-pill">
                      <span className="stories-attach-dot" />
                      <span className="stories-attach-text">
                        {a.title || "Untitled asset"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="stories-secondary-btn"
                onClick={() => setShowPicker(true)}
              >
                📁 Attach from cabinet
              </button>
            </div>

            <div className="stories-composer-actions">
              <button
                type="button"
                className="stories-secondary-btn stories-secondary-btn--ghost"
                onClick={handleComposerCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="stories-primary-btn"
                onClick={handleComposerSave}
                disabled={!newTitle.trim()}
              >
                Save story (local)
              </button>
            </div>
          </div>
        )}

        <ul className="stories-list">
          {stories.map((s) => (
            <li key={s.id} className="stories-row">
              <div className="stories-main">
                <div className="stories-title">{s.title}</div>
                <div className="stories-meta">
                  {s.status === "SCHEDULED" ? "Scheduled" : "Draft"} • {s.when}
                  {typeof s.attachedCount === "number" &&
                    s.attachedCount > 0 && (
                      <>
                        {" "}
                        •{" "}
                        <span className="stories-pill">
                          {s.attachedCount} media
                        </span>
                      </>
                    )}
                </div>
              </div>
              <div className="stories-actions">
                <button
                  type="button"
                  className="stories-link"
                  onClick={() => openStory(s)}
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showPicker && (
        <CreatorAssetPicker
          onPick={handleAttach}
          onClose={() => setShowPicker(false)}
        />
      )}
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

.creator-stories h2 {
  margin:0 0 4px;
  font-size:1rem;
}
.stories-sub {
  margin:0;
  font-size:0.86rem;
  color:#6b7280;
}

.stories-head {
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
.stories-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.86rem;
  padding:6px 12px;
  cursor:pointer;
}

/* Composer */

.stories-composer {
  margin-top:10px;
  padding:10px 11px;
  border-radius:14px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.stories-composer-row {
  display:flex;
  flex-direction:column;
  gap:4px;
}
.stories-composer-row--split {
  flex-direction:row;
  gap:8px;
}
.stories-composer-row--split .stories-label {
  flex:1;
}
.stories-label {
  font-size:0.8rem;
  color:#374151;
  display:flex;
  flex-direction:column;
  gap:2px;
}
.stories-label-meta {
  font-size:0.75rem;
  color:#9ca3af;
}
.stories-input {
  border-radius:10px;
  border:1px solid #d1d5db;
  padding:5px 8px;
  font-size:0.84rem;
  background:#f9fafb;
}
.stories-input:focus {
  outline:none;
  border-color:#4f46e5;
  box-shadow:0 0 0 1px rgba(79,70,229,0.3);
}

.stories-empty {
  border-radius:10px;
  border:1px dashed #d1d5db;
  background:#f9fafb;
  padding:7px 9px;
  font-size:0.8rem;
  color:#6b7280;
}

.stories-attach-strip {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:4px;
}
.stories-attach-pill {
  display:inline-flex;
  align-items:center;
  gap:4px;
  padding:3px 8px;
  border-radius:999px;
  background:#eef2ff;
  border:1px solid #e0e7ff;
}
.stories-attach-dot {
  width:6px;
  height:6px;
  border-radius:999px;
  background:#4f46e5;
}
.stories-attach-text {
  font-size:0.78rem;
  color:#3730a3;
}

.stories-composer-actions {
  display:flex;
  justify-content:flex-end;
  gap:8px;
  margin-top:2px;
}
.stories-primary-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.84rem;
  padding:6px 12px;
  cursor:pointer;
}
.stories-primary-btn:disabled {
  opacity:0.6;
  cursor:not-allowed;
}
.stories-secondary-btn {
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#f9fafb;
  color:#111827;
  font-size:0.82rem;
  padding:5px 11px;
  cursor:pointer;
}
.stories-secondary-btn--ghost {
  background:#ffffff;
}

/* List */

.stories-list {
  margin:10px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.stories-row {
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  background:#f3f4f6;
}
.stories-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.stories-title {
  font-size:0.92rem;
  font-weight:600;
}
.stories-meta {
  font-size:0.8rem;
  color:#6b7280;
}
.stories-actions {
  display:flex;
  align-items:center;
}
.stories-link {
  background:transparent;
  border:none;
  padding:0;
  font-size:0.82rem;
  color:#111827;
  cursor:pointer;
}
.stories-pill {
  display:inline-flex;
  align-items:center;
  border-radius:999px;
  padding:1px 7px;
  font-size:0.75rem;
  background:#e5e7eb;
  color:#374151;
}

@media (max-width:640px) {
  .stories-composer-row--split {
    flex-direction:column;
  }
}
`;
