// site/src/routes/prime/CreatorHub.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const CREATOR_RESOURCES = [
  { id: 1, title: "Production Schedule", desc: "Upcoming filming dates & locations", icon: "📅" },
  { id: 2, title: "Creator Handbook", desc: "Guidelines, best practices, FAQs", icon: "📖" },
  { id: 3, title: "Marketing Toolkit", desc: "Graphics, hashtags, promotion tips", icon: "🎨" },
  { id: 4, title: "Analytics Dashboard", desc: "Track your performance metrics", icon: "📊" },
  { id: 5, title: "Messaging System", desc: "Direct communication with team", icon: "💬" },
  { id: 6, title: "Resource Library", desc: "Templates, music, stock footage", icon: "🎬" }
];

const FEATURED_CREATORS = [
  { id: 1, name: "Alex Chen", role: "Style Expert", followers: "245K", contribution: "Styling Tips" },
  { id: 2, name: "Jordan Lee", role: "Fashion Critic", followers: "189K", contribution: "Trend Analysis" },
  { id: 3, name: "Sam Rivera", role: "Content Creator", followers: "312K", contribution: "Behind-Scenes" }
];

export default function CreatorHub() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="creator-hub">
      <style>{styles}</style>

      {/* HERO */}
      <section className="ch-hero card">
        <div className="ch-hero-main">
          <div>
            <p className="ch-pill">👑 CREATORS</p>
            <h1 className="ch-title">Creator Hub</h1>
            <p className="ch-sub">
              Your central command for production, resources, communications, 
              and collaboration with the Styling Adventures team.
            </p>
          </div>
          <div className="ch-hero-card">
            <p className="ch-stat-label">Creator Community</p>
            <p className="ch-stat-value">50+</p>
            <p className="ch-stat-sub">Active collaborators</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="ch-tabs">
        <button
          className={`ch-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`ch-tab ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          Resources
        </button>
        <button
          className={`ch-tab ${activeTab === "creators" ? "active" : ""}`}
          onClick={() => setActiveTab("creators")}
        >
          Creators
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="ch-content">
          <div className="ch-quick-actions">
            <div className="ch-action">
              <p className="ch-action-icon">🎬</p>
              <h3 className="ch-action-title">Next Filming Date</h3>
              <p className="ch-action-value">March 15, 2025</p>
              <p className="ch-action-sub">Los Angeles Studio</p>
            </div>
            <div className="ch-action">
              <p className="ch-action-icon">📧</p>
              <h3 className="ch-action-title">Pending Messages</h3>
              <p className="ch-action-value">3</p>
              <p className="ch-action-sub">From production team</p>
            </div>
            <div className="ch-action">
              <p className="ch-action-icon">💰</p>
              <h3 className="ch-action-title">Monthly Earnings</h3>
              <p className="ch-action-value">$3,450</p>
              <p className="ch-action-sub">From collaborations</p>
            </div>
            <div className="ch-action">
              <p className="ch-action-icon">⭐</p>
              <h3 className="ch-action-title">Performance Score</h3>
              <p className="ch-action-value">8.7/10</p>
              <p className="ch-action-sub">Excellent standing</p>
            </div>
          </div>

          <section className="ch-section card">
            <h2 className="ch-section-title">Important Announcements</h2>
            <div className="ch-announcement">
              <p className="ch-announcement-date">March 8, 2025</p>
              <h3 className="ch-announcement-title">Season 2 Production Kick-Off</h3>
              <p className="ch-announcement-text">
                We're excited to announce that Season 2 production is officially launching! 
                All creators will receive detailed production schedules and expectations by March 10th.
              </p>
            </div>
            <div className="ch-announcement">
              <p className="ch-announcement-date">Feb 28, 2025</p>
              <h3 className="ch-announcement-title">Updated Brand Guidelines</h3>
              <p className="ch-announcement-text">
                New brand guidelines are now available in the Resource Library. 
                Please review before your next content submission.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* RESOURCES */}
      {activeTab === "resources" && (
        <div className="ch-content">
          <div className="ch-resources-grid">
            {CREATOR_RESOURCES.map(resource => (
              <div key={resource.id} className="ch-resource-card card">
                <p className="ch-resource-icon">{resource.icon}</p>
                <h3 className="ch-resource-title">{resource.title}</h3>
                <p className="ch-resource-desc">{resource.desc}</p>
                <button className="btn btn-secondary">Access</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATORS */}
      {activeTab === "creators" && (
        <div className="ch-content">
          <div className="ch-creators-grid">
            {FEATURED_CREATORS.map(creator => (
              <div key={creator.id} className="ch-creator-card card">
                <div className="ch-creator-avatar">👤</div>
                <h3 className="ch-creator-name">{creator.name}</h3>
                <p className="ch-creator-role">{creator.role}</p>
                <p className="ch-creator-followers">{creator.followers} followers</p>
                <p className="ch-creator-contribution">Contributes: {creator.contribution}</p>
                <button className="btn btn-secondary">View Profile</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDELINES */}
      <section className="ch-section card">
        <h2 className="ch-section-title">Creator Guidelines</h2>
        <div className="ch-guidelines">
          <div className="ch-guideline">
            <h4 className="ch-guideline-title">✓ Content Quality</h4>
            <p className="ch-guideline-text">All submitted content must meet our quality standards for video, audio, and production value.</p>
          </div>
          <div className="ch-guideline">
            <h4 className="ch-guideline-title">✓ Timeline</h4>
            <p className="ch-guideline-text">Submit all materials 48 hours before scheduled publication or filming dates.</p>
          </div>
          <div className="ch-guideline">
            <h4 className="ch-guideline-title">✓ Communication</h4>
            <p className="ch-guideline-text">Keep the team updated on availability, schedule changes, and project status.</p>
          </div>
          <div className="ch-guideline">
            <h4 className="ch-guideline-title">✓ Brand Alignment</h4>
            <p className="ch-guideline-text">Ensure all content aligns with Styling Adventures brand values and guidelines.</p>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="ch-affirm card">
        <p className="ch-affirm-main">Creator success is our success.</p>
        <p className="ch-affirm-sub">
          50+ talented creators building magic together. Your voice matters here. 💜
        </p>
        <Link to="/prime" className="btn btn-primary">Back to Prime</Link>
      </section>
    </div>
  );
}

const styles = `
.creator-hub {
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
.ch-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 215, 170, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 190, 118, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.ch-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .ch-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ch-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #b45309;
  border: 1px solid rgba(254, 243, 230, 0.9);
}

.ch-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.ch-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.ch-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.ch-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.ch-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.ch-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TABS */
.ch-tabs {
  display: flex;
  gap: 8px;
}

.ch-tab {
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

.ch-tab:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.ch-tab.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  border-color: #f59e0b;
}

/* CONTENT */
.ch-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* QUICK ACTIONS */
.ch-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.ch-action {
  padding: 16px;
  background: linear-gradient(135deg, rgba(254, 215, 170, 0.1), rgba(253, 190, 118, 0.1));
  border: 1px solid rgba(254, 215, 170, 0.2);
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.1);
}

.ch-action-icon {
  margin: 0;
  font-size: 2rem;
}

.ch-action-title {
  margin: 8px 0 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.ch-action-value {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
}

.ch-action-sub {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* SECTION */
.ch-section {
  padding: 18px;
}

.ch-section-title {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

/* ANNOUNCEMENTS */
.ch-announcement {
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.ch-announcement:last-child {
  border-bottom: none;
}

.ch-announcement-date {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ch-announcement-title {
  margin: 4px 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ch-announcement-text {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

/* RESOURCES GRID */
.ch-resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.ch-resource-card {
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.ch-resource-icon {
  margin: 0;
  font-size: 2rem;
}

.ch-resource-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ch-resource-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
  flex: 1;
}

/* CREATORS GRID */
.ch-creators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.ch-creator-card {
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.ch-creator-avatar {
  font-size: 2.4rem;
}

.ch-creator-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ch-creator-role {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.ch-creator-followers {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.ch-creator-contribution {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* GUIDELINES */
.ch-guidelines {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.ch-guideline {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.ch-guideline-title {
  margin: 0 0 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.ch-guideline-text {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* AFFIRM */
.ch-affirm {
  padding: 18px;
  text-align: center;
}

.ch-affirm-main {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.ch-affirm-sub {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
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
  transition: transform 40ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #fff8f0;
  border-color: #fed7aa;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #f59e0b;
  color: #fff;
  box-shadow: 0 8px 18px rgba(245, 158, 11, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  border-color: #d97706;
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
