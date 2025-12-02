// site/src/routes/fan/FanRules.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function FanRules() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        const r = await window.sa?.graphql?.(`
          query GetGameEconomyConfig {
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
                meta
              }
            }
          }
        `);

        if (!alive) return;

        const cfg = r?.getGameEconomyConfig || null;
        if (!cfg) {
          setError(
            "We couldn’t load the latest coin rules. Please try again soon."
          );
        } else {
          setConfig(cfg);
        }
      } catch (e) {
        console.error("[FanRules] failed", e);
        if (!alive) return;
        setError(
          "We couldn’t load the latest coin rules. Please try again soon."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const rules = Array.isArray(config?.rules) ? config.rules : [];

  const earnRules = useMemo(
    () => rules.filter((r) => (r.coins ?? 0) > 0),
    [rules]
  );
  const spendRules = useMemo(
    () =>
      rules.filter(
        (r) => (r.coins ?? 0) < 0 || String(r.category).toUpperCase() === "REDEMPTION"
      ),
    [rules]
  );

  const dailyCap = config?.dailyCoinCap ?? null;
  const weeklyCap = config?.weeklyCoinCap ?? null;
  const monthlyEvents = config?.monthlyBonusEventsLimit ?? null;
  const coinToUsd = config?.coinToUsdRatio ?? null;

  const lastUpdated = useMemo(() => {
    if (!config?.updatedAt) return "";
    return new Date(config.updatedAt).toLocaleString();
  }, [config]);

  return (
    <div className="fan-rules">
      <style>{styles}</style>

      {/* HERO */}
      <section className="fan-rules-hero">
        <div className="fan-rules-hero__eyebrow">
          Game Guide 🎮 · Live rules from Lala Bank
        </div>
        <h1 className="fan-rules-hero__title">
          How Lala Coins &amp; petals work
        </h1>
        <p className="fan-rules-hero__subtitle">
          Coins live in your Lala Bank and unlock fun extras. Petals (XP) level
          up your profile. This sheet is synced with Lala&apos;s admin tools so
          when she updates things, you see it here.
        </p>

        <div className="fan-rules-hero__pill-row">
          <div className="fan-rules-pill">
            <span className="fan-rules-pill__icon">🪙</span>
            Coins are your in-world money
          </div>
          <div className="fan-rules-pill">
            <span className="fan-rules-pill__icon">🌸</span>
            Petals (XP) show progress &amp; levels
          </div>
          <div className="fan-rules-pill">
            <span className="fan-rules-pill__icon">🔥</span>
            Streaks + events give bonuses
          </div>
          <div className="fan-rules-pill">
            <span className="fan-rules-pill__icon">🏦</span>
            <Link to="/fan/bank" className="fan-rules-pill-link">
              View your Lala Bank →
            </Link>
          </div>
        </div>

        {coinToUsd != null && coinToUsd > 0 && (
          <div className="fan-rules-hero__hint">
            Current setting: <strong>1 coin ≈ ${coinToUsd}</strong> of prize /
            reward value inside Lala&apos;s world.
          </div>
        )}

        {lastUpdated && (
          <div className="fan-rules-hero__updated">
            Rules last updated: <span>{lastUpdated}</span>
          </div>
        )}
      </section>

      {loading && (
        <div className="rules-loading">Loading the latest rules…</div>
      )}
      {error && !loading && <div className="rules-error">{error}</div>}

      {!loading && !error && (
        <section className="fan-rules-grid">
          {/* LEFT: EARNING + SPENDING */}
          <div className="rules-card">
            <h2 className="rules-card__title">
              <span className="emoji">🪙</span> Earning coins
            </h2>
            <p className="rules-card__subtitle">
              These are the main ways you can earn Lala Coins. Some actions
              have daily limits to keep the economy fair.
            </p>

            {earnRules.length > 0 ? (
              <div className="rules-table">
                <div className="rules-table__head">
                  <div>Action</div>
                  <div>Coins</div>
                  <div>Notes</div>
                </div>
                {earnRules.map((rule) => (
                  <div key={rule.id} className="rules-table__row">
                    <div>{rule.label || "Action"}</div>
                    <div className="rules-table__cell--coins">
                      +{rule.coins ?? 0}
                    </div>
                    <div>
                      <span className="rules-table__pill">
                        {rule.maxPerDay != null
                          ? `Max ${rule.maxPerDay}/day`
                          : "Limit may apply"}
                      </span>
                      {rule.description && (
                        <span style={{ marginLeft: 6 }}>
                          {rule.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rules-highlight">
                Lala&apos;s still tuning the detailed coin rules. For now, most
                watch time, chat, and style-game actions earn a small number of
                coins and petals.
              </div>
            )}

            {dailyCap && (
              <div className="rules-limit">
                <strong>Daily cap:</strong> You can earn up to{" "}
                <strong>{dailyCap}</strong> coins per day from actions. You can
                still play and get XP after that — coins just stop until
                tomorrow.
              </div>
            )}

            {weeklyCap && (
              <div className="rules-limit rules-limit--soft">
                <strong>Weekly guardrail:</strong> Around{" "}
                <strong>{weeklyCap}</strong> coins per week so the Lala
                economy doesn&apos;t explode.
              </div>
            )}

            {/* SPENDING */}
            {spendRules.length > 0 && (
              <>
                <h2
                  className="rules-card__title"
                  style={{
                    marginTop: 18,
                    borderTop: "1px solid #f3f4f6",
                    paddingTop: 10,
                  }}
                >
                  <span className="emoji">🎁</span> Spending coins
                </h2>
                <p className="rules-card__subtitle">
                  These are typical coin costs for unlocks and rewards. Exact
                  items may change for special events or drops.
                </p>

                <div className="rules-table">
                  <div className="rules-table__head">
                    <div>Reward</div>
                    <div>Cost</div>
                    <div>Notes</div>
                  </div>
                  {spendRules.map((rule) => (
                    <div key={rule.id} className="rules-table__row">
                      <div>{rule.label || "Reward"}</div>
                      <div className="rules-table__cell--coins">
                        {Math.abs(rule.coins ?? 0)}
                      </div>
                      <div>{rule.description || "Details in the reward panel"}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {monthlyEvents && (
              <div className="rules-highlight">
                Lala can run up to <strong>{monthlyEvents}</strong> special
                bonus events per month (like double coin weekends). Those will
                always be clearly labeled inside episodes or the community hub.
              </div>
            )}

            <p className="rules-tagline">
              These rules are tuned by Lala and may evolve over time. When she
              updates the admin Game Rules Studio, this page updates too.
            </p>
          </div>

          {/* RIGHT: PETALS, LEVELS, FAQ */}
          <div className="rules-card">
            <h2 className="rules-card__title">
              <span className="emoji">🌸</span> Petals, levels &amp; badges
            </h2>
            <p className="rules-card__subtitle">
              Petals are your XP — they show how active and loyal you are in
              Lala&apos;s world.
            </p>

            <ul className="rules-faq-list">
              <li className="rules-faq-item">
                <strong>How do I earn petals?</strong>
                <br />
                You get petals for almost everything: watching episodes,
                styling looks, joining live chat, checking in daily, and
                playing mini-games. Some actions might give XP even when
                you&apos;ve hit your coin cap.
              </li>
              <li className="rules-faq-item">
                <strong>How do levels work?</strong>
                <br />
                As you collect petals, your fan level goes up. Higher levels
                may unlock new badges, priority in special events, or early
                access to certain drops.
              </li>
              <li className="rules-faq-item">
                <strong>What about badges?</strong>
                <br />
                Badges are little trophies for milestones: watch streaks, event
                participation, closet challenges, and more. Some are permanent,
                some are seasonal.
              </li>
              <li className="rules-faq-item">
                <strong>Can these values change?</strong>
                <br />
                Yep. To keep the economy healthy (and prevent farming), Lala may
                tweak coin amounts or limits. Big changes will be called out in
                the community hub and reflected here.
              </li>
              <li className="rules-faq-item">
                <strong>Where can I see my own numbers?</strong>
                <br />
                Visit your{" "}
                <Link to="/fan/profile" className="rules-inline-link">
                  profile
                </Link>{" "}
                for levels, petals and badges, and the{" "}
                <Link to="/fan/bank" className="rules-inline-link">
                  Bank page
                </Link>{" "}
                for your live coin balance.
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

const styles = `
.fan-rules {
  max-width: 980px;
  margin: 0 auto 32px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO ------------------------------------------------- */

.fan-rules-hero {
  padding: 20px 22px 18px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, #ffe4f3, #fdf7ff 45%),
    radial-gradient(circle at bottom right, #e0f2fe, #ffffff 70%);
  box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  border: 1px solid rgba(244,220,255,0.9);
}

.fan-rules-hero__eyebrow {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.fan-rules-hero__title {
  font-size: 26px;
  line-height: 1.2;
  margin: 0 0 6px;
  background: linear-gradient(90deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 800;
}

.fan-rules-hero__subtitle {
  font-size: 14px;
  color: #4b5563;
  margin: 0 0 8px;
  max-width: 48rem;
}

.fan-rules-hero__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.fan-rules-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(229,231,235,0.9);
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fan-rules-pill__icon {
  font-size: 14px;
}
.fan-rules-pill-link {
  color:#4c1d95;
  text-decoration:none;
}
.fan-rules-pill-link:hover {
  text-decoration:underline;
}

.fan-rules-hero__hint {
  margin-top: 8px;
  font-size: 12px;
  color: #4b5563;
}
.fan-rules-hero__updated {
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
}

/* GRID ------------------------------------------------- */

.fan-rules-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 18px;
}
@media (max-width: 900px) {
  .fan-rules-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.rules-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 18px 18px 20px;
  border: 1px solid rgba(229,231,235,0.9);
  box-shadow: 0 16px 40px rgba(15,23,42,0.06);
}
.rules-card__title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
}
.rules-card__title span.emoji {
  font-size: 18px;
}
.rules-card__subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

/* TABLE-ish list -------------------------------------- */

.rules-table {
  margin-top: 6px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.rules-table__head,
.rules-table__row {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) 80px minmax(0, 1.6fr);
  align-items: center;
  padding: 8px 10px;
  font-size: 13px;
}
.rules-table__head {
  background: #f9fafb;
  font-weight: 600;
  color: #6b7280;
}
.rules-table__row:nth-child(even) {
  background: #fdfdfd;
}
.rules-table__cell--coins {
  font-weight: 700;
  color: #111827;
}
.rules-table__pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  gap: 4px;
}

/* RIGHT PANEL / FAQ ----------------------------------- */

.rules-faq-list {
  font-size: 13px;
  color: #4b5563;
  display: grid;
  gap: 10px;
  padding-left: 18px;
  margin: 4px 0 0;
}
.rules-faq-item strong {
  color: #111827;
}
.rules-inline-link {
  color:#4f46e5;
  text-decoration:none;
}
.rules-inline-link:hover {
  text-decoration:underline;
}

.rules-tagline {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 10px;
}

.rules-highlight {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(236,72,153,0.05),
    rgba(129,140,248,0.08)
  );
  font-size: 12px;
  color: #4b5563;
}

.rules-limit {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #fefce8;
  border: 1px solid #facc15;
  font-size: 12px;
  color: #854d0e;
}
.rules-limit--soft {
  background:#eff6ff;
  border-color:#bfdbfe;
  color:#1d4ed8;
}

.rules-loading,
.rules-error {
  font-size: 14px;
  color: #6b7280;
  padding: 10px 0;
}
.rules-error {
  color: #b91c1c;
}
`;
