// site/src/routes/admin/Economy.jsx
import { useState } from "react";

const INITIAL_STATE = {
  coinSupply: 50000,
  maxCoinSupply: 100000,
  watchReward: 10,
  voteReward: 5,
  shopReward: 2,
  communityReward: 15,
  bestiePriceMonthly: 9.99,
  coinExchangeRate: 100, // coins per $1
  dailyLimitPerUser: 500,
};

export default function AdminEconomy() {
  const [state, setState] = useState(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState("supply");
  const [saved, setSaved] = useState(false);

  const handleUpdate = (field, value) => {
    setState(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const coinPercentage = Math.round((state.coinSupply / state.maxCoinSupply) * 100);
  const circulating = state.coinSupply;
  const available = state.maxCoinSupply - state.coinSupply;

  return (
    <div className="admin-economy">
      <style>{styles}</style>

      {/* HERO */}
      <section className="ae-hero card">
        <div className="ae-hero-main">
          <div>
            <p className="ae-pill">💰 ECONOMY CONTROL</p>
            <h1 className="ae-title">Coin Supply & Reward Tuning</h1>
            <p className="ae-sub">
              Monitor total coin supply, adjust reward amounts, and manage economy health. 
              Changes affect all users immediately.
            </p>
          </div>
          <div className="ae-hero-stats">
            <div className="ae-stat">
              <p className="ae-stat-label">Circulating</p>
              <p className="ae-stat-value">{circulating.toLocaleString()}</p>
            </div>
            <div className="ae-stat">
              <p className="ae-stat-label">Available</p>
              <p className="ae-stat-value">{available.toLocaleString()}</p>
            </div>
            <div className="ae-stat">
              <p className="ae-stat-label">Fill Rate</p>
              <p className="ae-stat-value">{coinPercentage}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="ae-tabs card">
        <button
          className={`ae-tab ${activeTab === "supply" ? "active" : ""}`}
          onClick={() => setActiveTab("supply")}
        >
          Coin Supply
        </button>
        <button
          className={`ae-tab ${activeTab === "rewards" ? "active" : ""}`}
          onClick={() => setActiveTab("rewards")}
        >
          Reward Amounts
        </button>
        <button
          className={`ae-tab ${activeTab === "pricing" ? "active" : ""}`}
          onClick={() => setActiveTab("pricing")}
        >
          Pricing & Limits
        </button>
        <button
          className={`ae-tab ${activeTab === "health" ? "active" : ""}`}
          onClick={() => setActiveTab("health")}
        >
          Economy Health
        </button>
      </div>

      {/* SUPPLY TAB */}
      {activeTab === "supply" && (
        <div className="ae-content card">
          <h3 className="ae-section-title">Coin Supply Management</h3>
          
          <div className="ae-control-group">
            <label className="ae-label">
              Total Circulating Coins: <span className="ae-value">{state.coinSupply.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="0"
              max={state.maxCoinSupply}
              value={state.coinSupply}
              onChange={(e) => handleUpdate("coinSupply", parseInt(e.target.value))}
              className="ae-slider"
            />
            <p className="ae-slider-labels">
              <span>0</span>
              <span>{state.maxCoinSupply.toLocaleString()}</span>
            </p>
          </div>

          <div className="ae-control-group">
            <label className="ae-label">Max Coin Supply Cap</label>
            <input
              type="number"
              value={state.maxCoinSupply}
              onChange={(e) => handleUpdate("maxCoinSupply", parseInt(e.target.value))}
              className="ae-input"
            />
            <p className="ae-note">Hard cap on total coins available in system</p>
          </div>

          <div className="ae-supply-visual">
            <div className="ae-supply-bar">
              <div
                className="ae-supply-filled"
                style={{ width: `${coinPercentage}%` }}
              />
            </div>
            <p className="ae-supply-text">
              {coinPercentage}% of max supply circulating
            </p>
          </div>

          <div className="ae-warning">
            <p className="ae-warning-icon">⚠️</p>
            <p className="ae-warning-text">
              When supply exceeds 85%, consider limiting new rewards to prevent inflation.
            </p>
          </div>
        </div>
      )}

      {/* REWARDS TAB */}
      {activeTab === "rewards" && (
        <div className="ae-content card">
          <h3 className="ae-section-title">Reward Amounts per Action</h3>
          
          <div className="ae-rewards-grid">
            <div className="ae-reward-card">
              <p className="ae-reward-action">👀 Watch Episode</p>
              <div className="ae-reward-input-group">
                <input
                  type="number"
                  value={state.watchReward}
                  onChange={(e) => handleUpdate("watchReward", parseInt(e.target.value))}
                  className="ae-input"
                  min="1"
                  max="100"
                />
                <span className="ae-reward-unit">coins</span>
              </div>
              <p className="ae-reward-note">Earned for watching full episode</p>
            </div>

            <div className="ae-reward-card">
              <p className="ae-reward-action">🗳️ Vote on Poll</p>
              <div className="ae-reward-input-group">
                <input
                  type="number"
                  value={state.voteReward}
                  onChange={(e) => handleUpdate("voteReward", parseInt(e.target.value))}
                  className="ae-input"
                  min="1"
                  max="100"
                />
                <span className="ae-reward-unit">coins</span>
              </div>
              <p className="ae-reward-note">Earned for voting in styling poll</p>
            </div>

            <div className="ae-reward-card">
              <p className="ae-reward-action">🛍️ Shop Purchase</p>
              <div className="ae-reward-input-group">
                <input
                  type="number"
                  value={state.shopReward}
                  onChange={(e) => handleUpdate("shopReward", parseInt(e.target.value))}
                  className="ae-input"
                  min="1"
                  max="100"
                />
                <span className="ae-reward-unit">% earned</span>
              </div>
              <p className="ae-reward-note">% of purchase amount as coins</p>
            </div>

            <div className="ae-reward-card">
              <p className="ae-reward-action">💬 Share in Community</p>
              <div className="ae-reward-input-group">
                <input
                  type="number"
                  value={state.communityReward}
                  onChange={(e) => handleUpdate("communityReward", parseInt(e.target.value))}
                  className="ae-input"
                  min="1"
                  max="100"
                />
                <span className="ae-reward-unit">coins</span>
              </div>
              <p className="ae-reward-note">Earned for community post (daily cap)</p>
            </div>
          </div>

          <div className="ae-total-reward">
            <p className="ae-total-label">Avg Daily Earn per Active User:</p>
            <p className="ae-total-amount">
              ~{Math.round(state.watchReward + state.voteReward + state.communityReward * 0.5)} coins/day
            </p>
          </div>
        </div>
      )}

      {/* PRICING TAB */}
      {activeTab === "pricing" && (
        <div className="ae-content card">
          <h3 className="ae-section-title">Pricing & User Limits</h3>
          
          <div className="ae-control-group">
            <label className="ae-label">Bestie Monthly Price</label>
            <div className="ae-input-with-currency">
              <span className="ae-currency">$</span>
              <input
                type="number"
                value={state.bestiePriceMonthly}
                onChange={(e) => handleUpdate("bestiePriceMonthly", parseFloat(e.target.value))}
                className="ae-input"
                step="0.01"
                min="1"
              />
              <span className="ae-period">/month</span>
            </div>
          </div>

          <div className="ae-control-group">
            <label className="ae-label">Coin to Dollar Exchange Rate</label>
            <div className="ae-input-with-unit">
              <input
                type="number"
                value={state.coinExchangeRate}
                onChange={(e) => handleUpdate("coinExchangeRate", parseInt(e.target.value))}
                className="ae-input"
                min="10"
              />
              <span className="ae-unit">coins = $1</span>
            </div>
            <p className="ae-note">Users get {state.coinExchangeRate} coins per dollar spent</p>
          </div>

          <div className="ae-control-group">
            <label className="ae-label">Daily Coin Earn Limit</label>
            <div className="ae-input-with-unit">
              <input
                type="number"
                value={state.dailyLimitPerUser}
                onChange={(e) => handleUpdate("dailyLimitPerUser", parseInt(e.target.value))}
                className="ae-input"
                min="100"
              />
              <span className="ae-unit">coins/day per user</span>
            </div>
            <p className="ae-note">Prevents farming and inflation via repeated actions</p>
          </div>

          <div className="ae-calculation">
            <p className="ae-calc-title">Earning Scenario:</p>
            <p className="ae-calc-item">
              Watch 1 episode = {state.watchReward} coins (${(state.watchReward / state.coinExchangeRate).toFixed(2)})
            </p>
            <p className="ae-calc-item">
              Vote 3 times = {state.voteReward * 3} coins (${((state.voteReward * 3) / state.coinExchangeRate).toFixed(2)})
            </p>
            <p className="ae-calc-item">
              Shop $50 = {Math.round(50 * state.shopReward)} coins (${(50 * state.shopReward).toFixed(2)})
            </p>
            <p className="ae-calc-total">
              Total possible: ~{state.watchReward + state.voteReward * 3 + Math.round(50 * state.shopReward)} coins/day
            </p>
          </div>
        </div>
      )}

      {/* HEALTH TAB */}
      {activeTab === "health" && (
        <div className="ae-content card">
          <h3 className="ae-section-title">Economy Health Dashboard</h3>
          
          <div className="ae-health-grid">
            <div className="ae-health-card">
              <p className="ae-health-label">Supply Ratio</p>
              <p className="ae-health-value">{coinPercentage}%</p>
              <div className="ae-health-indicator">
                <div
                  className={`ae-health-bar ${coinPercentage > 85 ? "warning" : "good"}`}
                  style={{ width: `${coinPercentage}%` }}
                />
              </div>
              <p className="ae-health-desc">
                {coinPercentage > 85 ? "⚠️ High - consider limits" : "✓ Healthy"}
              </p>
            </div>

            <div className="ae-health-card">
              <p className="ae-health-label">Monthly Revenue</p>
              <p className="ae-health-value">~$45K</p>
              <p className="ae-health-sub">(~4,500 active Besties)</p>
              <p className="ae-health-desc">Est. based on $9.99/month</p>
            </div>

            <div className="ae-health-card">
              <p className="ae-health-label">Avg User Daily Earn</p>
              <p className="ae-health-value">~{Math.round(state.watchReward + state.voteReward + state.communityReward * 0.5)}</p>
              <p className="ae-health-sub">coins</p>
              <p className="ae-health-desc">Sustainable level</p>
            </div>

            <div className="ae-health-card">
              <p className="ae-health-label">Creator Revenue Share</p>
              <p className="ae-health-value">70%</p>
              <p className="ae-health-sub">of Bestie revenue</p>
              <p className="ae-health-desc">~$31.5K/month to Lala</p>
            </div>
          </div>

          <div className="ae-recommendations">
            <h4 className="ae-recommendations-title">🎯 Recommendations</h4>
            <ul className="ae-rec-list">
              <li>Current reward amounts are sustainable with 85% supply cap</li>
              <li>If supply exceeds 80%, reduce daily community reward from {state.communityReward} to {Math.max(5, state.communityReward - 5)}</li>
              <li>Besties price ($9.99) is competitive—no change needed</li>
              <li>Exchange rate of {state.coinExchangeRate} coins/$1 is fair to users</li>
              <li>Daily limit of {state.dailyLimitPerUser} coins prevents farming</li>
            </ul>
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      <div className="ae-footer">
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? "✓ Settings Saved" : "Save Changes"}
        </button>
        {saved && <p className="ae-saved-msg">All changes applied immediately</p>}
      </div>

      {/* AFFIRM */}
      <section className="ae-affirm card">
        <p className="ae-affirm-main">Balance growth with fairness.</p>
        <p className="ae-affirm-sub">
          A healthy economy rewards users, funds creators, and sustains the platform. 
          Monitor closely. Adjust thoughtfully. 💜
        </p>
      </section>
    </div>
  );
}

const styles = `
.admin-economy {
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
.ae-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 243, 219, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 224, 71, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.ae-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .ae-hero-main {
    grid-template-columns: 1fr;
  }
}

.ae-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #d97706;
  border: 1px solid rgba(254, 243, 219, 0.9);
}

.ae-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.ae-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.ae-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ae-stat {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  padding: 10px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  text-align: center;
}

.ae-stat-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.ae-stat-value {
  margin: 4px 0 0;
  font-weight: 700;
  font-size: 1.3rem;
  color: #d97706;
}

/* TABS */
.ae-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.ae-tab {
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

.ae-tab:hover {
  color: #111827;
}

.ae-tab.active {
  color: #d97706;
  border-bottom-color: #d97706;
}

/* CONTENT */
.ae-content {
  padding: 18px;
}

.ae-section-title {
  margin: 0 0 14px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.ae-control-group {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.ae-control-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.ae-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #111827;
  font-size: 0.95rem;
}

.ae-value {
  font-weight: 700;
  color: #d97706;
  margin-left: 4px;
}

.ae-slider {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.ae-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #d97706;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
}

.ae-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #d97706;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
}

.ae-slider-labels {
  display: flex;
  justify-content: space-between;
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.ae-input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}

.ae-input:focus {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.ae-input-with-currency,
.ae-input-with-unit {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ae-currency,
.ae-unit,
.ae-period {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.ae-note {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.ae-supply-visual {
  margin-top: 14px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 12px;
}

.ae-supply-bar {
  width: 100%;
  height: 16px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.ae-supply-filled {
  height: 100%;
  background: linear-gradient(90deg, #d97706, #f59e0b);
  transition: width 200ms ease;
}

.ae-supply-text {
  margin: 8px 0 0;
  font-size: 0.85rem;
  text-align: center;
  color: #4b5563;
  font-weight: 500;
}

.ae-warning {
  margin-top: 14px;
  padding: 10px;
  background: rgba(217, 119, 6, 0.05);
  border: 1px solid rgba(217, 119, 6, 0.2);
  border-radius: 8px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.ae-warning-icon {
  margin: 0;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.ae-warning-text {
  margin: 0;
  font-size: 0.9rem;
  color: #b45309;
}

/* REWARDS */
.ae-rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 0 0 14px;
}

.ae-reward-card {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
}

.ae-reward-action {
  margin: 0 0 8px;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.ae-reward-input-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 0 8px;
}

.ae-reward-input-group input {
  width: 60px;
  padding: 6px 8px;
  text-align: center;
}

.ae-reward-unit {
  font-size: 0.85rem;
  color: #6b7280;
}

.ae-reward-note {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.ae-total-reward {
  padding: 12px;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.05), rgba(217, 119, 6, 0.02));
  border: 1px solid rgba(217, 119, 6, 0.2);
  border-radius: 12px;
  text-align: center;
}

.ae-total-label {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: #6b7280;
}

.ae-total-amount {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #d97706;
}

/* CALCULATION */
.ae-calculation {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  margin-top: 14px;
}

.ae-calc-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.ae-calc-item {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.ae-calc-total {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-weight: 600;
  color: #111827;
}

/* HEALTH */
.ae-health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 0 0 14px;
}

.ae-health-card {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.ae-health-label {
  margin: 0 0 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.ae-health-value {
  margin: 0 0 2px;
  font-weight: 700;
  font-size: 1.4rem;
  color: #d97706;
}

.ae-health-sub {
  margin: 0 0 6px;
  font-size: 0.8rem;
  color: #6b7280;
}

.ae-health-indicator {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin: 8px 0;
}

.ae-health-bar {
  height: 100%;
  background: #22c55e;
  transition: width 200ms ease;
}

.ae-health-bar.warning {
  background: #f59e0b;
}

.ae-health-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.ae-recommendations {
  padding: 12px;
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
}

.ae-recommendations-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: #16a34a;
  font-size: 0.95rem;
}

.ae-rec-list {
  margin: 0;
  padding: 0 0 0 20px;
}

.ae-rec-list li {
  font-size: 0.9rem;
  color: #4b5563;
  margin-bottom: 6px;
  line-height: 1.4;
}

/* FOOTER */
.ae-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
}

.ae-saved-msg {
  margin: 0;
  font-size: 0.9rem;
  color: #16a34a;
  font-weight: 500;
}

/* AFFIRM */
.ae-affirm {
  padding: 18px;
  text-align: center;
}

.ae-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.ae-affirm-sub {
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
  padding: 9px 14px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  border-color: #d97706;
  color: #fff;
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #b45309, #d97706);
}
`;
