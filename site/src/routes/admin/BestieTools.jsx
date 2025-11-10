// site/src/routes/admin/BestieTools.jsx
import React, { useState } from "react";
import { getSA } from "../../lib/sa";

export default function BestieTools() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function run(mutation, vars) {
    setMsg("");
    try {
      const SA = await getSA();
      const res = await SA.gql(mutation, vars);
      setMsg("✅ Success");
    } catch (e) {
      setMsg("❌ " + (e?.message || String(e)));
    }
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff", maxWidth: 560 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Bestie controls</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}
        />
        <button
          onClick={() =>
            run(`mutation($email:String!){ AdminSetBestieByEmail(email:$email) }`, { email })
          }
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #111827", background: "#111827", color: "#fff" }}
        >
          Promote
        </button>
        <button
          onClick={() =>
            run(`mutation($email:String!){ AdminRevokeBestieByEmail(email:$email) }`, { email })
          }
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" }}
        >
          Revoke
        </button>
      </div>
      {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
