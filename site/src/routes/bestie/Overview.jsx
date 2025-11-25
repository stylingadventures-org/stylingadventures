// site/src/routes/bestie/Overview.jsx
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

export default function BestieOverview() {
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
      console.error("[BestieOverview] loadStatus error", e);
      setErr("We couldn't load your Bestie status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const isBestie = !!status?.isBestie;
  const tier = status?.tier || "FREE";
  const expiresAt = formatDate(status?.expiresAt);
  const hasSub = !!status?.activeSubscription;

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
      window.location.href = url; // Stripe / billing page
    } catch (e) {
      console.error("[BestieOverview] startCheckout error", e);
      setErr("Couldn't start checkout. Please try again.");
      setBusy(false);
    }
  }

  async function handleClaimTrial() {
    try {
      setBusy(true);
      setErr("");
      const s = await claimBestieTrial();
      if (!s) {
        setErr("Couldn't claim your trial. Please try again.");
      } else {
        setStatus(s);
      }
    } catch (e) {
      console.error("[BestieOverview] claimTrial error", e);
      setErr("Couldn't claim your trial. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bestie-overview-page">
      <section className="bestie-hero-card">
        <div className="bestie-hero-left">
          <div className="bestie-pill">Bestie Tier</div>
          <h1>Unlock Bestie mode 💖</h1>
          <p>
            Join Lala&apos;s Besties for early drops, exclusive closet looks, and
            bonus game rewards. Your support keeps new episodes and style
            experiments coming.
          </p>

          {loading ? (
            <div className="bestie-status bestie-status--loading">
              Checking your Bestie status…
            </div>
          ) : isBestie ? (
            <div className="bestie-status bestie-status--active">
              You&apos;re a{" "}
              <strong>{tier === "PAID" ? "Paid Bestie" : "Free Bestie"}</strong>
              {expiresAt ? ` · through ${expiresAt}` : ""}.
            </div>
          ) : (
            <div className="bestie-status">
              You&apos;re currently on the <strong>fan tier</strong>.
            </div>
          )}
        </div>

        <div className="bestie-hero-right">
          <div className="bestie-perks">
            <h2>Bestie perks</h2>
            <ul>
              <li>🌟 Early access to select episodes</li>
              <li>👗 Bestie-only closet drops & exclusive looks</li>
              <li>🎮 Bonus coins / XP in style games</li>
              <li>💌 Surprise polls & mini-drops</li>
            </ul>

            {err && (
              <div className="bestie-error">
                <strong>Oops:</strong> {err}
              </div>
            )}

            {loading ? null : isBestie ? (
              <div className="bestie-cta bestie-cta--active">
                <p>
                  Thanks for being a Bestie! You&apos;ll see Bestie content
                  wherever it&apos;s available in the app.
                </p>
                <Link to="/fan/closet-feed" className="btn btn-primary">
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
                <p className="bestie-cta-hint">
                  You&apos;ll be taken to a secure checkout page to complete your
                  Bestie membership.
                </p>

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
      </section>

      {/* Secondary info card */}
      <section className="bestie-info-card">
        <h2>Where Bestie unlocks things</h2>
        <div className="bestie-info-grid">
          <div className="bestie-info-item">
            <h3>Closet</h3>
            <p>
              Items marked <strong>Bestie only</strong> or{" "}
              <strong>Exclusive drop</strong> in Lala&apos;s closet are unlocked
              for active Besties.
            </p>
            <Link to="/fan/closet-feed" className="bestie-link">
              See the closet feed →
            </Link>
          </div>
          <div className="bestie-info-item">
            <h3>Episodes</h3>
            <p>
              Some episodes show up early for Besties. Look for the{" "}
              <strong>Early access</strong> label.
            </p>
          </div>
          <div className="bestie-info-item">
            <h3>Style games</h3>
            <p>
              Extra coins, XP streaks, or secret challenges may appear when
              you&apos;re in Bestie mode.
            </p>
            <Link to="/fan" className="bestie-link">
              Go to fan dashboard →
            </Link>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = /* css */ `
.bestie-overview-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* Hero card */
.bestie-hero-card {
  display:grid;
  grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);
  gap:20px;
  padding:18px 20px;
  border-radius:24px;
  border:1px solid #e5e7eb;
  background:
    radial-gradient(circle at top left,#fce7f3,#f9fafb 60%),
    radial-gradient(circle at bottom right,#e0e7ff,#ffffff);
  box-shadow:0 18px 40px rgba(148,163,184,0.32);
}
.bestie-hero-left h1 {
  margin:6px 0 8px;
  font-size:22px;
  letter-spacing:-0.02em;
}
.bestie-hero-left p {
  margin:0;
  font-size:14px;
  color:#4b5563;
  max-width:420px;
}
.bestie-pill {
  display:inline-flex;
  align-items:center;
  padding:4px 10px;
  border-radius:999px;
  background:#020617;
  color:#f9fafb;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.14em;
}
.bestie-status {
  margin-top:10px;
  display:inline-flex;
  align-items:center;
  padding:5px 10px;
  border-radius:999px;
  background:#eef2ff;
  color:#4b5563;
  font-size:12px;
}
.bestie-status--active {
  background:#ecfdf3;
  color:#166534;
}
.bestie-status--loading {
  background:#fef3c7;
  color:#92400e;
}

.bestie-hero-right {
  display:flex;
  justify-content:flex-end;
}
.bestie-perks {
  max-width:360px;
  width:100%;
  border-radius:20px;
  background:rgba(248,250,252,0.96);
  border:1px solid #e5e7eb;
  padding:14px 16px 16px;
}
.bestie-perks h2 {
  margin:0 0 6px;
  font-size:16px;
}
.bestie-perks ul {
  margin:0 0 10px;
  padding-left:18px;
  font-size:13px;
  color:#4b5563;
}
.bestie-error {
  margin:4px 0 0;
  padding:6px 8px;
  border-radius:10px;
  background:#fef2f2;
  color:#b91c1c;
  font-size:12px;
}

.bestie-cta {
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.bestie-cta-hint {
  margin:0;
  font-size:11px;
  color:#6b7280;
}
.bestie-cta--active p {
  margin:0 0 6px;
  font-size:12px;
  color:#4b5563;
}
.bestie-trial-btn {
  font-size:12px;
  padding:6px 12px;
}

/* Info card */
.bestie-info-card {
  border-radius:22px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  padding:16px 18px 18px;
  box-shadow:0 10px 30px rgba(148,163,184,0.2);
}
.bestie-info-card h2 {
  margin:0 0 8px;
  font-size:18px;
}
.bestie-info-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;
  margin-top:6px;
}
.bestie-info-item {
  border-radius:16px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:10px 12px;
}
.bestie-info-item h3 {
  margin:0 0 4px;
  font-size:14px;
}
.bestie-info-item p {
  margin:0 0 6px;
  font-size:13px;
  color:#4b5563;
}
.bestie-link {
  font-size:12px;
  color:#4f46e5;
  text-decoration:underline;
}

/* Buttons (reuse your general look) */
.btn {
  border-radius:999px;
  border:1px solid transparent;
  padding:8px 16px;
  font-size:13px;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.btn-primary {
  background:linear-gradient(135deg,#a855f7,#6366f1);
  color:#fff;
}
.btn-secondary {
  background:#f9fafb;
  border-color:#e5e7eb;
  color:#111827;
}

@media (max-width: 900px) {
  .bestie-hero-card {
    grid-template-columns:minmax(0,1fr);
  }
  .bestie-hero-right {
    justify-content:flex-start;
  }
}
`;
