import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSA } from "../lib/sa";

export default function Bestie() {
  const [ready, setReady] = useState(false);
  const [signed, setSigned] = useState(false);
  const [role, setRole] = useState("FAN");
  const [sa, setSA] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getSA();
      if (!alive) return;
      setSA(s);
      setSigned(Boolean(s?.isSignedIn?.()));
      setRole(s?.getRole?.() || "FAN");
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  if (!ready) return null;                         // small mount gap
  if (!signed) return <Navigate to="/profile" replace />;

  const allowed = role === "BESTIE" || role === "ADMIN";
  if (!allowed) return <Navigate to="/" replace />;

  return (
    <section className="card">
      <h1 style={{ marginTop: 0 }}>Bestie dashboard</h1>
      <p>Exclusive perks for Besties 🎀</p>

      <div style={{display: "flex", gap: 8, marginTop: 12}}>
        <a className="pill" href="/fan">Go to Fan</a>
        <button className="pill" onClick={() => sa?.logoutEverywhere?.()}>
          Sign out
        </button>
      </div>
    </section>
  );
}
