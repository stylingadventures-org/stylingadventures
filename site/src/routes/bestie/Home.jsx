// site/src/routes/bestie/Home.jsx
import React from "react";
import { Link, useOutletContext } from "react-router-dom";

export default function BestieHome() {
  const ctx = useOutletContext() || {};
  const { bestieStatus, isBestie, isAdmin } = ctx;

  const tier = bestieStatus?.tier || "FREE";
  const expiresAt = bestieStatus?.expiresAt
    ? new Date(bestieStatus.expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="bestie-home">
      {/* TOP: Hero (style + content) + status/perks */}
      <section className="bestie-home-top">
        {/* Hero / main CTA */}
        <article className="sa-card bestie-home-hero">
          <header className="bestie-home-hero-header">
            <div className="bestie-home-pill">WELCOME BACK, BESTIE ✨</div>
            <h2 className="bestie-home-title">
              Turn your personal style into content & community.
            </h2>
          </header>

          <p className="bestie-home-body">
            Bestie Studio is your HQ for styling outfits, keeping up with new
            episodes, and growing your socials with content that actually feels
            like you.
          </p>

          <ul className="bestie-home-list">
            <li>🧺 Log real outfits & pieces in your digital closet.</li>
            <li>🎬 Watch new episodes and turn ideas into content plans.</li>
            <li>🤝 Stay close to the community and track your social glow-up.</li>
          </ul>

          <div className="bestie-home-actions">
            <Link to="/bestie/closet" className="bestie-btn bestie-btn-primary">
              Style an outfit
            </Link>
            <Link to="/fan/episodes" className="bestie-btn bestie-btn-secondary">
              Watch latest episode
            </Link>
            <Link to="/bestie/content" className="bestie-btn bestie-btn-ghost">
              Plan a post
            </Link>
          </div>
        </article>

        {/* Status / tier + quick perks */}
        <aside className="sa-card bestie-home-status">
          <div className="bestie-status-header">
            <div className="bestie-status-pill-main">
              <span className="bestie-status-dot-main" />
              <span className="bestie-status-label-main">
                {isAdmin
                  ? "Admin access"
                  : isBestie
                  ? "Active Bestie"
                  : "Bestie mode"}
              </span>
            </div>
            <div className="bestie-status-meta">
              <span className="bestie-status-chip">
                Tier: <strong>{tier}</strong>
              </span>
              {expiresAt && (
                <span className="bestie-status-chip">
                  Renews / ends on <strong>{expiresAt}</strong>
                </span>
              )}
            </div>
          </div>

          <p className="bestie-status-copy">
            You&apos;re in the inner circle. This is where new perks, experiments,
            and community drops will show up first.
          </p>

          <ul className="bestie-status-list">
            <li>✨ Early access to select episodes</li>
            <li>🧺 Bestie-only closet looks & experiments</li>
            <li>📈 Content & social growth tools (rolling out)</li>
            <li>🎁 Surprise mini-drops, polls, and bonuses</li>
          </ul>

          <div className="bestie-status-actions">
            <Link to="/bestie/perks" className="bestie-link">
              View all perks →
            </Link>
            <Link to="/bestie/overview" className="bestie-link bestie-link-muted">
              How Bestie works →
            </Link>
          </div>
        </aside>
      </section>

      {/* TODAY SECTION: style, episodes, social growth */}
      <section className="bestie-home-today">
        <header className="bestie-home-grid-header">
          <h3>Today in Bestie Studio</h3>
          <p>
            Three small moves that keep your style, content, and socials growing
            over time.
          </p>
        </header>

        <div className="bestie-home-today-grid">
          {/* Style mission */}
          <article className="sa-card bestie-home-today-card">
            <div className="bestie-card-kicker">STYLE MISSION</div>
            <h4>Log one outfit you love</h4>
            <p>
              Snap a fit, add notes on how it made you feel, and tag it so you
              can reuse it for future reels and posts.
            </p>
            <ul className="bestie-card-list">
              <li>📸 Upload a new closet piece</li>
              <li>🏷 Add category + vibes tags</li>
              <li>⭐ Mark it as a &quot;repeatable&quot; look</li>
            </ul>
            <Link to="/bestie/closet" className="bestie-link">
              Open my closet →
            </Link>
          </article>

          {/* Watch & learn */}
          <article className="sa-card bestie-home-today-card">
            <div className="bestie-card-kicker">WATCH & LEARN</div>
            <h4>Catch up on the latest episode</h4>
            <p>
              Watch styling breakdowns, real-life closet edits, and content
              ideas you can adapt to your own style.
            </p>
            <ul className="bestie-card-list">
              <li>🎧 Watch while you get ready</li>
              <li>📝 Save one idea you want to try</li>
              <li>📌 Turn that idea into a Bestie content card</li>
            </ul>
            <Link to="/fan/episodes" className="bestie-link">
              Watch episodes →
            </Link>
          </article>

          {/* Social growth */}
          <article className="sa-card bestie-home-today-card">
            <div className="bestie-card-kicker">SOCIAL GROWTH</div>
            <h4>Plan one piece of content</h4>
            <p>
              Use Bestie content as your tiny content studio: outline a reel,
              carousel, or TikTok based on your closet.
            </p>
            <ul className="bestie-card-list">
              <li>🧠 Pick a closet look or vibe</li>
              <li>🗂 Choose a content format (reel, carousel, story)</li>
              <li>✅ Write 3–4 bullet points you&apos;ll film</li>
            </ul>
            <Link to="/bestie/content" className="bestie-link">
              Plan a post →
            </Link>
          </article>
        </div>
      </section>

      {/* COMMUNITY + PERKS + COMING SOON */}
      <section className="bestie-home-grid">
        <header className="bestie-home-grid-header">
          <h3>Community, perks & your glow-up</h3>
          <p>
            Bestie isn&apos;t just a membership — it&apos;s tools + people +
            experiments to keep you inspired.
          </p>
        </header>

        <div className="bestie-home-grid-cards">
          <article className="sa-card bestie-home-grid-card">
            <div className="bestie-card-kicker">COMMUNITY</div>
            <h4>Stay close to the Styling Adventures fam</h4>
            <p>
              Show up in comments, polls, and future community spots. As we roll
              out more features, this is where they&apos;ll plug in.
            </p>
            <Link to="/fan/bestie" className="bestie-link">
              Go to Bestie hub →
            </Link>
          </article>

          <article className="sa-card bestie-home-grid-card">
            <div className="bestie-card-kicker">PERKS</div>
            <h4>Keep an eye on new drops</h4>
            <p>
              Early access episodes, closet experiments, bonus coins, and
              future collabs will all roll through your perks page.
            </p>
            <Link to="/bestie/perks" className="bestie-link">
              View perks dashboard →
            </Link>
          </article>

          <article className="sa-card bestie-home-grid-card">
            <div className="bestie-card-kicker bestie-card-kicker-soon">
              COMING SOON
            </div>
            <h4>Progress & social stats</h4>
            <p>
              Track how often you post, what outfits perform best, and how your
              style content is growing across platforms.
            </p>
            <span className="bestie-coming-note">
              We&apos;ll plug this in automatically when it&apos;s ready — no extra
              setup needed.
            </span>
          </article>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.bestie-home {
  display:flex;
  flex-direction:column;
  gap:24px;
}

/* top two-column area */
.bestie-home-top {
  display:grid;
  grid-template-columns:minmax(0, 2.1fr) minmax(0, 1.4fr);
  gap:18px;
}
@media (max-width: 900px) {
  .bestie-home-top {
    grid-template-columns: minmax(0,1fr);
  }
}

.bestie-home-hero {
  padding:18px 18px 20px;
}

.bestie-home-hero-header {
  margin-bottom:10px;
}

.bestie-home-pill {
  display:inline-flex;
  align-items:center;
  padding:4px 10px;
  border-radius:999px;
  font-size:0.68rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  background:#eef2ff;
  color:#4f46e5;
  font-weight:700;
}

.bestie-home-title {
  margin:6px 0 4px;
  font-size:1.4rem;
}

.bestie-home-body {
  margin:0 0 10px;
  font-size:0.92rem;
  color:#4b5563;
}

.bestie-home-list {
  margin:0 0 12px 1rem;
  padding:0;
  font-size:0.9rem;
  color:#4b5563;
}

.bestie-home-actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:6px;
}

.bestie-btn {
  border-radius:999px;
  height:34px;
  padding:0 14px;
  font-size:0.9rem;
  border:1px solid transparent;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  text-decoration:none;
}
.bestie-btn-primary {
  background:linear-gradient(90deg,#4f46e5,#ec4899);
  color:#fff;
  box-shadow:0 10px 24px rgba(79,70,229,0.45);
}
.bestie-btn-secondary {
  background:#111827;
  color:#f9fafb;
}
.bestie-btn-ghost {
  background:#f9fafb;
  border-color:#e5e7eb;
  color:#111827;
}

/* status card */
.bestie-home-status {
  padding:14px 16px 16px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.bestie-status-header {
  display:flex;
  flex-direction:column;
  gap:6px;
}

.bestie-status-pill-main {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 12px;
  border-radius:999px;
  background:#ecfdf3;
  border:1px solid #bbf7d0;
  color:#166534;
  font-size:0.8rem;
  font-weight:600;
  align-self:flex-start;
}

.bestie-status-dot-main {
  width:8px;
  height:8px;
  border-radius:999px;
  background:#22c55e;
}

.bestie-status-meta {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

.bestie-status-chip {
  font-size:0.75rem;
  padding:3px 8px;
  border-radius:999px;
  background:#f3f4f6;
  color:#4b5563;
}

.bestie-status-copy {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
}

.bestie-status-list {
  margin:0 0 4px 1rem;
  padding:0;
  font-size:0.86rem;
  color:#4b5563;
}

.bestie-status-actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:auto;
}

/* links */
.bestie-link {
  font-size:0.86rem;
  color:#4f46e5;
  text-decoration:none;
  font-weight:500;
}
.bestie-link:hover {
  text-decoration:underline;
}
.bestie-link-muted {
  color:#6b7280;
}

/* TODAY SECTION */
.bestie-home-today {
  margin-top:4px;
}

.bestie-home-grid-header h3 {
  margin:0 0 4px;
  font-size:1.05rem;
}
.bestie-home-grid-header p {
  margin:0;
  font-size:0.88rem;
  color:#6b7280;
}

.bestie-home-today-grid {
  margin-top:10px;
  display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));
  gap:12px;
}
@media (max-width: 900px) {
  .bestie-home-today-grid {
    grid-template-columns:minmax(0,1fr);
  }
}

.bestie-home-today-card {
  padding:14px 14px 16px;
  display:flex;
  flex-direction:column;
  gap:6px;
}

/* Shared card elements */
.bestie-card-kicker {
  font-size:0.7rem;
  text-transform:uppercase;
  letter-spacing:0.16em;
  color:#6b7280;
}
.bestie-card-kicker-soon {
  color:#db2777;
}

.bestie-card-list {
  margin:4px 0 8px 1rem;
  padding:0;
  font-size:0.84rem;
  color:#4b5563;
}

.bestie-coming-note {
  font-size:0.8rem;
  color:#6b7280;
}

/* where bestie shows up / community grid */
.bestie-home-grid {
  margin-top:4px;
}

.bestie-home-grid-cards {
  margin-top:10px;
  display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));
  gap:12px;
}
@media (max-width: 900px) {
  .bestie-home-grid-cards {
    grid-template-columns:minmax(0,1fr);
  }
}

.bestie-home-grid-card {
  padding:14px 14px 16px;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.bestie-home-grid-card h4 {
  margin:0;
  font-size:0.98rem;
}
.bestie-home-grid-card p {
  margin:0;
  font-size:0.88rem;
  color:#4b5563;
}
`;

