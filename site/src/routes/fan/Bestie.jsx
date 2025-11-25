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
      // full redirect to Stripe checkout (or your billing page)
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
      <main className="bestie-main">
        {/* Hero */}
        <header className="bestie-hero card">
          <div className="bestie-hero__left">
            <div className="fan-pill">Bestie tier</div>
            <h1>Unlock Bestie mode 💖</h1>
            <p>
              Get early drops, exclusive closet looks, and bonus game rewards
              when you join Lala’s Besties. Your support keeps new episodes and
              style experiments coming.
            </p>

            {loading ? (
              <div className="bestie-status-chip bestie-status-chip--loading">
                Checking your Bestie status…
              </div>
            ) : isBestie ? (
              <div className="bestie-status-chip bestie-status-chip--active">
                You&apos;re a <strong>{tier === "PAID" ? "Paid" : "Free"}</strong> Bestie
                {niceExpiry ? ` · through ${niceExpiry}` : ""}.
              </div>
            ) : (
              <div className="bestie-status-chip">
                You&apos;re currently on the{" "}
                <strong>fan</strong> tier.
              </div>
            )}
          </div>

          <div className="bestie-hero__right">
            <div className="bestie-perks card">
              <h2>What Besties get</h2>
              <ul>
                <li>🌟 Early access to select episodes</li>
                <li>👗 Bestie-only closet drops & exclusive looks</li>
                <li>🎮 Bonus coins / XP in style games</li>
                <li>💌 Occasional surprise mini-drops & polls</li>
              </ul>

              {err && (
                <div className="bestie-error">
                  <strong>Oops:</strong> {err}
                </div>
              )}

              {/* CTA logic */}
              {loading ? null : isBestie ? (
                <div className="bestie-cta bestie-cta--active">
                  <p>
                    Thanks for being a Bestie! You’ll automatically see Bestie
                    content across the app whenever it’s available.
                  </p>
                  <Link to="/fan/closet" className="btn btn-primary">
                    Browse Bestie closet looks
                  </Link>
                </div>
              ) : (
                <div className="bestie-cta">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartCheckout}
                    disabled={busy}
                  >
                    {busy ? "Starting checkout…" : "Join Besties"}
                  </button>
                  <p className="bestie-cta__hint">
                    You’ll be redirected to a secure checkout page to complete
                    your Bestie membership.
                  </p>

                  {/* Optional trial CTA – only show if backend treats FREE tier / trial separately */}
                  {!hasSub && tier === "FREE" && (
                    <button
                      type="button"
                      className="btn btn-secondary bestie-trial-btn"
                      onClick={handleClaimTrial}
                      disabled={busy}
                    >
                      {busy ? "Claiming trial…" : "Or claim a free trial first"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Secondary section: explain gating so users understand */}
        <section className="bestie-info card">
          <h2>Where Bestie shows up</h2>
          <div className="bestie-info__grid">
            <div className="bestie-info__item">
              <h3>Closet</h3>
              <p>
                Items marked <strong>Bestie only</strong> or{" "}
                <strong>Exclusive drops</strong> in Lala&apos;s closet are
                unlocked for active Besties.
              </p>
              <Link to="/fan/closet-feed" className="bestie-link">
                Peek at the closet feed →
              </Link>
            </div>
            <div className="bestie-info__item">
              <h3>Episodes</h3>
              <p>
                Some episodes show up early for Besties. If you see an{" "}
                <strong>Early access</strong> label, that&apos;s you.
              </p>
            </div>
            <div className="bestie-info__item">
              <h3>Style games</h3>
              <p>
                Extra coins, XP streaks, or secret challenges may appear when
                you&apos;re in Bestie mode.
              </p>
              <Link to="/fan/games" className="bestie-link">
                Play a style game →
              </Link>
            </div>
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
  padding: 16px;
}

.card {
  border-radius: 24px;
  background: #fdfbff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 40px rgba(148,163,184,0.32);
}

.bestie-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Hero */
.bestie-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 20px;
  padding: 20px 22px;
  background:
    radial-gradient(circle at top left,#fce7f3,#f9fafb 60%),
    radial-gradient(circle at bottom right,#e0e7ff,#ffffff);
}

.bestie-hero__left h1 {
  margin: 4px 0 8px;
  font-size: 24px;
  letter-spacing: -0.02em;
}

.bestie-hero__left p {
  margin: 0;
  font-size: 14px;
  color: #4b5563;
}

.fan-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #020617;
  color: #f9fafb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.bestie-hero__right {
  display: flex;
  justify-content: flex-end;
}

.bestie-perks {
  padding: 14px 16px 16px;
  max-width: 360px;
  width: 100%;
  background: rgba(248,250,252,0.95);
}

.bestie-perks h2 {
  margin: 0 0 6px;
  font-size: 16px;
}

.bestie-perks ul {
  margin: 0 0 10px;
  padding-left: 18px;
  font-size: 13px;
  color: #4b5563;
}

.bestie-status-chip {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4b5563;
  font-size: 12px;
}

.bestie-status-chip--active {
  background: #ecfdf3;
  color: #166534;
}

.bestie-status-chip--loading {
  background: #fef3c7;
  color: #92400e;
}

.bestie-cta {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bestie-cta__hint {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}

.bestie-trial-btn {
  font-size: 12px;
  padding: 6px 10px;
}

.bestie-error {
  margin: 4px 0 0;
  padding: 6px 8px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
}

/* Info section */

.bestie-info {
  padding: 16px 18px 18px;
}

.bestie-info h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.bestie-info__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
  gap: 12px;
  margin-top: 6px;
}

.bestie-info__item {
  padding: 10px 12px;
  border-radius: 18px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.bestie-info__item h3 {
  margin: 0 0 4px;
  font-size: 14px;
}

.bestie-info__item p {
  margin: 0 0 6px;
  font-size: 13px;
  color: #4b5563;
}

.bestie-link {
  font-size: 12px;
  color: #4f46e5;
  text-decoration: underline;
}

/* Buttons (reuse existing btn classes where possible) */

.btn {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg,#a855f7,#6366f1);
  color: #fff;
}

.btn-secondary {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #111827;
}

@media (max-width: 900px) {
  .bestie-hero {
    grid-template-columns: minmax(0,1fr);
  }
  .bestie-hero__right {
    justify-content: flex-start;
  }
}
`;
