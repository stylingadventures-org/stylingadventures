// site/src/routes/fan/JoinBesties.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const PERKS = [
  {
    id: 1,
    name: "Early Access ⚡",
    description: "Watch new episodes 48 hours before everyone else. Be first to experience the magic.",
    why: "Feel like part of the inner circle"
  },
  {
    id: 2,
    name: "Exclusive Closet 👗",
    description: "Browse, vote on, and buy exact items from every episode. Support Lala's style directly.",
    why: "Own a piece of your favorite looks"
  },
  {
    id: 3,
    name: "Voting Power 🗳️",
    description: "Vote on styling challenges, outfit picks, and future episode themes. Your vote matters.",
    why: "Shape the show directly"
  },
  {
    id: 4,
    name: "VIP Moments 🎬",
    description: "Get exclusive behind-the-scenes clips and personal messages from Lala and the crew.",
    why: "Connect on a deeper level"
  },
  {
    id: 5,
    name: "Collab Dibs 🤝",
    description: "First access to limited-edition collaborations. Limited quantities go fast.",
    why: "Get exclusive items before they're gone"
  },
  {
    id: 6,
    name: "Shout-Outs 📢",
    description: "Get featured in Bestie Moments. Your styling journey could be on the show.",
    why: "Become part of the LaLa-Verse story"
  },
  {
    id: 7,
    name: "Priority Support 💬",
    description: "Direct messaging with the team. Questions? We're here, and you're a priority.",
    why: "Get answers when you need them"
  },
  {
    id: 8,
    name: "Custom Outfit ✨",
    description: "Get styled by the crew (digitally) or receive personalized styling tips.",
    why: "Get expert advice tailored to you"
  }
];

const FAQ = [
  {
    q: "What's the difference between Fan and Bestie?",
    a: "Fans watch and shop. Besties participate. You get early access, voting power, exclusive items, direct messaging, and much more. It's about being part of the inner circle."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel anytime in your settings."
  },
  {
    q: "Is my money going directly to Lala?",
    a: "A portion of every membership goes directly to Lala and the crew. The rest covers production, platform, and keeping things running smoothly."
  },
  {
    q: "Do I get any other benefits?",
    a: "You unlock a special Bestie badge, get access to Bestie-only community spaces, and can participate in monthly live sessions with the crew."
  },
  {
    q: "What if I'm not sure it's for me?",
    a: "Try it for one month. If it's not your thing, cancel anytime. But we bet you'll love it."
  }
];

export default function FanJoinBesties() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <div className="fan-join-besties">
      <style>{styles}</style>

      {/* HERO */}
      <section className="fjb-hero card">
        <div className="fjb-hero-main">
          <div>
            <p className="fjb-pill">💖 JOIN THE BESTIES</p>
            <h1 className="fjb-title">Become Part of the Crew</h1>
            <p className="fjb-sub">
              More than a show. More than a membership. A community where your voice matters 
              and your style counts. Join Lala and the Besties today.
            </p>
          </div>
          <div className="fjb-hero-card">
            <p className="fjb-stat-label">Monthly</p>
            <p className="fjb-stat-value">$9.99</p>
            <p className="fjb-stat-sub">Fully flexible</p>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="fjb-comparison card">
        <h2 className="fjb-comparison-title">Fan vs. Bestie</h2>
        <div className="fjb-comparison-table">
          <div className="fjb-comp-row header">
            <div className="fjb-comp-cell">Feature</div>
            <div className="fjb-comp-cell">👤 Fan</div>
            <div className="fjb-comp-cell">💖 Bestie</div>
          </div>
          
          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Watch episodes</div>
            <div className="fjb-comp-cell">✓</div>
            <div className="fjb-comp-cell">✓ (48h early)</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Shop Closet</div>
            <div className="fjb-comp-cell">✓</div>
            <div className="fjb-comp-cell">✓</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Vote on styling</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Behind-the-scenes</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Message the crew</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓ (Priority)</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Exclusive items</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Prime Tea full access</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓</div>
          </div>

          <div className="fjb-comp-row">
            <div className="fjb-comp-cell feature">Community badge</div>
            <div className="fjb-comp-cell">✗</div>
            <div className="fjb-comp-cell">✓</div>
          </div>
        </div>
      </section>

      {/* PERKS GRID */}
      <section className="fjb-perks">
        <h2 className="fjb-perks-title">What You Get</h2>
        <div className="fjb-perks-grid">
          {PERKS.map(perk => (
            <div key={perk.id} className="fjb-perk-card card">
              <p className="fjb-perk-name">{perk.name}</p>
              <p className="fjb-perk-description">{perk.description}</p>
              <p className="fjb-perk-why">{perk.why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="fjb-pricing card">
        <h2 className="fjb-pricing-title">Simple Pricing</h2>
        <div className="fjb-price-box">
          <p className="fjb-price-label">Monthly Membership</p>
          <p className="fjb-price-amount">$9.99</p>
          <p className="fjb-price-sub">/month • Fully flexible</p>
          <p className="fjb-price-note">
            A portion of every membership goes directly to Lala and the crew. 
            The rest covers production, platform, and keeping things amazing.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="fjb-faq">
        <h2 className="fjb-section-title">Common Questions</h2>
        <div className="fjb-faq-list">
          {FAQ.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className={`fjb-faq-item card ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedFaq(isExpanded ? null : idx)}
              >
                <div className="fjb-faq-question">
                  <h3>{item.q}</h3>
                  <span className="fjb-faq-arrow">{isExpanded ? "▼" : "▶"}</span>
                </div>
                {isExpanded && (
                  <p className="fjb-faq-answer">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY JOIN */}
      <section className="fjb-why card">
        <h2 className="fjb-section-title">Why Join Now?</h2>
        <div className="fjb-why-grid">
          <div className="fjb-why-card">
            <p className="fjb-why-emoji">🎯</p>
            <h3 className="fjb-why-title">Shape the Show</h3>
            <p className="fjb-why-text">
              Your votes directly influence styling choices, collabs, and what happens next.
            </p>
          </div>
          
          <div className="fjb-why-card">
            <p className="fjb-why-emoji">🤝</p>
            <h3 className="fjb-why-title">Connect with Lala</h3>
            <p className="fjb-why-text">
              Get exclusive moments, messages, and the chance to be featured in episodes.
            </p>
          </div>

          <div className="fjb-why-card">
            <p className="fjb-why-emoji">👗</p>
            <h3 className="fjb-why-title">Own the Look</h3>
            <p className="fjb-why-text">
              Get early access to exclusive items, collaborations, and pieces you can't buy anywhere else.
            </p>
          </div>

          <div className="fjb-why-card">
            <p className="fjb-why-emoji">💫</p>
            <h3 className="fjb-why-title">Your Story Matters</h3>
            <p className="fjb-why-text">
              Share your styling journey and see yourself featured on the show.
            </p>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="fjb-affirm card">
        <p className="fjb-affirm-main">Every Bestie changes the LaLa-Verse.</p>
        <p className="fjb-affirm-sub">
          You're not just watching. You're creating. You're voting. You're part of something real. 
          Join us. 💜
        </p>
        <div className="fjb-affirm-buttons">
          <button className="btn btn-primary">Become a Bestie</button>
          <Link to="/fan" className="btn btn-secondary">Back to Fan Home</Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.fan-join-besties {
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
.fjb-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(252, 231, 243, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(244, 194, 230, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.fjb-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .fjb-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fjb-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #be123c;
  border: 1px solid rgba(252, 231, 243, 0.9);
}

.fjb-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.fjb-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.fjb-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.fjb-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.fjb-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.fjb-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* COMPARISON */
.fjb-comparison {
  padding: 18px;
}

.fjb-comparison-title {
  margin: 0 0 14px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fjb-comparison-table {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.fjb-comp-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 10px;
}

.fjb-comp-row:last-child {
  border-bottom: none;
}

.fjb-comp-row.header {
  background: #f5f3ff;
  font-weight: 600;
  font-size: 0.9rem;
  color: #4b5563;
  text-align: center;
}

.fjb-comp-cell {
  padding: 0;
  text-align: center;
  font-size: 0.9rem;
  color: #374151;
}

.fjb-comp-cell.feature {
  text-align: left;
}

/* PERKS */
.fjb-perks {
  padding: 0 0 18px 0;
}

.fjb-perks > h2 {
  margin: 0 0 12px;
  padding: 0 18px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fjb-perks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  padding: 0 0 0 0;
}

.fjb-perk-card {
  padding: 12px;
  cursor: default;
}

.fjb-perk-name {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.fjb-perk-description {
  margin: 0 0 6px;
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.4;
}

.fjb-perk-why {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

/* PRICING */
.fjb-pricing {
  padding: 18px;
  text-align: center;
}

.fjb-pricing-title {
  margin: 0 0 14px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fjb-price-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.02));
  border-radius: 16px;
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.fjb-price-label {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.fjb-price-amount {
  margin: 4px 0 2px;
  font-size: 2.2rem;
  font-weight: 700;
  color: #ec4899;
}

.fjb-price-sub {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #6b7280;
}

.fjb-price-note {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
  max-width: 400px;
}

/* SECTION TITLE */
.fjb-section-title {
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

/* FAQ */
.fjb-faq {
  padding: 0 18px;
}

.fjb-faq > h2 {
  margin: 0 0 12px;
}

.fjb-faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fjb-faq-item {
  padding: 12px;
  cursor: pointer;
  transition: all 200ms ease;
}

.fjb-faq-item:hover {
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.2);
  transform: translateY(-2px);
}

.fjb-faq-question {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.fjb-faq-question h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.fjb-faq-arrow {
  font-size: 0.8rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.fjb-faq-answer {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

/* WHY GRID */
.fjb-why {
  padding: 0 18px;
}

.fjb-why > h2 {
  margin: 0 0 12px;
}

.fjb-why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.fjb-why-card {
  padding: 14px;
  background: #f9fafb;
  border-radius: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.fjb-why-emoji {
  margin: 0;
  font-size: 2rem;
}

.fjb-why-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.fjb-why-text {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
  line-height: 1.4;
}

/* AFFIRM */
.fjb-affirm {
  padding: 18px;
  text-align: center;
}

.fjb-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fjb-affirm-sub {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
}

.fjb-affirm-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
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
  background: #fce7f3;
  border-color: #fbcfe8;
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #ec4899, #f472b6);
  border-color: #ec4899;
  color: #fff;
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #db2777, #ec4899);
  border-color: #db2777;
}

.btn-secondary {
  background: #ffffff;
  border-color: #e5e7eb;
  color: #111827;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
`;
