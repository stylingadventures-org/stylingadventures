// site/src/routes/Closet.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // 👈 NEW
import { getSA, fetchLeaderboard } from "../lib/sa";

/**
 * Style Lala — backend-powered
 * - Picks Top / Bottom / Shoes
 * - Scores the combo (client)
 * - Sends GameEvent -> AppSync (logGameEvent)
 * - Updates profile (level/xp/coins) from mutation result
 * - Shows real leaderboard from topXP
 * - Compact leaderboard widget at the top
 */

const TOPS = ["Tee", "Blouse", "Hoodie", "Jacket"];
const BOTTOMS = ["Jeans", "Skirt", "Trousers", "Shorts"];
const SHOES = ["Sneakers", "Heels", "Boots", "Loafers"];

const now = () => Date.now();

function scoreCombo(top, bottom, shoes) {
  let score = 50;
  const chic = top === "Blouse" && bottom === "Skirt";
  const street = top === "Hoodie" && bottom === "Jeans";
  const smart = top === "Jacket" && bottom === "Trousers";
  if (chic) score += 25;
  if (street) score += 20;
  if (smart) score += 30;
  if (shoes === "Heels" && chic) score += 20;
  if (shoes === "Sneakers" && street) score += 15;
  if (shoes === "Loafers" && smart) score += 15;
  score += Math.floor(Math.random() * 11);
  return score;
}

export default function Closet() {
  // outfit picks
  const [top, setTop] = useState(TOPS[0]);
  const [bottom, setBottom] = useState(BOTTOMS[0]);
  const [shoes, setShoes] = useState(SHOES[0]);

  // UI / backend state
  const [lastScore, setLastScore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  // backend data
  const [profile, setProfile] = useState(null);
  const [leader, setLeader] = useState([]);

  // memo helpers
  const gqlCall = useCallback(async (query, variables) => {
    const SA = await getSA();
    return SA.gql(query, variables);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const d = await gqlCall(
        `query { getMyProfile { userId displayName level xp coins badges lastEventAt } }`
      );
      setProfile(d.getMyProfile);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, [gqlCall]);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const rows = await fetchLeaderboard(10);
      setLeader(rows || []);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, []);

  // mini header leaderboard (top 3 + you)
  const headerTop = useMemo(() => leader.slice(0, 3), [leader]);
  const yourRow = useMemo(() => {
    if (!profile?.userId) return null;
    return leader.find((r) => r.userId === profile.userId) || null;
  }, [leader, profile?.userId]);

  // progress to next XP milestone (keep UI truthful vs backend level calc)
  const milestone = useMemo(() => {
    const xp = Number(profile?.xp ?? 0);
    const mod = xp % 100;
    const percent = mod; // 0..99
    const toNext = mod === 0 && xp > 0 ? 0 : 100 - mod;
    return { toNext, percent };
  }, [profile?.xp]);

  useEffect(() => {
    refreshProfile();
    refreshLeaderboard();
    const t = setInterval(() => {
      refreshLeaderboard().catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, [refreshProfile, refreshLeaderboard]);

  async function styleIt() {
    setBusy(true);
    setErr("");
    setNote("");
    try {
      const score = scoreCombo(top, bottom, shoes);
      setLastScore(score);

      const res = await gqlCall(
        `mutation ($input: GameEventInput!){
           logGameEvent(input:$input){
             userId displayName level xp coins badges lastEventAt
           }
         }`,
        {
          input: {
            type: "STYLE_IT",
            metadata: JSON.stringify({ top, bottom, shoes, score, ts: now() }),
          },
        }
      );

      setProfile(res.logGameEvent);
      setNote(`🎉 Styled! +${Math.max(1, Math.round(score / 5))} XP awarded.`);
      await refreshLeaderboard();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
      if (!err) setTimeout(() => setNote(""), 4000);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ marginTop: 12 }}>Style Lala</h1>

      {/* 👇 NEW link to community closet feed */}
      <p style={{ marginTop: 8 }}>
        Want to see community looks?{" "}
        <Link to="/fan/closet-feed">Browse Lala&apos;s Closet →</Link>
      </p>

      {/* Compact leaderboard widget */}
      <section style={{ ...miniWrap }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Leaderboard</div>
        <div style={miniRow}>
          {headerTop.map((r) => (
            <div key={r.rank} style={miniChip}>
              <span style={miniRank}>#{r.rank}</span>{" "}
              <span style={{ fontWeight: 600 }}>
                {r.displayName?.trim() ||
                  (r.userId ? `${r.userId.slice(0, 4)}…${r.userId.slice(-4)}` : "—")}
              </span>{" "}
              <span style={{ color: "#6b7280" }}>{r.xp ?? 0} XP</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ ...miniYou, background: "#eff6ff", borderColor: "#bfdbfe" }}>
            You: <strong>{yourRow?.xp ?? profile?.xp ?? 0}</strong> XP
            {yourRow?.rank ? (
              <span style={miniRank}>#{yourRow.rank}</span>
            ) : (
              <span style={{ marginLeft: 6, color: "#6b7280" }}>—</span>
            )}
          </div>
        </div>
      </section>

      {err && (
        <div style={bannerErr}>
          <strong>Oops:</strong> {err}
        </div>
      )}
      {note && <div style={bannerOk}>{note}</div>}

      {/* Outfit pickers */}
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

        <button onClick={styleIt} disabled={busy} style={primaryBtn}>
          {busy ? "Styling…" : "Style it!"}
        </button>

        {lastScore != null && (
          <p style={{ marginTop: 10 }}>
            Score: <strong>{lastScore}</strong> · XP +
            {Math.max(1, Math.round(lastScore / 5))}
          </p>
        )}
      </section>

      {/* Live profile from backend */}
      <section className="card" style={card}>
        <h3 style={{ marginTop: 0 }}>Player</h3>
        {!profile ? (
          <div>Loading…</div>
        ) : (
          <>
            <p style={{ marginTop: 10 }}>
              Level <strong>{profile.level}</strong> · XP <strong>{profile.xp}</strong> · Coins{" "}
              <strong>{profile.coins}</strong>{" "}
              <span style={{ color: "#666" }}>
                {milestone.toNext === 0
                  ? "Reached a milestone! 🎉"
                  : `${milestone.toNext} XP to next milestone`}
              </span>
            </p>
            {/* progress to next (every 100 XP) */}
            <div
              style={{
                marginTop: 8,
                height: 8,
                background: "#f0f2ff",
                border: "1px solid #e5e9ff",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${milestone.percent}%`,
                  background: "#6b8cff",
                  transition: "width 200ms ease-out",
                }}
              />
            </div>
          </>
        )}
      </section>

      {/* Leaderboard from backend */}
      <section className="card" style={card}>
        <h3 style={{ marginTop: 0 }}>Leaderboard (XP)</h3>
        {leader.length === 0 ? (
          <p>No entries yet — be the first to style! ✨</p>
        ) : (
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {leader.map((e) => (
              <li key={`${e.rank}-${e.userId}`} style={{ margin: "6px 0" }}>
                #{e.rank} · <strong>{e.displayName?.trim() || e.userId}</strong> · XP{" "}
                <span style={{ color: "#0b6bcb" }}>{e.xp ?? 0}</span>
              </li>
            ))}
          </ol>
        )}
        <button onClick={refreshLeaderboard} disabled={busy} style={ghostBtn}>
          Refresh leaderboard
        </button>
      </section>
    </main>
  );
}

/* small styles */
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
const select = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb", // ✅ fixed
};
const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};
const ghostBtn = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
};
const bannerOk = {
  margin: "8px 0",
  padding: 10,
  borderRadius: 8,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1e40af",
};
const bannerErr = {
  margin: "8px 0",
  padding: 10,
  borderRadius: 8,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
};

/* mini leaderboard styles */
const miniWrap = {
  border: "1px dashed #e5e7eb",
  borderRadius: 12,
  padding: 12,
  margin: "8px 0 16px",
};
const miniRow = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const miniChip = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#fff",
  whiteSpace: "nowrap",
};
const miniRank = { marginLeft: 6, fontWeight: 700, color: "#6b7280" };
const miniYou = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};
