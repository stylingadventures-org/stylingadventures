// site/src/routes/prime/Episodes.jsx
import { useState } from "react";

const SCENES = [
  { id: 1, name: "Summer Casual", emoji: "👕", items: ["White tee", "Blue jeans", "White sneakers"] },
  { id: 2, name: "Evening Glam", emoji: "✨", items: ["Black dress", "Gold heels", "Silver earrings"] },
  { id: 3, name: "Work Professional", emoji: "💼", items: ["Blazer", "Trousers", "Loafers"] },
  { id: 4, name: "Street Style", emoji: "🎨", items: ["Oversized shirt", "Cargo pants", "Boots"] },
];

export default function PrimeEpisodes() {
  const [activeTab, setActiveTab] = useState("builder");
  const [episodeScript, setEpisodeScript] = useState("Title: Summer Vibes\n\nSegment 1: Casual looks...\n");
  const [selectedScenes, setSelectedScenes] = useState([]);

  const toggleScene = (sceneId) => {
    setSelectedScenes(prev =>
      prev.includes(sceneId)
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
      );
  };

  return (
    <div className="prime-episodes">
      <style>{styles}</style>

      {/* HERO */}
      <section className="pe-hero card">
        <div className="pe-hero-main">
          <div>
            <p className="pe-pill">🎬 EPISODE BUILDER</p>
            <h1 className="pe-title">Create & Produce Episodes</h1>
            <p className="pe-sub">
              Write scripts, assign scenes, manage cast, and coordinate production. 
              Build episodes from concept to final cut.
            </p>
          </div>
          <div className="pe-hero-card">
            <p className="pe-stat-label">Scene Library</p>
            <p className="pe-stat-value">{SCENES.length}</p>
            <p className="pe-stat-sub">Presets available</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="pe-tabs card">
        <button
          className={`pe-tab ${activeTab === "builder" ? "active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          Script Editor
        </button>
        <button
          className={`pe-tab ${activeTab === "scenes" ? "active" : ""}`}
          onClick={() => setActiveTab("scenes")}
        >
          Scene Selection
        </button>
        <button
          className={`pe-tab ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Episode Preview
        </button>
      </div>

      {/* SCRIPT EDITOR */}
      {activeTab === "builder" && (
        <div className="pe-content card">
          <h3 className="pe-section-title">Write Your Script</h3>
          <textarea
            value={episodeScript}
            onChange={(e) => setEpisodeScript(e.target.value)}
            className="pe-editor"
            placeholder="Write your episode script here..."
          />
          <div className="pe-editor-actions">
            <button className="btn btn-primary">Save Script</button>
            <button className="btn btn-secondary">AI Suggestions</button>
          </div>
        </div>
      )}

      {/* SCENE SELECTION */}
      {activeTab === "scenes" && (
        <div className="pe-content card">
          <h3 className="pe-section-title">Select Scenes for This Episode</h3>
          <p className="pe-section-sub">Selected: {selectedScenes.length} scenes</p>
          
          <div className="pe-scenes-grid">
            {SCENES.map(scene => (
              <div
                key={scene.id}
                className={`pe-scene-card ${selectedScenes.includes(scene.id) ? "selected" : ""}`}
                onClick={() => toggleScene(scene.id)}
              >
                <div className="pe-scene-emoji">{scene.emoji}</div>
                <h4 className="pe-scene-name">{scene.name}</h4>
                <div className="pe-scene-items">
                  {scene.items.map((item, idx) => (
                    <p key={idx} className="pe-item-tag">{item}</p>
                  ))}
                </div>
                {selectedScenes.includes(scene.id) && (
                  <div className="pe-selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>

          <div className="pe-scene-actions">
            <button className="btn btn-primary">Confirm Scenes</button>
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {activeTab === "preview" && (
        <div className="pe-content card">
          <h3 className="pe-section-title">Episode Preview</h3>
          
          <div className="pe-preview-section">
            <h4 className="pe-preview-label">Script Summary</h4>
            <div className="pe-preview-box">
              <p className="pe-preview-text">
                {episodeScript.substring(0, 200)}...
              </p>
            </div>
          </div>

          <div className="pe-preview-section">
            <h4 className="pe-preview-label">Scenes in Episode</h4>
            <div className="pe-selected-scenes">
              {selectedScenes.length === 0 ? (
                <p className="pe-empty">No scenes selected yet</p>
              ) : (
                selectedScenes.map(sceneId => {
                  const scene = SCENES.find(s => s.id === sceneId);
                  return (
                    <div key={sceneId} className="pe-scene-preview">
                      <span className="pe-emoji">{scene.emoji}</span>
                      <span className="pe-name">{scene.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pe-preview-actions">
            <button className="btn btn-primary">Start Production</button>
            <button className="btn btn-secondary">Schedule Release</button>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="pe-affirm card">
        <p className="pe-affirm-main">Great episodes don't happen by accident.</p>
        <p className="pe-affirm-sub">
          Plan, script, select scenes, coordinate production. Every detail matters. 👑
        </p>
      </section>
    </div>
  );
}

const styles = `
.prime-episodes {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.pe-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 243, 219, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 224, 71, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.pe-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .pe-hero-main {
    grid-template-columns: 1fr;
  }
}

.pe-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #b45309;
  border: 1px solid rgba(254, 243, 219, 0.9);
}

.pe-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.pe-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.pe-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.pe-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.pe-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.pe-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TABS */
.pe-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.pe-tab {
  appearance: none;
  background: transparent;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 150ms ease;
  flex: 1;
}

.pe-tab:hover {
  color: #111827;
}

.pe-tab.active {
  color: #d97706;
  border-bottom-color: #d97706;
}

/* CONTENT */
.pe-content {
  padding: 18px;
}

.pe-section-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.pe-section-sub {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

.pe-editor {
  width: 100%;
  height: 300px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
  outline: none;
}

.pe-editor:focus {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.pe-editor-actions,
.pe-scene-actions,
.pe-preview-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* SCENES */
.pe-scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.pe-scene-card {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 200ms ease;
  position: relative;
}

.pe-scene-card:hover {
  border-color: #d97706;
  background: #fffbf0;
}

.pe-scene-card.selected {
  border-color: #d97706;
  background: #fef3c7;
}

.pe-scene-emoji {
  font-size: 2rem;
  margin-bottom: 6px;
}

.pe-scene-name {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pe-scene-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pe-item-tag {
  margin: 0;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.pe-selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #d97706;
  color: #fff;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

/* PREVIEW */
.pe-preview-section {
  margin-bottom: 14px;
}

.pe-preview-label {
  margin: 0 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.pe-preview-box {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.pe-preview-text {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.pe-selected-scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pe-scene-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #111827;
}

.pe-emoji {
  font-size: 1.2rem;
}

.pe-name {
  font-weight: 500;
}

.pe-empty {
  margin: 0;
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* AFFIRM */
.pe-affirm {
  padding: 18px;
  text-align: center;
}

.pe-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.pe-affirm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  border-color: #d97706;
  color: #fff;
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #b45309, #d97706);
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
`;
