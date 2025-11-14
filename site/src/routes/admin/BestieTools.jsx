// site/src/routes/admin/BestieTools.jsx
import React, { useEffect, useState } from "react";

const GQL = {
  grant: /* GraphQL */ `
    mutation Grant($email: AWSEmail!) {
      adminSetBestieByEmail(email: $email, active: true) { active until source }
    }
  `,
  revoke: /* GraphQL */ `
    mutation Revoke($email: AWSEmail!) {
      adminRevokeBestieByEmail(email: $email) { active until source }
    }
  `,
};

export default function BestieTools() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (window.sa?.ready) window.sa.ready().catch(() => {});
  }, []);

  async function doGrant() {
    setErr(""); setOk("");
    try {
      const d = await window.sa.graphql(GQL.grant, { email: email.trim() });
      setOk("Granted! 🎉");
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  async function doRevoke() {
    setErr(""); setOk("");
    try {
      const d = await window.sa.graphql(GQL.revoke, { email: email.trim() });
      setOk("Revoked.");
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  return (
    <div className="sa-card">
      <h2 style={{ marginTop: 0 }}>Bestie tools</h2>
      <p className="sa-muted">Grant or revoke Bestie by a user’s email.</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 560 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="sa-input"
          style={{ flex: 1 }}
        />
        <button className="sa-btn" onClick={doGrant}>Grant Bestie (1 year)</button>
        <button className="sa-btn sa-btn--ghost" onClick={doRevoke}>Revoke Bestie</button>
      </div>

      {err && <div className="error-text" style={{ marginTop: 8 }}>{err}</div>}
      {ok && <div className="success-text" style={{ marginTop: 8 }}>{ok}</div>}
    </div>
  );
}
