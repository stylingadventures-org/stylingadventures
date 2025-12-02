// site/src/routes/admin/AdminGameOverview.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminGameOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [economy, setEconomy] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [closetItems, setClosetItems] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        if (window.sa?.ready) {
          await window.sa.ready();
        }

        // 1) Economy config
        let ecoResp = null;
        try {
          ecoResp = await window.sa.graphql(`
            query AdminGameOverviewEconomy {
              getGameEconomyConfig {
                id
                updatedAt
                coinToUsdRatio
                dailyCoinCap
                weeklyCoinCap
                monthlyBonusEventsLimit
                rules {
                  id
                  label
                  category
                  coins
                }
              }
            }
          `);
        } catch (e) {
          console.error("[AdminGameOverview] economy query failed", e);
        }

        // 2) Episodes with coin unlock
        let epResp = null;
        try {
          epResp = await window.sa.graphql(`
            query AdminGameOverviewEpisodes {
              adminListEpisodes {
                items {
                  id
                  slug
                  title
                  status
                  unlockCoinCost
                  publishedAt
                }
              }
            }
          `);
        } catch (e) {
          console.error("[AdminGameOverview] episodes query failed", e);
        }

        // 3) Closet items w/ coinValue – now using list return type
        let closet = [];
        try {
          const closetResp = await window.sa.graphql(`
            query AdminGameOverviewCloset {
              adminListClosetItems(limit: 200) {
                id
                title
                status
                mediaKey
                createdAt
                coinValue
                category
                subcategory
              }
            }
          `);
          const closetRaw = closetResp?.adminListClosetItems;
          closet = Array.isArray(closetRaw) ? closetRaw : [];
        } catch (e) {
          console.warn(
            "[AdminGameOverview] closet query failed (adjust query to match your schema):",
            e
          );
        }

        if (!alive) return;

        setEconomy(ecoResp?.getGameEconomyConfig || null);
        setEpisodes(
          epResp?.adminListEpisodes?.items
            ? epResp.adminListEpisodes.items
            : []
        );
        setClosetItems(closet);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const episodesWithCost = useMemo(
    () =>
      (episodes || [])
        .filter((ep) => (ep.unlockCoinCost ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.unlockCoinCost ?? 0) - (a.unlockCoinCost ?? 0)
        ),
    [episodes]
  );

  const closetWithValue = useMemo(
    () =>
      (closetItems || [])
        .filter(
          (item) =>
            item.coinValue !== null &&
            item.coinValue !== undefined &&
            item.coinValue !== 0
        )
        .sort((a, b) => (b.coinValue ?? 0) - (a.coinValue ?? 0)),
    [closetItems]
  );

  const totalEpisodeCost = useMemo(
    () =>
      episodesWithCost.reduce(
        (sum, ep) => sum + (Number(ep.unlockCoinCost) || 0),
        0
      ),
    [episodesWithCost]
  );

  const totalClosetValue = useMemo(
    () =>
      closetWithValue.reduce(
        (sum, item) => sum + (Number(item.coinValue) || 0),
        0
      ),
    [closetWithValue]
  );

  const lastUpdated = useMemo(() => {
    if (!economy?.updatedAt) return "";
    return new Date(economy.updatedAt).toLocaleString();
  }, [economy]);

  return (
    <div className="game-overview-page">
      <style>{styles}</style>

      {/* HERO */}
      <header className="go-hero">
        <div className="go-hero-inner">
          <div className="go-hero-left">
            <div className="go-pill">Admin · Money overview</div>
            <h1 className="go-title">Game money overview</h1>
            <p className="go-sub">
              One place to see every surface that touches coins: economy
              config, episode unlock prices, and closet item value. Use this to
              keep things fair (and fun) as the world grows.
            </p>

            <div className="go-links">
              <Link to="/admin/game-rules" className="go-link">
                Edit game rules →
              </Link>
              <Link to="/admin/episodes" className="go-link">
                Open Episode studio →
              </Link>
              <Link to="/admin/closet-library" className="go-link">
                View closet library →
              </Link>
            </div>
          </div>

          <aside className="go-hero-right">
            <div className="go-summary-card">
              <div className="go-summary-label">Config snapshot</div>
              <div className="go-summary-main">
                <div className="go-summary-row">
                  <span>Daily cap</span>
                  <strong>
                    {economy?.dailyCoinCap != null
                      ? economy.dailyCoinCap
                      : "—"}
                  </strong>
                </div>
                <div className="go-summary-row">
                  <span>Weekly cap</span>
                  <strong>
                    {economy?.weeklyCoinCap != null
                      ? economy.weeklyCoinCap
                      : "—"}
                  </strong>
                </div>
                <div className="go-summary-row">
                  <span>Coin ratio</span>
                  <strong>
                    {economy?.coinToUsdRatio != null
                      ? `1 coin ≈ $${economy.coinToUsdRatio}`
                      : "not set"}
                  </strong>
                </div>
                <div className="go-summary-row">
                  <span>Bonus events / month</span>
                  <strong>
                    {economy?.monthlyBonusEventsLimit != null
                      ? economy.monthlyBonusEventsLimit
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="go-summary-meta">
                {lastUpdated
                  ? `Rules last updated ${lastUpdated}`
                  : "No saved config yet"}
              </div>
            </div>
          </aside>
        </div>

        {error && (
          <div className="go-error">
            {error}
            <div className="go-error-sub">
              Economy & episode data might still be partially visible below.
            </div>
          </div>
        )}
        {loading && (
          <div className="go-loading">Loading money surfaces…</div>
        )}
      </header>

      {/* MAIN GRID */}
      {!loading && (
        <main className="go-main">
          <div className="go-grid">
            {/* LEFT: EPISODES */}
            <section className="go-card">
              <h2 className="go-card-title">Episodes that cost coins</h2>
              <p className="go-card-sub">
                Any episode with an <code>unlockCoinCost</code> greater than 0
                appears here. Use this list when tuning prices or balancing
                against daily caps.
              </p>

              <div className="go-metric-row">
                <div className="go-metric">
                  <div className="go-metric-label">Episodes charging coins</div>
                  <div className="go-metric-value">
                    {episodesWithCost.length}
                  </div>
                </div>
                <div className="go-metric">
                  <div className="go-metric-label">
                    Sum of episode unlock costs
                  </div>
                  <div className="go-metric-value">
                    {totalEpisodeCost.toLocaleString()}{" "}
                    <span className="go-metric-suffix">coins</span>
                  </div>
                </div>
              </div>

              {episodesWithCost.length === 0 ? (
                <div className="go-empty">
                  No episodes currently require coins to unlock. You can set
                  prices in the Episode Studio.
                </div>
              ) : (
                <div className="go-table">
                  <div className="go-table-head">
                    <div>Episode</div>
                    <div>Cost</div>
                    <div>Status</div>
                    <div>Published</div>
                  </div>
                  {episodesWithCost.map((ep) => (
                    <div key={ep.id} className="go-table-row">
                      <div className="go-ep-main">
                        <div className="go-ep-title">
                          {ep.title || "(Untitled episode)"}
                        </div>
                        {ep.slug && (
                          <div className="go-ep-slug">
                            slug: <code>{ep.slug}</code>
                          </div>
                        )}
                      </div>
                      <div className="go-ep-cost">
                        {ep.unlockCoinCost ?? 0} coins
                      </div>
                      <div>
                        <span className="go-status-pill">
                          {ep.status || "DRAFT"}
                        </span>
                      </div>
                      <div className="go-ep-date">
                        {ep.publishedAt
                          ? new Date(ep.publishedAt).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RIGHT: CLOSET VALUE */}
            <section className="go-card">
              <h2 className="go-card-title">Closet items with coin value</h2>
              <p className="go-card-sub">
                Items in Lala&apos;s closet that have a <code>coinValue</code>{" "}
                set. Use this when aligning episode prizes, closet redemptions,
                and the overall economy.
              </p>

              <div className="go-metric-row">
                <div className="go-metric">
                  <div className="go-metric-label">Priced closet items</div>
                  <div className="go-metric-value">
                    {closetWithValue.length}
                  </div>
                </div>
                <div className="go-metric">
                  <div className="go-metric-label">
                    Sum of closet coin values
                  </div>
                  <div className="go-metric-value">
                    {totalClosetValue.toLocaleString()}{" "}
                    <span className="go-metric-suffix">coins</span>
                  </div>
                </div>
              </div>

              {closetItems.length === 0 && (
                <div className="go-empty">
                  We couldn&apos;t load closet items with coin value. If your
                  schema uses a different admin query name, update the query in{" "}
                  <code>AdminGameOverview.jsx</code> labeled{" "}
                  <strong>AdminGameOverviewCloset</strong>.
                </div>
              )}

              {closetWithValue.length > 0 && (
                <div className="go-table">
                  <div className="go-table-head">
                    <div>Item</div>
                    <div>Value</div>
                    <div>Status</div>
                    <div>Created</div>
                  </div>
                  {closetWithValue.slice(0, 30).map((item) => (
                    <div key={item.id} className="go-table-row">
                      <div className="go-ep-main">
                        <div className="go-ep-title">
                          {item.title || "(Untitled item)"}
                        </div>
                        {item.category && (
                          <div className="go-ep-slug">
                            category: <code>{item.category}</code>
                          </div>
                        )}
                      </div>
                      <div className="go-ep-cost">
                        {item.coinValue ?? 0} coins
                      </div>
                      <div>
                        <span className="go-status-pill">
                          {item.status || "DRAFT"}
                        </span>
                      </div>
                      <div className="go-ep-date">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {closetWithValue.length > 30 && (
                <div className="go-note">
                  Showing top 30 by coin value. Use the Closet Library for the
                  full list.
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

const styles = `
.game-overview-page {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO ---------------------------------------------------- */

.go-hero {
  border-radius:24px;
  padding:16px 18px;
  background:
    radial-gradient(circle at top left,#ffe4f3,#fdf7ff 45%),
    radial-gradient(circle at bottom right,#e0f2fe,#ffffff 70%);
  border:1px solid rgba(244,220,255,0.9);
  box-shadow:0 18px 40px rgba(148,163,184,0.3);
}

.go-hero-inner {
  max-width:1120px;
  margin:0 auto;
  display:grid;
  grid-template-columns:minmax(0,2.2fr) minmax(0,1.5fr);
  gap:16px;
}
@media (max-width: 900px) {
  .go-hero-inner {
    grid-template-columns:minmax(0,1fr);
  }
}

.go-pill {
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

.go-title {
  margin:4px 0 4px;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  background:linear-gradient(90deg,#4c1d95,#ec4899);
  -webkit-background-clip:text;
  color:transparent;
}

.go-sub {
  margin:0;
  font-size:0.95rem;
  color:#374151;
  max-width:40rem;
}

.go-links {
  margin-top:6px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.go-link {
  font-size:0.82rem;
  color:#4c1d95;
  text-decoration:none;
}
.go-link:hover {
  text-decoration:underline;
}

/* SUMMARY CARD ------------------------------------------- */

.go-hero-right {
  display:flex;
  justify-content:flex-end;
}

.go-summary-card {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 32px rgba(148,163,184,0.25);
  padding:12px 14px 14px;
  min-width:230px;
}

.go-summary-label {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#6b7280;
}

.go-summary-main {
  margin-top:4px;
  display:flex;
  flex-direction:column;
  gap:4px;
}
.go-summary-row {
  display:flex;
  justify-content:space-between;
  gap:6px;
  font-size:0.84rem;
  color:#4b5563;
}
.go-summary-row strong {
  color:#111827;
}

.go-summary-meta {
  margin-top:6px;
  font-size:0.78rem;
  color:#9ca3af;
}

/* NOTICES ------------------------------------------------ */

.go-error {
  margin-top:8px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #fecaca;
  background:#fef2f2;
  font-size:0.9rem;
  color:#7f1d1d;
}
.go-error-sub {
  margin-top:2px;
  font-size:0.78rem;
}
.go-loading {
  margin-top:6px;
  font-size:0.9rem;
  color:#111827;
}

/* MAIN --------------------------------------------------- */

.go-main {
  max-width:1120px;
  margin:0 auto 28px;
}

.go-grid {
  display:grid;
  grid-template-columns:minmax(0,2.1fr) minmax(0,1.8fr);
  gap:16px;
}
@media (max-width: 960px) {
  .go-grid {
    grid-template-columns:minmax(0,1fr);
  }
}

.go-card {
  background:#ffffff;
  border-radius:20px;
  padding:14px 16px 16px;
  border:1px solid #e5e7eb;
  box-shadow:0 14px 32px rgba(148,163,184,0.2);
}

.go-card-title {
  margin:0 0 4px;
  font-size:1.1rem;
  font-weight:600;
  color:#111827;
}
.go-card-sub {
  margin:0 0 8px;
  font-size:0.9rem;
  color:#6b7280;
}

/* METRICS ------------------------------------------------ */

.go-metric-row {
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin:4px 0 8px;
}
.go-metric {
  flex:1 1 140px;
  border-radius:12px;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  padding:8px 9px;
}
.go-metric-label {
  font-size:0.78rem;
  color:#6b7280;
}
.go-metric-value {
  margin-top:3px;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.go-metric-suffix {
  font-size:0.8rem;
  color:#6b7280;
}

/* TABLES ------------------------------------------------- */

.go-table {
  margin-top:6px;
  border-radius:14px;
  border:1px solid #e5e7eb;
  overflow:hidden;
  font-size:0.86rem;
}
.go-table-head,
.go-table-row {
  display:grid;
  grid-template-columns: minmax(0, 2.4fr) 90px 90px 120px;
  align-items:center;
  padding:7px 9px;
}
.go-table-head {
  background:#f9fafb;
  font-weight:600;
  color:#6b7280;
}
.go-table-row:nth-child(even) {
  background:#fdfdfd;
}

.go-ep-main {
  display:flex;
  flex-direction:column;
}
.go-ep-title {
  font-weight:500;
  color:#111827;
}
.go-ep-slug {
  font-size:0.78rem;
  color:#6b7280;
}
.go-ep-cost {
  font-weight:600;
  color:#111827;
}
.go-ep-date {
  font-size:0.78rem;
  color:#6b7280;
}

.go-status-pill {
  padding:3px 8px;
  border-radius:999px;
  font-size:0.75rem;
  background:#eef2ff;
  border:1px solid #e0e7ff;
  color:#4338ca;
}

/* MISC --------------------------------------------------- */

.go-empty {
  margin-top:6px;
  padding:8px 10px;
  border-radius:12px;
  background:#f9fafb;
  border:1px dashed #e5e7eb;
  font-size:0.86rem;
  color:#6b7280;
}

.go-note {
  margin-top:6px;
  font-size:0.8rem;
  color:#9ca3af;
}
`;
