import React, { useEffect, useMemo, useState } from "react";

/**
 * Style Lala — local-only mini game
 * - Picks Top / Bottom / Shoes
 * - Scores the combo
 * - Persists leaderboard + player progress to localStorage
 * - Ready to wire to AppSync later
 */

const TOPS = ["Tee", "Blouse", "Hoodie", "Jacket"];
const BOTTOMS = ["Jeans", "Skirt", "Trousers", "Shorts"];
const SHOES = ["Sneakers", "Heels", "Boots", "Loafers"];

// localStorage keys
const LS = {
  PLAYER: "sa.style.player",      // string username
  PROGRESS: "sa.style.progress",  // { xp, level }
  BOARD: "sa.style.board",        // [{ id, user, top, bottom, shoes, score, ts }]
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
  } catch {}
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
  const [saving, setSaving] = useState(false);

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

  const levelMeta = useMemo(() => levelForXP(progress.xp), [progress.xp]);

  async function styleIt() {
    const score = scoreCombo(top, bottom, shoes);
    setLastScore(score);

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
    const next = [entry, ...board].sort((a, b) => b.score - a.score).slice(0, 20);
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
  }

  return (
    <main className="container" style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ marginTop: 12 }}>Style Lala</h1>

      {/* pickers */}
      <section className="card" style={card}>
        <div style={row}>
          <div style={col}>
            <label style={label}>Top</label>
            <select value={top} onChange={(e) => setTop(e.target.value)} style={select}>
              {TOPS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={col}>
            <label style={label}>Bottom</label>
            <select value={bottom} onChange={(e) => setBottom(e.target.value)} style={select}>
              {BOTTOMS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div style={col}>
            <label style={label}>Shoes</label>
            <select value={shoes} onChange={(e) => setShoes(e.target.value)} style={select}>
              {SHOES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={styleIt} style={primaryBtn}>Style it!</button>

        {lastScore != null && (
          <p style={{ marginTop: 10 }}>
            Score: <strong>{lastScore}</strong> · XP +{Math.max(1, Math.round(lastScore / 5))}
          </p>
        )}
      </section>

      {/* leaderboard */}
      <section className="card" style={card}>
        <h3 style={{ marginTop: 0 }}>Leaderboard (local)</h3>
        {board.length === 0 ? (
          <p>No entries yet — be the first to style! ✨</p>
        ) : (
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {board.map((e, i) => (
              <li key={e.id} style={{ margin: "6px 0" }}>
                <strong>{e.user}</strong> · {e.top}/{e.bottom}/{e.shoes} ·{" "}
                <span style={{ color: "#0b6bcb" }}>{e.score}</span>
              </li>
            ))}
          </ol>
        )}
        {board.length > 0 && (
          <button onClick={resetAll} style={dangerBtn}>
            Clear leaderboard & progress
          </button>
        )}
      </section>

      {/* player / progress */}
      <section className="card" style={card}>
        <h3 style={{ marginTop: 0 }}>Player</h3>
        <div style={row}>
          <input
            style={{ ...input, flex: 1 }}
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            placeholder="Player name"
          />
          <button onClick={saveName} disabled={saving} style={secondaryBtn}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={resetProgress} style={ghostBtn}>
            Reset progress
          </button>
        </div>

        <p style={{ marginTop: 10 }}>
          Level <strong>{levelMeta.level}</strong> · XP <strong>{progress.xp}</strong> ·{" "}
          <span style={{ color: "#666" }}>
            {levelMeta.toNext} XP to level {levelMeta.level + 1}
          </span>
        </p>
      </section>
    </main>
  );
}

// ---------- tiny styles ----------
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  margin: "16px 0",
  background: "#fff",
};
const row = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" };
const col = { flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 6 };
const label = { fontSize: 12, color: "#6b7280" };
const select = { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" };
const input = { padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb" };

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};
const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #2563eb",
  background: "#eff6ff",
  color: "#1e40af",
  cursor: "pointer",
};
const ghostBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
};
const dangerBtn = {
  marginTop: 12,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #dc2626",
  background: "#fee2e2",
  color: "#991b1b",
  cursor: "pointer",
};
