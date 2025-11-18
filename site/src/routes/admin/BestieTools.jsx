// site/src/routes/admin/BestieTools.jsx
import React, { useEffect, useState } from "react";

const GQL = {
  grant: /* GraphQL */ `
    mutation Grant($email: AWSEmail!) {
      adminSetBestieByEmail(email: $email, active: true) {
        active
        until
        source
      }
    }
  `,
  revoke: /* GraphQL */ `
    mutation Revoke($email: AWSEmail!) {
      adminRevokeBestieByEmail(email: $email) {
        active
        until
        source
      }
    }
  `,
};

export default function BestieTools() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.sa?.ready) window.sa.ready().catch(() => {});
  }, []);

  const trimmedEmail = email.trim();
  const isEmailValid = trimmedEmail.includes("@");

  async function doGrant() {
    if (!isEmailValid) {
      setErr("Enter a valid email to grant Bestie.");
      setStatusMsg("");
      setLastResult(null);
      return;
    }
    setErr("");
    setStatusMsg("");
    setLastResult(null);

    try {
      setLoading(true);
      const d = await window.sa.graphql(GQL.grant, { email: trimmedEmail });
      const res = d?.adminSetBestieByEmail || null;
      setLastResult(res);
      setStatusMsg("Bestie access granted 🎉");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function doRevoke() {
    if (!isEmailValid) {
      setErr("Enter a valid email to revoke Bestie.");
      setStatusMsg("");
      setLastResult(null);
      return;
    }
    setErr("");
    setStatusMsg("");
    setLastResult(null);

    try {
      setLoading(true);
      const d = await window.sa.graphql(GQL.revoke, { email: trimmedEmail });
      const res = d?.adminRevokeBestieByEmail || null;
      setLastResult(res);
      setStatusMsg("Bestie access revoked.");
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-bestie-tools">
      <style>{styles}</style>

      {/* HERO */}
      <header className="bt-hero">
        <div className="bt-hero-main">
          <div className="bt-kicker">Styling Adventures with Lala</div>
          <h1 className="bt-title">
            Bestie control center <span className="bt-emoji">💜</span>
          </h1>
          <p className="bt-sub">
            Grant or revoke Bestie access by email. Use this when you&apos;re
            gifting passes, fixing billing issues, or giving inner-circle
            access to collaborators.
          </p>
        </div>
        <div className="bt-hero-meta">
          <span className="bt-chip">Admin portal</span>
          <span className="bt-hero-hint">
            Changes apply instantly to the user&apos;s account.
          </span>
        </div>
      </header>

      {/* TWO-COLUMN SHELL */}
      <section className="bt-shell">
        {/* LEFT: form */}
        <section className="bt-card bt-card-main">
          <h2 className="bt-card-title">Manage Bestie access</h2>
          <p className="bt-card-sub">
            Paste a user&apos;s email to toggle their Bestie status. Granting
            Bestie uses your default duration (e.g. 1 year) on the backend.
          </p>

          <div className="bt-form-row">
            <label className="bt-field">
              <span className="bt-field-label">User email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="sa-input"
              />
            </label>
          </div>

          <div className="bt-actions">
            <button
              className="sa-btn"
              onClick={doGrant}
              disabled={loading || !isEmailValid}
            >
              {loading ? "Saving…" : "Grant Bestie"}
            </button>
            <button
              className="sa-btn sa-btn--ghost"
              onClick={doRevoke}
              disabled={loading || !isEmailValid}
            >
              Revoke Bestie
            </button>
          </div>

          {/* Messages */}
          {err && (
            <div className="bt-msg bt-msg--error">
              <strong>Oops:</strong> {err}
            </div>
          )}
          {statusMsg && (
            <div className="bt-msg bt-msg--ok">
              {statusMsg}
              {lastResult && (
                <div className="bt-meta-line">
                  {typeof lastResult.active === "boolean" && (
                    <span>
                      Status:{" "}
                      <strong>
                        {lastResult.active ? "Active" : "Inactive"}
                      </strong>
                    </span>
                  )}
                  {lastResult.until && (
                    <span>
                      • Until:{" "}
                      <strong>
                        {new Date(lastResult.until).toLocaleDateString()}
                      </strong>
                    </span>
                  )}
                  {lastResult.source && (
                    <span>
                      • Source: <strong>{lastResult.source}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="bt-footnote">
            Tip: if someone&apos;s card declines or a subscription fails, you
            can temporarily grant Bestie here while support sorts out their
            billing.
          </p>
        </section>

        {/* RIGHT: explainer / guardrails */}
        <aside className="bt-card bt-card-side">
          <h3 className="bt-side-title">Bestie guidelines</h3>
          <ul className="bt-list">
            <li>
              <strong>One account per person.</strong> Only grant to emails you
              recognize from your user list or support inbox.
            </li>
            <li>
              <strong>Short-term passes.</strong> Use this for giveaways,
              contests, and collabs when you want to comp someone manually.
            </li>
            <li>
              <strong>Revokes are soft.</strong> Revoking Bestie keeps their
              account but removes access to Bestie-only areas and uploads.
            </li>
            <li>
              <strong>Audit-friendly.</strong> Back-end logs keep track of who
              was granted Bestie and when.
            </li>
          </ul>
          <p className="bt-side-note">
            Need to see a full list of Besties? Use the{" "}
            <span className="bt-link-inline">Users</span> page to filter by
            role/tier.
          </p>
        </aside>
      </section>
    </div>
  );
}

const styles = `
.admin-bestie-tools {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

/* HERO */
.bt-hero {
  margin-top: 4px;
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(252, 231, 243, 0.95), rgba(255, 255, 255, 0.96)),
    radial-gradient(circle at bottom right, rgba(221, 214, 254, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 18px 40px rgba(148, 163, 184, 0.45);
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
@media (max-width: 820px) {
  .bt-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
.bt-hero-main {
  max-width: 620px;
}
.bt-kicker {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #6b7280;
  margin-bottom: 2px;
}
.bt-title {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bt-emoji {
  font-size: 22px;
}
.bt-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #4b5563;
}
.bt-hero-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
@media (max-width: 820px) {
  .bt-hero-meta {
    align-items: flex-start;
  }
}
.bt-chip {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.bt-hero-hint {
  font-size: 11px;
  color: #6b7280;
}

/* SHELL */
.bt-shell {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.5fr);
  gap: 18px;
}
@media (max-width: 900px) {
  .bt-shell {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* CARDS */
.bt-card {
  border-radius: 20px;
  border: 1px solid rgba(209, 213, 219, 0.7);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
  background: #ffffff;
  padding: 16px 18px 18px;
}
.bt-card-main {
  background: #fdfcff;
}
.bt-card-side {
  background: #f5f3ff;
}
.bt-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.bt-card-sub {
  margin: 4px 0 12px;
  font-size: 13px;
  color: #6b7280;
}

/* FORM */
.bt-form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.bt-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bt-field-label {
  font-size: 11px;
  color: #6b7280;
}
.bt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

/* MESSAGES */
.bt-msg {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
}
.bt-msg--error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.bt-msg--ok {
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.bt-meta-line {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
}
.bt-footnote {
  margin-top: 10px;
  font-size: 11px;
  color: #6b7280;
}

/* SIDEBAR CARD */
.bt-side-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}
.bt-list {
  margin: 0 0 10px;
  padding-left: 18px;
  font-size: 12px;
  color: #4b5563;
}
.bt-list li {
  margin-bottom: 4px;
}
.bt-side-note {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
}
.bt-link-inline {
  color: #4c1d95;
  font-weight: 500;
}
`;
