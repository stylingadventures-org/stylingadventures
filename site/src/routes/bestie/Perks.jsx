// site/src/routes/bestie/Perks.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

// Bestie Perks Catalog
const BESTIE_PERKS = [
  {
    id: "early-access",
    icon: "⚡",
    title: "Early Access Drops",
    description: "Get exclusive closet looks 48 hours before fans",
    details: [
      "See new Lala looks 2 days early",
      "First dibs on limited styles",
      "Exclusive creator collabs preview"
    ],
    unlocked: true,
    category: "watch"
  },
  {
    id: "exclusive-closet",
    icon: "👗",
    title: "Exclusive Closet Access",
    description: "Browse Lala's private styling selections",
    details: [
      "Behind-the-scenes looks",
      "Personal style notes from Lala",
      "Styling breakdown videos",
      "Outfit combinations guide"
    ],
    unlocked: true,
    category: "closet"
  },
  {
    id: "voting-power",
    icon: "🗳️",
    title: "Voting Power",
    description: "Influence what Lala wears next episode",
    details: [
      "Vote on outfit choices",
      "Suggest theme/style directions",
      "Early voting access (48 hrs)",
      "Your votes weighted higher"
    ],
    unlocked: true,
    category: "community"
  },
  {
    id: "vip-moments",
    icon: "🎬",
    title: "VIP Moments",
    description: "Get special Bestie-only content drops",
    details: [
      "Weekly Bestie-only style sessions",
      "Lala's personal style tips",
      "Behind-the-scenes filming clips",
      "Exclusive challenge videos"
    ],
    unlocked: true,
    category: "watch"
  },
  {
    id: "collab-first",
    icon: "🤝",
    title: "Collab First Dibs",
    description: "See brand partnerships before anyone else",
    details: [
      "First access to creator collabs",
      "Exclusive guest-stylist reveals",
      "Partner brand previews",
      "Special Bestie discount codes"
    ],
    unlocked: false,
    category: "closet"
  },
  {
    id: "shoutout",
    icon: "📢",
    title: "Bestie Shout-Outs",
    description: "Get recognized in episodes for standout style",
    details: [
      "Occasional episode mentions",
      "Featured on Bestie spotlight",
      "Community recognition badges",
      "Your style inspiration shared"
    ],
    unlocked: false,
    category: "community"
  },
  {
    id: "priority-support",
    icon: "💬",
    title: "Priority Support",
    description: "Get faster help with questions & feedback",
    details: [
      "Direct access to support channel",
      "Faster response times",
      "One-on-one styling consultations",
      "Feature request prioritization"
    ],
    unlocked: false,
    category: "community"
  },
  {
    id: "custom-outfit",
    icon: "✨",
    title: "Custom Outfit Request",
    description: "Request a special styled look from Lala",
    details: [
      "One custom outfit per month",
      "Personalized styling notes",
      "Featured in Bestie content",
      "Direct collaboration with Lala"
    ],
    unlocked: false,
    category: "closet"
  }
];

export default function BestiePerks() {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedPerk, setExpandedPerk] = useState(null);

  const filteredPerks = activeTab === "all" 
    ? BESTIE_PERKS 
    : BESTIE_PERKS.filter(p => p.category === activeTab);

  const unlockedCount = BESTIE_PERKS.filter(p => p.unlocked).length;
  const totalCount = BESTIE_PERKS.length;
  return (
    <div className="bestie-perks">
      <style>{styles}</style>

      {/* HERO SECTION with progress tracker */}
      <section className="bp-hero card">
        <div className="bp-hero-main">
          <div>
            <p className="bp-pill">✨ BESTIE CLUB</p>
            <h1 className="bp-title">Your perks, unlocked 💕</h1>
            <p className="bp-sub">
              You're in the inner circle. That means exclusive content, early access, 
              voting power, and moments that matter. Here's your complete Bestie benefits guide.
            </p>
            {/* Progress tracker */}
            <div className="bp-progress-container">
              <div className="bp-progress-bar">
                <div 
                  className="bp-progress-fill" 
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                />
              </div>
              <p className="bp-progress-text">
                <strong>{unlockedCount} of {totalCount}</strong> perks unlocked
              </p>
            </div>
          </div>
          <div className="bp-hero-right">
            <div className="bp-hero-card">
              <p className="bp-hero-label">Your Status</p>
              <p className="bp-hero-value">Trusted Bestie</p>
              <p className="bp-hero-note">You've earned full exclusivity</p>
              <div className="bp-hero-actions">
                <Link to="/bestie/closet" className="btn btn-primary bp-hero-btn">
                  Explore Exclusive Looks
                </Link>
              </div>
              <div className="bp-hero-stats">
                <div className="bp-stat-pill">
                  <span className="bp-stat-label">Unlocked</span>
                  <span className="bp-stat-value">{unlockedCount}</span>
                </div>
                <div className="bp-stat-pill">
                  <span className="bp-stat-label">Total</span>
                  <span className="bp-stat-value">{totalCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TAB FILTERS */}
      <div className="bp-tabs">
        <button 
          className={`bp-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Perks
        </button>
        <button 
          className={`bp-tab ${activeTab === 'watch' ? 'active' : ''}`}
          onClick={() => setActiveTab('watch')}
        >
          Watch
        </button>
        <button 
          className={`bp-tab ${activeTab === 'closet' ? 'active' : ''}`}
          onClick={() => setActiveTab('closet')}
        >
          Closet
        </button>
        <button 
          className={`bp-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
      </div>

      {/* PERKS DISPLAY */}
      <div className="bp-perks-container">
        {filteredPerks.map(perk => (
          <div 
            key={perk.id} 
            className={`bp-perk-card card ${perk.unlocked ? 'unlocked' : 'locked'}`}
            onClick={() => setExpandedPerk(expandedPerk === perk.id ? null : perk.id)}
          >
            <div className="bp-perk-header">
              <div className="bp-perk-icon">{perk.icon}</div>
              <div className="bp-perk-title-section">
                <h3 className="bp-perk-title">{perk.title}</h3>
                <p className="bp-perk-desc">{perk.description}</p>
              </div>
              <div className="bp-perk-status">
                {perk.unlocked ? (
                  <span className="bp-status-badge unlocked">✓ Unlocked</span>
                ) : (
                  <span className="bp-status-badge locked">🔒 Locked</span>
                )}
              </div>
            </div>

            {expandedPerk === perk.id && (
              <div className="bp-perk-details">
                <ul className="bp-details-list">
                  {perk.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PERKS SUMMARY SECTIONS */}
      <section className="bp-grid">
        <article className="bp-card">
          <h2 className="bp-card-title">👀 Watch Perks</h2>
          <p className="bp-card-sub">
            Get closer to the story and see moments before anyone else.
          </p>
          <ul className="bp-list">
            <li>⚡ Early-access episodes 48 hours before they drop for free fans.</li>
            <li>🎬 Behind-the-scenes styling notes and Lala's thinking.</li>
            <li>💌 Surprise Bestie-only content drops and exclusive challenges.</li>
            <li>🎯 Direct voice in what Lala wears through voting.</li>
          </ul>
          <Link to="/fan/episodes" className="bp-link">
            Watch Early Episodes →
          </Link>
        </article>

        <article className="bp-card">
          <h2 className="bp-card-title">👗 Closet Perks</h2>
          <p className="bp-card-sub">
            Explore exclusive looks and styling inspiration.
          </p>
          <ul className="bp-list">
            <li>✨ Private access to Lala's personal wardrobe & breakdowns.</li>
            <li>💎 Exclusive creator collaborations and brand partnerships.</li>
            <li>🎨 Styling guides and outfit combination suggestions.</li>
            <li>📸 Upload your own Bestie looks and get community featured.</li>
          </ul>
          <Link to="/bestie/closet" className="bp-link">
            Open Bestie Closet →
          </Link>
        </article>

        <article className="bp-card">
          <h2 className="bp-card-title">💬 Community Perks</h2>
          <p className="bp-card-sub">
            Connect, vote, and shape the culture.
          </p>
          <ul className="bp-list">
            <li>🗳️ Voting power — influence episode themes and outfit choices.</li>
            <li>💭 Access to exclusive Bestie-only spaces and conversations.</li>
            <li>🌟 Get recognized for standout style with community badges.</li>
            <li>🤝 Priority support and direct line to our community team.</li>
          </ul>
          <Link to="/fan/community" className="bp-link">
            Join Community →
          </Link>
        </article>
      </section>

      {/* Feel-good affirmation block */}
      <section className="bp-affirm card">
        <div className="bp-affirm-text">
          <p className="bp-affirm-label">Little reminder</p>
          <p className="bp-affirm-main">
            You're allowed to take up space, on screen and in real life.
          </p>
          <p className="bp-affirm-sub">
            Styling Adventures is your cozy corner of the internet. Whether you
            binge episodes, quietly heart closet looks, or go full stylist in
            Bestie uploads — it all counts, and it all matters. We're so
            glad you're here. 💗
          </p>
        </div>
        <div className="bp-affirm-actions">
          <Link to="/bestie/closet" className="btn btn-primary">
            Start Styling Now
          </Link>
          <Link to="/bestie" className="btn btn-ghost">
            Back to Bestie Home
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.bestie-perks {
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* shared card shell */
.card {
  background:#ffffff;
  border-radius:22px;
  border:1px solid #e5e7eb;
  box-shadow:0 16px 40px rgba(148,163,184,0.35);
}

/* HERO */
.bp-hero {
  padding:18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(251,207,232,0.95), rgba(255,255,255,0.95)),
    radial-gradient(circle at bottom right, rgba(196,181,253,0.95), rgba(255,255,255,1));
  border:1px solid rgba(248,250,252,0.9);
}

.bp-hero-main {
  display:grid;
  grid-template-columns:minmax(0,2.4fr) minmax(0,2fr);
  gap:18px;
  align-items:flex-start;
}
@media (max-width: 900px) {
  .bp-hero-main {
    grid-template-columns:minmax(0,1fr);
  }
}

.bp-pill {
  display:inline-flex;
  align-items:center;
  padding:4px 12px;
  border-radius:999px;
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  background:rgba(255,255,255,0.9);
  color:#9f1239;
  border:1px solid rgba(254,226,226,0.9);
}

.bp-title {
  margin:8px 0 4px;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  color:#111827;
}

.bp-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

/* Progress tracker */
.bp-progress-container {
  margin-top: 16px;
}

.bp-progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.bp-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #f472b6);
  border-radius: 999px;
  transition: width 300ms ease;
}

.bp-progress-text {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

/* hero right card */
.bp-hero-right {
  display: flex;
  justify-content: flex-end;
}

.bp-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
  max-width: 280px;
}

.bp-hero-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.bp-hero-value {
  margin: 4px 0;
  font-weight: 700;
  font-size: 1.05rem;
  color: #111827;
}

.bp-hero-note {
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: #4b5563;
}

.bp-hero-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bp-hero-btn {
  width: 100%;
}

.bp-hero-stats {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bp-stat-pill {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(229, 231, 235, 0.9);
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.8rem;
}

.bp-stat-label {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  color: #9ca3af;
}

.bp-stat-value {
  font-weight: 500;
  color: #111827;
}

/* TABS */
.bp-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bp-tab {
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

.bp-tab:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.bp-tab.active {
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: #ffffff;
  border-color: #ec4899;
}

/* PERKS DISPLAY */
.bp-perks-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.bp-perk-card {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.bp-perk-card:hover {
  box-shadow: 0 20px 50px rgba(236, 72, 153, 0.25);
  transform: translateY(-2px);
}

.bp-perk-card.locked {
  opacity: 0.75;
}

.bp-perk-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bp-perk-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.bp-perk-title-section {
  flex: 1;
  min-width: 0;
}

.bp-perk-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.bp-perk-desc {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.bp-perk-status {
  flex-shrink: 0;
}

.bp-status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.bp-status-badge.unlocked {
  background: #d1fae5;
  color: #065f46;
}

.bp-status-badge.locked {
  background: #fee2e2;
  color: #991b1b;
}

.bp-perk-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.bp-details-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
  color: #374151;
}

.bp-details-list li + li {
  margin-top: 6px;
}

/* GRID SECTIONS */
.bp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.bp-card {
  padding: 14px 16px 16px;
}

.bp-card-title {
  margin: 0 0 4px;
  font-size: 1.05rem;
}

.bp-card-sub {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #6b7280;
}

.bp-list {
  margin: 0 0 10px 0;
  padding-left: 18px;
  font-size: 0.9rem;
  color: #374151;
}

.bp-list li + li {
  margin-top: 4px;
}

.bp-link {
  font-size: 0.85rem;
  text-decoration: none;
  color: #4f46e5;
  font-weight: 500;
}

.bp-link:hover {
  text-decoration: underline;
}

/* AFFIRMATION BLOCK */
.bp-affirm {
  padding: 14px 16px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, rgba(254, 242, 242, 0.9), #ffffff);
}

.bp-affirm-text {
  flex: 1 1 260px;
  min-width: 0;
}

.bp-affirm-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.bp-affirm-main {
  margin: 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.bp-affirm-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 520px;
}

.bp-affirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .bp-affirm-actions {
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
  background: linear-gradient(135deg, #6366f1, #ec4899);
  border-color: #6366f1;
  color: #fff;
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4f46e5, #db2777);
  border-color: #4f46e5;
}

.btn-ghost {
  background: #ffffff;
  color: #374151;
}
`;
