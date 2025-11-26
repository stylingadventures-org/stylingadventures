import React from "react";
import { Link } from "react-router-dom";

/**
 * Bestie Overview
 * High-level explainer page for what the Bestie tier includes.
 * Home (/bestie) is your primary dashboard; this page is the deeper
 * "how it works" guide linked from the navigation.
 */
export default function BestieOverview() {
  return (
    <div className="bestie-overview-page">
      <section className="bestie-overview-hero">
        <h2>How Bestie Studio works</h2>
        <p>
          Bestie Studio is your backstage pass to Styling Adventures. It&apos;s
          where you organize your real closet, plan content, and unlock perks
          that regular fans don&apos;t see.
        </p>
      </section>

      <section className="bestie-overview-grid">
        <article className="bestie-overview-card">
          <h3>1. Build your digital closet</h3>
          <p>
            Start by uploading photos of the pieces you actually own. Add
            simple tags like category, color, and vibe so you can find them
            later with a quick search.
          </p>
          <ul>
            <li>Snap a photo on your phone and upload</li>
            <li>Tag items (tops, dresses, bags, shoes, etc.)</li>
            <li>Group items into outfits or capsules</li>
          </ul>
          <Link to="/bestie/closet" className="bestie-overview-link">
            Go to My Closet →
          </Link>
        </article>

        <article className="bestie-overview-card">
          <h3>2. Turn looks into content</h3>
          <p>
            Use the Bestie content tools to plan carousels, outfit breaksdowns,
            GRWM videos, and more—using looks from your closet.
          </p>
          <ul>
            <li>Mark closet looks that you want to film</li>
            <li>Draft hooks, captions, and shot lists</li>
            <li>Track which outfits you&apos;ve already posted</li>
          </ul>
          <Link to="/bestie/content" className="bestie-overview-link">
            Open Bestie content →
          </Link>
        </article>

        <article className="bestie-overview-card">
          <h3>3. Collect perks &amp; drops</h3>
          <p>
            As we roll out new experiments, they&apos;ll show up under Perks:
            bonus episodes, early drops, surprise closet features, and more.
          </p>
          <ul>
            <li>Bestie-only experiments and tools</li>
            <li>Behind-the-scenes notes from Lala&apos;s team</li>
            <li>Occasional IRL surprises and collabs</li>
          </ul>
          <Link to="/bestie/perks" className="bestie-overview-link">
            View perks →
          </Link>
        </article>
      </section>

      <section className="bestie-overview-footer">
        <h3>Where should I start?</h3>
        <p>
          If you&apos;re new, we recommend starting with{" "}
          <Link to="/bestie/closet">My Closet</Link>. Add 5–10 of your
          favorite pieces, then come back to{" "}
          <Link to="/bestie/content">Bestie content</Link> to plan one outfit
          you want to film this week.
        </p>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.bestie-overview-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

.bestie-overview-hero {
  background:#f9fafb;
  border-radius:16px;
  padding:14px 16px;
  border:1px solid #e5e7eb;
}
.bestie-overview-hero h2 {
  margin:0 0 4px;
  font-size:1.15rem;
}
.bestie-overview-hero p {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
}

.bestie-overview-grid {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap:12px;
}

.bestie-overview-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:14px 15px 15px;
  box-shadow:0 10px 24px rgba(148,163,184,0.20);
}
.bestie-overview-card h3 {
  margin:0 0 4px;
  font-size:1rem;
}
.bestie-overview-card p {
  margin:0 0 6px;
  font-size:0.9rem;
  color:#4b5563;
}
.bestie-overview-card ul {
  margin:0 0 6px;
  padding-left:18px;
  font-size:0.86rem;
  color:#4b5563;
}
.bestie-overview-card li {
  margin-bottom:2px;
}

.bestie-overview-link {
  font-size:0.86rem;
  color:#4f46e5;
  text-decoration:none;
}
.bestie-overview-link:hover {
  text-decoration:underline;
}

.bestie-overview-footer {
  margin-top:4px;
  padding:10px 12px;
  border-radius:14px;
  background:#fef3c7;
  border:1px solid #fde68a;
  font-size:0.9rem;
  color:#78350f;
}
`;
