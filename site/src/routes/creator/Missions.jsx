// site/src/routes/creator/Missions.jsx
import { useState } from "react";

const MISSIONS = [
  {
    id: 1,
    title: "Spring Wardrobe Refresh",
    category: "Style Challenge",
    emoji: "🌸",
    description: "Create a 5-piece spring wardrobe that works for work, casual, and going out.",
    reward: "500 coins + featured in newsletter",
    difficulty: "Intermediate",
    dueDate: "Apr 30",
    progress: 75,
    status: "in-progress"
  },
  {
    id: 2,
    title: "Sustainable Fashion Find",
    category: "Research Challenge",
    emoji: "♻️",
    description: "Discover and feature 3 sustainable fashion brands. Explain why you love them.",
    reward: "250 coins + collab opportunity",
    difficulty: "Easy",
    dueDate: "Apr 15",
    progress: 40,
    status: "in-progress"
  },
  {
    id: 3,
    title: "Accessory Styling Mastery",
    category: "Content Collab",
    emoji: "✨",
    description: "Partner with an accessory brand to create 3 styling tutorials.",
    reward: "1000 coins + brand commission",
    difficulty: "Advanced",
    dueDate: "May 15",
    progress: 0,
    status: "available"
  },
  {
    id: 4,
    title: "Thrift Flipping Guide",
    category: "Tutorial",
    emoji: "🎨",
    description: "Create a step-by-step guide to thrifting and upcycling 3 pieces.",
    reward: "400 coins + featured video",
    difficulty: "Intermediate",
    dueDate: "Apr 20",
    progress: 0,
    status: "available"
  },
  {
    id: 5,
    title: "Behind-the-Scenes: Your Studio Tour",
    category: "Documentary",
    emoji: "🎬",
    description: "Show followers how you create content. 2-3 minute behind-the-scenes video.",
    reward: "750 coins + spotlight feature",
    difficulty: "Easy",
    dueDate: "Apr 25",
    progress: 100,
    status: "completed"
  },
];

export default function CreatorMissions() {
  const [activeTab, setActiveTab] = useState("in-progress");
  const [expandedMission, setExpandedMission] = useState(null);

  const missions = MISSIONS.filter(m => m.status === activeTab);
  const inProgressCount = MISSIONS.filter(m => m.status === "in-progress").length;
  const completedCount = MISSIONS.filter(m => m.status === "completed").length;
  const availableCount = MISSIONS.filter(m => m.status === "available").length;

  return (
    <div className="creator-missions">
      <style>{styles}</style>

      {/* HERO */}
      <section className="cm-hero card">
        <div className="cm-hero-main">
          <div>
            <p className="cm-pill">🎯 MISSIONS</p>
            <h1 className="cm-title">Creator Challenges & Collabs</h1>
            <p className="cm-sub">
              Complete missions to earn coins, grow your audience, and collaborate with brands. 
              Each mission is designed to help you create better content.
            </p>
          </div>
          <div className="cm-hero-stats">
            <div className="cm-stat">
              <p className="cm-stat-label">In Progress</p>
              <p className="cm-stat-value">{inProgressCount}</p>
            </div>
            <div className="cm-stat">
              <p className="cm-stat-label">Available</p>
              <p className="cm-stat-value">{availableCount}</p>
            </div>
            <div className="cm-stat">
              <p className="cm-stat-label">Completed</p>
              <p className="cm-stat-value">{completedCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="cm-tabs card">
        <button
          className={`cm-tab ${activeTab === "in-progress" ? "active" : ""}`}
          onClick={() => setActiveTab("in-progress")}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          className={`cm-tab ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          Available ({availableCount})
        </button>
        <button
          className={`cm-tab ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* MISSIONS GRID */}
      <div className="cm-content">
        <div className="cm-missions-grid">
          {missions.map(mission => {
            const isExpanded = expandedMission === mission.id;
            return (
              <div
                key={mission.id}
                className={`cm-mission-card card ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedMission(isExpanded ? null : mission.id)}
              >
                <div className="cm-mission-header">
                  <span className="cm-emoji">{mission.emoji}</span>
                  <div className="cm-mission-title-section">
                    <h3 className="cm-mission-title">{mission.title}</h3>
                    <p className="cm-mission-category">{mission.category}</p>
                  </div>
                </div>

                <p className="cm-mission-desc">{mission.description}</p>

                <div className="cm-mission-meta">
                  <span className="cm-meta-item">📅 {mission.dueDate}</span>
                  <span className={`cm-difficulty ${mission.difficulty.toLowerCase()}`}>
                    {mission.difficulty}
                  </span>
                </div>

                {(mission.status === "in-progress" || mission.status === "completed") && (
                  <div className="cm-progress">
                    <div className="cm-progress-bar">
                      <div className="cm-progress-fill" style={{ width: `${mission.progress}%` }} />
                    </div>
                    <p className="cm-progress-text">{mission.progress}% complete</p>
                  </div>
                )}

                {isExpanded && (
                  <div className="cm-mission-details">
                    <div className="cm-detail-section">
                      <p className="cm-detail-label">Reward</p>
                      <p className="cm-detail-value">🏆 {mission.reward}</p>
                    </div>

                    {mission.status === "available" && (
                      <button className="btn btn-primary">Start Mission</button>
                    )}
                    {mission.status === "in-progress" && (
                      <button className="btn btn-secondary">Update Progress</button>
                    )}
                    {mission.status === "completed" && (
                      <p className="cm-completed-badge">✓ Completed & Rewarded</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AFFIRM */}
      <section className="cm-affirm card">
        <p className="cm-affirm-main">Every mission builds your creative empire.</p>
        <p className="cm-affirm-sub">
          Complete challenges to earn coins, collaborate with brands, and grow your audience. 
          Your creativity has real value. 💜
        </p>
      </section>
    </div>
  );
}

const styles = `
.creator-missions {
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
.cm-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(243, 232, 255, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(219, 191, 255, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.cm-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .cm-hero-main {
    grid-template-columns: 1fr;
  }
}

.cm-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #7c3aed;
  border: 1px solid rgba(243, 232, 255, 0.9);
}

.cm-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.cm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.cm-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.cm-stat {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  padding: 10px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  text-align: center;
}

.cm-stat-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.cm-stat-value {
  margin: 4px 0 0;
  font-weight: 700;
  font-size: 1.4rem;
  color: #7c3aed;
}

/* TABS */
.cm-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.cm-tab {
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

.cm-tab:hover {
  color: #111827;
}

.cm-tab.active {
  color: #7c3aed;
  border-bottom-color: #7c3aed;
}

/* CONTENT */
.cm-content {
  padding: 18px 0;
}

.cm-missions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 0 0 18px;
}

.cm-mission-card {
  padding: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.cm-mission-card:hover {
  box-shadow: 0 12px 32px rgba(124, 58, 237, 0.2);
  transform: translateY(-2px);
}

.cm-mission-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.cm-emoji {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.cm-mission-title-section {
  flex: 1;
  min-width: 0;
}

.cm-mission-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.cm-mission-category {
  margin: 2px 0 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.cm-mission-desc {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.cm-mission-meta {
  display: flex;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #6b7280;
  flex-wrap: wrap;
}

.cm-meta-item {
  display: inline-block;
}

.cm-difficulty {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.cm-difficulty.easy {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.cm-difficulty.intermediate {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}

.cm-difficulty.advanced {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.cm-progress {
  margin: 8px 0;
}

.cm-progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 4px;
}

.cm-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
  transition: width 300ms ease;
}

.cm-progress-text {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
}

.cm-mission-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.cm-detail-section {
  margin-bottom: 8px;
}

.cm-detail-label {
  margin: 0 0 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 600;
}

.cm-detail-value {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #7c3aed;
}

.cm-completed-badge {
  margin: 8px 0;
  padding: 8px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  color: #16a34a;
  font-weight: 600;
}

/* AFFIRM */
.cm-affirm {
  padding: 18px;
  text-align: center;
}

.cm-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.cm-affirm-sub {
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
  padding: 8px 12px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.85rem;
  font-weight: 500;
  width: 100%;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  border-color: #8b5cf6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(139, 92, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #c026d3);
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
