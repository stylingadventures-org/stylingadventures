// site/src/routes/creator/Monetization.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

// Revenue streams data
const REVENUE_STREAMS = [
  {
    id: "episodes",
    icon: "🎬",
    title: "Episode Views",
    description: "Revenue from episode views and watch time",
    current: "$1,820",
    growth: "+24%",
    monthly: "$1,820",
    nextPayout: "Mar 28",
    details: [
      "Views tracked per episode",
      "Watch time bonuses",
      "Bestie exclusive multiplier 1.5x"
    ],
    status: "active",
    category: "primary"
  },
  {
    id: "besties",
    icon: "💖",
    title: "Bestie Subscriptions",
    description: "Monthly revenue from Bestie tier members",
    current: "$1,240",
    growth: "+18%",
    monthly: "$1,240",
    nextPayout: "Mar 28",
    details: [
      "86 active subscribers",
      "92% monthly retention",
      "$15/month per Bestie"
    ],
    status: "active",
    category: "primary"
  },
  {
    id: "affiliates",
    icon: "🔗",
    title: "Affiliate Links",
    description: "Commissions from product recommendations",
    current: "$420",
    growth: "+8%",
    monthly: "$420",
    nextPayout: "Apr 15",
    details: [
      "Fashion & style brands",
      "5-15% commission per sale",
      "Real-time tracking"
    ],
    status: "active",
    category: "secondary"
  },
  {
    id: "brand-deals",
    icon: "🤝",
    title: "Brand Partnerships",
    description: "Revenue from sponsored content & collabs",
    current: "$650",
    growth: "+42%",
    monthly: "$650",
    nextPayout: "Apr 1",
    details: [
      "2 active brand deals",
      "Custom partnership rates",
      "Performance bonuses available"
    ],
    status: "active",
    category: "secondary"
  },
  {
    id: "merchandise",
    icon: "👕",
    title: "Merchandise & Products",
    description: "Direct sales from branded products",
    current: "$185",
    growth: "-5%",
    monthly: "$185",
    nextPayout: "May 15",
    details: [
      "Limited edition drops",
      "Styling guides & e-books",
      "Coming soon: Print-on-demand"
    ],
    status: "developing",
    category: "tertiary"
  },
  {
    id: "gaming",
    icon: "🎮",
    title: "In-Game Rewards",
    description: "Earnings from the styling mini-game",
    current: "$92",
    growth: "+156%",
    monthly: "$92",
    nextPayout: "Mar 28",
    details: [
      "Player challenges won",
      "Leaderboard rewards",
      "Daily login bonuses"
    ],
    status: "active",
    category: "tertiary"
  }
];

export default function CreatorMonetization() {
  const [activeStream, setActiveStream] = useState("episodes");
  const [expandedStream, setExpandedStream] = useState(null);
  const [view, setView] = useState("overview");

  const totalRevenue = REVENUE_STREAMS.reduce(
    (sum, stream) => sum + parseInt(stream.current.replace(/\$|,/g, "")),
    0
  );

  const activeStreams = REVENUE_STREAMS.filter(s => s.status === "active").length;

  const selectedStream = REVENUE_STREAMS.find(s => s.id === activeStream);

  return (
    <div className="creator-monetization">
      <style>{styles}</style>

      {/* HERO SECTION */}
      <section className="cm-hero card">
        <div className="cm-hero-main">
          <div>
            <p className="cm-pill">💰 CREATOR INCOME</p>
            <h1 className="cm-title">Your monetization dashboard</h1>
            <p className="cm-sub">
              Track earnings across all revenue streams, manage affiliates, negotiate brand deals, 
              and optimize your income. Everything you need to grow as a creator.
            </p>
            {/* Total revenue highlight */}
            <div className="cm-highlight">
              <div className="cm-highlight-stat">
                <span className="cm-label">Total Monthly Revenue</span>
                <span className="cm-amount">${(totalRevenue / 1000).toFixed(1)}K</span>
              </div>
              <div className="cm-highlight-stat">
                <span className="cm-label">Active Streams</span>
                <span className="cm-amount">{activeStreams}</span>
              </div>
              <div className="cm-highlight-stat">
                <span className="cm-label">Next Payout</span>
                <span className="cm-amount">Mar 28</span>
              </div>
            </div>
          </div>
          <div className="cm-hero-right">
            <div className="cm-hero-card">
              <p className="cm-hero-label">Your Creator Level</p>
              <p className="cm-hero-value">Premium Creator</p>
              <p className="cm-hero-note">Unlocked all monetization features</p>
              <div className="cm-hero-actions">
                <Link to="/creator/tools" className="btn btn-primary cm-hero-btn">
                  Creator Tools
                </Link>
              </div>
              <div className="cm-hero-stats">
                <div className="cm-stat-pill">
                  <span className="cm-stat-label">Members</span>
                  <span className="cm-stat-value">86</span>
                </div>
                <div className="cm-stat-pill">
                  <span className="cm-stat-label">Retention</span>
                  <span className="cm-stat-value">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIEW TABS */}
      <div className="cm-view-tabs">
        <button 
          className={`cm-view-tab ${view === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
        >
          Revenue Overview
        </button>
        <button 
          className={`cm-view-tab ${view === 'payouts' ? 'active' : ''}`}
          onClick={() => setView('payouts')}
        >
          Payout Schedule
        </button>
        <button 
          className={`cm-view-tab ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
        >
          Monetization Settings
        </button>
      </div>

      {/* OVERVIEW VIEW */}
      {view === 'overview' && (
        <>
          {/* Revenue Streams Grid */}
          <div className="cm-streams-container">
            {REVENUE_STREAMS.map(stream => (
              <div 
                key={stream.id}
                className={`cm-stream-card card ${stream.status} ${expandedStream === stream.id ? 'expanded' : ''}`}
                onClick={() => setExpandedStream(expandedStream === stream.id ? null : stream.id)}
              >
                <div className="cm-stream-header">
                  <div className="cm-stream-icon">{stream.icon}</div>
                  <div className="cm-stream-title-section">
                    <h3 className="cm-stream-title">{stream.title}</h3>
                    <p className="cm-stream-desc">{stream.description}</p>
                  </div>
                  <div className="cm-stream-amount">
                    <span className="cm-amount-value">{stream.current}</span>
                    <span className={`cm-growth ${stream.growth.includes('-') ? 'negative' : 'positive'}`}>
                      {stream.growth}
                    </span>
                  </div>
                </div>

                {expandedStream === stream.id && (
                  <div className="cm-stream-details">
                    <div className="cm-details-grid">
                      <div className="cm-detail-item">
                        <span className="cm-detail-label">Monthly Estimate</span>
                        <span className="cm-detail-value">{stream.monthly}</span>
                      </div>
                      <div className="cm-detail-item">
                        <span className="cm-detail-label">Next Payout</span>
                        <span className="cm-detail-value">{stream.nextPayout}</span>
                      </div>
                      <div className="cm-detail-item">
                        <span className="cm-detail-label">Status</span>
                        <span className="cm-detail-value cm-status-badge">{stream.status}</span>
                      </div>
                    </div>
                    <div className="cm-stream-list">
                      <p className="cm-list-title">Key metrics:</p>
                      <ul>
                        {stream.details.map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Primary vs Secondary Streams */}
          <section className="cm-breakdown card">
            <h2 className="cm-card-title">Revenue Breakdown</h2>
            <div className="cm-breakdown-grid">
              <div className="cm-breakdown-item">
                <p className="cm-breakdown-label">Primary Streams</p>
                <p className="cm-breakdown-value">$3,060</p>
                <p className="cm-breakdown-meta">Episodes + Besties: 71% of revenue</p>
              </div>
              <div className="cm-breakdown-item">
                <p className="cm-breakdown-label">Secondary Streams</p>
                <p className="cm-breakdown-value">$1,070</p>
                <p className="cm-breakdown-meta">Affiliates + Brand deals: 25% of revenue</p>
              </div>
              <div className="cm-breakdown-item">
                <p className="cm-breakdown-label">Experimental</p>
                <p className="cm-breakdown-value">$277</p>
                <p className="cm-breakdown-meta">Merch + Gaming: 4% of revenue</p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="cm-actions-grid">
            <div className="cm-action-card">
              <h3 className="cm-action-title">📊 Growth Opportunities</h3>
              <ul className="cm-action-list">
                <li>Increase Bestie retention to 95% (+$320/month)</li>
                <li>Launch merchandise drop this quarter</li>
                <li>Negotiate 2 more brand partnerships</li>
              </ul>
            </div>
            <div className="cm-action-card">
              <h3 className="cm-action-title">💼 Active Partnerships</h3>
              <ul className="cm-action-list">
                <li>Brand Deal #1: Fashion Nova ($500/mo)</li>
                <li>Brand Deal #2: StyleUp App ($150/mo)</li>
                <li>Open to 2 more collaborations</li>
              </ul>
            </div>
            <div className="cm-action-card">
              <h3 className="cm-action-title">🔗 Affiliate Programs</h3>
              <ul className="cm-action-list">
                <li>Amazon Fashion (tracking active)</li>
                <li>ASOS (8 clicks, 0 conversions)</li>
                <li>Shein (2 orders, $35 commission)</li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* PAYOUTS VIEW */}
      {view === 'payouts' && (
        <section className="cm-payouts card">
          <h2 className="cm-card-title">Payout Schedule</h2>
          <table className="cm-payout-table">
            <thead>
              <tr>
                <th>Payout Date</th>
                <th>Episodes</th>
                <th>Besties</th>
                <th>Affiliates</th>
                <th>Brand Deals</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="scheduled">
                <td>Mar 28, 2026</td>
                <td>$1,820</td>
                <td>$1,240</td>
                <td>$315</td>
                <td>$500</td>
                <td className="total">$3,875</td>
                <td><span className="status-badge scheduled">Scheduled</span></td>
              </tr>
              <tr className="paid">
                <td>Feb 26, 2026</td>
                <td>$1,650</td>
                <td>$1,080</td>
                <td>$280</td>
                <td>$400</td>
                <td className="total">$3,410</td>
                <td><span className="status-badge paid">Paid</span></td>
              </tr>
              <tr className="paid">
                <td>Jan 28, 2026</td>
                <td>$1,540</td>
                <td>$950</td>
                <td>$220</td>
                <td>$300</td>
                <td className="total">$3,010</td>
                <td><span className="status-badge paid">Paid</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* SETTINGS VIEW */}
      {view === 'settings' && (
        <section className="cm-settings card">
          <h2 className="cm-card-title">Monetization Settings</h2>
          
          <div className="cm-settings-section">
            <h3 className="cm-settings-title">Payment Method</h3>
            <div className="cm-setting-row">
              <div className="cm-setting-label">
                <p className="cm-label-main">Bank Account</p>
                <p className="cm-label-sub">Direct deposit to your bank</p>
              </div>
              <button className="btn btn-secondary">Update</button>
            </div>
          </div>

          <div className="cm-settings-section">
            <h3 className="cm-settings-title">Monetization Features</h3>
            <div className="cm-setting-row">
              <label className="cm-setting-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span>Episode monetization (active)</span>
              </label>
            </div>
            <div className="cm-setting-row">
              <label className="cm-setting-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span>Bestie subscriptions (active)</span>
              </label>
            </div>
            <div className="cm-setting-row">
              <label className="cm-setting-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span>Affiliate program (active)</span>
              </label>
            </div>
            <div className="cm-setting-row">
              <label className="cm-setting-toggle">
                <input type="checkbox" defaultChecked disabled />
                <span>Brand partnerships (active)</span>
              </label>
            </div>
            <div className="cm-setting-row">
              <label className="cm-setting-toggle">
                <input type="checkbox" disabled />
                <span>Merchandise sales (coming soon)</span>
              </label>
            </div>
          </div>

          <div className="cm-settings-section">
            <h3 className="cm-settings-title">Revenue Sharing & Taxes</h3>
            <div className="cm-setting-row">
              <div className="cm-setting-label">
                <p className="cm-label-main">Platform Fee: 30%</p>
                <p className="cm-label-sub">Styling Adventures keeps 30% to support platform, you get 70%</p>
              </div>
            </div>
            <div className="cm-setting-row">
              <div className="cm-setting-label">
                <p className="cm-label-main">Tax Forms</p>
                <p className="cm-label-sub">Download 1099 forms for filing</p>
              </div>
              <button className="btn btn-secondary">Download</button>
            </div>
          </div>
        </section>
      )}

      {/* Affirm section */}
      <section className="cm-affirm card">
        <div className="cm-affirm-text">
          <p className="cm-affirm-label">Creator milestone</p>
          <p className="cm-affirm-main">You're earning real money doing what you love.</p>
          <p className="cm-affirm-sub">
            Over $4K earned this month. That's how many creators are building sustainable income 
            on Styling Adventures. Keep growing your community, and your earnings grow with you. 💚
          </p>
        </div>
        <div className="cm-affirm-actions">
          <Link to="/creator/insights" className="btn btn-primary">
            View Analytics
          </Link>
          <Link to="/creator" className="btn btn-ghost">
            Back to Creator Hub
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.creator-monetization {
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
.cm-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(251, 207, 232, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(196, 181, 253, 0.95), rgba(255, 255, 255, 1));
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
    grid-template-columns: minmax(0, 1fr);
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
  color: #9f1239;
  border: 1px solid rgba(254, 226, 226, 0.9);
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

/* Highlight stats */
.cm-highlight {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.cm-highlight-stat {
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(229, 231, 235, 0.6);
}

.cm-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
  margin-bottom: 4px;
}

.cm-amount {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
}

/* Hero right card */
.cm-hero-right {
  display: flex;
  justify-content: flex-end;
}

.cm-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
  max-width: 280px;
}

.cm-hero-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.cm-hero-value {
  margin: 4px 0;
  font-weight: 700;
  font-size: 1.05rem;
  color: #111827;
}

.cm-hero-note {
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: #4b5563;
}

.cm-hero-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-hero-btn {
  width: 100%;
}

.cm-hero-stats {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cm-stat-pill {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(229, 231, 235, 0.9);
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.8rem;
}

.cm-stat-label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: #9ca3af;
}

.cm-stat-value {
  font-weight: 500;
  color: #111827;
}

/* VIEW TABS */
.cm-view-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cm-view-tab {
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

.cm-view-tab:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.cm-view-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #ffffff;
  border-color: #8b5cf6;
}

/* REVENUE STREAMS */
.cm-streams-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.cm-stream-card {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.cm-stream-card:hover {
  box-shadow: 0 20px 50px rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
}

.cm-stream-card.developing {
  opacity: 0.7;
}

.cm-stream-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.cm-stream-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.cm-stream-title-section {
  flex: 1;
  min-width: 0;
}

.cm-stream-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.cm-stream-desc {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.cm-stream-amount {
  flex-shrink: 0;
  text-align: right;
}

.cm-amount-value {
  display: block;
  font-weight: 700;
  font-size: 1.1rem;
  color: #111827;
}

.cm-growth {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 4px;
}

.cm-growth.positive {
  color: #059669;
}

.cm-growth.negative {
  color: #dc2626;
}

.cm-stream-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.cm-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.cm-detail-item {
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.cm-detail-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.cm-detail-value {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.cm-status-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.cm-stream-list {
  font-size: 0.9rem;
  color: #374151;
}

.cm-list-title {
  margin: 0 0 6px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6b7280;
}

.cm-stream-list ul {
  margin: 0;
  padding-left: 18px;
}

.cm-stream-list li + li {
  margin-top: 4px;
}

/* BREAKDOWN */
.cm-breakdown {
  padding: 16px;
}

.cm-card-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cm-breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.cm-breakdown-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.cm-breakdown-label {
  margin: 0 0 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.cm-breakdown-value {
  margin: 0 0 4px;
  font-size: 1.3rem;
  font-weight: 700;
  color: #8b5cf6;
}

.cm-breakdown-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* ACTIONS GRID */
.cm-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.cm-action-card {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.cm-action-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.cm-action-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
  color: #374151;
}

.cm-action-list li + li {
  margin-top: 4px;
}

/* PAYOUTS TABLE */
.cm-payouts {
  padding: 16px;
  overflow: auto;
}

.cm-payout-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.cm-payout-table th {
  text-align: left;
  padding: 10px;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cm-payout-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.cm-payout-table tr.paid {
  background: rgba(16, 185, 129, 0.05);
}

.cm-payout-table .total {
  font-weight: 700;
  color: #8b5cf6;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

/* SETTINGS */
.cm-settings {
  padding: 16px;
}

.cm-settings-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.cm-settings-section:last-child {
  border-bottom: none;
}

.cm-settings-title {
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cm-setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.cm-setting-label {
  flex: 1;
}

.cm-label-main {
  margin: 0 0 2px;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.cm-label-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.cm-setting-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #111827;
  cursor: pointer;
}

.cm-setting-toggle input {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

/* AFFIRM */
.cm-affirm {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, rgba(254, 242, 242, 0.9), #ffffff);
}

.cm-affirm-text {
  flex: 1 1 260px;
  min-width: 0;
}

.cm-affirm-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.cm-affirm-main {
  margin: 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.cm-affirm-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 520px;
}

.cm-affirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .cm-affirm-actions {
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
  padding: 9px 16px;
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
  box-shadow: 0 6px 16px rgba(129, 140, 248, 0.35);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-color: #8b5cf6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(139, 92, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #db2777);
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

.btn-ghost {
  background: #ffffff;
  color: #374151;
}
`;
