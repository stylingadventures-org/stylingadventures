// site/src/routes/fan/FanHome.jsx
import React, { useEffect, useState, useCallback } from "react";

const GQL = {
  me: /* GraphQL */ `
    query GetMyProfile {
      getMyProfile {
        userId
        displayName
        level
        xp
        coins
        badges
      }
    }
  `,
};

async function fallbackGraphql(query, variables) {
  const url = window.sa?.cfg?.appsyncUrl || (window.__SA__ && window.__SA__.appsyncUrl);
  const idToken =
    localStorage.getItem("sa:idToken") ||
    localStorage.getItem("idToken") ||
    (window.sa?.session && window.sa.session.idToken);
  if (!url || !idToken) throw new Error("Not signed in");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: idToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export default function FanHome() {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");

  const runGql = useCallback(async (q, v) => {
    if (window.sa?.graphql) return window.sa.graphql(q, v);
    return fallbackGraphql(q, v);
  }, []);

  const load = useCallback(async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await runGql(GQL.me);
      setP(data?.getMyProfile ?? null);
    } catch (e) {
      setErr(String(e.message || e));
      setP(null);
    } finally {
      setLoading(false);
    }
  }, [runGql]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="card">
      <h1 style={{ marginTop: 0 }}>Welcome, Fan!</h1>
      <p>This is your base dashboard.</p>

      {err && <div style={{ color: "#b91c1c", marginBottom: 8 }}>{err}</div>}

      {loading ? (
        <p>Loading your profile…</p>
      ) : p ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Stat label="Display name" value={p.displayName || "no display name"} />
            <Stat label="Level" value={p.level} />
            <Stat label="XP" value={p.xp} />
            <Stat label="Coins" value={p.coins} />
            <Stat label="Badges" value={(p.badges || []).join(", ") || "—"} />
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={load}>Refresh</button>
          </div>
        </div>
      ) : (
        <p>We couldn’t load your profile.</p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "#f6f7fb",
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
