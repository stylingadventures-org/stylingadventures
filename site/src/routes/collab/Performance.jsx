// site/src/routes/collab/Performance.jsx
import { useState } from "react";

const CAMPAIGN_METRICS = {
  ep9: {
    name: "Summer Vibes Campaign",
    views: 24580,
    clicks: 3240,
    conversions: 412,
    conversionRate: 12.7,
    revenue: 4942,
  },
  ep10: {
    name: "Sustainable Fashion Drop",
    views: 18940,
    clicks: 2156,
    conversions: 289,
    conversionRate: 13.4,
    revenue: 3467,
  },
};

const WEEKLY_DATA = [
  { week: "Week 1", views: 6240, clicks: 820, conversions: 104 },
  { week: "Week 2", views: 8320, clicks: 1120, conversions: 142 },
  { week: "Week 3", views: 5680, clicks: 920, conversions: 105 },
  { week: "Week 4", views: 4340, clicks: 380, conversions: 61 },
];

export default function CollabPerformance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedCampaign, setExpandedCampaign] = useState(null);

  const toggleCampaign = (campaignId) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

  const totalViews = Object.values(CAMPAIGN_METRICS).reduce((sum, c) => sum + c.views, 0);
  const totalConversions = Object.values(CAMPAIGN_METRICS).reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = Object.values(CAMPAIGN_METRICS).reduce((sum, c) => sum + c.revenue, 0);
  const avgConversionRate = (
    Object.values(CAMPAIGN_METRICS).reduce((sum, c) => sum + c.conversionRate, 0) /
    Object.values(CAMPAIGN_METRICS).length
  ).toFixed(1);

  return (
    <div className="collab-performance">
      <style>{styles}</style>

      {/* HERO */}
      <section className="cp-hero card">
        <div className="cp-hero-main">
          <div>
            <p className="cp-pill">📊 CAMPAIGN PERFORMANCE</p>
            <h1 className="cp-title">Collaboration Metrics & Analytics</h1>
            <p className="cp-sub">
              Track campaign performance, monitor engagement metrics, analyze conversion rates, 
              and measure ROI across all collaborations.
            </p>
          </div>
          <div className="cp-hero-card">
            <p className="cp-stat-label">Total Views</p>
            <p className="cp-stat-value">{totalViews.toLocaleString()}</p>
            <p className="cp-stat-sub">All active campaigns</p>
          </div>
        </div>
      </section>

      {/* METRICS GRID */}
      <div className="cp-metrics-grid">
        <div className="cp-metric-card">
          <p className="cp-metric-label">Total Conversions</p>
          <p className="cp-metric-value">{totalConversions}</p>
          <p className="cp-metric-sub">+18% from last month</p>
        </div>
        <div className="cp-metric-card">
          <p className="cp-metric-label">Total Revenue</p>
          <p className="cp-metric-value">${totalRevenue.toLocaleString()}</p>
          <p className="cp-metric-sub">+24% from last month</p>
        </div>
        <div className="cp-metric-card">
          <p className="cp-metric-label">Avg Conversion Rate</p>
          <p className="cp-metric-value">{avgConversionRate}%</p>
          <p className="cp-metric-sub">Exceeding industry avg</p>
        </div>
        <div className="cp-metric-card">
          <p className="cp-metric-label">Active Campaigns</p>
          <p className="cp-metric-value">{Object.keys(CAMPAIGN_METRICS).length}</p>
          <p className="cp-metric-sub">All performing well</p>
        </div>
      </div>

      {/* TABS */}
      <div className="cp-tabs card">
        <button
          className={`cp-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Campaign Overview
        </button>
        <button
          className={`cp-tab ${activeTab === "engagement" ? "active" : ""}`}
          onClick={() => setActiveTab("engagement")}
        >
          Engagement Details
        </button>
        <button
          className={`cp-tab ${activeTab === "weekly" ? "active" : ""}`}
          onClick={() => setActiveTab("weekly")}
        >
          Weekly Breakdown
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="cp-content card">
          <h3 className="cp-section-title">Active Campaigns</h3>
          <p className="cp-section-sub">Performance metrics for each collaboration</p>

          <div className="cp-campaigns-list">
            {Object.entries(CAMPAIGN_METRICS).map(([id, campaign]) => (
              <div key={id} className="cp-campaign-card">
                <div
                  className="cp-campaign-header"
                  onClick={() => toggleCampaign(id)}
                >
                  <div className="cp-campaign-info">
                    <h4 className="cp-campaign-name">{campaign.name}</h4>
                    <p className="cp-campaign-id">{id.toUpperCase()}</p>
                  </div>
                  <div className="cp-campaign-key-metric">
                    <p className="cp-key-label">Views</p>
                    <p className="cp-key-value">{campaign.views.toLocaleString()}</p>
                  </div>
                  <span className="cp-chevron">{expandedCampaign === id ? "▼" : "▶"}</span>
                </div>

                {expandedCampaign === id && (
                  <div className="cp-campaign-details">
                    <div className="cp-detail-grid">
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Views</p>
                        <p className="cp-detail-value">{campaign.views.toLocaleString()}</p>
                      </div>
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Clicks</p>
                        <p className="cp-detail-value">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Conversions</p>
                        <p className="cp-detail-value">{campaign.conversions}</p>
                      </div>
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Conversion Rate</p>
                        <p className="cp-detail-value">{campaign.conversionRate}%</p>
                      </div>
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Revenue</p>
                        <p className="cp-detail-value">${campaign.revenue.toLocaleString()}</p>
                      </div>
                      <div className="cp-detail-item">
                        <p className="cp-detail-label">Status</p>
                        <p className="cp-detail-value">Active ✓</p>
                      </div>
                    </div>

                    <div className="cp-campaign-actions">
                      <button className="btn btn-secondary">View Full Report</button>
                      <button className="btn btn-secondary">Contact Partner</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ENGAGEMENT */}
      {activeTab === "engagement" && (
        <div className="cp-content card">
          <h3 className="cp-section-title">Engagement Metrics</h3>
          <p className="cp-section-sub">Detailed engagement analysis across all campaigns</p>

          <div className="cp-engagement-section">
            <h4 className="cp-subsection-title">Engagement by Campaign</h4>
            <div className="cp-engagement-grid">
              {Object.entries(CAMPAIGN_METRICS).map(([id, campaign]) => (
                <div key={id} className="cp-engagement-card">
                  <p className="cp-eng-campaign">{campaign.name}</p>
                  
                  <div className="cp-metric-row">
                    <span className="cp-metric-name">Click-Through Rate</span>
                    <div className="cp-progress-bar">
                      <div
                        className="cp-progress-fill"
                        style={{ width: `${(campaign.clicks / campaign.views) * 100}%` }}
                      ></div>
                    </div>
                    <span className="cp-metric-pct">{((campaign.clicks / campaign.views) * 100).toFixed(1)}%</span>
                  </div>

                  <div className="cp-metric-row">
                    <span className="cp-metric-name">Conversion Rate</span>
                    <div className="cp-progress-bar">
                      <div
                        className="cp-progress-fill"
                        style={{ width: `${campaign.conversionRate * 2}%` }}
                      ></div>
                    </div>
                    <span className="cp-metric-pct">{campaign.conversionRate}%</span>
                  </div>

                  <div className="cp-metric-row">
                    <span className="cp-metric-name">Avg Order Value</span>
                    <span className="cp-metric-pct">${(campaign.revenue / campaign.conversions).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cp-insights">
            <h4 className="cp-subsection-title">Key Insights</h4>
            <div className="cp-insight-list">
              <div className="cp-insight-item">
                <span className="cp-insight-icon">💡</span>
                <p className="cp-insight-text">
                  Sustainable Fashion campaign shows highest conversion rate at 13.4%
                </p>
              </div>
              <div className="cp-insight-item">
                <span className="cp-insight-icon">📈</span>
                <p className="cp-insight-text">
                  Summer Vibes generated 43% more revenue despite lower conversion rate
                </p>
              </div>
              <div className="cp-insight-item">
                <span className="cp-insight-icon">🎯</span>
                <p className="cp-insight-text">
                  Both campaigns exceeding industry benchmarks for engagement
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY */}
      {activeTab === "weekly" && (
        <div className="cp-content card">
          <h3 className="cp-section-title">Weekly Performance Breakdown</h3>
          <p className="cp-section-sub">Trends across the past month</p>

          <div className="cp-weekly-table">
            <div className="cp-table-header">
              <div className="cp-col col-week">Week</div>
              <div className="cp-col col-metric">Views</div>
              <div className="cp-col col-metric">Clicks</div>
              <div className="cp-col col-metric">Conversions</div>
              <div className="cp-col col-metric">CTR</div>
            </div>

            {WEEKLY_DATA.map((week, idx) => {
              const ctr = ((week.clicks / week.views) * 100).toFixed(1);
              return (
                <div key={idx} className="cp-table-row">
                  <div className="cp-col col-week">
                    <span className="cp-week-badge">{week.week}</span>
                  </div>
                  <div className="cp-col col-metric">{week.views.toLocaleString()}</div>
                  <div className="cp-col col-metric">{week.clicks.toLocaleString()}</div>
                  <div className="cp-col col-metric">{week.conversions}</div>
                  <div className="cp-col col-metric">{ctr}%</div>
                </div>
              );
            })}

            <div className="cp-table-total">
              <div className="cp-col col-week">
                <span className="cp-week-badge">Total</span>
              </div>
              <div className="cp-col col-metric">
                <strong>{WEEKLY_DATA.reduce((sum, w) => sum + w.views, 0).toLocaleString()}</strong>
              </div>
              <div className="cp-col col-metric">
                <strong>{WEEKLY_DATA.reduce((sum, w) => sum + w.clicks, 0).toLocaleString()}</strong>
              </div>
              <div className="cp-col col-metric">
                <strong>{WEEKLY_DATA.reduce((sum, w) => sum + w.conversions, 0)}</strong>
              </div>
              <div className="cp-col col-metric">
                <strong>
                  {(
                    (WEEKLY_DATA.reduce((sum, w) => sum + w.clicks, 0) /
                      WEEKLY_DATA.reduce((sum, w) => sum + w.views, 0)) *
                    100
                  ).toFixed(1)}
                  %
                </strong>
              </div>
            </div>
          </div>

          <div className="cp-weekly-actions">
            <button className="btn btn-primary">Export Data</button>
            <button className="btn btn-secondary">View Detailed Report</button>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="cp-affirm card">
        <p className="cp-affirm-main">Data drives decisions.</p>
        <p className="cp-affirm-sub">
          Track every metric, understand your audience, optimize your strategy. 
          The numbers tell the story. 📈
        </p>
      </section>
    </div>
  );
}

const styles = `
.collab-performance {
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
.cp-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(147, 197, 253, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.cp-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .cp-hero-main {
    grid-template-columns: 1fr;
  }
}

.cp-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #1e40af;
  border: 1px solid rgba(219, 234, 254, 0.9);
}

.cp-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.cp-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.cp-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.cp-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.cp-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.cp-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* METRICS GRID */
.cp-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.cp-metric-card {
  padding: 14px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 20px rgba(148, 163, 184, 0.25);
}

.cp-metric-label {
  margin: 0 0 4px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.cp-metric-value {
  margin: 0 0 2px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.cp-metric-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* TABS */
.cp-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.cp-tab {
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

.cp-tab:hover {
  color: #111827;
}

.cp-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* CONTENT */
.cp-content {
  padding: 18px;
}

.cp-section-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cp-section-sub {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

.cp-subsection-title {
  margin: 12px 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

/* CAMPAIGNS */
.cp-campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.cp-campaign-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.cp-campaign-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: all 150ms ease;
  background: #f9fafb;
}

.cp-campaign-header:hover {
  background: #f3f4f6;
}

.cp-campaign-info {
  display: flex;
  flex-direction: column;
}

.cp-campaign-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.cp-campaign-id {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.cp-campaign-key-metric {
  text-align: right;
  border-right: 1px solid #e5e7eb;
  padding-right: 12px;
}

.cp-key-label {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cp-key-value {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.cp-chevron {
  font-size: 0.85rem;
  color: #9ca3af;
}

.cp-campaign-details {
  padding: 12px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.cp-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.cp-detail-item {
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.cp-detail-label {
  margin: 0 0 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
}

.cp-detail-value {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.cp-campaign-actions {
  display: flex;
  gap: 8px;
}

/* ENGAGEMENT */
.cp-engagement-section {
  margin: 12px 0;
}

.cp-engagement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.cp-engagement-card {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.cp-eng-campaign {
  margin: 0 0 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.cp-metric-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.cp-metric-name {
  flex-shrink: 0;
  min-width: 100px;
  color: #6b7280;
}

.cp-progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.cp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 999px;
}

.cp-metric-pct {
  flex-shrink: 0;
  min-width: 35px;
  text-align: right;
  font-weight: 600;
  color: #111827;
}

.cp-insights {
  margin: 12px 0;
}

.cp-insight-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cp-insight-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  align-items: flex-start;
}

.cp-insight-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
}

.cp-insight-text {
  margin: 0;
  font-size: 0.85rem;
  color: #1e40af;
}

/* WEEKLY TABLE */
.cp-weekly-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 12px 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.cp-table-header,
.cp-table-row,
.cp-table-total {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 0;
}

.cp-table-header {
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.cp-table-row {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.cp-table-row:hover {
  background: #f9fafb;
}

.cp-table-row:last-child {
  border-bottom: 1px solid #e5e7eb;
}

.cp-table-total {
  background: #f9fafb;
  border-top: 2px solid #d1d5db;
}

.cp-col {
  padding: 10px 12px;
  font-size: 0.9rem;
  color: #374151;
  align-items: center;
  display: flex;
}

.cp-table-header .cp-col {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  font-weight: 600;
}

.col-week {
  font-weight: 600;
  color: #111827;
}

.col-metric {
  justify-content: flex-end;
}

.cp-week-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  color: #fff;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.cp-weekly-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* AFFIRM */
.cp-affirm {
  padding: 18px;
  text-align: center;
}

.cp-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.cp-affirm-sub {
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
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
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
