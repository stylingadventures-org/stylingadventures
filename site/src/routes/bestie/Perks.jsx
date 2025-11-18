// site/src/routes/bestie/Perks.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function BestiePerks() {
  return (
    <div className="bestie-perks">
      <style>{styles}</style>

      {/* Hero */}
      <section className="bp-hero card">
        <div className="bp-hero-main">
          <div>
            <div className="bp-pill">Bestie Club</div>
            <h1 className="bp-title">Your Bestie perks, unlocked 💕</h1>
            <p className="bp-sub">
              Thanks for being in Lala&apos;s inner circle. You&apos;re not just
              watching the show — you&apos;re shaping it. Here&apos;s everything
              you get as a Bestie, plus a little reminder that you&apos;re doing
              amazing.
            </p>
          </div>

          <div className="bp-hero-right">
            <div className="bp-hero-card">
              <p className="bp-hero-label">Today&apos;s vibe</p>
              <p className="bp-hero-value">Soft glam, main-character energy ✨</p>
              <p className="bp-hero-note">
                Take a breath, grab a snack, and claim a little screen time
                that&apos;s just for you.
              </p>
              <div className="bp-hero-actions">
                <Link to="/fan/episodes" className="btn btn-primary bp-hero-btn">
                  Watch early episodes
                </Link>
                <Link to="/bestie/closet" className="btn btn-ghost bp-hero-btn">
                  Open Bestie closet
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* tiny stat / summary row */}
        <div className="bp-hero-stats">
          <div className="bp-stat-pill">
            <span className="bp-stat-label">Episodes</span>
            <span className="bp-stat-value">Early access &amp; bonus moments</span>
          </div>
          <div className="bp-stat-pill">
            <span className="bp-stat-label">Closet</span>
            <span className="bp-stat-value">Upload looks &amp; get featured</span>
          </div>
          <div className="bp-stat-pill">
            <span className="bp-stat-label">Community</span>
            <span className="bp-stat-value">Polls, collabs &amp; shout-outs</span>
          </div>
        </div>
      </section>

      {/* Perk buckets – these fold in the perks from your old page */}
      <section className="bp-grid">
        <article className="bp-card">
          <h2 className="bp-card-title">Watch perks</h2>
          <p className="bp-card-sub">
            Get closer to the story and see moments before anyone else.
          </p>
          <ul className="bp-list">
            <li>🌙 Early-access episodes before they drop for free fans.</li>
            <li>🎬 Behind-the-scenes vibes and creator notes as they roll out.</li>
            <li>⏭️ Smooth &quot;Next up&quot; flow so you can stay in the moment.</li>
            <li>💌 Surprise Bestie-only drops when Lala feels chaotic good.</li>
          </ul>
          <Link to="/fan/episodes" className="bp-link">
            Go to Episodes →
          </Link>
        </article>

        <article className="bp-card">
          <h2 className="bp-card-title">Closet perks</h2>
          <p className="bp-card-sub">
            You don&apos;t just wear the looks — you help design the closet.
          </p>
          <ul className="bp-list">
            <li>👗 Bestie-only closet uploads from the fan area.</li>
            <li>⭐ Approved looks can show up in Lala&apos;s public Closet.</li>
            <li>📚 Save outfits as named stories with seasons &amp; vibe tags.</li>
            <li>⚡ Priority in the review queue vs free-tier submissions.</li>
          </ul>
          <Link to="/bestie/closet" className="bp-link">
            Manage your closet →
          </Link>
        </article>

        <article className="bp-card">
          <h2 className="bp-card-title">Community perks</h2>
          <p className="bp-card-sub">
            Bestie status means your voice carries extra sparkle.
          </p>
          <ul className="bp-list">
            <li>📊 Bestie community polls for outfits, challenges, and drops.</li>
            <li>💬 Extra context prompts in future community spaces.</li>
            <li>🤝 First dibs on collab / guest-stylist moments (coming soon).</li>
            <li>🎉 Occasional shout-outs for standout Besties.</li>
          </ul>
          <Link to="/fan/community" className="bp-link">
            Visit Community →
          </Link>
        </article>
      </section>

      {/* Feel-good affirmation block */}
      <section className="bp-affirm card">
        <div className="bp-affirm-text">
          <p className="bp-affirm-label">Little reminder</p>
          <p className="bp-affirm-main">
            You&apos;re allowed to take up space, on screen and in real life.
          </p>
          <p className="bp-affirm-sub">
            Styling Adventures is your cozy corner of the internet. Whether you
            binge episodes, quietly heart closet looks, or go full stylist in
            Bestie uploads — it all counts, and it all matters. We&apos;re so
            glad you&apos;re here. 💗
          </p>
        </div>
        <div className="bp-affirm-actions">
          <Link to="/fan/closet" className="btn btn-primary">
            Style Lala now
          </Link>
          <Link to="/fan" className="btn btn-ghost">
            Back to fan home
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
  margin:0;
  font-size:0.95rem;
  color:#374151;
  max-width:520px;
}

/* hero right card */
.bp-hero-right {
  display:flex;
  justify-content:flex-end;
}
.bp-hero-card {
  background:rgba(255,255,255,0.96);
  border-radius:20px;
  padding:12px 14px 14px;
  border:1px solid rgba(229,231,235,0.9);
  box-shadow:0 14px 32px rgba(148,163,184,0.55);
  max-width:280px;
}
.bp-hero-label {
  margin:0;
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#9ca3af;
}
.bp-hero-value {
  margin:4px 0;
  font-weight:700;
  font-size:1.05rem;
  color:#111827;
}
.bp-hero-note {
  margin:0 0 10px;
  font-size:0.8rem;
  color:#4b5563;
}
.bp-hero-actions {
  display:flex;
  flex-direction:column;
  gap:6px;
}
.bp-hero-btn {
  width:100%;
}

/* hero stat row */
.bp-hero-stats {
  margin-top:12px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.bp-stat-pill {
  border-radius:999px;
  padding:6px 10px;
  background:rgba(255,255,255,0.85);
  border:1px solid rgba(229,231,235,0.9);
  display:flex;
  gap:6px;
  align-items:center;
  font-size:0.8rem;
}
.bp-stat-label {
  text-transform:uppercase;
  letter-spacing:0.12em;
  font-size:0.7rem;
  color:#9ca3af;
}
.bp-stat-value {
  font-weight:500;
  color:#111827;
}

/* PERKS GRID */
.bp-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));
  gap:16px;
}
.bp-card {
  padding:14px 16px 16px;
}
.bp-card-title {
  margin:0 0 4px;
  font-size:1.05rem;
}
.bp-card-sub {
  margin:0 0 10px;
  font-size:0.9rem;
  color:#6b7280;
}
.bp-list {
  margin:0 0 10px 0;
  padding-left:18px;
  font-size:0.9rem;
  color:#374151;
}
.bp-list li + li {
  margin-top:4px;
}
.bp-link {
  font-size:0.85rem;
  text-decoration:none;
  color:#4f46e5;
}
.bp-link:hover {
  text-decoration:underline;
}

/* AFFIRMATION BLOCK */
.bp-affirm {
  padding:14px 16px 16px;
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  align-items:flex-start;
  background:
    radial-gradient(circle at top left, rgba(254,242,242,0.9), #ffffff);
}
.bp-affirm-text {
  flex:1 1 260px;
  min-width:0;
}
.bp-affirm-label {
  margin:0;
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#9ca3af;
}
.bp-affirm-main {
  margin:4px 0;
  font-size:1.1rem;
  font-weight:600;
  color:#111827;
}
.bp-affirm-sub {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
  max-width:520px;
}
.bp-affirm-actions {
  display:flex;
  flex-direction:column;
  gap:8px;
}
@media (min-width: 768px) {
  .bp-affirm-actions {
    align-items:flex-end;
    justify-content:center;
  }
}

/* BUTTONS – aligned with your other pages */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:9px 16px;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:500;
}
.btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.btn:active {
  transform: translateY(1px);
}
.btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#fff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.btn-ghost {
  background:#ffffff;
  color:#374151;
}
`;
