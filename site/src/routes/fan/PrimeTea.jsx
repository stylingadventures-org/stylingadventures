// site/src/routes/fan/PrimeTea.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const HEADLINES = [
  {
    id: 1,
    category: "Fashion",
    emoji: "👗",
    title: "The Spring Refresh Looks We Can't Stop Talking About",
    snippet: "Lala's latest styling choices are turning heads. Here's what the crew is saying about the bold new aesthetic.",
    views: "2.4K",
    comments: "384",
    locked: false
  },
  {
    id: 2,
    category: "Behind the Scenes",
    emoji: "🎬",
    title: "How We Create Lala's Signature Look",
    snippet: "An exclusive dive into the production process. Renee reveals her creative process for styling the show's most iconic moments.",
    views: "1.8K",
    comments: "256",
    locked: false
  },
  {
    id: 3,
    category: "Trending",
    emoji: "✨",
    title: "That Unexpected Outfit Combo Everyone's Recreating",
    snippet: "One scene, two minutes in—and suddenly everyone wants the exact same look. The crew reacts to the viral moment.",
    views: "3.2K",
    comments: "512",
    locked: false
  }
];

const BREAKDOWNS = [
  {
    id: 1,
    title: "Winter Essentials: The Perfect Layering Guide",
    category: "Style Guide",
    emoji: "❄️",
    description: "Master the art of layering with Lala's proven framework.",
    items: [
      { name: "Base layer (fitted)", why: "Creates clean silhouette" },
      { name: "Mid layer (texture)", why: "Adds visual interest" },
      { name: "Outer layer (statement piece)", why: "Defines the look" },
      { name: "Accessories (confidence)", why: "Brings it all together" }
    ]
  },
  {
    id: 2,
    title: "Color Combinations That Always Work",
    category: "Color Theory",
    emoji: "🎨",
    description: "The psychology behind Lala's bold color choices.",
    items: [
      { name: "Complementary (opposite hues)", why: "Maximum visual impact" },
      { name: "Analogous (next-door colors)", why: "Harmonious and safe" },
      { name: "Monochromatic (same hue variations)", why: "Elegant and cohesive" },
      { name: "Neutral accents", why: "Lets colors breathe" }
    ]
  },
  {
    id: 3,
    title: "The Science of Good Fit",
    category: "Fit 101",
    emoji: "📏",
    description: "Why fit matters more than brand name.",
    items: [
      { name: "Shoulders align", why: "Creates proper proportions" },
      { name: "Sleeve length hits wrist", why: "Clean line appearance" },
      { name: "Waistline follows natural curve", why: "Flatters the body" },
      { name: "Length hits right spot", why: "Extends or shortens legs intentionally" }
    ]
  },
  {
    id: 4,
    title: "Mixing High & Low Fashion",
    category: "Budget Tips",
    emoji: "💎",
    description: "Looking expensive on any budget.",
    items: [
      { name: "Invest in foundation pieces", why: "Worn frequently, last longer" },
      { name: "Mix with affordable trends", why: "Stay current without overspending" },
      { name: "Quality over quantity", why: "Fewer pieces, more versatility" },
      { name: "Signature accessories", why: "Elevate any outfit instantly" }
    ]
  }
];

export default function FanPrimeTea() {
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);

  return (
    <div className="fan-prime-tea">
      <style>{styles}</style>

      {/* HERO */}
      <section className="fpt-hero card">
        <div className="fpt-hero-main">
          <div>
            <p className="fpt-pill">☕ PRIME TEA</p>
            <h1 className="fpt-title">The Fashion Talk</h1>
            <p className="fpt-sub">
              Headlines from the LaLa-Verse, fashion breakdowns, and insider insights. 
              Join the conversation and get full access to comments.
            </p>
          </div>
          <div className="fpt-hero-card">
            <p className="fpt-stat-label">Latest Headline</p>
            <p className="fpt-stat-value">Today</p>
            <p className="fpt-stat-sub">Spring Refresh</p>
          </div>
        </div>
      </section>

      {/* HEADLINES SECTION */}
      <section className="fpt-headlines">
        <h2 className="fpt-section-title">Latest Headlines</h2>
        <div className="fpt-headlines-grid">
          {HEADLINES.map(headline => (
            <div key={headline.id} className="fpt-headline-card card">
              <div className="fpt-headline-header">
                <span className="fpt-emoji">{headline.emoji}</span>
                <span className="fpt-category">{headline.category}</span>
              </div>
              <h3 className="fpt-headline-title">{headline.title}</h3>
              <p className="fpt-headline-snippet">{headline.snippet}</p>
              <div className="fpt-headline-meta">
                <span className="fpt-meta-item">👁️ {headline.views} views</span>
                {headline.locked ? (
                  <span className="fpt-meta-item locked">🔒 Comments locked</span>
                ) : (
                  <span className="fpt-meta-item">{headline.comments} comments</span>
                )}
              </div>
              <p className="fpt-headline-cta">
                {headline.locked ? "Join Besties to comment" : "Read & comment"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BREAKDOWNS SECTION */}
      <section className="fpt-breakdowns">
        <h2 className="fpt-section-title">Fashion Breakdowns</h2>
        <p className="fpt-section-subtitle">
          Deep dives into styling strategy, color theory, fit science, and budget tips
        </p>
        <div className="fpt-breakdowns-grid">
          {BREAKDOWNS.map(breakdown => {
            const isExpanded = expandedBreakdown === breakdown.id;
            return (
              <div
                key={breakdown.id}
                className={`fpt-breakdown-card card ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedBreakdown(isExpanded ? null : breakdown.id)}
              >
                <div className="fpt-breakdown-header">
                  <span className="fpt-emoji">{breakdown.emoji}</span>
                  <div className="fpt-breakdown-title-section">
                    <h3 className="fpt-breakdown-title">{breakdown.title}</h3>
                    <p className="fpt-breakdown-category">{breakdown.category}</p>
                  </div>
                </div>

                <p className="fpt-breakdown-desc">{breakdown.description}</p>

                {isExpanded && (
                  <div className="fpt-breakdown-items">
                    {breakdown.items.map((item, idx) => (
                      <div key={idx} className="fpt-item">
                        <p className="fpt-item-name">{item.name}</p>
                        <p className="fpt-item-why">{item.why}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="fpt-breakdown-arrow">
                  {isExpanded ? "▼" : "▶"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* COMMENTS PREVIEW */}
      <section className="fpt-comments-preview card">
        <h2 className="fpt-section-title">What Besties Are Saying</h2>
        <p className="fpt-section-subtitle">Join Besties to see full conversations and comment yourself</p>
        
        <div className="fpt-comment-sample">
          <div className="fpt-comment">
            <p className="fpt-comment-author">@StyleSeeker</p>
            <p className="fpt-comment-text">
              "The way Lala mixed those colors... I never would've thought to put those together, but it works so perfectly."
            </p>
            <p className="fpt-comment-time">2 hours ago</p>
          </div>
          <div className="fpt-comment">
            <p className="fpt-comment-author">@FashionFanatic</p>
            <p className="fpt-comment-text">
              "This is giving main character energy. I'm gonna try this look for my spring refresh!"
            </p>
            <p className="fpt-comment-time">3 hours ago</p>
          </div>
          <div className="fpt-comment">
            <p className="fpt-comment-author">@CrewLover</p>
            <p className="fpt-comment-text">
              "Can we just appreciate how Renee makes everything look so effortless? The production quality is incredible."
            </p>
            <p className="fpt-comment-time">5 hours ago</p>
          </div>
        </div>

        <div className="fpt-locked-message">
          <p className="fpt-locked-icon">🔒</p>
          <p className="fpt-locked-text">Full comments section available to Besties only</p>
          <Link to="/bestie" className="btn btn-primary">Join Besties</Link>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="fpt-affirm card">
        <p className="fpt-affirm-main">Fashion is conversation. Style is connection.</p>
        <p className="fpt-affirm-sub">
          Join the Besties community to participate in discussions, 
          share your own styling journey, and get exclusive fashion insights.
        </p>
        <div className="fpt-affirm-buttons">
          <Link to="/bestie" className="btn btn-primary">Become a Bestie</Link>
          <Link to="/fan" className="btn btn-secondary">Back to Fan Home</Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.fan-prime-tea {
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
.fpt-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(253, 245, 235, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(249, 240, 231, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.fpt-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .fpt-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fpt-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #b45309;
  border: 1px solid rgba(253, 245, 235, 0.9);
}

.fpt-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.fpt-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.fpt-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.fpt-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.fpt-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.fpt-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* SECTION TITLE */
.fpt-section-title {
  margin: 0 0 4px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fpt-section-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

/* HEADLINES */
.fpt-headlines {
  padding: 0;
}

.fpt-headlines > h2 {
  padding: 0 18px;
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fpt-headlines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  padding: 0 0 18px 0;
}

.fpt-headline-card {
  padding: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.fpt-headline-card:hover {
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.2);
  transform: translateY(-2px);
}

.fpt-headline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.fpt-emoji {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.fpt-category {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 600;
}

.fpt-headline-title {
  margin: 8px 0 6px;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.fpt-headline-snippet {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.fpt-headline-meta {
  display: flex;
  gap: 10px;
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #9ca3af;
}

.fpt-meta-item.locked {
  color: #d97706;
  font-weight: 600;
}

.fpt-headline-cta {
  margin: 0;
  font-size: 0.85rem;
  color: #d97706;
  font-weight: 600;
}

/* BREAKDOWNS */
.fpt-breakdowns {
  padding: 0 18px;
}

.fpt-breakdowns > h2 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #111827;
}

.fpt-breakdowns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.fpt-breakdown-card {
  padding: 14px;
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
}

.fpt-breakdown-card:hover {
  box-shadow: 0 12px 32px rgba(217, 119, 6, 0.2);
  transform: translateY(-2px);
}

.fpt-breakdown-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.fpt-breakdown-title-section {
  flex: 1;
  min-width: 0;
}

.fpt-breakdown-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.fpt-breakdown-category {
  margin: 2px 0 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.fpt-breakdown-desc {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.fpt-breakdown-items {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fpt-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fpt-item-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.fpt-item-why {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

.fpt-breakdown-arrow {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 0.9rem;
  color: #9ca3af;
}

/* COMMENTS PREVIEW */
.fpt-comments-preview {
  padding: 18px;
}

.fpt-comment-sample {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 14px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 16px;
  border-left: 4px solid #d97706;
}

.fpt-comment {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fpt-comment-author {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: #111827;
}

.fpt-comment-text {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
}

.fpt-comment-time {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.fpt-locked-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px;
  background: rgba(217, 119, 6, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(217, 119, 6, 0.2);
  text-align: center;
}

.fpt-locked-icon {
  margin: 0;
  font-size: 1.6rem;
}

.fpt-locked-text {
  margin: 0;
  font-size: 0.95rem;
  color: #d97706;
  font-weight: 600;
}

/* AFFIRM */
.fpt-affirm {
  padding: 18px;
  text-align: center;
}

.fpt-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fpt-affirm-sub {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
}

.fpt-affirm-buttons {
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
  background: #f5f3ff;
  border-color: #e0e7ff;
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  border-color: #d97706;
  color: #fff;
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #b45309, #d97706);
  border-color: #b45309;
}

.btn-secondary {
  background: #f5f3ff;
  border-color: #e0e7ff;
  color: #111827;
}

.btn-secondary:hover {
  background: #ede9fe;
  border-color: #c7d2fe;
}
`;
