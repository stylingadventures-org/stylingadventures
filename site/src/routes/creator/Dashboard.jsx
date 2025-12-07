// site/src/routes/creator/Dashboard.jsx
import React from "react";

export default function CreatorDashboard() {
  return (
    <div className="creator-grid">
      <style>{styles}</style>

      <section className="creator-card creator-metrics">
        <h2>Production snapshot</h2>
        <div className="creator-kpis">
          <div className="creator-kpi">
            <div className="kpi-label">Episodes in progress</div>
            <div className="kpi-value">3</div>
            <div className="kpi-sub">1 in script review</div>
          </div>
          <div className="creator-kpi">
            <div className="kpi-label">Looks ready to publish</div>
            <div className="kpi-value">7</div>
            <div className="kpi-sub">Closet approvals complete</div>
          </div>
          <div className="creator-kpi">
            <div className="kpi-label">Stories this week</div>
            <div className="kpi-value">4</div>
            <div className="kpi-sub">2 scheduled, 2 drafted</div>
          </div>
        </div>
      </section>

      <section className="creator-card">
        <h2>Today&apos;s focus</h2>
        <ul className="creator-list">
          <li>
            <span className="dot" /> Approve closet looks for{" "}
            <strong>Holiday Glam Drop</strong>
          </li>
          <li>
            <span className="dot" /> Draft a story thread for{" "}
            <strong>Episode 3</strong>
          </li>
          <li>
            <span className="dot" /> Upload reference photos into your{" "}
            <strong>“Winter street style”</strong> cabinet
          </li>
        </ul>
      </section>

      <section className="creator-card">
        <h2>Shortcuts</h2>
        <div className="creator-shortcuts">
          <a href="/creator/tools" className="creator-chip">
            ✨ Open AI tools
          </a>
          <a href="/creator/library" className="creator-chip">
            🗂 Filing cabinets
          </a>
          <a href="/creator/stories" className="creator-chip">
            📚 Story planner
          </a>
          <a href="/creator/earnings" className="creator-chip">
            💰 Earnings
          </a>
        </div>
      </section>
    </div>
  );
}

const styles = `
.creator-grid {
  display:grid;
  grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);
  gap:12px;
}
@media (max-width:880px) {
  .creator-grid {
    grid-template-columns:minmax(0,1fr);
  }
}

.creator-card {
  background:#f9fafb;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:14px 14px 12px;
  box-shadow:0 10px 24px rgba(15,23,42,0.08);
}
.creator-card h2 {
  margin:0 0 8px;
  font-size:1rem;
  color:#111827;
}

.creator-metrics {
  grid-column:1 / -1;
}

.creator-kpis {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(0,1fr));
  gap:10px;
}
.creator-kpi {
  padding:10px;
  border-radius:12px;
  border:1px dashed #d1d5db;
  background:#f3f4f6;
}
.kpi-label {
  font-size:0.78rem;
  text-transform:uppercase;
  letter-spacing:0.06em;
  color:#6b7280;
}
.kpi-value {
  font-size:1.4rem;
  font-weight:600;
  margin-top:2px;
}
.kpi-sub {
  margin-top:2px;
  font-size:0.82rem;
  color:#6b7280;
}

.creator-list {
  margin:0;
  padding-left:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:0.9rem;
}
.creator-list .dot {
  display:inline-block;
  width:6px;
  height:6px;
  border-radius:999px;
  background:#6b7280;
  margin-right:6px;
}

.creator-shortcuts {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.creator-chip {
  border-radius:999px;
  padding:6px 11px;
  font-size:0.86rem;
  background:#111827;
  color:#f9fafb;
  text-decoration:none;
}
`;
