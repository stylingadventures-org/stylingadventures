// site/src/routes/creator/Earnings.jsx
import React from "react";

export default function CreatorEarnings() {
  return (
    <section className="creator-earnings">
      <style>{styles}</style>

      <div className="creator-card">
        <h2>Earnings overview</h2>
        <p className="earn-sub">
          High-level view of Bestie subs, collab deals, and in-game rewards.
          These numbers are demo placeholders until we wire the real ledger.
        </p>

        <div className="earn-grid">
          <div className="earn-block">
            <div className="earn-label">This month (projected)</div>
            <div className="earn-value">$1,240</div>
            <div className="earn-meta">+18% vs last month</div>
          </div>
          <div className="earn-block">
            <div className="earn-label">Bestie subscriptions</div>
            <div className="earn-value">86</div>
            <div className="earn-meta">Renewal rate 92%</div>
          </div>
          <div className="earn-block">
            <div className="earn-label">Brand / collab payouts</div>
            <div className="earn-value">$620</div>
            <div className="earn-meta">2 campaigns active</div>
          </div>
        </div>

        <div className="earn-foot">
          <button
            type="button"
            className="earn-btn"
            onClick={() => alert("Export statement coming soon.")}
          >
            Export statement
          </button>
          <span className="earn-foot-note">
            Final payouts always follow the official ledger and terms.
          </span>
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

.creator-earnings h2 {
  margin:0 0 4px;
  font-size:1rem;
}
.earn-sub {
  margin:0;
  font-size:0.86rem;
  color:#6b7280;
}

.earn-grid {
  margin-top:10px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(0,1fr));
  gap:10px;
}
.earn-block {
  border-radius:12px;
  border:1px dashed #d1d5db;
  background:#f3f4f6;
  padding:9px 10px;
}
.earn-label {
  font-size:0.8rem;
  color:#6b7280;
}
.earn-value {
  font-size:1.3rem;
  font-weight:600;
  margin-top:2px;
}
.earn-meta {
  font-size:0.8rem;
  color:#4b5563;
  margin-top:2px;
}

.earn-foot {
  margin-top:12px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  align-items:center;
}
.earn-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.86rem;
  padding:6px 12px;
  cursor:pointer;
}
.earn-foot-note {
  font-size:0.8rem;
  color:#6b7280;
}
`;
