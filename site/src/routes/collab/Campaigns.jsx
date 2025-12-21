// site/src/routes/collab/Campaigns.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

// Sample campaigns data
const SAMPLE_CAMPAIGNS = [
  {
    id: "camp-001",
    name: "Summer Fashion Drop",
    brand: "StyleUp Apparel",
    status: "active",
    startDate: "2025-03-01",
    endDate: "2025-05-31",
    creators: 5,
    reach: "1.2M",
    engagement: "18.5%",
    budget: "$25,000",
    spent: "$18,450",
    deliverables: 12,
    completed: 10,
    assets: 24
  },
  {
    id: "camp-002",
    name: "Spring Vibes Campaign",
    brand: "Fresh Collective",
    status: "planning",
    startDate: "2025-04-15",
    endDate: "2025-06-30",
    creators: 3,
    reach: "—",
    engagement: "—",
    budget: "$12,000",
    spent: "$0",
    deliverables: 6,
    completed: 0,
    assets: 8
  },
  {
    id: "camp-003",
    name: "Winter Essentials",
    brand: "CozyHome Co.",
    status: "completed",
    startDate: "2024-11-01",
    endDate: "2025-02-28",
    creators: 4,
    reach: "890K",
    engagement: "22.3%",
    budget: "$15,000",
    spent: "$15,000",
    deliverables: 8,
    completed: 8,
    assets: 18
  },
  {
    id: "camp-004",
    name: "Gen-Z Collab Series",
    brand: "Trend Labs",
    status: "active",
    startDate: "2025-03-15",
    endDate: "2025-08-15",
    creators: 7,
    reach: "2.1M",
    engagement: "21.2%",
    budget: "$45,000",
    spent: "$32,100",
    deliverables: 18,
    completed: 14,
    assets: 42
  },
  {
    id: "camp-005",
    name: "Beauty Essentials Q1",
    brand: "Glow Beauty",
    status: "planning",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
    creators: 6,
    reach: "—",
    engagement: "—",
    budget: "$18,500",
    spent: "$0",
    deliverables: 12,
    completed: 0,
    assets: 15
  }
];

export default function CollabCampaigns() {
  const [activeView, setActiveView] = useState("overview");
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter campaigns
  let filteredCampaigns = SAMPLE_CAMPAIGNS;
  if (filterStatus !== "all") {
    filteredCampaigns = filteredCampaigns.filter(c => c.status === filterStatus);
  }

  // Calculate stats
  const totalBudget = SAMPLE_CAMPAIGNS.reduce((sum, c) => {
    const amount = parseFloat(c.budget.replace(/[$,]/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const totalSpent = SAMPLE_CAMPAIGNS.reduce((sum, c) => {
    const amount = parseFloat(c.spent.replace(/[$,]/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const activeCampaigns = SAMPLE_CAMPAIGNS.filter(c => c.status === "active").length;
  const totalReach = SAMPLE_CAMPAIGNS.filter(c => c.status === "completed")
    .reduce((sum, c) => {
      const m = parseFloat(c.reach.replace(/[MK,]/g, ""));
      const mult = c.reach.includes("M") ? 1000000 : 1000;
      return sum + (isNaN(m) ? 0 : m * mult);
    }, 0);

  return (
    <div className="collab-campaigns">
      <style>{styles}</style>

      {/* HERO */}
      <section className="cc-hero card">
        <div className="cc-hero-main">
          <div>
            <p className="cc-pill">🤝 CAMPAIGNS</p>
            <h1 className="cc-title">Brand Partnership Hub</h1>
            <p className="cc-sub">
              Manage all active collaborations, track deliverables, approve assets, 
              and measure campaign performance in one place.
            </p>
          </div>
          <div className="cc-hero-right">
            <div className="cc-hero-card">
              <p className="cc-hero-label">Budget Overview</p>
              <p className="cc-hero-value">${(totalBudget / 1000).toFixed(0)}K</p>
              <p className="cc-hero-note">
                ${(totalSpent / 1000).toFixed(0)}K spent • {Math.round((totalSpent / totalBudget) * 100)}% used
              </p>
              <div className="cc-budget-bar">
                <div className="cc-budget-fill" style={{ width: `${(totalSpent / totalBudget) * 100}%` }} />
              </div>
              <div className="cc-hero-stats">
                <div className="cc-stat-pill">
                  <span className="cc-stat-label">Active</span>
                  <span className="cc-stat-value">{activeCampaigns}</span>
                </div>
                <div className="cc-stat-pill">
                  <span className="cc-stat-label">Reach</span>
                  <span className="cc-stat-value">{(totalReach / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div className="cc-filters">
        <button
          className={`cc-filter-btn ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => setFilterStatus("all")}
        >
          All Campaigns
        </button>
        <button
          className={`cc-filter-btn ${filterStatus === "active" ? "active" : ""}`}
          onClick={() => setFilterStatus("active")}
        >
          Active
        </button>
        <button
          className={`cc-filter-btn ${filterStatus === "planning" ? "active" : ""}`}
          onClick={() => setFilterStatus("planning")}
        >
          Planning
        </button>
        <button
          className={`cc-filter-btn ${filterStatus === "completed" ? "active" : ""}`}
          onClick={() => setFilterStatus("completed")}
        >
          Completed
        </button>
      </div>

      {/* CAMPAIGNS GRID */}
      <div className="cc-campaigns-container">
        {filteredCampaigns.map(campaign => {
          const isExpanded = expandedCampaign === campaign.id;
          const budgetPercent = (campaign.spent.replace(/[$,]/g, "") / campaign.budget.replace(/[$,]/g, "")) * 100;

          return (
            <div
              key={campaign.id}
              className={`cc-campaign-card card ${campaign.status} ${isExpanded ? "expanded" : ""}`}
              onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
            >
              <div className="cc-campaign-header">
                <div className="cc-campaign-title-section">
                  <h3 className="cc-campaign-name">{campaign.name}</h3>
                  <p className="cc-campaign-brand">🏢 {campaign.brand}</p>
                </div>
                <div className="cc-campaign-status">
                  <span className={`cc-status-badge ${campaign.status}`}>
                    {campaign.status === "active" && "🟢 Active"}
                    {campaign.status === "planning" && "⏳ Planning"}
                    {campaign.status === "completed" && "✓ Completed"}
                  </span>
                </div>
              </div>

              <div className="cc-campaign-summary">
                <div className="cc-summary-item">
                  <span className="cc-summary-label">Creators</span>
                  <span className="cc-summary-value">{campaign.creators}</span>
                </div>
                <div className="cc-summary-item">
                  <span className="cc-summary-label">Reach</span>
                  <span className="cc-summary-value">{campaign.reach}</span>
                </div>
                <div className="cc-summary-item">
                  <span className="cc-summary-label">Engagement</span>
                  <span className="cc-summary-value">{campaign.engagement}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="cc-campaign-details">
                  <div className="cc-details-section">
                    <p className="cc-section-title">📅 Timeline</p>
                    <div className="cc-detail-row">
                      <span>Start:</span>
                      <span>{campaign.startDate}</span>
                    </div>
                    <div className="cc-detail-row">
                      <span>End:</span>
                      <span>{campaign.endDate}</span>
                    </div>
                  </div>

                  <div className="cc-details-section">
                    <p className="cc-section-title">💰 Budget</p>
                    <div className="cc-budget-bar-large">
                      <div className="cc-budget-fill-large" style={{ width: `${Math.min(budgetPercent, 100)}%` }} />
                    </div>
                    <div className="cc-budget-text">
                      <span>${campaign.spent}</span>
                      <span>/</span>
                      <span>${campaign.budget}</span>
                    </div>
                  </div>

                  <div className="cc-details-section">
                    <p className="cc-section-title">✅ Deliverables</p>
                    <div className="cc-deliverable-bar">
                      <div className="cc-deliverable-fill" style={{ width: `${(campaign.completed / campaign.deliverables) * 100}%` }} />
                    </div>
                    <p className="cc-deliverable-text">
                      {campaign.completed}/{campaign.deliverables} completed
                    </p>
                  </div>

                  <div className="cc-details-section">
                    <p className="cc-section-title">📦 Assets</p>
                    <p className="cc-asset-count">{campaign.assets} brand assets uploaded</p>
                  </div>

                  <div className="cc-actions">
                    <button className="btn btn-primary">View Deliverables</button>
                    <button className="btn btn-secondary">Manage Assets</button>
                    <button className="btn btn-secondary">Performance Report</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <section className="cc-actions card">
        <h2 className="cc-card-title">Campaign Management</h2>
        <div className="cc-action-grid">
          <div className="cc-action-box">
            <h3 className="cc-action-title">📋 New Campaign</h3>
            <p className="cc-action-sub">Create a new brand collaboration</p>
            <button className="btn btn-primary">Start Campaign</button>
          </div>
          <div className="cc-action-box">
            <h3 className="cc-action-title">📦 Asset Review Queue</h3>
            <p className="cc-action-sub">Approve or reject submitted assets</p>
            <button className="btn btn-secondary">Review (3)</button>
          </div>
          <div className="cc-action-box">
            <h3 className="cc-action-title">✅ Approval Workflows</h3>
            <p className="cc-action-sub">Manage script & deliverable approvals</p>
            <button className="btn btn-secondary">Pending (5)</button>
          </div>
          <div className="cc-action-box">
            <h3 className="cc-action-title">📊 Performance Analytics</h3>
            <p className="cc-action-sub">View engagement and ROI metrics</p>
            <button className="btn btn-secondary">Analytics</button>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="cc-affirm card">
        <div className="cc-affirm-text">
          <p className="cc-affirm-label">Partner Hub</p>
          <p className="cc-affirm-main">Collaborations that create magic.</p>
          <p className="cc-affirm-sub">
            5 active campaigns, ${(totalBudget / 1000).toFixed(0)}K total investment, millions of impressions. 
            Build partnerships that matter. 💜
          </p>
        </div>
        <div className="cc-affirm-actions">
          <Link to="/collab" className="btn btn-primary">
            Back to Collab Hub
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.collab-campaigns {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Shared card shell */
.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.cc-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(216, 180, 254, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(196, 181, 253, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.cc-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .cc-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.cc-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #6b21a8;
  border: 1px solid rgba(243, 232, 255, 0.9);
}

.cc-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.cc-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

/* Hero right card */
.cc-hero-right {
  display: flex;
  justify-content: flex-end;
}

.cc-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
  max-width: 280px;
}

.cc-hero-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.cc-hero-value {
  margin: 4px 0;
  font-weight: 700;
  font-size: 1.4rem;
  color: #111827;
}

.cc-hero-note {
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #4b5563;
}

.cc-budget-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.cc-budget-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 999px;
}

.cc-hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cc-stat-pill {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(229, 231, 235, 0.9);
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.8rem;
}

.cc-stat-label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: #9ca3af;
}

.cc-stat-value {
  font-weight: 500;
  color: #111827;
}

/* FILTERS */
.cc-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cc-filter-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.cc-filter-btn:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.cc-filter-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  color: #ffffff;
  border-color: #8b5cf6;
}

/* CAMPAIGNS GRID */
.cc-campaigns-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cc-campaign-card {
  padding: 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.cc-campaign-card:hover {
  box-shadow: 0 20px 50px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}

.cc-campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.cc-campaign-title-section {
  flex: 1;
  min-width: 0;
}

.cc-campaign-name {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cc-campaign-brand {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.cc-campaign-status {
  flex-shrink: 0;
}

.cc-status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.cc-status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.cc-status-badge.planning {
  background: #fef3c7;
  color: #b45309;
}

.cc-status-badge.completed {
  background: #dbeafe;
  color: #0c4a6e;
}

/* Campaign summary */
.cc-campaign-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.cc-summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cc-summary-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.cc-summary-value {
  font-weight: 700;
  color: #111827;
  font-size: 0.95rem;
}

/* Campaign details */
.cc-campaign-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.cc-details-section {
  margin-bottom: 12px;
}

.cc-section-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

.cc-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 4px;
}

.cc-budget-bar-large {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 6px;
}

.cc-budget-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #d946ef);
  border-radius: 999px;
}

.cc-budget-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #6b7280;
}

.cc-deliverable-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 4px;
}

.cc-deliverable-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 999px;
}

.cc-deliverable-text {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.cc-asset-count {
  margin: 0;
  font-size: 0.9rem;
  color: #374151;
}

.cc-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* QUICK ACTIONS */
.cc-actions {
  padding: 16px;
}

.cc-card-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cc-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.cc-action-box {
  padding: 14px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
}

.cc-action-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.cc-action-sub {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* AFFIRM */
.cc-affirm {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, rgba(243, 232, 255, 0.9), #ffffff);
}

.cc-affirm-text {
  flex: 1 1 260px;
  min-width: 0;
}

.cc-affirm-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.cc-affirm-main {
  margin: 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cc-affirm-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 520px;
}

.cc-affirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .cc-affirm-actions {
    align-items: flex-end;
    justify-content: center;
  }
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #f5f3ff;
  border-color: #e0e7ff;
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  border-color: #8b5cf6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(139, 92, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #c026d3);
  border-color: #7c3aed;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}
`;
