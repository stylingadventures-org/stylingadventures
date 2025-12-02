// site/src/routes/fan/FanGameRules.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORY_LABELS = {
  WATCH_TIME: "Watch time",
  CHAT: "Chat & comments",
  TRIVIA: "Trivia & games",
  STREAK: "Streaks",
  SOCIAL: "Sharing & friends",
  EVENT: "Special events",
  REDEMPTION: "Redemptions",
  OTHER: "Other",
};

function groupByCategory(rules = []) {
  const out = {};
  for (const r of rules) {
    const cat = (r.category || "OTHER").toUpperCase();
    if (!out[cat]) out[cat] = [];
    out[cat].push(r);
  }
  return out;
}

export default function FanGameRules() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        if (window.sa?.ready) {
          await window.sa.ready();
        } else if (window.getSA) {
          await window.getSA();
        }

        const r = await window.sa.graphql(
          `query GetGameEconomyConfig {
            getGameEconomyConfig {
              id
              updatedAt
              coinToUsdRatio
              dailyCoinCap
              weeklyCoinCap
              monthlyBonusEventsLimit
              rules {
                id
                category
                label
                description
                coins
                per
                maxPerDay
              }
            }
          }`
        );

        if (!alive) return;
        setConfig(r?.getGameEconomyConfig || null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(
    () => groupByCategory(config?.rules || []),
    [config]
  );

  const lastUpdated = useMemo(() => {
    if (!config?.updatedAt) return "";
    const d = new Date(config.updatedAt);
    return d.toLocaleString();
  }, [config]);

  const coinValueLine = useMemo(() => {
    if (!config) return null;
    const v = Number(config.coinToUsdRatio || 0);
    if (!v) return null;
    return `Roughly, 1 coin ≈ $${v.toFixed(2)} in reward value (not cash).`;
  }, [config]);

  return (
    <div className="fan-rules-page">
      {/* HERO */}
      <header className="fan-rules-hero">
        <div className="fan-rules-hero-inner">
          <div className="fan-rules-hero-top">
            <div className="fan-rules-hero-pill">Lala’s world · Game rules</div>
            <Link to="/fan" className="fan-rules-link">
              ← Back to fan home
            </Link>
          </div>
          <h1 className="fan-rules-title">How Lala&apos;s coins work</h1>
          <p className="fan-rules-sub">
            Coins are how Lala says “thank you” for hanging out, watching,
            chatting, styling outfits, and sharing the show. This page shows the
            live rules for how you earn and use coins in Lala’s world.
          </p>

          <div className="fan-rules-summary">
            <div className="fan-rules-summary-card">
              <div className="fan-rules-summary-label">Daily coin cap</div>
              <div className="fan-rules-summary-value">
                {config?.dailyCoinCap ?? "–"}
              </div>
              <p className="fan-rules-summary-text">
                Max coins you can earn in one day across all activities.
              </p>
            </div>
            <div className="fan-rules-summary-card">
              <div className="fan-rules-summary-label">Weekly coin cap</div>
              <div className="fan-rules-summary-value">
                {config?.weeklyCoinCap ?? "–"}
              </div>
              <p className="fan-rules-summary-text">
                Keeps things fair and prevents farming.
              </p>
            </div>
            <div className="fan-rules-summary-card">
              <div className="fan-rules-summary-label">Special events / month</div>
              <div className="fan-rules-summary-value">
                {config?.monthlyBonusEventsLimit ?? "–"}
              </div>
              <p className="fan-rules-summary-text">
                Double-coin days & surprise drops per month.
              </p>
            </div>
          </div>

          {coinValueLine && (
            <p className="fan-rules-note">
              💡 <strong>Coin value:</strong> {coinValueLine} Coins are{" "}
              <strong>not real money</strong> and can&apos;t be cashed out or
              traded with other players.
            </p>
          )}

          {lastUpdated && (
            <p className="fan-rules-meta">
              Last updated: <strong>{lastUpdated}</strong>
            </p>
          )}

          {err && (
            <div className="fan-rules-error">
              Couldn&apos;t load the latest rules. You can still play — we&apos;ll
              try again next time you open this page.
              <br />
              <code>{err}</code>
            </div>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="fan-rules-main">
        <section className="fan-rules-section">
          <h2>Big picture</h2>
          <ul className="fan-rules-list">
            <li>
              You earn coins by <strong>engaging</strong> — watching episodes,
              chatting, playing trivia, styling outfits, and sharing the show.
            </li>
            <li>
              Coins are used to unlock <strong>fun perks</strong> inside Lala&apos;s
              world: early episode access, raffles, special content,
              discounts, and more (never gambling or cashback).
            </li>
            <li>
              There are daily & weekly caps so one person can&apos;t
              <strong>farm</strong> coins endlessly.
            </li>
            <li>
              If spam or cheating is detected, coins can be{" "}
              <strong>frozen or removed</strong> by the admin team.
            </li>
          </ul>
        </section>

        {/* Category sections rendered from config */}
        {Object.entries(grouped).map(([cat, rules]) => (
          <section key={cat} className="fan-rules-section">
            <h2>{CATEGORY_LABELS[cat] || "Other"}</h2>
            <ul className="fan-rules-list fan-rules-list--cards">
              {rules.map((r) => (
                <li key={r.id} className="fan-rules-ruleCard">
                  <div className="fan-rules-ruleHead">
                    <div className="fan-rules-ruleLabel">{r.label}</div>
                    <div className="fan-rules-ruleReward">
                      {r.coins >= 0 ? "+" : ""}
                      {r.coins} coin{Math.abs(r.coins) === 1 ? "" : "s"}
                      {r.per ? (
                        <span className="fan-rules-rulePer"> · {r.per}</span>
                      ) : null}
                    </div>
                  </div>
                  {r.description && (
                    <p className="fan-rules-ruleText">{r.description}</p>
                  )}
                  {r.maxPerDay != null && (
                    <div className="fan-rules-ruleMeta">
                      Max per day: <strong>{r.maxPerDay}</strong>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="fan-rules-section">
          <h2>Spending coins</h2>
          <p className="fan-rules-paragraph">
            Lala may offer unlocks like early episode access, raffles, or
            special merch rewards. Each unlock will clearly show its{" "}
            <strong>coin cost</strong> and any extra requirements (for example:
            “must have a 7-day watch streak”).
          </p>
          <p className="fan-rules-paragraph">
            You&apos;ll always see your current{" "}
            <strong>coin balance</strong> before you confirm anything. Once you
            spend coins, the action can&apos;t be undone unless there was a
            technical issue or confirmed bug.
          </p>
        </section>

        <section className="fan-rules-section">
          <h2>Fair play & safety</h2>
          <ul className="fan-rules-list">
            <li>No coin trading, selling, or &quot;black market&quot; coins.</li>
            <li>No spam, bots, or fake accounts to farm coins.</li>
            <li>
              We reserve the right to freeze/reduce coins for accounts that
              break the rules or harass others.
            </li>
          </ul>
          <p className="fan-rules-paragraph">
            If you ever have questions about a reward or your balance, you can
            contact the team through the support link in the app.
          </p>
        </section>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.fan-rules-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO ----------------------------------------------------- */
.fan-rules-hero {
  border-radius:24px;
  padding:14px 16px 18px;
  background:
    radial-gradient(circle at top left,#ffe7f6 0,#fff5fb 35%,transparent 70%),
    radial-gradient(circle at bottom right,#e0f2fe 0,#eef2ff 40%,transparent 75%),
    linear-gradient(135deg,#a855f7,#ec4899);
  border:1px solid rgba(244,184,255,0.9);
  box-shadow:0 18px 40px rgba(129,140,248,0.4);
  color:#0f172a;
}
.fan-rules-hero-inner {
  max-width:960px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.fan-rules-hero-top {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}
.fan-rules-hero-pill {
  padding:4px 10px;
  border-radius:999px;
  background:rgba(255,255,255,0.96);
  border:1px solid rgba(244,184,255,0.9);
  font-size:11px;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:#6b21a8;
}
.fan-rules-link {
  font-size:0.85rem;
  color:#4b5563;
  text-decoration:none;
}
.fan-rules-link:hover {
  text-decoration:underline;
}
.fan-rules-title {
  margin:0;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  background:linear-gradient(90deg,#4c1d95,#ec4899);
  -webkit-background-clip:text;
  color:transparent;
}
.fan-rules-sub {
  margin:0;
  font-size:0.95rem;
  color:#374151;
}
.fan-rules-summary {
  margin-top:6px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:10px;
}
.fan-rules-summary-card {
  background:rgba(255,255,255,0.96);
  border-radius:18px;
  border:1px solid rgba(233,213,255,0.95);
  padding:8px 10px;
  box-shadow:0 12px 30px rgba(148,163,184,0.3);
}
.fan-rules-summary-label {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#6b7280;
}
.fan-rules-summary-value {
  font-size:1.4rem;
  font-weight:800;
  color:#111827;
}
.fan-rules-summary-text {
  margin:2px 0 0;
  font-size:0.8rem;
  color:#6b7280;
}
.fan-rules-note {
  margin:6px 0 0;
  font-size:0.85rem;
  color:#111827;
}
.fan-rules-meta {
  margin:2px 0 0;
  font-size:0.78rem;
  color:#4b5563;
}
.fan-rules-error {
  margin-top:6px;
  padding:8px 10px;
  border-radius:10px;
  border:1px solid #fecaca;
  background:#fef2f2;
  color:#7f1d1d;
  font-size:0.8rem;
}

/* MAIN ----------------------------------------------------- */
.fan-rules-main {
  max-width:960px;
  margin:8px auto 32px;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.fan-rules-section h2 {
  margin:0 0 6px;
  font-size:1.1rem;
}
.fan-rules-list {
  margin:0;
  padding-left:18px;
  font-size:0.9rem;
  color:#374151;
}
.fan-rules-list li + li {
  margin-top:4px;
}
.fan-rules-list--cards {
  padding-left:0;
  list-style:none;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:8px;
}
.fan-rules-ruleCard {
  border-radius:16px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  padding:8px 10px;
}
.fan-rules-ruleHead {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:6px;
}
.fan-rules-ruleLabel {
  font-size:0.92rem;
  font-weight:600;
  color:#111827;
}
.fan-rules-ruleReward {
  font-size:0.8rem;
  font-weight:600;
  color:#6b21a8;
  white-space:nowrap;
}
.fan-rules-rulePer {
  color:#4b5563;
}
.fan-rules-ruleText {
  margin:2px 0 0;
  font-size:0.84rem;
  color:#4b5563;
}
.fan-rules-ruleMeta {
  margin-top:4px;
  font-size:0.78rem;
  color:#6b7280;
}
.fan-rules-paragraph {
  margin:2px 0 0;
  font-size:0.9rem;
  color:#374151;
}

/* small responsive tweak */
@media (max-width:640px) {
  .fan-rules-title {
    font-size:1.4rem;
  }
}
`;
