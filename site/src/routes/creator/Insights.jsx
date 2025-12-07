import React from "react";

export default function CreatorInsights() {
  return (
    <div className="creator-insights">
      <section className="creator-card">
        <h2>Insights</h2>
        <p className="creator-sub">
          We&apos;ll visualize fan engagement, saves, and XP earned from your
          content here.
        </p>

        <div className="creator-insights-grid">
          <div className="creator-insights-block">
            <h3>Top performing fits</h3>
            <p className="creator-placeholder">Analytics wiring coming soon.</p>
          </div>
          <div className="creator-insights-block">
            <h3>Story completion</h3>
            <p className="creator-placeholder">
              See how many fans finish each story episode.
            </p>
          </div>
          <div className="creator-insights-block">
            <h3>XP funnel</h3>
            <p className="creator-placeholder">
              Track how fan actions map into game XP and rewards.
            </p>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.creator-insights {
  display:flex;
  flex-direction:column;
  gap:12px;
}

.creator-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:12px 14px;
  box-shadow:0 10px 26px rgba(15,23,42,0.12);
}
.creator-card h2 {
  margin:0;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.creator-sub {
  margin:3px 0 8px;
  font-size:0.86rem;
  color:#6b7280;
}

.creator-insights-grid {
  margin-top:4px;
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap:10px;
}
.creator-insights-block {
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:8px 10px;
  background:#f9fafb;
}
.creator-insights-block h3 {
  margin:0 0 4px;
  font-size:0.92rem;
}
.creator-placeholder {
  margin:0;
  font-size:0.84rem;
  color:#9ca3af;
}
`;
