// site/src/routes/prime/Production.jsx
import { useState } from "react";

const PRODUCTION_QUEUE = [
  {
    id: 1,
    episode: "Episode 6: Summer Essentials",
    stage: "rendering",
    progress: 85,
    dueDate: "May 5",
    duration: "42 min",
    scenes: 12,
    notes: "Color grading in progress"
  },
  {
    id: 2,
    episode: "Episode 7: Collab with Sofia",
    stage: "editing",
    progress: 60,
    dueDate: "May 12",
    duration: "48 min",
    scenes: 14,
    notes: "B-roll integration"
  },
  {
    id: 3,
    episode: "Episode 8: Fan Styling",
    stage: "intake",
    progress: 30,
    dueDate: "May 19",
    duration: "45 min",
    scenes: 10,
    notes: "Scripts approved, ready for production"
  },
  {
    id: 4,
    episode: "Episode 9: Winter Lookback",
    stage: "intake",
    progress: 5,
    dueDate: "May 26",
    duration: "50 min",
    scenes: 15,
    notes: "Archive footage being collected"
  },
];

const STAGES = [
  { key: "intake", label: "Intake", color: "#6b7280" },
  { key: "editing", label: "Editing", color: "#f59e0b" },
  { key: "rendering", label: "Rendering", color: "#3b82f6" },
];

export default function PrimeProduction() {
  const [expandedEpisode, setExpandedEpisode] = useState(null);

  return (
    <div className="prime-production">
      <style>{styles}</style>

      {/* HERO */}
      <section className="pp-hero card">
        <div className="pp-hero-main">
          <div>
            <p className="pp-pill">🎬 PRODUCTION QUEUE</p>
            <h1 className="pp-title">Episode Pipeline</h1>
            <p className="pp-sub">
              Track episodes from intake through rendering. Manage production timeline 
              and identify bottlenecks.
            </p>
          </div>
          <div className="pp-hero-card">
            <p className="pp-stat-label">In Production</p>
            <p className="pp-stat-value">4</p>
            <p className="pp-stat-sub">Episodes queued</p>
          </div>
        </div>
      </section>

      {/* STAGE TIMELINE */}
      <div className="pp-timeline card">
        <div className="pp-timeline-stages">
          {STAGES.map((stage, idx) => (
            <div key={idx} className="pp-stage">
              <div className="pp-stage-dot" style={{ backgroundColor: stage.color }} />
              <p className="pp-stage-label">{stage.label}</p>
              <p className="pp-stage-count">
                {PRODUCTION_QUEUE.filter(e => e.stage === stage.key).length}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* QUEUE LIST */}
      <div className="pp-content">
        <div className="pp-queue">
          {PRODUCTION_QUEUE.map(episode => {
            const isExpanded = expandedEpisode === episode.id;
            const stageInfo = STAGES.find(s => s.key === episode.stage);
            return (
              <div
                key={episode.id}
                className={`pp-episode-card card ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedEpisode(isExpanded ? null : episode.id)}
              >
                <div className="pp-episode-header">
                  <div className="pp-episode-info">
                    <h3 className="pp-episode-title">{episode.episode}</h3>
                    <p className="pp-episode-meta">
                      {episode.duration} • {episode.scenes} scenes • Due {episode.dueDate}
                    </p>
                  </div>
                  <div className="pp-stage-badge" style={{ backgroundColor: stageInfo.color }}>
                    {stageInfo.label}
                  </div>
                </div>

                <div className="pp-progress">
                  <div className="pp-progress-bar">
                    <div className="pp-progress-fill" style={{ width: `${episode.progress}%` }} />
                  </div>
                  <p className="pp-progress-text">{episode.progress}%</p>
                </div>

                {isExpanded && (
                  <div className="pp-episode-details">
                    <p className="pp-detail-label">Notes:</p>
                    <p className="pp-detail-text">{episode.notes}</p>
                    <div className="pp-actions">
                      <button className="btn btn-secondary">Update Stage</button>
                      <button className="btn btn-secondary">Add Note</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AFFIRM */}
      <section className="pp-affirm card">
        <p className="pp-affirm-main">Quality through process. Consistency through planning.</p>
        <p className="pp-affirm-sub">
          Track production closely. Meet deadlines. Deliver excellence every episode. 👑
        </p>
      </section>
    </div>
  );
}

const styles = `
.prime-production {
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
.pp-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 243, 219, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 224, 71, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.pp-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .pp-hero-main {
    grid-template-columns: 1fr;
  }
}

.pp-pill {
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

.pp-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.pp-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.pp-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.pp-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.pp-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.pp-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TIMELINE */
.pp-timeline {
  padding: 14px;
  display: flex;
  justify-content: space-around;
}

.pp-timeline-stages {
  display: flex;
  gap: 30px;
  width: 100%;
  justify-content: space-around;
}

.pp-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.pp-stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.pp-stage-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

.pp-stage-count {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* CONTENT */
.pp-content {
  padding: 18px 0;
}

.pp-queue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0 18px;
}

.pp-episode-card {
  padding: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.pp-episode-card:hover {
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.2);
  transform: translateY(-2px);
}

.pp-episode-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.pp-episode-info {
  flex: 1;
  min-width: 0;
}

.pp-episode-title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.pp-episode-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.pp-stage-badge {
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.pp-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pp-progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.pp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #d97706, #f59e0b);
  transition: width 300ms ease;
}

.pp-progress-text {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #d97706;
  min-width: 35px;
  text-align: right;
}

.pp-episode-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.pp-detail-label {
  margin: 0 0 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 600;
}

.pp-detail-text {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #4b5563;
}

.pp-actions {
  display: flex;
  gap: 6px;
}

/* AFFIRM */
.pp-affirm {
  padding: 18px;
  text-align: center;
}

.pp-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.pp-affirm-sub {
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
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
