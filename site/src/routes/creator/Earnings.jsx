// site/src/routes/creator/Earnings.jsx
import React from "react";

export default function CreatorEarnings() {
  return (
    <section className="creator-earnings">
      <style>{styles}</style>

      <header className="earn-header">
        <div>
          <h2 className="earn-title">Earnings</h2>
          <p className="earn-sub">
            High-level view of Bestie subs, collab deals, and in-game rewards.
            These numbers are demo placeholders until we wire the real ledger.
          </p>
        </div>

        <button
          type="button"
          className="earn-range"
          onClick={() => alert("Date range filter coming soon.")}
        >
          Last 30 days ▾
        </button>
      </header>

      {/* KPI summary */}
      <div className="earn-kpi-row">
        <div className="earn-kpi">
          <div className="earn-label">This month (projected)</div>
          <div className="earn-value">$1,240</div>
          <div className="earn-meta">+18% vs last month</div>
        </div>
        <div className="earn-kpi">
          <div className="earn-label">Bestie subscriptions</div>
          <div className="earn-value">86</div>
          <div className="earn-meta">Renewal rate 92%</div>
        </div>
        <div className="earn-kpi">
          <div className="earn-label">Brand / collab payouts</div>
          <div className="earn-value">$620</div>
          <div className="earn-meta">2 campaigns active</div>
        </div>
      </div>

      {/* Chart + breakdown */}
      <div className="earn-main-grid">
        <section className="earn-card">
          <header className="earn-card-header">
            <h3 className="earn-card-title">Earnings over time</h3>
            <div className="earn-toggle">
              <button className="earn-toggle-btn is-active">Monthly</button>
              <button className="earn-toggle-btn">Weekly</button>
            </div>
          </header>

          <div className="earn-chart-placeholder">
            Chart wiring coming soon.
          </div>
        </section>

        <section className="earn-card">
          <header className="earn-card-header">
            <h3 className="earn-card-title">Breakdown</h3>
            <button className="earn-pill" type="button">
              By source ▾
            </button>
          </header>

          <div className="earn-breakdown-list">
            <div className="earn-breakdown-row">
              <div className="earn-breakdown-label">
                <span className="earn-dot" />
                Episodes
              </div>
              <div className="earn-breakdown-values">
                <span className="amount">$820</span>
                <span className="percent">64%</span>
              </div>
            </div>
            <div className="earn-breakdown-row">
              <div className="earn-breakdown-label">
                <span className="earn-dot earn-dot--secondary" />
                Bestie subscriptions
              </div>
              <div className="earn-breakdown-values">
                <span className="amount">$280</span>
                <span className="percent">22%</span>
              </div>
            </div>
            <div className="earn-breakdown-row">
              <div className="earn-breakdown-label">
                <span className="earn-dot earn-dot--tertiary" />
                Brand / collab payouts
              </div>
              <div className="earn-breakdown-values">
                <span className="amount">$140</span>
                <span className="percent">14%</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Upcoming payouts + recent activity */}
      <div className="earn-secondary-grid">
        <section className="earn-card">
          <header className="earn-card-header">
            <h3 className="earn-card-title">Upcoming payouts</h3>
            <span className="earn-chip">Next payout: Mar 28</span>
          </header>

          <div className="earn-table-wrap">
            <table className="earn-table">
              <thead>
                <tr>
                  <th>Payout date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mar 28, 2026</td>
                  <td>$420.00</td>
                  <td>
                    <span className="status status--scheduled">Scheduled</span>
                  </td>
                  <td>Bank transfer</td>
                </tr>
                <tr>
                  <td>Feb 26, 2026</td>
                  <td>$315.00</td>
                  <td>
                    <span className="status status--paid">Paid</span>
                  </td>
                  <td>Bank transfer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="earn-card">
          <header className="earn-card-header">
            <h3 className="earn-card-title">Recent activity</h3>
          </header>

          <ul className="earn-activity">
            <li className="earn-activity-row">
              <div>
                <div className="activity-title">
                  Episode: Closet Confessions EP 1
                </div>
                <div className="activity-meta">
                  Published · Mar 12, 4:32 PM
                </div>
              </div>
              <div className="activity-amount">+ $120.00</div>
            </li>
            <li className="earn-activity-row">
              <div>
                <div className="activity-title">
                  Bestie subscription renewals
                </div>
                <div className="activity-meta">Mar 10 · 8 renewals</div>
              </div>
              <div className="activity-amount">+ $56.00</div>
            </li>
            <li className="earn-activity-row">
              <div>
                <div className="activity-title">Brand collab: Holiday Glam</div>
                <div className="activity-meta">Milestone 1 · Mar 5</div>
              </div>
              <div className="activity-amount">+ $220.00</div>
            </li>
          </ul>
        </section>
      </div>

      <footer className="earn-foot">
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
      </footer>
    </section>
  );
}

const styles = `
.creator-earnings {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Header */

.earn-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.earn-title {
  margin: 0 0 4px;
  font-size: 1.4rem;
  font-weight: 600;
  color: #0f172a;
}

.earn-sub {
  margin: 0;
  font-size: 0.88rem;
  color: #6b7280;
  max-width: 520px;
}

.earn-range {
  align-self: flex-start;
  border-radius: 999px;
  border: 1px solid #d0d5dd;
  background: #ffffff;
  padding: 6px 12px;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
}

/* KPI row */

.earn-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 12px;
}

.earn-kpi {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.04);
}

.earn-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.earn-value {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 4px;
  color: #111827;
}

.earn-meta {
  font-size: 0.8rem;
  color: #4b5563;
  margin-top: 2px;
}

/* Main grids */

.earn-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr);
  gap: 16px;
}

.earn-secondary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .earn-main-grid,
  .earn-secondary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* Cards */

.earn-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 14px 16px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.earn-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.earn-card-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 600;
  color: #111827;
}

/* Chart placeholder */

.earn-chart-placeholder {
  height: 220px;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.84rem;
  color: #6b7280;
}

/* Breakdown */

.earn-pill {
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 4px 10px;
  font-size: 0.76rem;
  color: #374151;
  cursor: default;
}

.earn-breakdown-list {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.earn-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
}

.earn-breakdown-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.86rem;
  color: #374151;
}

.earn-breakdown-values {
  text-align: right;
  font-size: 0.84rem;
}

.earn-breakdown-values .amount {
  font-weight: 600;
  color: #111827;
}

.earn-breakdown-values .percent {
  display: block;
  font-size: 0.76rem;
  color: #6b7280;
}

.earn-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #4a77c6;
}

.earn-dot--secondary {
  background: #22c55e;
}

.earn-dot--tertiary {
  background: #facc15;
}

/* Toggle */

.earn-toggle {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.earn-toggle-btn {
  padding: 4px 10px;
  font-size: 0.76rem;
  background: transparent;
  border: none;
  color: #4b5563;
  cursor: pointer;
}

.earn-toggle-btn.is-active {
  background: #4a77c6;
  color: #ffffff;
}

/* Payouts table */

.earn-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.earn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.earn-table th {
  text-align: left;
  padding: 6px 8px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}

.earn-table td {
  padding: 6px 8px;
  color: #374151;
  border-top: 1px solid #e5e7eb;
}

.status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.72rem;
}

.status--scheduled {
  background: #ecfdf3;
  color: #166534;
}

.status--paid {
  background: #eff6ff;
  color: #1d4ed8;
}

/* Activity list */

.earn-activity {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.earn-activity-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.activity-title {
  font-size: 0.86rem;
  color: #111827;
}

.activity-meta {
  font-size: 0.76rem;
  color: #6b7280;
  margin-top: 2px;
}

.activity-amount {
  font-size: 0.86rem;
  font-weight: 600;
  color: #16a34a;
}

/* Footer */

.earn-foot {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.earn-btn {
  border-radius: 999px;
  border: none;
  background: #111827;
  color: #f9fafb;
  font-size: 0.86rem;
  padding: 6px 14px;
  cursor: pointer;
}

.earn-foot-note {
  font-size: 0.8rem;
  color: #6b7280;
}
`;
