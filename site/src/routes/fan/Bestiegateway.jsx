// site/src/routes/fan/Bestie.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchBestieStatus,
  startBestieCheckout,
  claimBestieTrial,
} from "../../lib/bestie";

function formatDate(dt) {
  if (!dt) return null;
  try {
    return new Date(dt).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function Bestie() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    try {
      setLoading(true);
      setErr("");
      const s = await fetchBestieStatus();
      setStatus(s);
    } catch (e) {
      console.error(e);
      setErr("Couldn’t load your Bestie status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const isBestie = !!status?.isBestie;
  const tier = status?.tier || "FREE";
  const expiresAt = status?.expiresAt;
  const hasSub = !!status?.activeSubscription;
  const niceExpiry = formatDate(expiresAt);

  // Option C: trial-first flow *if* available, otherwise straight to paid
  const showTrial = !loading && !isBestie && !hasSub && tier === "FREE";

  async function handleStartCheckout() {
    try {
      setBusy(true);
      setErr("");
      const url = await startBestieCheckout();
      if (!url) {
        setErr("Something went wrong starting checkout. Try again in a moment.");
        setBusy(false);
        return;
      }
      window.location.href = url;
    } catch (e) {
      console.error(e);
      setErr("Couldn’t start checkout. Please try again.");
      setBusy(false);
    }
  }

  async function handleClaimTrial() {
    try {
      setBusy(true);
      setErr("");
      const s = await claimBestieTrial();
      if (!s) {
        setErr("Couldn’t claim your trial. Please try again.");
      } else {
        setStatus(s);
      }
    } catch (e) {
      console.error(e);
      setErr("Couldn’t claim your trial. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bestie-page">
      <main className="bestie-shell">
        {/* HERO – welcome to Bestie World */}
        <header className="bestie-hero">
          <div className="bestie-hero__aura" aria-hidden="true" />
          <div className="bestie-hero__inner">
            <div className="bestie-hero__left">
              <div className="bestie-pill-row">
                <span className="bestie-pill bestie-pill--primary">
                  Bestie mode
                </span>
                <span className="bestie-pill bestie-pill--soft">
                  Digital Closet • Social Glow-Up
                </span>
              </div>

              <h1 className="bestie-hero__title">
                Unlock Lala&apos;s Bestie world 💖
              </h1>
              <p className="bestie-hero__subtitle">
                Besties don&apos;t just watch the show — they{" "}
                <strong>build their own digital closet, style lab, and fan page</strong>.
                Early episodes, exclusive closet drops, and perks that make your
                socials feel like Lala&apos;s.
              </p>

              {/* Status chip */}
              <div className="bestie-status-row">
                {loading ? (
                  <div className="bestie-status-chip bestie-status-chip--loading">
                    Checking your Bestie status…
                  </div>
                ) : isBestie ? (
                  <div className="bestie-status-chip bestie-status-chip--active">
                    You&apos;re in <strong>Bestie mode</strong>
                    {niceExpiry ? ` · through ${niceExpiry}` : ""}. ✨
                  </div>
                ) : (
                  <div className="bestie-status-chip">
                    You&apos;re currently on the <strong>Fan</strong> tier.
                  </div>
                )}
                {!loading && tier && (
                  <span className="bestie-status-tag">
                    Current tier: <strong>{tier}</strong>
                  </span>
                )}
              </div>

              {/* Upgrade CTAs – Option C logic */}
              {!loading && (
                <div className="bestie-cta-row">
                  {isBestie ? (
                    <>
                      <Link to="/fan/closet" className="bestie-btn bestie-btn-primary">
                        Go to your Bestie Closet
                      </Link>
                      <Link to="/fan/profile" className="bestie-btn bestie-btn-ghost">
                        View your profile
                      </Link>
                    </>
                  ) : (
                    <>
                      {showTrial && (
                        <button
                          type="button"
                          className="bestie-btn bestie-btn-primary bestie-btn-main"
                          onClick={handleClaimTrial}
                          disabled={busy}
                        >
                          {busy ? "Claiming your trial…" : "Start free Bestie trial"}
                          <span className="bestie-btn__sub">
                            Try Bestie mode first · cancel anytime
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        className={
                          "bestie-btn " +
                          (showTrial
                            ? "bestie-btn-ghost bestie-btn-main"
                            : "bestie-btn-primary bestie-btn-main")
                        }
                        onClick={handleStartCheckout}
                        disabled={busy}
                      >
                        {busy && !showTrial
                          ? "Starting checkout…"
                          : busy && showTrial
                          ? "Opening checkout…"
                          : "Unlock full Bestie membership"}
                        <span className="bestie-btn__sub">
                          Early episodes, exclusive drops, extra XP & coins
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {err && (
                <div className="bestie-error-banner">
                  <strong>Oops:</strong> {err}
                </div>
              )}

              {/* Hero steps – explain journey */}
              <ul className="bestie-steps">
                <li className="bestie-step">
                  <span className="bestie-step__badge">1</span>
                  <div className="bestie-step__body">
                    <div className="bestie-step__title">Become a Bestie</div>
                    <div className="bestie-step__text">
                      Unlock early episodes, closet drops, and boosted rewards.
                    </div>
                  </div>
                </li>
                <li className="bestie-step">
                  <span className="bestie-step__badge">2</span>
                  <div className="bestie-step__body">
                    <div className="bestie-step__title">Build your digital closet</div>
                    <div className="bestie-step__text">
                      Save favorite looks, run experiments in Style Lab, and plan future fits.
                    </div>
                  </div>
                </li>
                <li className="bestie-step">
                  <span className="bestie-step__badge">3</span>
                  <div className="bestie-step__body">
                    <div className="bestie-step__title">Turn it into content</div>
                    <div className="bestie-step__text">
                      Use your closet as inspo for TikToks, IG posts, and fan pages like Lala.
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Snapshot card */}
            <aside className="bestie-hero__right">
              <div className="bestie-snapshot">
                <div className="bestie-snapshot__header">
                  <div>
                    <div className="bestie-snapshot__label">Your Bestie snapshot</div>
                    <div className="bestie-snapshot__status">
                      {loading
                        ? "Loading…"
                        : isBestie
                        ? "Bestie mode: ON"
                        : "Bestie mode: Locked"}
                    </div>
                  </div>
                  <span className="bestie-snapshot__emoji">💅</span>
                </div>

                <div className="bestie-snapshot__meter">
                  <div className="bestie-snapshot__meter-track">
                    <div
                      className={
                        "bestie-snapshot__meter-fill" +
                        (isBestie ? " bestie-snapshot__meter-fill--full" : "")
                      }
                      style={{ width: isBestie ? "100%" : "35%" }}
                    />
                  </div>
                  <div className="bestie-snapshot__meter-caption">
                    {isBestie
                      ? "You’re fully in the inner circle."
                      : "You’re in fan mode. Bestie perks are still waiting."}
                  </div>
                </div>

                <ul className="bestie-snapshot__list">
                  <li>
                    <span>🎬 Early episode drops</span>
                    <span>{isBestie ? "Unlocked" : "Locked"}</span>
                  </li>
                  <li>
                    <span>👗 Bestie-only closet looks</span>
                    <span>{isBestie ? "Unlocked" : "Locked"}</span>
                  </li>
                  <li>
                    <span>🎮 Bonus XP & coins in Style Lab</span>
                    <span>{isBestie ? "Boosted" : "Standard"}</span>
                  </li>
                </ul>

                <div className="bestie-snapshot__footer">
                  <Link to="/fan/closet-feed" className="bestie-link-inline">
                    Peek Lala&apos;s closet feed →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </header>

        {/* PERKS GRID – why upgrade */}
        <section className="bestie-section bestie-section--perks">
          <div className="bestie-section__head">
            <h2 className="bestie-section__title">
              What Besties unlock inside Lala&apos;s world
            </h2>
            <p className="bestie-section__subtitle">
              It&apos;s not just &quot;no ads&quot; – it&apos;s early access, social glow-up, and
              a personal style sandbox.
            </p>
          </div>

          <div className="bestie-perk-grid">
            <article className="bestie-perk-card">
              <div className="bestie-perk-icon">🎬</div>
              <h3>Early episode drops</h3>
              <p>
                Watch certain episodes early with <strong>Bestie-only</strong> labels. You&apos;re
                reacting before everyone else.
              </p>
              <p className="bestie-perk-note">
                Look for the <span className="bestie-tag">Early access</span> tag on the Episodes
                page.
              </p>
            </article>

            <article className="bestie-perk-card">
              <div className="bestie-perk-icon">👗</div>
              <h3>Digital closet & wishlist</h3>
              <p>
                Heart favorite outfits in{" "}
                <Link to="/fan/closet-feed" className="bestie-link-inline">
                  Lala&apos;s Closet
                </Link>{" "}
                and build inspo boards for TikTok, IG, and future shopping.
              </p>
              <p className="bestie-perk-note">
                Bestie-only drops appear with <span className="bestie-tag">Bestie</span> badges.
              </p>
            </article>

            <article className="bestie-perk-card">
              <div className="bestie-perk-icon">🎮</div>
              <h3>Boosted Style Lab rewards</h3>
              <p>
                Get extra XP/coins and surprise bonuses when you play in{" "}
                <Link to="/fan/closet" className="bestie-link-inline">
                  Style Lab
                </Link>{" "}
                and style new looks.
              </p>
              <p className="bestie-perk-note">
                Perfect for leveling up your profile faster.
              </p>
            </article>

            <article className="bestie-perk-card">
              <div className="bestie-perk-icon">💌</div>
              <h3>Bestie-only vibes</h3>
              <p>
                Occasional surprise mini-drops, polls, and moments where Besties help shape what
                Lala does next.
              </p>
              <p className="bestie-perk-note">
                Bestie is how you vote with your petals for more Styling Adventures.
              </p>
            </article>
          </div>
        </section>

        {/* FAN vs BESTIE COMPARISON */}
        <section className="bestie-section bestie-section--compare">
          <div className="bestie-section__head">
            <h2 className="bestie-section__title">Fan vs Bestie</h2>
            <p className="bestie-section__subtitle">
              You can totally stay a Fan. But Bestie mode is built for the ones who want to live in
              Lala&apos;s world a little more.
            </p>
          </div>

          <div className="bestie-compare">
            <div className="bestie-compare-col bestie-compare-col--fan">
              <div className="bestie-compare-header">
                <span className="bestie-tier-label">Fan</span>
                <span className="bestie-tier-pill">Free</span>
              </div>
              <ul className="bestie-compare-list">
                <li>Watch public episodes</li>
                <li>Play Style Lab with standard XP</li>
                <li>View Lala&apos;s Closet feed</li>
                <li>Basic profile page</li>
              </ul>
            </div>

            <div className="bestie-compare-col bestie-compare-col--bestie">
              <div className="bestie-compare-header">
                <span className="bestie-tier-label">Bestie</span>
                <span className="bestie-tier-pill bestie-tier-pill--highlight">
                  Inner circle
                </span>
              </div>
              <ul className="bestie-compare-list bestie-compare-list--highlight">
                <li>Early access episode drops</li>
                <li>Bestie-only closet items & drops</li>
                <li>Boosted XP/coins in Style Lab</li>
                <li>More ways to show off your fits & progress</li>
                <li>Surprise mini-drops & polls</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SOCIAL / DIGITAL CLOSET PREVIEW */}
        <section className="bestie-section bestie-section--social">
          <div className="bestie-section__head">
            <h2 className="bestie-section__title">Build your own &quot;Lala page&quot;</h2>
            <p className="bestie-section__subtitle">
              Bestie mode turns your profile, closet, and community activity into a mini social hub.
            </p>
          </div>

          <div className="bestie-social-grid">
            <article className="bestie-social-card">
              <h3>Style Lab → Closet</h3>
              <p>
                Experiment in{" "}
                <Link to="/fan/closet" className="bestie-link-inline">
                  Style Lab
                </Link>{" "}
                until you find a combo you love… then recreate it IRL or turn it into a post.
              </p>
              <p className="bestie-social-note">
                Your XP & level help your profile feel like a real styling page.
              </p>
            </article>

            <article className="bestie-social-card">
              <h3>Closet Feed → Socials</h3>
              <p>
                Use{" "}
                <Link to="/fan/closet-feed" className="bestie-link-inline">
                  Lala&apos;s Closet
                </Link>{" "}
                as a moodboard. Save favorites, remix vibes, and screenshot for TikTok or IG inspo.
              </p>
            </article>

            <article className="bestie-social-card">
              <h3>Profile → Fan page</h3>
              <p>
                Your{" "}
                <Link to="/fan/profile" className="bestie-link-inline">
                  profile
                </Link>{" "}
                becomes a tiny fan page: levels, badges, closet preview, and more as you play.
              </p>
              <p className="bestie-social-note">
                Besties usually climb leaderboards faster and stand out in the community.
              </p>
            </article>
          </div>
        </section>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = /* css */ `
.bestie-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

/* SHELL */
.bestie-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* HERO ----------------------------------------------------- */

.bestie-hero {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(248,250,252,0.95);
  box-shadow: 0 24px 60px rgba(15,23,42,0.18);
  background:
    radial-gradient(circle at top left,#fdf2ff,#e0f2fe 45%,transparent 70%),
    radial-gradient(circle at bottom right,#e0e7ff,#f9fafb 60%,#ffffff 100%);
}

.bestie-hero__aura {
  position: absolute;
  inset: -40%;
  background:
    radial-gradient(circle at 0 0,rgba(255,255,255,0.8),transparent 60%),
    radial-gradient(circle at 100% 0,rgba(255,255,255,0.7),transparent 60%);
  pointer-events: none;
  opacity: 0.9;
}

.bestie-hero__inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 20px 18px;
  display: grid;
  grid-template-columns: minmax(0,1.6fr) minmax(0,1fr);
  gap: 18px;
  align-items: stretch;
}

.bestie-hero__left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.bestie-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bestie-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}
.bestie-pill--primary {
  background: #020617;
  color: #f9fafb;
}
.bestie-pill--soft {
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(226,232,240,0.9);
  color: #4b5563;
}

.bestie-hero__title {
  margin: 4px 0 4px;
  font-size: 1.85rem;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #0f172a;
}
.bestie-hero__subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 560px;
}

.bestie-status-row {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.bestie-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  background: #eef2ff;
  color: #374151;
  font-size: 0.78rem;
}
.bestie-status-chip--active {
  background: #ecfdf3;
  color: #166534;
}
.bestie-status-chip--loading {
  background: #fef3c7;
  color: #92400e;
}
.bestie-status-tag {
  font-size: 0.78rem;
  color: #6b7280;
}

/* CTAs */
.bestie-cta-row {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.bestie-btn {
  border-radius: 18px;
  padding: 9px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  cursor: pointer;
  min-height: 48px;
  transition: background .15s ease, box-shadow .15s ease, transform .04s ease, border-color .15s ease;
}
.bestie-btn-main {
  min-width: 200px;
}
.bestie-btn__sub {
  font-size: 0.78rem;
  font-weight: 400;
  opacity: 0.95;
}
.bestie-btn-primary {
  background: linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 10px 26px rgba(79,70,229,0.6);
}
.bestie-btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
  transform:translateY(-1px);
}
.bestie-btn-ghost {
  background:rgba(255,255,255,0.96);
  border-color:rgba(226,232,240,0.95);
  color:#111827;
}
.bestie-btn-ghost:hover {
  background:#eef2ff;
  box-shadow:0 8px 22px rgba(148,163,184,0.4);
  transform:translateY(-1px);
}

.bestie-error-banner {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background:#fef2f2;
  color:#b91c1c;
  font-size:0.82rem;
}

/* Hero steps */
.bestie-steps {
  margin: 10px 0 0;
  padding: 0;
  list-style:none;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.bestie-step {
  background:rgba(255,255,255,0.95);
  border-radius:999px;
  padding:6px 10px;
  display:flex;
  align-items:flex-start;
  gap:6px;
  border:1px solid rgba(226,232,240,0.9);
}
.bestie-step__badge {
  width:18px;
  height:18px;
  border-radius:999px;
  background:#020617;
  color:#f9fafb;
  font-size:0.75rem;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:600;
}
.bestie-step__title {
  font-size:0.8rem;
  font-weight:600;
  color:#111827;
}
.bestie-step__text {
  font-size:0.78rem;
  color:#4b5563;
}

/* Snapshot panel ------------------------------------------ */

.bestie-hero__right {
  display:flex;
  align-items:stretch;
  justify-content:flex-end;
}

.bestie-snapshot {
  background:rgba(255,255,255,0.96);
  border-radius:22px;
  border:1px solid rgba(226,232,240,0.95);
  padding:14px 14px 12px;
  box-shadow:0 16px 42px rgba(148,163,184,0.5);
  width:100%;
  max-width:340px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.bestie-snapshot__header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}
.bestie-snapshot__label {
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:.12em;
  color:#9ca3af;
}
.bestie-snapshot__status {
  font-size:0.95rem;
  font-weight:600;
  color:#111827;
}
.bestie-snapshot__emoji {
  font-size:1.6rem;
}

.bestie-snapshot__meter {
  margin-top:4px;
}
.bestie-snapshot__meter-track {
  width:100%;
  height:8px;
  border-radius:999px;
  background:#e5e7eb;
  overflow:hidden;
}
.bestie-snapshot__meter-fill {
  height:100%;
  width:35%;
  background:linear-gradient(90deg,#a855f7,#ec4899);
  transition:width 200ms ease-out;
}
.bestie-snapshot__meter-fill--full {
  width:100%;
}
.bestie-snapshot__meter-caption {
  margin-top:3px;
  font-size:0.78rem;
  color:#6b7280;
}

.bestie-snapshot__list {
  margin:8px 0 0;
  padding:0;
  list-style:none;
  font-size:0.8rem;
  color:#374151;
}
.bestie-snapshot__list li {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:6px;
  padding:4px 0;
  border-bottom:1px dashed #e5e7eb;
}
.bestie-snapshot__list li:last-child {
  border-bottom:none;
}
.bestie-snapshot__footer {
  margin-top:6px;
  font-size:0.8rem;
}

/* Links */
.bestie-link-inline {
  color:#4f46e5;
  text-decoration:none;
  font-weight:500;
}
.bestie-link-inline:hover {
  text-decoration:underline;
}

/* SECTIONS ------------------------------------------------- */

.bestie-section {
  border-radius:24px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  box-shadow:0 14px 40px rgba(148,163,184,0.18);
  padding:16px 18px 18px;
}
.bestie-section__head {
  margin-bottom:10px;
}
.bestie-section__title {
  margin:0;
  font-size:1.2rem;
  font-weight:600;
  color:#111827;
}
.bestie-section__subtitle {
  margin:3px 0 0;
  font-size:0.9rem;
  color:#6b7280;
}

/* Perks grid */
.bestie-perk-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;
}
.bestie-perk-card {
  border-radius:18px;
  padding:10px 12px 12px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.bestie-perk-icon {
  font-size:1.3rem;
}
.bestie-perk-card h3 {
  margin:0;
  font-size:0.95rem;
}
.bestie-perk-card p {
  margin:0;
  font-size:0.86rem;
  color:#4b5563;
}
.bestie-perk-note {
  font-size:0.8rem;
  color:#6b7280;
}
.bestie-tag {
  display:inline-flex;
  align-items:center;
  padding:2px 8px;
  border-radius:999px;
  background:#eef2ff;
  color:#4338ca;
  font-size:0.7rem;
}

/* Compare */
.bestie-compare {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:14px;
}
.bestie-compare-col {
  border-radius:18px;
  padding:12px 12px 14px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
}
.bestie-compare-col--bestie {
  background:radial-gradient(circle at top,#fdf2ff,#eef2ff);
  border-color:#ddd6fe;
}
.bestie-compare-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:6px;
}
.bestie-tier-label {
  font-size:0.9rem;
  font-weight:600;
}
.bestie-tier-pill {
  font-size:0.75rem;
  padding:3px 8px;
  border-radius:999px;
  background:#f3f4f6;
  color:#374151;
}
.bestie-tier-pill--highlight {
  background:#ecfdf3;
  color:#166534;
}
.bestie-compare-list {
  margin:0;
  padding-left:16px;
  font-size:0.86rem;
  color:#4b5563;
}
.bestie-compare-list--highlight li::marker {
  color:#a855f7;
}

/* Social/closet preview */
.bestie-social-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
  gap:12px;
}
.bestie-social-card {
  border-radius:18px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:10px 12px 12px;
}
.bestie-social-card h3 {
  margin:0 0 4px;
  font-size:0.95rem;
}
.bestie-social-card p {
  margin:0 0 4px;
  font-size:0.86rem;
  color:#4b5563;
}
.bestie-social-note {
  font-size:0.8rem;
  color:#6b7280;
}

/* Responsive ---------------------------------------------- */

@media (max-width: 900px) {
  .bestie-hero__inner {
    grid-template-columns:minmax(0,1fr);
    padding:16px 14px 16px;
  }
  .bestie-hero__right {
    justify-content:flex-start;
  }
}

@media (max-width: 640px) {
  .bestie-hero__title {
    font-size:1.5rem;
  }
  .bestie-steps {
    flex-direction:column;
    align-items:flex-start;
  }
}
`;
