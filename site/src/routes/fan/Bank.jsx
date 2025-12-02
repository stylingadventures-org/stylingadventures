// site/src/routes/fan/Bank.jsx
import React, { useEffect, useState } from "react";
import { fetchProfile } from "../../lib/sa";

export default function Bank() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const p = await fetchProfile();
        if (!gone) setProfile(p || {});
      } catch (e) {
        console.error("[Bank] fetchProfile error", e);
        if (!gone) setError("We couldn’t load your bank balance.");
      } finally {
        if (!gone) setLoading(false);
      }
    })();
    return () => {
      gone = true;
    };
  }, []);

  const coins = profile?.coins ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streakCount ?? 0;

  return (
    <div className="bank-page">
      <style>{styles}</style>

      {/* HERO */}
      <header className="bank-hero">
        <div className="bank-hero-inner">
          <div>
            <div className="bank-pill">Lala Bank 🏦</div>
            <h1 className="bank-title">Let&apos;s get this muphuckin MONEY</h1>
            <p className="bank-sub">
              This is your coin balance inside Styling Adventures. Earn coins by
              watching episodes, playing style games, and keeping your streak
              alive—then spend them on fun unlocks.
            </p>

            <div className="bank-links">
              <a href="/fan/rules" className="bank-link">
                How coins work →
              </a>
              <a href="/fan/episodes" className="bank-link">
                Browse episodes →
              </a>
              <a href="/fan/closet" className="bank-link">
                Play style games →
              </a>
            </div>
          </div>

          <div className="bank-balance-card">
            <div className="bank-balance-label">Current balance</div>
            <div className="bank-balance-value">
              {loading ? "…" : coins.toLocaleString()}
              <span className="bank-balance-suffix"> coins</span>
            </div>
            <div className="bank-balance-meta">
              Level {level} • Streak {streak} day{streak === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {error && <div className="bank-error">{error}</div>}
      </header>

      {/* BODY */}
      <main className="bank-main">
        <section className="bank-card">
          <h2 className="bank-card-title">How to earn more</h2>
          <p className="bank-card-sub">
            You get coins for being active. Some actions give a few coins, some
            give more. Check the{" "}
            <a href="/fan/rules" className="bank-inline-link">
              coin rules
            </a>{" "}
            page for the exact numbers.
          </p>

          <ul className="bank-list">
            <li>🎬 Watch new episodes and early drops.</li>
            <li>🧪 Play style games in the Style Lab.</li>
            <li>🔥 Keep your daily streak going.</li>
            <li>💬 Join special events and challenges.</li>
          </ul>
        </section>

        <section className="bank-card">
          <h2 className="bank-card-title">What you can spend on</h2>
          <p className="bank-card-sub">
            As we roll out more perks, you&apos;ll see coin prices show up on
            episodes, closet items and other goodies.
          </p>
          <ul className="bank-list">
            <li>🔓 Unlock certain episodes early.</li>
            <li>👗 Redeem Lala&apos;s closet items or style packs.</li>
            <li>☕ Future perks like &quot;Coffee with Lala&quot; or
              behind-the-scenes drops.
            </li>
          </ul>
          <p className="bank-footnote">
            Prices may change as we balance the game, but your earned coins will
            always stay yours.
          </p>
        </section>
      </main>
    </div>
  );
}

const styles = `
.bank-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO --------------------------------------------------- */
.bank-hero {
  border-radius:24px;
  padding:18px 20px;
  background:
    radial-gradient(circle at top left,#ffe7f6,#fdf2ff 45%),
    radial-gradient(circle at bottom right,#e0f2fe,#ffffff 70%);
  border:1px solid rgba(244,220,255,0.9);
  box-shadow:0 18px 40px rgba(148,163,184,0.3);
}

.bank-hero-inner {
  max-width:960px;
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,2.1fr) minmax(0,1.4fr);
  gap:16px;
  align-items:flex-start;
}
@media (max-width: 880px) {
  .bank-hero-inner {
    grid-template-columns:minmax(0,1fr);
  }
}

.bank-pill {
  display:inline-flex;
  align-items:center;
  padding:4px 10px;
  border-radius:999px;
  background:rgba(255,255,255,0.96);
  border:1px solid rgba(244,220,255,0.9);
  font-size:11px;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:#6b21a8;
}

.bank-title {
  margin:6px 0 4px;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  background:linear-gradient(90deg,#4c1d95,#ec4899);
  -webkit-background-clip:text;
  color:transparent;
}

.bank-sub {
  margin:0;
  font-size:0.95rem;
  color:#374151;
  max-width:34rem;
}

.bank-links {
  margin-top:8px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.bank-link {
  font-size:0.84rem;
  color:#4c1d95;
  text-decoration:none;
}
.bank-link:hover {
  text-decoration:underline;
}

/* Balance card ------------------------------------------- */
.bank-balance-card {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 32px rgba(148,163,184,0.25);
  padding:12px 14px 14px;
  min-width:220px;
}

.bank-balance-label {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#6b7280;
}
.bank-balance-value {
  margin-top:4px;
  font-size:2rem;
  font-weight:800;
  color:#111827;
}
.bank-balance-suffix {
  font-size:0.9rem;
  margin-left:4px;
  color:#6b7280;
}
.bank-balance-meta {
  margin-top:4px;
  font-size:0.8rem;
  color:#9ca3af;
}

.bank-error {
  margin-top:8px;
  padding:8px 10px;
  border-radius:12px;
  background:#fef2f2;
  border:1px solid #fecaca;
  font-size:0.9rem;
  color:#7f1d1d;
}

/* MAIN --------------------------------------------------- */
.bank-main {
  max-width:960px;
  margin:8px auto 24px;
  display:grid;
  grid-template-columns:minmax(0,1.4fr) minmax(0,1.4fr);
  gap:16px;
}
@media (max-width: 880px) {
  .bank-main {
    grid-template-columns:minmax(0,1fr);
  }
}

.bank-card {
  background:#ffffff;
  border-radius:20px;
  padding:14px 16px 16px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 32px rgba(148,163,184,0.2);
}
.bank-card-title {
  margin:0 0 4px;
  font-size:1.1rem;
  font-weight:600;
  color:#111827;
}
.bank-card-sub {
  margin:0 0 8px;
  font-size:0.9rem;
  color:#6b7280;
}
.bank-list {
  margin:0;
  padding-left:1.2rem;
  font-size:0.9rem;
  color:#4b5563;
  display:grid;
  gap:4px;
}
.bank-footnote {
  margin-top:8px;
  font-size:0.8rem;
  color:#9ca3af;
}
.bank-inline-link {
  color:#4c1d95;
  text-decoration:none;
}
.bank-inline-link:hover {
  text-decoration:underline;
}
`;
