// site/src/routes/prime/Schedule.jsx
import { useState } from "react";

const EPISODES = [
  { ep: 6, title: "Summer Vibes", status: "scheduled", date: "Aug 15", platforms: ["youtube", "tiktok", "instagram"] },
  { ep: 7, title: "Work Wear Masterclass", status: "scheduled", date: "Aug 22", platforms: ["youtube", "instagram"] },
  { ep: 8, title: "Evening Elegance", status: "scheduled", date: "Aug 29", platforms: ["youtube", "tiktok"] },
  { ep: 9, title: "Street Style Rebellion", status: "published", date: "Aug 8", platforms: ["youtube", "tiktok", "instagram"] },
  { ep: 10, title: "Sustainable Fashion", status: "published", date: "Aug 1", platforms: ["youtube", "instagram"] },
];

export default function PrimeSchedule() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [autoPost, setAutoPost] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["youtube", "tiktok", "instagram"]);

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="prime-schedule">
      <style>{styles}</style>

      {/* HERO */}
      <section className="ps-hero card">
        <div className="ps-hero-main">
          <div>
            <p className="ps-pill">📅 RELEASE SCHEDULE</p>
            <h1 className="ps-title">Schedule & Publish Episodes</h1>
            <p className="ps-sub">
              Plan your release calendar, configure auto-posting to social platforms, 
              and manage your content distribution strategy.
            </p>
          </div>
          <div className="ps-hero-card">
            <p className="ps-stat-label">Scheduled Releases</p>
            <p className="ps-stat-value">{EPISODES.filter(e => e.status === "scheduled").length}</p>
            <p className="ps-stat-sub">Next 30 days</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="ps-tabs card">
        <button
          className={`ps-tab ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          Release Calendar
        </button>
        <button
          className={`ps-tab ${activeTab === "platforms" ? "active" : ""}`}
          onClick={() => setActiveTab("platforms")}
        >
          Social Platforms
        </button>
        <button
          className={`ps-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Publishing History
        </button>
      </div>

      {/* CALENDAR */}
      {activeTab === "calendar" && (
        <div className="ps-content card">
          <h3 className="ps-section-title">Upcoming Releases</h3>
          <p className="ps-section-sub">View and manage episode release dates</p>

          <div className="ps-episodes-list">
            {EPISODES.filter(ep => ep.status === "scheduled").map(episode => (
              <div key={episode.ep} className="ps-episode-row">
                <div className="ps-episode-main">
                  <div className="ps-episode-num">EP {episode.ep}</div>
                  <div className="ps-episode-info">
                    <h4 className="ps-episode-title">{episode.title}</h4>
                    <p className="ps-episode-date">{episode.date}</p>
                  </div>
                </div>
                <div className="ps-episode-platforms">
                  {episode.platforms.map(platform => (
                    <span key={platform} className="ps-platform-badge">
                      {platform === "youtube" && "📺"}
                      {platform === "tiktok" && "🎵"}
                      {platform === "instagram" && "📸"}
                    </span>
                  ))}
                </div>
                <button className="ps-edit-btn">Edit</button>
              </div>
            ))}
          </div>

          <div className="ps-calendar-actions">
            <button className="btn btn-primary">+ Schedule New</button>
            <button className="btn btn-secondary">View Full Calendar</button>
          </div>
        </div>
      )}

      {/* PLATFORMS */}
      {activeTab === "platforms" && (
        <div className="ps-content card">
          <h3 className="ps-section-title">Social Platform Configuration</h3>
          <p className="ps-section-sub">Enable auto-posting and customize settings per platform</p>

          <div className="ps-settings-section">
            <div className="ps-auto-post">
              <div className="ps-setting-header">
                <h4 className="ps-setting-title">Auto-Post to Platforms</h4>
                <label className="ps-toggle">
                  <input
                    type="checkbox"
                    checked={autoPost}
                    onChange={(e) => setAutoPost(e.target.checked)}
                  />
                  <span className="ps-toggle-switch"></span>
                </label>
              </div>
              <p className="ps-setting-desc">
                Automatically publish episodes to selected platforms at scheduled time
              </p>
            </div>
          </div>

          <h4 className="ps-platforms-title">Select Platforms</h4>
          <div className="ps-platforms-grid">
            {[
              { id: "youtube", name: "YouTube", emoji: "📺", color: "#dc2626" },
              { id: "tiktok", name: "TikTok", emoji: "🎵", color: "#000000" },
              { id: "instagram", name: "Instagram", emoji: "📸", color: "#e1306c" },
            ].map(platform => (
              <div
                key={platform.id}
                className={`ps-platform-card ${selectedPlatforms.includes(platform.id) ? "selected" : ""}`}
                onClick={() => togglePlatform(platform.id)}
              >
                <div className="ps-platform-emoji">{platform.emoji}</div>
                <h4 className="ps-platform-name">{platform.name}</h4>
                <div className="ps-platform-checkbox">
                  {selectedPlatforms.includes(platform.id) && "✓"}
                </div>
              </div>
            ))}
          </div>

          <div className="ps-platform-actions">
            <button className="btn btn-primary">Save Configuration</button>
            <button className="btn btn-secondary">Test Post</button>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {activeTab === "history" && (
        <div className="ps-content card">
          <h3 className="ps-section-title">Publishing History</h3>
          <p className="ps-section-sub">Recent episodes and their distribution status</p>

          <div className="ps-history-table">
            <div className="ps-table-header">
              <div className="ps-table-col-ep">Episode</div>
              <div className="ps-table-col-date">Published</div>
              <div className="ps-table-col-platforms">Platforms</div>
              <div className="ps-table-col-status">Status</div>
            </div>

            {EPISODES.filter(ep => ep.status === "published").map(episode => (
              <div key={episode.ep} className="ps-table-row">
                <div className="ps-table-col-ep">
                  <div className="ps-ep-badge">EP {episode.ep}</div>
                  <span className="ps-ep-title">{episode.title}</span>
                </div>
                <div className="ps-table-col-date">{episode.date}</div>
                <div className="ps-table-col-platforms">
                  {episode.platforms.map(p => (
                    <span key={p} className="ps-badge">
                      {p === "youtube" && "YouTube"}
                      {p === "tiktok" && "TikTok"}
                      {p === "instagram" && "Instagram"}
                    </span>
                  ))}
                </div>
                <div className="ps-table-col-status">
                  <span className="ps-status-badge published">✓ Published</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ps-history-actions">
            <button className="btn btn-secondary">Download Report</button>
            <button className="btn btn-secondary">View Analytics</button>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="ps-affirm card">
        <p className="ps-affirm-main">Consistency builds an audience.</p>
        <p className="ps-affirm-sub">
          Schedule releases, auto-post to platforms, track distribution. Keep your fans engaged. 🚀
        </p>
      </section>
    </div>
  );
}

const styles = `
.prime-schedule {
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
.ps-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 243, 219, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 224, 71, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.ps-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .ps-hero-main {
    grid-template-columns: 1fr;
  }
}

.ps-pill {
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

.ps-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.ps-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.ps-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.ps-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.ps-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.ps-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TABS */
.ps-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.ps-tab {
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

.ps-tab:hover {
  color: #111827;
}

.ps-tab.active {
  color: #d97706;
  border-bottom-color: #d97706;
}

/* CONTENT */
.ps-content {
  padding: 18px;
}

.ps-section-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.ps-section-sub {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* EPISODES LIST */
.ps-episodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.ps-episode-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 150ms ease;
}

.ps-episode-row:hover {
  background: #f3f4f6;
  border-color: #d97706;
}

.ps-episode-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ps-episode-num {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.ps-episode-info {
  display: flex;
  flex-direction: column;
}

.ps-episode-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ps-episode-date {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.ps-episode-platforms {
  display: flex;
  gap: 4px;
}

.ps-platform-badge {
  font-size: 1.2rem;
}

.ps-edit-btn {
  appearance: none;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 140ms ease;
}

.ps-edit-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* CALENDAR ACTIONS */
.ps-calendar-actions,
.ps-platform-actions,
.ps-history-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* SETTINGS */
.ps-settings-section {
  margin: 12px 0;
}

.ps-auto-post {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.ps-setting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ps-setting-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ps-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  width: 44px;
  height: 24px;
}

.ps-toggle input {
  appearance: none;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.ps-toggle-switch {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #d1d5db;
  border-radius: 999px;
  transition: background 200ms ease;
  pointer-events: none;
}

.ps-toggle-switch::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 999px;
  top: 2px;
  left: 2px;
  transition: left 200ms ease;
}

.ps-toggle input:checked + .ps-toggle-switch {
  background: #d97706;
}

.ps-toggle input:checked + .ps-toggle-switch::after {
  left: 22px;
}

.ps-setting-desc {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.ps-platforms-title {
  margin: 14px 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

/* PLATFORMS GRID */
.ps-platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.ps-platform-card {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 200ms ease;
  position: relative;
}

.ps-platform-card:hover {
  border-color: #d97706;
  background: #fffbf0;
}

.ps-platform-card.selected {
  border-color: #d97706;
  background: #fef3c7;
}

.ps-platform-emoji {
  font-size: 2rem;
  margin-bottom: 6px;
}

.ps-platform-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.ps-platform-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #d97706;
  color: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  display: none;
}

.ps-platform-card.selected .ps-platform-checkbox {
  display: flex;
}

/* HISTORY TABLE */
.ps-history-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 12px 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.ps-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 0;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.ps-table-col-ep,
.ps-table-col-date,
.ps-table-col-platforms,
.ps-table-col-status {
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ps-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 0;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  align-items: center;
}

.ps-table-row:last-child {
  border-bottom: none;
}

.ps-table-row:hover {
  background: #f9fafb;
}

.ps-ep-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: #fff;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.75rem;
  margin-right: 8px;
}

.ps-ep-title {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
}

.ps-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #374151;
  margin-right: 4px;
}

.ps-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.ps-status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

/* AFFIRM */
.ps-affirm {
  padding: 18px;
  text-align: center;
}

.ps-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.ps-affirm-sub {
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
