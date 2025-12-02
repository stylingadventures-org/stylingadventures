// site/src/routes/fan/Closet.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Style Lab — local-only mini game
 * - Picks Top / Bottom / Shoes
 * - Scores the combo
 * - Persists leaderboard + player progress to localStorage
 * - Fans browse Lala's Closet from a separate route; admin uploads items.
 */

const TOPS = ["Tee", "Blouse", "Hoodie", "Jacket"];
const BOTTOMS = ["Jeans", "Skirt", "Trousers", "Shorts"];
const SHOES = ["Sneakers", "Heels", "Boots", "Loafers"];

// localStorage keys
const LS = {
  PLAYER: "sa.style.player", // string username
  PROGRESS: "sa.style.progress", // { xp, level }
  BOARD: "sa.style.board", // [{ id, user, top, bottom, shoes, score, ts }],
};

// Fan closet GraphQL
const GQL = {
  myCloset: /* GraphQL */ `
    query MyCloset($limit: Int, $nextToken: String) {
      myCloset(limit: $limit, nextToken: $nextToken) {
        items {
          id
          title
          status
          audience
          mediaKey
          rawMediaKey
          category
          subcategory
          coinValue
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  `,
};

// ---------- helpers ----------
const now = () => Date.now();

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function scoreCombo(top, bottom, shoes) {
  // Base: variety points
  let score = 50;

  // Matchy bonuses
  const chic = top === "Blouse" && bottom === "Skirt";
  const street = top === "Hoodie" && bottom === "Jeans";
  const smart = top === "Jacket" && bottom === "Trousers";

  if (chic) score += 25;
  if (street) score += 20;
  if (smart) score += 30;

  // Shoes synergy
  if (shoes === "Heels" && chic) score += 20;
  if (shoes === "Sneakers" && street) score += 15;
  if (shoes === "Loafers" && smart) score += 15;

  // Small variety spice
  score += Math.floor(Math.random() * 11); // +0..10

  return score;
}

function levelForXP(xp) {
  // simple curve
  // L1=0, L2=100, L3=250, L4=450, L5=700 ...
  let lvl = 1;
  let need = 100;
  let remaining = xp;
  while (remaining >= need) {
    remaining -= need;
    lvl += 1;
    need += 50; // incremental requirement
  }
  return { level: lvl, toNext: need - remaining, needed: need };
}

// ---------- component ----------
export default function Closet() {
  // selections
  const [top, setTop] = useState(TOPS[0]);
  const [bottom, setBottom] = useState(BOTTOMS[0]);
  const [shoes, setShoes] = useState(SHOES[0]);

  // persisted state
  const [player, setPlayer] = useState("ADMIN");
  const [progress, setProgress] = useState({ xp: 0, level: 1 });
  const [board, setBoard] = useState([]);

  // ephemeral UI state
  const [lastScore, setLastScore] = useState(null);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [saving, setSaving] = useState(false);

  // fan closet state
  const [closetItems, setClosetItems] = useState([]);
  const [closetLoading, setClosetLoading] = useState(false);
  const [closetError, setClosetError] = useState("");

  // load from LS once
  useEffect(() => {
    const p = readLS(LS.PLAYER, "ADMIN");
    setPlayer(p);
    const prog = readLS(LS.PROGRESS, { xp: 0, level: 1 });
    setProgress(prog);
    const b = readLS(LS.BOARD, []);
    setBoard(b);
  }, []);

  // persist on change
  useEffect(() => writeLS(LS.PLAYER, player), [player]);
  useEffect(() => writeLS(LS.PROGRESS, progress), [progress]);
  useEffect(() => writeLS(LS.BOARD, board), [board]);

  // load fan closet once
  useEffect(() => {
    async function loadCloset() {
      setClosetLoading(true);
      setClosetError("");
      try {
        const data = await window.sa.graphql(GQL.myCloset, {
          limit: 50,
          nextToken: null,
        });

        const conn = data?.myCloset;
        const items = Array.isArray(conn?.items) ? conn.items : [];
        const nextToken = conn?.nextToken || null; // reserved for future pagination

        setClosetItems(items);
        // If you later want "Load more", keep nextToken in state.
        // e.g. setClosetNextToken(nextToken);
      } catch (e) {
        console.error(e);
        setClosetError(
          e?.message ||
            "Failed to load your closet items. Please try again.",
        );
      } finally {
        setClosetLoading(false);
      }
    }
    loadCloset();
  }, []);

  const levelMeta = useMemo(() => levelForXP(progress.xp), [progress.xp]);

  const levelProgressPct = useMemo(() => {
    const total = levelMeta.needed || 1;
    const intoLevel = total - levelMeta.toNext;
    return Math.max(
      0,
      Math.min(100, Math.round((intoLevel / total) * 100)),
    );
  }, [levelMeta]);

  const highScore = useMemo(
    () => (board.length ? Math.max(...board.map((e) => e.score)) : null),
    [board],
  );

  function randomizeLook() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setTop(pick(TOPS));
    setBottom(pick(BOTTOMS));
    setShoes(pick(SHOES));
  }

  async function styleIt() {
    const score = scoreCombo(top, bottom, shoes);
    const prevHigh = board.length ? Math.max(...board.map((e) => e.score)) : 0;

    setLastScore(score);
    setIsNewHigh(score > prevHigh);

    // XP gain = score/5 (rounded)
    const gain = Math.max(1, Math.round(score / 5));
    const nextXP = progress.xp + gain;
    const nextLevel = levelForXP(nextXP).level;
    setProgress({ xp: nextXP, level: nextLevel });

    // put on leaderboard
    const entry = {
      id: now(),
      user: player || "Guest",
      top,
      bottom,
      shoes,
      score,
      ts: now(),
    };
    const next = [entry, ...board]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    setBoard(next);
  }

  function resetProgress() {
    setProgress({ xp: 0, level: 1 });
  }

  async function saveName() {
    setSaving(true);
    // nothing remote yet; kept to mirror future AppSync write
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
  }

  function resetAll() {
    setBoard([]);
    resetProgress();
    setLastScore(null);
    setIsNewHigh(false);
  }

  const lastXpGain =
    lastScore != null ? Math.max(1, Math.round(lastScore / 5)) : null;

  function handleSaveLook() {
    alert(
      "Saving looks to your Closet is coming soon! For now, keep experimenting and note your favorite combos, bestie 💖",
    );
  }

  function handleShareLook() {
    alert(
      "Sharing to Bestie uploads will connect this lab to the full community soon. Stay tuned!",
    );
  }

  return (
    <div className="style-lab">
      {/* HERO */}
      <section className="style-lab-hero" aria-label="Style lab overview">
        <div className="style-lab-hero__copy">
          <div className="style-lab-hero__badge">🎮 Style Lab</div>
          <h1 className="style-lab-hero__title">
            Welcome to Lala&apos;s Style Lab
          </h1>
          <p className="style-lab-hero__subtitle">
            Step into Lala&apos;s world and experiment with outfits for every
            episode. Mix tops, bottoms, and shoes, earn petals (XP), and get
            ready to send your fave looks into{" "}
            <strong>Lala&apos;s Closet</strong> for other Besties to love.
          </p>

          <div className="style-lab-hero__steps">
            <div className="style-step">
              <span className="style-step__bubble">1</span>
              <div className="style-step__copy">
                <div className="style-step__label">Style a look</div>
                <div className="style-step__text">
                  Pick a top, bottom, and shoes that feel very Lala.
                </div>
              </div>
            </div>
            <div className="style-step">
              <span className="style-step__bubble">2</span>
              <div className="style-step__copy">
                <div className="style-step__label">Score it</div>
                <div className="style-step__text">
                  Hit <strong>Style it!</strong> and see your score & XP boost.
                </div>
              </div>
            </div>
            <div className="style-step">
              <span className="style-step__bubble">3</span>
              <div className="style-step__copy">
                <div className="style-step__label">Share the vibe</div>
                <div className="style-step__text">
                  Soon you&apos;ll be able to send lab looks into Lala&apos;s
                  Closet & Bestie uploads.
                </div>
              </div>
            </div>
          </div>

          <div className="style-lab-hero__links">
            <Link to="/fan/closet-feed" className="lab-btn lab-btn-primary">
              Browse Lala&apos;s Closet →
            </Link>
            <div className="hero-helper">
              Want more inspo?{" "}
              <Link to="/fan/episodes" className="hero-helper__link">
                Watch an episode
              </Link>{" "}
              then come back and recreate your favorite fit.
            </div>
          </div>
        </div>

        <div className="style-lab-hero__panel">
          <div className="hero-label">Player name</div>
          <div className="hero-player-row">
            <input
              className="hero-input"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              placeholder="Player name"
            />
            <button
              type="button"
              className="lab-btn lab-btn-ghost hero-save-btn"
              onClick={saveName}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="hero-level-row">
            <div className="hero-level-meta">
              <div className="hero-pill">
                Level {levelMeta.level} Stylist
              </div>
              <div className="hero-xp">
                <span className="hero-xp-label">XP</span>
                <span className="hero-xp-value">{progress.xp}</span>
              </div>
            </div>
            <div className="hero-progress">
              <div
                className="hero-progress-bar"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
            <div className="hero-level-hint">
              {levelMeta.toNext} XP to level {levelMeta.level + 1}. Style a few
              more looks to level up, bestie ✨
            </div>
          </div>

          <button
            type="button"
            className="lab-link-danger"
            onClick={resetProgress}
          >
            Reset XP & level (this device only)
          </button>
        </div>
      </section>

      {/* MAIN GRID: game + leaderboard */}
      <section className="style-lab-grid">
        {/* Outfit builder + preview */}
        <section className="lab-card lab-card--game">
          <div className="lab-header-row">
            <div>
              <h2 className="lab-title">Style a lab look</h2>
              <p className="lab-subtitle">
                Pick a combo for Lala, preview the vibe, then{" "}
                <strong>Style it!</strong> to see your score and XP.
              </p>
            </div>
            <div className="lab-tag">Local mini game</div>
          </div>

          <div className="lab-main-layout">
            {/* Outfit preview card */}
            <div className="lab-preview">
              <div className="lab-preview-inner">
                <div className="lab-preview-avatar" />
                <div className="lab-preview-body">
                  <div className="lab-preview-label">
                    Today&apos;s lab fit
                  </div>
                  <div className="lab-preview-line">
                    <span className="lab-preview-tag">Top</span>
                    <span className="lab-preview-value">{top}</span>
                  </div>
                  <div className="lab-preview-line">
                    <span className="lab-preview-tag">Bottom</span>
                    <span className="lab-preview-value">{bottom}</span>
                  </div>
                  <div className="lab-preview-line">
                    <span className="lab-preview-tag">Shoes</span>
                    <span className="lab-preview-value">{shoes}</span>
                  </div>
                  <div className="lab-preview-hint">
                    Pro tip: Blouse + Skirt is a chic bonus. Hoodie + Jeans
                    brings streetwear energy.
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="lab-controls">
              <div className="lab-form-row">
                <div className="lab-field">
                  <label className="lab-label">Top</label>
                  <div className="lab-select-wrap">
                    <span className="lab-select-icon">👕</span>
                    <select
                      className="lab-select"
                      value={top}
                      onChange={(e) => setTop(e.target.value)}
                    >
                      {TOPS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lab-field">
                  <label className="lab-label">Bottom</label>
                  <div className="lab-select-wrap">
                    <span className="lab-select-icon">👖</span>
                    <select
                      className="lab-select"
                      value={bottom}
                      onChange={(e) => setBottom(e.target.value)}
                    >
                      {BOTTOMS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lab-field">
                  <label className="lab-label">Shoes</label>
                  <div className="lab-select-wrap">
                    <span className="lab-select-icon">👟</span>
                    <select
                      className="lab-select"
                      value={shoes}
                      onChange={(e) => setShoes(e.target.value)}
                    >
                      {SHOES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="lab-actions-row">
                <button
                  type="button"
                  className="lab-btn lab-btn-primary"
                  onClick={styleIt}
                >
                  Style it!
                </button>
                <button
                  type="button"
                  className="lab-btn lab-btn-secondary"
                  onClick={randomizeLook}
                >
                  Randomize look 🎲
                </button>
              </div>

              {lastScore != null && (
                <div className="lab-result">
                  <div className="lab-score-line">
                    <span className="lab-score-label">Score</span>
                    <span className="lab-score-value">{lastScore}</span>
                    {lastXpGain != null && (
                      <span className="lab-chip lab-chip--xp">
                        +{lastXpGain} XP
                      </span>
                    )}
                    {isNewHigh && (
                      <span className="lab-chip lab-chip--highlight">
                        New high score! 🏆
                      </span>
                    )}
                  </div>
                  <div className="lab-result-hints">
                    {lastScore < 60 && (
                      <span className="lab-hint">
                        Cute! Try mixing chic pieces (blouse, skirt, heels) or
                        streetwear (hoodie, jeans, sneakers) to boost your
                        score.
                      </span>
                    )}
                    {lastScore >= 60 && !isNewHigh && (
                      <span className="lab-hint">
                        Nice work! Keep experimenting with bolder combos to beat
                        your top score.
                      </span>
                    )}
                    {isNewHigh && (
                      <span className="lab-hint">
                        You&apos;re setting the lab standard. Screenshot or jot
                        down this combo so you can recreate it later in
                        Lala&apos;s Closet.
                      </span>
                    )}
                  </div>

                  <div className="lab-save-row">
                    <button
                      type="button"
                      className="lab-btn lab-btn-ghost lab-btn-small"
                      onClick={handleSaveLook}
                    >
                      Save this look (coming soon)
                    </button>
                    <button
                      type="button"
                      className="lab-btn lab-btn-ghost lab-btn-small"
                      onClick={handleShareLook}
                    >
                      Share with Besties (coming soon)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="lab-card lab-card--scores">
          <h2 className="lab-title">Style lab leaderboard</h2>
          <p className="lab-subtitle">
            Your best experiments on this device only. Perfect for practicing
            fits before sending favorites into Lala&apos;s Closet & Bestie
            uploads later.
          </p>

          {board.length === 0 ? (
            <div className="lab-empty">
              No entries yet — style your first lab look and claim the #1 spot,
              bestie ✨
            </div>
          ) : (
            <ol className="lab-board">
              {board.map((e, idx) => (
                <li key={e.id} className="lab-board-row">
                  <span className="lab-rank">#{idx + 1}</span>
                  <div className="lab-board-main">
                    <div className="lab-board-user">{e.user}</div>
                    <div className="lab-board-outfit">
                      {e.top} / {e.bottom} / {e.shoes}
                    </div>
                  </div>
                  <span className="lab-score-pill">{e.score}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="lab-board-footer">
            <div className="lab-board-meta">
              {highScore != null ? (
                <>Best score so far: {highScore}</>
              ) : (
                <>No scores yet — the top spot is wide open.</>
              )}
            </div>
            {board.length > 0 && (
              <button
                type="button"
                className="lab-btn lab-btn-ghost lab-btn-small lab-btn-danger"
                onClick={resetAll}
              >
                Clear leaderboard &amp; progress
              </button>
            )}
          </div>
        </section>
      </section>

      {/* FAN CLOSET: show value for each of their items */}
      <section className="fan-closet-section">
        <header className="rails-header">
          <h2 className="rails-header__title">Your saved closet</h2>
          <p className="rails-header__subtitle">
            Items you&apos;ve unlocked in Lala&apos;s Closet, with how many
            Lala Coins each is worth in games & rewards.
          </p>
        </header>

        {closetError && <div className="cl-error">{closetError}</div>}

        {closetLoading && !closetError && (
          <div className="cl-empty">Loading your closet…</div>
        )}

        {!closetLoading && !closetError && closetItems.length === 0 && (
          <div className="cl-empty">
            You don&apos;t have any closet items yet. Keep exploring episodes
            and events to unlock looks!
          </div>
        )}

        {closetItems.length > 0 && (
          <>
            <div className="cl-grid">
              {closetItems.map((item) => (
                <article key={item.id} className="cl-item">
                  <div className="cl-item-media">
                    {/* fan feed uses mediaKey → signed URL elsewhere; here we assume CDN mapping */}
                    {item.mediaKey ? (
                      <img
                        src={item.mediaKey}
                        alt={item.title || "Closet item"}
                      />
                    ) : (
                      <div className="cl-item-placeholder">No image</div>
                    )}
                  </div>
                  <div className="cl-item-body">
                    <div className="cl-item-title-row">
                      <div className="cl-item-title">
                        {item.title || "Untitled look"}
                      </div>
                      <span className="cl-item-status">
                        {item.status?.toLowerCase() || "unknown"}
                      </span>
                    </div>
                    <div className="cl-item-meta">
                      <span className="cl-item-date">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <div className="cl-item-footer">
                      <button
                        type="button"
                        className="lab-btn lab-btn-ghost lab-btn-small"
                      >
                        Style more
                      </button>
                    </div>

                    {item.coinValue != null && item.coinValue !== 0 && (
                      <div className="fan-coin-pill">
                        🪙 Worth {item.coinValue} coin
                        {item.coinValue === 1 ? "" : "s"}
                      </div>
                    )}

                    <small className="cl-item-coins-help">
                      <a href="/fan/rules">How Lala Coins work →</a>
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* RAIL: tie back to episodes / closet / community */}
      <section className="style-lab-rails">
        <header className="rails-header">
          <h2 className="rails-header__title">Where to take your fit next</h2>
          <p className="rails-header__subtitle">
            Watch an episode for inspo, browse Lala&apos;s Closet, then chat
            with Besties about your favorite looks.
          </p>
        </header>
        <div className="rails-grid">
          <article className="rail rail--episodes">
            <div className="rail__head">
              <div className="rail__label">Episodes</div>
              <Link to="/fan/episodes" className="rail__link">
                Binge episodes →
              </Link>
            </div>
            <p className="rail__text">
              Need a moodboard? Rewatch the Pilot or Holiday Glam Drop and
              style a look inspired by your favorite scene.
            </p>
          </article>

          <article className="rail rail--closet">
            <div className="rail__head">
              <div className="rail__label">Lala&apos;s Closet</div>
              <Link to="/fan/closet-feed" className="rail__link">
                See all looks →
              </Link>
            </div>
            <p className="rail__text">
              Browse outfits that Lala and Besties have created. Soon you&apos;ll
              be able to send your lab experiments here too.
            </p>
          </article>

          <article className="rail rail--community">
            <div className="rail__head">
              <div className="rail__label">Community</div>
              <Link to="/fan/community" className="rail__link">
                Join the chat →
              </Link>
            </div>
            <p className="rail__text">
              Share what you styled in the lab, trade outfit ideas, and vote on
              which vibe Lala should rock next.
            </p>
          </article>
        </div>
      </section>

      {/* PAGE-SPECIFIC STYLES */}
      <style>{`
        :root {
          --lab-control-height: 36px;
          --lab-max-width: 1120px;
        }

        .style-lab {
          max-width: var(--lab-max-width);
          margin: 0 auto 32px;
          padding: 12px 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* HERO */
        .style-lab-hero {
          position: relative;
          border-radius: 26px;
          padding: 18px 20px;
          background:
            radial-gradient(circle at top left, #ffe4f3, #fdf2ff 40%, transparent 70%),
            radial-gradient(circle at bottom right, #f9a8d4, #fee2f2 45%, transparent 75%),
            linear-gradient(135deg, #a855f7, #ec4899);
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 22px 60px rgba(15,23,42,0.25);
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          overflow: hidden;
        }
        .style-lab-hero::before {
          content: "";
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 0 0, rgba(255,255,255,0.8), transparent 60%),
            radial-gradient(circle at 100% 0, rgba(255,255,255,0.55), transparent 60%);
          pointer-events: none;
          opacity: 0.9;
        }
        .style-lab-hero__copy,
        .style-lab-hero__panel {
          position: relative;
          z-index: 1;
        }
        .style-lab-hero__copy {
          flex: 1.5;
          min-width: 0;
        }
        .style-lab-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .14em;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(244,114,182,0.6);
          color: #9d174d;
          margin-bottom: 6px;
        }
        .style-lab-hero__title {
          margin: 0 0 6px;
          font-size: 1.7rem;
          line-height: 1.2;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .style-lab-hero__subtitle {
          margin: 0;
          font-size: 0.96rem;
          color: #111827;
          max-width: 520px;
        }

        .style-lab-hero__steps {
          margin-top: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .style-step {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(252,231,243,0.9);
        }
        .style-step__bubble {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: linear-gradient(135deg,#a855f7,#ec4899);
          color:#fff;
          font-size: 0.75rem;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:600;
        }
        .style-step__label {
          font-size: 0.8rem;
          font-weight: 600;
          color:#111827;
        }
        .style-step__text {
          font-size: 0.78rem;
          color:#4b5563;
        }

        .style-lab-hero__links {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }
        .hero-helper {
          font-size: 0.8rem;
          color: #111827;
        }
        .hero-helper__link {
          color: #7c3aed;
          text-decoration: underline;
        }

        .style-lab-hero__panel {
          flex: 1;
          min-width: 260px;
          max-width: 340px;
          background: rgba(255,255,255,0.96);
          border-radius: 20px;
          border: 1px solid rgba(248,209,255,0.95);
          box-shadow: 0 18px 44px rgba(109,40,217,0.35);
          padding: 14px 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hero-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #9ca3af;
        }
        .hero-player-row {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .hero-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          padding: 0 12px;
          height: var(--lab-control-height);
          font-size: 0.9rem;
          line-height: 1.2;
          box-sizing: border-box;
        }
        .hero-save-btn {
          padding-inline: 12px;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .hero-level-row {
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .hero-level-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .hero-xp {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          font-size: 0.84rem;
        }
        .hero-xp-label {
          color: #6b7280;
        }
        .hero-xp-value {
          font-weight: 600;
          color: #111827;
        }

        .hero-progress {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: #f5f3ff;
          overflow: hidden;
          border: 1px solid #e0e7ff;
        }
        .hero-progress-bar {
          height: 100%;
          background: linear-gradient(90deg,#a855f7,#ec4899,#fb7185);
          width: 0%;
          transition: width 200ms ease-out;
        }
        .hero-level-hint {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .lab-link-danger {
          margin-top: 2px;
          align-self: flex-start;
          border: none;
          background: transparent;
          color: #b91c1c;
          font-size: 0.75rem;
          text-decoration: underline;
          cursor: pointer;
          padding: 2px 0;
        }

        /* MAIN GRID */
        .style-lab-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.9fr) minmax(0, 1.2fr);
          margin-top: 20px;
          gap: 24px;
          align-items: stretch;
        }

        .style-lab-grid > .lab-card {
          align-self: stretch;
        }

        .lab-card {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #f1f5f9;
          padding: 16px 18px 18px;
          box-shadow: 0 18px 40px rgba(148,163,184,0.18);
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          box-sizing: border-box;
        }
        .lab-card--game {
          align-items: stretch;
        }

        .lab-header-row {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:10px;
        }
        .lab-tag {
          padding:4px 10px;
          border-radius:999px;
          background:#fee2f2;
          color:#be185d;
          font-size:0.75rem;
          font-weight:600;
          white-space:nowrap;
        }
        .lab-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #111827;
        }
        .lab-subtitle {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
        }

        /* inner layout: preview | controls */
        .lab-main-layout {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: stretch;
        }

        /* preview */
        .lab-preview {
          flex: 1 1 250px;
          max-width: 300px;
          background: radial-gradient(circle at top,#fef3ff,#e9d5ff);
          border-radius:18px;
          padding:10px;
          border:1px solid #f5d0fe;
          display:flex;
          align-items:stretch;
          box-sizing: border-box;
        }
        .lab-preview-inner {
          display:flex;
          gap:10px;
          align-items:center;
        }
        .lab-preview-avatar {
          width:70px;
          height:100px;
          border-radius:18px;
          background:linear-gradient(135deg,#a855f7,#ec4899);
          box-shadow:0 14px 30px rgba(147,51,234,0.55);
          position:relative;
        }
        .lab-preview-avatar::before {
          content:"";
          position:absolute;
          inset:18% 18% 34% 18%;
          border-radius:18px;
          background:#f9fafb;
          opacity:0.9;
        }
        .lab-preview-body {
          flex:1;
          display:flex;
          flex-direction:column;
          gap:4px;
          min-width:0;
        }
        .lab-preview-label {
          font-size:0.78rem;
          text-transform:uppercase;
          letter-spacing:.12em;
          color:#7c3aed;
        }
        .lab-preview-line {
          display:flex;
          justify-content:space-between;
          gap:6px;
          font-size:0.86rem;
        }
        .lab-preview-tag {
          color:#6b7280;
        }
        .lab-preview-value {
          font-weight:600;
          color:#111827;
          text-align:right;
          flex:1;
        }
        .lab-preview-hint {
          margin-top:4px;
          font-size:0.78rem;
          color:#6b7280;
        }

        /* controls */
        .lab-controls {
          flex: 2;
          min-width: 240px;
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .lab-form-row {
          margin-top: 4px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .lab-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .lab-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #9ca3af;
        }
        .lab-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          padding-inline: 12px;
          height: var(--lab-control-height);
          width: 100%;
          box-sizing: border-box;
        }
        .lab-select-icon {
          font-size: 0.9rem;
          margin-right: 6px;
        }
        .lab-select {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          background: transparent;
          padding: 0;
          font-size: 0.85rem;
          outline: none;
          appearance: none;
        }
        .lab-select::-ms-expand {
          display: none;
        }

        .lab-actions-row {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .lab-btn {
          border-radius: 999px;
          padding: 7px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          min-height: 38px;
          transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.04s ease, border-color 0.15s ease;
        }
        .lab-btn:hover {
          background: #fdf2ff;
          box-shadow: 0 6px 18px rgba(244,114,182,0.3);
        }
        .lab-btn:active {
          transform: translateY(1px);
        }

        /* ensure Save pill matches input height */
        .hero-player-row .hero-save-btn {
          height: var(--lab-control-height);
          min-height: var(--lab-control-height);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .lab-btn-primary,
        .lab-btn-secondary {
          min-width: 132px;
        }

        .lab-btn-primary {
          background: linear-gradient(90deg,#a855f7,#ec4899);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 6px 18px rgba(147,51,234,0.45);
        }
        .lab-btn-primary:hover {
          background: linear-gradient(90deg,#7c3aed,#db2777);
        }

        .lab-btn-secondary {
          background: #fee2f2;
          border-color: #fb7185;
          color: #9d174d;
        }

        .lab-btn-ghost {
          background: #ffffff;
          border-color: #e5e7eb;
          color: #4b5563;
          box-shadow: none;
        }

        .lab-btn-danger {
          border-color: #fecaca;
          color: #b91c1c;
          background: #fef2f2;
        }

        .lab-btn-small {
          padding-block: 5px;
          font-size: 0.8rem;
          min-height: 32px;
        }

        .lab-result {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #fdf2ff;
          border: 1px solid #f5d0fe;
          display: grid;
          gap: 4px;
        }
        .lab-score-line {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .lab-score-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #6b7280;
        }
        .lab-score-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #111827;
        }
        .lab-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .lab-chip--xp {
          background: #dcfce7;
          color: #166534;
        }
        .lab-chip--highlight {
          background: #fef3c7;
          color: #92400e;
        }
        .lab-result-hints {
          font-size: 0.78rem;
          color: #4b5563;
        }
        .lab-hint {
          opacity: 0.9;
        }
        .lab-save-row {
          margin-top: 4px;
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        /* Leaderboard */
        .lab-empty {
          margin-top: 6px;
          font-size: 0.9rem;
          color: #6b7280;
        }
        .lab-board {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          display: grid;
          gap: 6px;
        }
        .lab-board-row {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid #f3e8ff;
          background: radial-gradient(circle at top left,#fdf4ff,#f9fafb);
        }
        .lab-rank {
          font-weight: 700;
          text-align: center;
          color: #6b21a8;
        }
        .lab-board-main {
          min-width: 0;
        }
        .lab-board-user {
          font-size: 0.9rem;
          font-weight: 600;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lab-board-outfit {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .lab-score-pill {
          padding: 4px 10px;
          border-radius: 999px;
          background: #eef2ff;
          color: #4338ca;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .lab-board-footer {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 0.8rem;
          color: #6b7280;
        }
        .lab-board-meta {
          opacity: 0.9;
        }

        /* FAN CLOSET SECTION */
        .fan-closet-section {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cl-grid {
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 10px;
        }

        .cl-item {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 10px 26px rgba(148,163,184,0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cl-item-media {
          background: #fdf2ff;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .cl-item-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cl-item-placeholder {
          font-size: 0.78rem;
          color: #6b7280;
        }

        .cl-item-body {
          padding: 8px 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cl-item-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }

        .cl-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cl-item-status {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          background: #f5f3ff;
          color: #6d28d9;
          padding: 2px 6px;
          border-radius: 999px;
        }

        .cl-item-meta {
          font-size: 0.78rem;
          color: #9ca3af;
        }

        .cl-item-date {
          font-size: 0.78rem;
        }

        .cl-item-footer {
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .fan-coin-pill {
          margin-top: 4px;
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 11px;
          background: #fef3c7;
          border: 1px solid #facc15;
          color: #92400e;
          gap: 4px;
        }

        .cl-item-coins-help {
          font-size: 0.7rem;
          color: #6b7280;
          margin-top: 2px;
        }

        .cl-item-coins-help a {
          color: #4b5563;
          text-decoration: underline;
        }

        .cl-error {
          margin-top: 4px;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 0.8rem;
          background: #fef2f2;
          color: #b91c1c;
        }

        .cl-empty {
          margin-top: 4px;
          font-size: 0.85rem;
          color: #6b7280;
        }

        /* RAILS */
        .style-lab-rails {
          max-width: var(--lab-max-width);
          margin: 4px auto 0;
          display:flex;
          flex-direction:column;
          gap:10px;
        }
        .rails-header__title {
          margin:0;
          font-size:1.1rem;
          font-weight:600;
        }
        .rails-header__subtitle {
          margin:2px 0 0;
          font-size:0.9rem;
          color:#6b7280;
        }
        .rails-grid {
          display:grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap:12px;
        }
        .rail {
          border-radius:18px;
          padding:12px 12px 14px;
          border:1px solid #ffe4f3;
          background:#fff;
          box-shadow:0 12px 36px rgba(248,113,181,0.25);
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .rail--episodes {
          background:radial-gradient(circle at top left,#ffe4f3,#fdf2ff);
        }
        .rail--closet {
          background:radial-gradient(circle at top,#fdf2ff,#e9d5ff);
        }
        .rail--community {
          background:radial-gradient(circle at top,#fee2f2,#e0f2fe);
        }
        .rail__head {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
        }
        .rail__label {
          font-size:0.8rem;
          text-transform:uppercase;
          letter-spacing:0.14em;
          color:#7c3aed;
        }
        .rail__link {
          font-size:0.8rem;
          color:#a855f7;
          text-decoration:none;
          white-space:nowrap;
        }
        .rail__link:hover {
          text-decoration:underline;
        }
        .rail__text {
          margin:0;
          font-size:0.86rem;
          color:#374151;
        }

        /* RESPONSIVE TWEAKS */
        @media (max-width: 900px) {
          .style-lab {
            padding-inline: 12px;
          }
          .style-lab-hero {
            padding: 14px 14px 16px;
          }
          .style-lab-hero__copy,
          .style-lab-hero__panel {
            width: 100%;
          }
          .style-lab-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .lab-main-layout {
            flex-direction: column;
          }
          .lab-preview {
            flex: 0 0 auto;
            max-width: 100%;
          }
          .lab-form-row {
            grid-template-columns: minmax(0, 1fr);
          }
          .rails-grid {
            grid-template-columns:minmax(0,1fr);
          }
        }

        @media (max-width: 640px) {
          .style-lab-hero__title {
            font-size: 1.45rem;
          }
          .style-lab-hero__panel {
            max-width: 100%;
          }
          .hero-player-row {
            flex-direction: column;
          }
          .hero-player-row .hero-save-btn {
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}

