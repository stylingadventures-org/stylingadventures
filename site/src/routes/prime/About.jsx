// site/src/routes/prime/About.jsx
import { Link } from "react-router-dom";

export default function PrimeAbout() {
  return (
    <div className="prime-about">
      <style>{styles}</style>

      {/* HERO */}
      <section className="pa-hero card">
        <div className="pa-hero-main">
          <div>
            <p className="pa-pill">👑 PRIME STUDIOS</p>
            <h1 className="pa-title">About Prime</h1>
            <p className="pa-sub">
              The premium creative hub for original content, exclusive interviews, 
              and behind-the-scenes access to Styling Adventures.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="pa-section card">
        <h2 className="pa-heading">Our Mission</h2>
        <p className="pa-text">
          Prime Studios exists to elevate the creator economy by providing a platform for 
          high-quality content production, strategic partnerships, and community building. 
          We believe in celebrating individuality while fostering meaningful collaborations 
          that benefit creators, brands, and fans alike.
        </p>
      </section>

      {/* WHAT IS PRIME */}
      <section className="pa-section card">
        <h2 className="pa-heading">What is Prime?</h2>
        <div className="pa-features">
          <div className="pa-feature">
            <p className="pa-feature-icon">📺</p>
            <h3 className="pa-feature-title">Exclusive Content</h3>
            <p className="pa-feature-text">Unfiltered, behind-the-scenes looks at show production, creator interviews, and editorial features.</p>
          </div>
          <div className="pa-feature">
            <p className="pa-feature-icon">📚</p>
            <h3 className="pa-feature-title">Magazine & Blog</h3>
            <p className="pa-feature-text">Quarterly digital magazine with trend analysis, style guides, and creator spotlights.</p>
          </div>
          <div className="pa-feature">
            <p className="pa-feature-icon">🤝</p>
            <h3 className="pa-feature-title">Brand Partnerships</h3>
            <p className="pa-feature-text">Strategic collaborations that create value for creators, sponsors, and the community.</p>
          </div>
          <div className="pa-feature">
            <p className="pa-feature-icon">🎬</p>
            <h3 className="pa-feature-title">Live Events</h3>
            <p className="pa-feature-text">Virtual and in-person experiences bringing creators and fans together for special moments.</p>
          </div>
          <div className="pa-feature">
            <p className="pa-feature-icon">💰</p>
            <h3 className="pa-feature-title">Revenue Share</h3>
            <p className="pa-feature-text">Transparent, creator-first monetization models that reward quality content and engagement.</p>
          </div>
          <div className="pa-feature">
            <p className="pa-feature-icon">✨</p>
            <h3 className="pa-feature-title">Community Support</h3>
            <p className="pa-feature-text">Direct access to production team, scheduling tools, and strategic growth resources.</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="pa-stats-section card">
        <h2 className="pa-heading">By The Numbers</h2>
        <div className="pa-stats-grid">
          <div className="pa-stat">
            <p className="pa-stat-number">12</p>
            <p className="pa-stat-label">Episodes Produced</p>
          </div>
          <div className="pa-stat">
            <p className="pa-stat-number">50+</p>
            <p className="pa-stat-label">Creator Partners</p>
          </div>
          <div className="pa-stat">
            <p className="pa-stat-number">2.4M</p>
            <p className="pa-stat-label">Total Viewers</p>
          </div>
          <div className="pa-stat">
            <p className="pa-stat-number">$850K</p>
            <p className="pa-stat-label">Creator Payouts</p>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="pa-section card">
        <h2 className="pa-heading">Our Team</h2>
        <p className="pa-text">
          Prime Studios is powered by a diverse team of creatives, producers, technologists, 
          and strategists dedicated to building the future of entertainment. Every team member 
          brings a unique perspective and shared commitment to creator success.
        </p>
        <div className="pa-team-grid">
          {["Creative Lead", "Content Director", "Brand Manager", "Community Manager"].map(role => (
            <div key={role} className="pa-team-card">
              <div className="pa-team-avatar">👤</div>
              <p className="pa-team-role">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="pa-section card">
        <h2 className="pa-heading">Our Values</h2>
        <div className="pa-values">
          <div className="pa-value">
            <h3 className="pa-value-title">🎯 Creator-First</h3>
            <p className="pa-value-text">Every decision prioritizes creator success, agency, and fair compensation.</p>
          </div>
          <div className="pa-value">
            <h3 className="pa-value-title">🌈 Authentic</h3>
            <p className="pa-value-text">We celebrate individuality and encourage creators to share their genuine selves.</p>
          </div>
          <div className="pa-value">
            <h3 className="pa-value-title">🚀 Innovative</h3>
            <p className="pa-value-text">We constantly explore new formats, technologies, and storytelling methods.</p>
          </div>
          <div className="pa-value">
            <h3 className="pa-value-title">💬 Community</h3>
            <p className="pa-value-text">We build meaningful connections between creators and their most dedicated fans.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pa-cta card">
        <h2 className="pa-heading">Ready to Join?</h2>
        <p className="pa-text">
          Whether you're a creator, brand partner, or passionate fan, Prime has a place for you.
        </p>
        <div className="pa-buttons">
          <Link to="/prime/partnerships" className="btn btn-primary">Partner With Us</Link>
          <Link to="/prime" className="btn btn-secondary">Back to Prime</Link>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="pa-affirm card">
        <p className="pa-affirm-main">Elevating creators. Celebrating culture.</p>
        <p className="pa-affirm-sub">
          Prime Studios is more than a platform—it's a movement toward a creator-first future. 👑
        </p>
      </section>
    </div>
  );
}

const styles = `
.prime-about {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
  padding: 18px;
}

/* HERO */
.pa-hero {
  background:
    radial-gradient(circle at top left, rgba(254, 215, 170, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 190, 118, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
  padding: 18px 18px 16px;
}

.pa-hero-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pa-pill {
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
  width: fit-content;
}

.pa-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.pa-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

/* SECTIONS */
.pa-section {
  padding: 18px;
}

.pa-heading {
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.pa-text {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
}

/* FEATURES */
.pa-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.pa-feature {
  padding: 14px;
  background: linear-gradient(135deg, rgba(254, 215, 170, 0.1), rgba(253, 190, 118, 0.1));
  border: 1px solid rgba(254, 215, 170, 0.2);
  border-radius: 12px;
  text-align: center;
}

.pa-feature-icon {
  margin: 0;
  font-size: 2rem;
}

.pa-feature-title {
  margin: 8px 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pa-feature-text {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* STATS */
.pa-stats-section {
  padding: 18px;
}

.pa-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.pa-stat {
  text-align: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
}

.pa-stat-number {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
}

.pa-stat-label {
  margin: 4px 0 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

/* TEAM */
.pa-team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.pa-team-card {
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  text-align: center;
}

.pa-team-avatar {
  font-size: 2.4rem;
  margin-bottom: 6px;
}

.pa-team-role {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

/* VALUES */
.pa-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.pa-value {
  padding: 14px;
  background: #f9fafb;
  border-radius: 12px;
}

.pa-value-title {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pa-value-text {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* CTA */
.pa-cta {
  padding: 18px;
  text-align: center;
  background:
    radial-gradient(circle at top left, rgba(254, 215, 170, 0.5), rgba(255, 255, 255, 0.5));
}

/* AFFIRM */
.pa-affirm {
  padding: 18px;
  text-align: center;
}

.pa-affirm-main {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.pa-affirm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
}

/* BUTTONS */
.pa-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
  flex-wrap: wrap;
}

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
