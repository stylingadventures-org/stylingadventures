// site/src/routes/admin/Analytics.jsx
import { useState } from "react";

const EPISODE_PERFORMANCE = [
  { episode: "Ep 1: Winter Collection", airDate: "Dec 1", views: "125K", avgWatch: "87%", coins: "1,250", revenue: "$8.2K" },
  { episode: "Ep 2: New Year Refresh", airDate: "Jan 5", views: "148K", avgWatch: "91%", coins: "1,480", revenue: "$9.8K" },
  { episode: "Ep 3: Valentine Special", airDate: "Feb 1", views: "156K", avgWatch: "93%", coins: "1,560", revenue: "$10.2K" },
  { episode: "Ep 4: Spring Vibes", airDate: "Mar 1", views: "182K", avgWatch: "94%", coins: "1,820", revenue: "$11.5K" },
  { episode: "Ep 5: Creator Collab", airDate: "Mar 15", views: "198K", avgWatch: "95%", coins: "1,980", revenue: "$12.8K" },
];

const CONVERSION_FUNNEL = [
  { stage: "Total Viewers", count: 145000, percent: "100%" },
  { stage: "Watched Full Ep", count: 136000, percent: "94%" },
  { stage: "Shopped Closet", count: 42300, percent: "29%" },
  { stage: "Joined Besties", count: 8900, percent: "6%" },
];

const REVENUE_BREAKDOWN = [
  { source: "Bestie Memberships", amount: 44900, percent: 65 },
  { source: "Affiliate Commissions", amount: 16200, percent: 23 },
  { source: "Shop Revenue", amount: 7400, percent: 11 },
];

const USER_GROWTH = [
  { period: "Jan", fans: 15000, besties: 2100, creators: 340 },
  { period: "Feb", fans: 22000, besties: 3200, creators: 520 },
  { period: "Mar", fans: 28500, besties: 4200, creators: 680 },
  { period: "Apr", fans: 35200, besties: 5100, creators: 820 },
];

export default function AdminAnalytics() {
  const [activeMetric, setActiveMetric] = useState("overview");

  return (
    <div className="admin-analytics">
      <style>{styles}</style>

      {/* HERO */}
      <section className="aaa-hero card">
        <div className="aaa-hero-main">
          <div>
            <p className="aaa-pill">📊 ANALYTICS</p>
            <h1 className="aaa-title">Performance Dashboard</h1>
            <p className="aaa-sub">
              Track episode performance, user conversion, revenue streams, and growth metrics. 
              Data updates in real-time.
            </p>
          </div>
          <div className="aaa-hero-stats">
            <div className="aaa-stat">
              <p className="aaa-stat-label">Total Revenue</p>
              <p className="aaa-stat-value">$68.5K</p>
            </div>
            <div className="aaa-stat">
              <p className="aaa-stat-label">Active Besties</p>
              <p className="aaa-stat-value">4.2K</p>
            </div>
            <div className="aaa-stat">
              <p className="aaa-stat-label">Monthly Growth</p>
              <p className="aaa-stat-value">+42%</p>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="aaa-tabs card">
        <button
          className={`aaa-tab ${activeMetric === "overview" ? "active" : ""}`}
          onClick={() => setActiveMetric("overview")}
        >
          Overview
        </button>
        <button
          className={`aaa-tab ${activeMetric === "episodes" ? "active" : ""}`}
          onClick={() => setActiveMetric("episodes")}
        >
          Episodes
        </button>
        <button
          className={`aaa-tab ${activeMetric === "funnel" ? "active" : ""}`}
          onClick={() => setActiveMetric("funnel")}
        >
          Conversion Funnel
        </button>
        <button
          className={`aaa-tab ${activeMetric === "revenue" ? "active" : ""}`}
          onClick={() => setActiveMetric("revenue")}
        >
          Revenue
        </button>
        <button
          className={`aaa-tab ${activeMetric === "growth" ? "active" : ""}`}
          onClick={() => setActiveMetric("growth")}
        >
          Growth
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeMetric === "overview" && (
        <div className="aaa-content">
          <div className="aaa-metrics-grid">
            <div className="aaa-metric-card card">
              <p className="aaa-metric-label">Total Views</p>
              <p className="aaa-metric-value">809K</p>
              <p className="aaa-metric-change">+12.5% vs last month</p>
            </div>
            <div className="aaa-metric-card card">
              <p className="aaa-metric-label">Avg Watch %</p>
              <p className="aaa-metric-value">92%</p>
              <p className="aaa-metric-change">+2.1% vs season avg</p>
            </div>
            <div className="aaa-metric-card card">
              <p className="aaa-metric-label">Coins Distributed</p>
              <p className="aaa-metric-value">8.1M</p>
              <p className="aaa-metric-change">+18.3% user engagement</p>
            </div>
            <div className="aaa-metric-card card">
              <p className="aaa-metric-label">Shop Conversions</p>
              <p className="aaa-metric-value">29%</p>
              <p className="aaa-metric-change">+4% from Ep 4</p>
            </div>
          </div>

          <div className="aaa-insight card">
            <h3 className="aaa-insight-title">💡 Key Insights</h3>
            <ul className="aaa-insight-list">
              <li><strong>Ep 5 smashed records:</strong> 198K views, 95% watch rate—creator collab format highly effective</li>
              <li><strong>Shop momentum building:</strong> Closet integrations driving 29% shop conversion (up from 25%)</li>
              <li><strong>Bestie adoption accelerating:</strong> 5.1K active members by end of Mar, 21.4% monthly growth rate</li>
              <li><strong>Revenue trending strong:</strong> $68.5K in Q1—on track for $275K+ annual run rate</li>
              <li><strong>Affiliate channel performing:</strong> Now 23% of revenue, growing faster than direct Bestie subs</li>
            </ul>
          </div>
        </div>
      )}

      {/* EPISODES TAB */}
      {activeMetric === "episodes" && (
        <div className="aaa-content card">
          <h3 className="aaa-section-title">Episode Performance</h3>
          <div className="aaa-table-container">
            <table className="aaa-table">
              <thead>
                <tr>
                  <th>Episode</th>
                  <th>Air Date</th>
                  <th>Views</th>
                  <th>Avg Watch</th>
                  <th>Coins</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {EPISODE_PERFORMANCE.map((ep, idx) => (
                  <tr key={idx}>
                    <td><strong>{ep.episode}</strong></td>
                    <td>{ep.airDate}</td>
                    <td>{ep.views}</td>
                    <td>
                      <div className="aaa-progress">
                        <div className="aaa-progress-bar" style={{ width: ep.avgWatch }} />
                        <span>{ep.avgWatch}</span>
                      </div>
                    </td>
                    <td>{ep.coins}</td>
                    <td className="aaa-revenue">{ep.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="aaa-table-note">📈 Clear upward trend in views, watch rate, and revenue per episode</p>
        </div>
      )}

      {/* FUNNEL TAB */}
      {activeMetric === "funnel" && (
        <div className="aaa-content card">
          <h3 className="aaa-section-title">Conversion Funnel (Last 30 Days)</h3>
          <div className="aaa-funnel">
            {CONVERSION_FUNNEL.map((step, idx) => {
              const width = (step.count / CONVERSION_FUNNEL[0].count) * 100;
              return (
                <div key={idx} className="aaa-funnel-step">
                  <div className="aaa-funnel-visual" style={{ width: `${width}%` }}>
                    <span className="aaa-funnel-label">{step.stage}</span>
                    <span className="aaa-funnel-count">{step.count.toLocaleString()}</span>
                  </div>
                  <span className="aaa-funnel-percent">{step.percent}</span>
                </div>
              );
            })}
          </div>
          <div className="aaa-funnel-insights">
            <p className="aaa-insight-point">
              ✓ <strong>6% conversion to Bestie:</strong> Strong—avg industry benchmark is 2-4%
            </p>
            <p className="aaa-insight-point">
              ✓ <strong>29% shop conversion:</strong> Excellent—closet integration is working
            </p>
            <p className="aaa-insight-point">
              → <strong>Opportunity:</strong> Retarget the 94K who watched but didn't shop
            </p>
          </div>
        </div>
      )}

      {/* REVENUE TAB */}
      {activeMetric === "revenue" && (
        <div className="aaa-content">
          <div className="aaa-revenue-grid">
            {REVENUE_BREAKDOWN.map((item, idx) => (
              <div key={idx} className="aaa-revenue-card card">
                <p className="aaa-revenue-label">{item.source}</p>
                <p className="aaa-revenue-amount">${item.amount.toLocaleString()}</p>
                <div className="aaa-revenue-bar">
                  <div className="aaa-revenue-fill" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="aaa-revenue-percent">{item.percent}% of total</p>
              </div>
            ))}
          </div>

          <div className="aaa-revenue-breakdown card">
            <h4 className="aaa-breakdown-title">Q1 Revenue Summary</h4>
            <div className="aaa-breakdown-section">
              <p className="aaa-breakdown-label">Bestie Memberships (65% - $44.9K)</p>
              <p className="aaa-breakdown-detail">
                ~4,500 active members × $9.99/month = $44,955 base<br/>
                70% to creators = $31.5K paid out to Lala
              </p>
            </div>
            <div className="aaa-breakdown-section">
              <p className="aaa-breakdown-label">Affiliate Commissions (23% - $16.2K)</p>
              <p className="aaa-breakdown-detail">
                Amazon, Etsy, Depop: 5% affiliate on $324K in sales<br/>
                Growing rapidly—fans earning coins via affiliate rewards
              </p>
            </div>
            <div className="aaa-breakdown-section">
              <p className="aaa-breakdown-label">Shop Revenue (11% - $7.4K)</p>
              <p className="aaa-breakdown-detail">
                Direct Closet item sales via Stripe<br/>
                Lower margin but helps with inventory management
              </p>
            </div>
            <p className="aaa-revenue-total">
              <strong>Total Q1 Revenue: $68.5K</strong><br/>
              <strong>Creator Payout (70%): $47.95K</strong><br/>
              Platform keeps: $20.55K for ops, hosting, team
            </p>
          </div>
        </div>
      )}

      {/* GROWTH TAB */}
      {activeMetric === "growth" && (
        <div className="aaa-content card">
          <h3 className="aaa-section-title">User Growth Trajectory</h3>
          
          <div className="aaa-growth-chart">
            {USER_GROWTH.map((month, idx) => {
              const maxCount = 35200;
              return (
                <div key={idx} className="aaa-growth-month">
                  <p className="aaa-growth-period">{month.period}</p>
                  <div className="aaa-growth-bars">
                    <div className="aaa-growth-bar fans" style={{ height: `${(month.fans / maxCount) * 100}%` }}>
                      <span className="aaa-bar-label">{month.fans}</span>
                    </div>
                    <div className="aaa-growth-bar besties" style={{ height: `${(month.besties / maxCount) * 100}%` }}>
                      <span className="aaa-bar-label">{month.besties}</span>
                    </div>
                    <div className="aaa-growth-bar creators" style={{ height: `${(month.creators / maxCount) * 100}%` }}>
                      <span className="aaa-bar-label">{month.creators}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="aaa-legend">
            <div className="aaa-legend-item">
              <span className="aaa-legend-color fans" />
              <span>👤 Fans</span>
            </div>
            <div className="aaa-legend-item">
              <span className="aaa-legend-color besties" />
              <span>💖 Besties</span>
            </div>
            <div className="aaa-legend-item">
              <span className="aaa-legend-color creators" />
              <span>✨ Creators</span>
            </div>
          </div>

          <div className="aaa-growth-stats">
            <p className="aaa-growth-stat">
              <strong>Fan Growth:</strong> 135% (15K → 35.2K) — Strong viral adoption
            </p>
            <p className="aaa-growth-stat">
              <strong>Bestie Growth:</strong> 143% (2.1K → 5.1K) — Membership uptake accelerating
            </p>
            <p className="aaa-growth-stat">
              <strong>Creator Growth:</strong> 141% (340 → 820) — Creator ecosystem scaling
            </p>
            <p className="aaa-growth-forecast">
              📈 At current trajectory: 60K+ fans by Q3, 8K+ Besties = $96K+ monthly revenue
            </p>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="aaa-affirm card">
        <p className="aaa-affirm-main">Data tells the story. Metrics drive decisions.</p>
        <p className="aaa-affirm-sub">
          Watch these trends closely. They guide content strategy, feature prioritization, 
          and ecosystem growth. The numbers show strong momentum. 📈💜
        </p>
      </section>
    </div>
  );
}

const styles = `
.admin-analytics {
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
.aaa-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(223, 213, 255, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(196, 181, 253, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.aaa-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .aaa-hero-main {
    grid-template-columns: 1fr;
  }
}

.aaa-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #7c3aed;
  border: 1px solid rgba(223, 213, 255, 0.9);
}

.aaa-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.aaa-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.aaa-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.aaa-stat {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  padding: 10px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  text-align: center;
}

.aaa-stat-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.aaa-stat-value {
  margin: 4px 0 0;
  font-weight: 700;
  font-size: 1.3rem;
  color: #7c3aed;
}

/* TABS */
.aaa-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
  overflow-x: auto;
}

.aaa-tab {
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
  white-space: nowrap;
}

.aaa-tab:hover {
  color: #111827;
}

.aaa-tab.active {
  color: #7c3aed;
  border-bottom-color: #7c3aed;
}

/* CONTENT */
.aaa-content {
  padding: 18px 0;
}

/* METRICS GRID */
.aaa-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  padding: 0 0 18px;
}

.aaa-metric-card {
  padding: 14px;
}

.aaa-metric-label {
  margin: 0 0 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.aaa-metric-value {
  margin: 0 0 4px;
  font-size: 1.6rem;
  font-weight: 700;
  color: #7c3aed;
}

.aaa-metric-change {
  margin: 0;
  font-size: 0.8rem;
  color: #16a34a;
  font-weight: 500;
}

/* INSIGHT */
.aaa-insight {
  padding: 14px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.aaa-insight-title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.aaa-insight-list {
  margin: 0;
  padding: 0 0 0 20px;
}

.aaa-insight-list li {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 6px;
  line-height: 1.5;
}

/* SECTION TITLE */
.aaa-section-title {
  margin: 0 0 14px;
  padding: 0 18px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

/* TABLE */
.aaa-table-container {
  overflow-x: auto;
  padding: 18px;
}

.aaa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.aaa-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.aaa-table th {
  padding: 10px;
  text-align: left;
  font-weight: 600;
  color: #111827;
}

.aaa-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
}

.aaa-table tbody tr:hover {
  background: #f9fafb;
}

.aaa-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.aaa-progress-bar {
  height: 6px;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 999px;
  min-width: 40px;
}

.aaa-revenue {
  font-weight: 600;
  color: #111827;
}

.aaa-table-note {
  padding: 0 18px;
  margin: 12px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

/* FUNNEL */
.aaa-funnel {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aaa-funnel-step {
  display: flex;
  align-items: center;
  gap: 12px;
}

.aaa-funnel-visual {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
  border-radius: 8px;
  transition: width 300ms ease;
}

.aaa-funnel-label {
  font-weight: 600;
  color: #111827;
  font-size: 0.9rem;
}

.aaa-funnel-count {
  font-weight: 700;
  color: #7c3aed;
  white-space: nowrap;
}

.aaa-funnel-percent {
  min-width: 50px;
  text-align: right;
  font-weight: 600;
  color: #7c3aed;
}

.aaa-funnel-insights {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aaa-insight-point {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

/* REVENUE */
.aaa-revenue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
  padding: 0 0 18px;
}

.aaa-revenue-card {
  padding: 14px;
}

.aaa-revenue-label {
  margin: 0 0 8px;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.aaa-revenue-amount {
  margin: 0 0 8px;
  font-size: 1.4rem;
  font-weight: 700;
  color: #7c3aed;
}

.aaa-revenue-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.aaa-revenue-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.aaa-revenue-percent {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.aaa-revenue-breakdown {
  padding: 18px;
}

.aaa-breakdown-title {
  margin: 0 0 14px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.aaa-breakdown-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.aaa-breakdown-section:last-child {
  border-bottom: none;
}

.aaa-breakdown-label {
  margin: 0 0 6px;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.aaa-breakdown-detail {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

.aaa-revenue-total {
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 8px;
  font-size: 0.95rem;
  color: #111827;
}

.aaa-revenue-total strong {
  color: #7c3aed;
}

/* GROWTH */
.aaa-growth-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 16px;
  padding: 18px;
  min-height: 280px;
}

.aaa-growth-month {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.aaa-growth-period {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: #111827;
}

.aaa-growth-bars {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 200px;
}

.aaa-growth-bar {
  flex: 1;
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  min-height: 20px;
}

.aaa-growth-bar.fans {
  background: #a78bfa;
}

.aaa-growth-bar.besties {
  background: #ec4899;
}

.aaa-growth-bar.creators {
  background: #10b981;
}

.aaa-bar-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  padding: 2px;
  white-space: nowrap;
}

.aaa-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 18px;
  flex-wrap: wrap;
}

.aaa-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #4b5563;
}

.aaa-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.aaa-legend-color.fans {
  background: #a78bfa;
}

.aaa-legend-color.besties {
  background: #ec4899;
}

.aaa-legend-color.creators {
  background: #10b981;
}

.aaa-growth-stats {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aaa-growth-stat {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.aaa-growth-forecast {
  margin: 8px 0 0;
  padding: 8px;
  background: rgba(139, 92, 246, 0.05);
  border-left: 3px solid #7c3aed;
  font-weight: 500;
  color: #111827;
}

/* AFFIRM */
.aaa-affirm {
  padding: 18px;
  text-align: center;
}

.aaa-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.aaa-affirm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
}
`;
