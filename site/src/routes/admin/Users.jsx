// site/src/routes/admin/Users.jsx
import React, { useEffect, useState, useCallback } from "react";

const GQL = {
  list: /* GraphQL */ `
    query Users($search: String, $limit: Int, $nextToken: String) {
      adminListUsers(search: $search, limit: $limit, nextToken: $nextToken) {
        items { id email role tier createdAt updatedAt }
        nextToken
      }
    }
  `,
  setRole: /* GraphQL */ `
    mutation SetRole($input: SetUserRoleInput!) {
      setUserRole(input: $input) { id email role tier }
    }
  `,
  grantBestie: /* GraphQL */ `
    mutation Grant($email: AWSEmail!) {
      adminSetBestieByEmail(email: $email, active: true) { active until }
    }
  `,
  revokeBestie: /* GraphQL */ `
    mutation Revoke($email: AWSEmail!) {
      adminRevokeBestieByEmail(email: $email) { active until }
    }
  `,
};

const ROLES = ["FAN", "BESTIE", "CREATOR", "COLLAB", "ADMIN"];
const TIERS = ["FREE", "PRIME"];

export default function Users() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState({ items: [], nextToken: null });
  const [err, setErr] = useState("");

  const fetchUsers = useCallback(
    async (token = null) => {
      setLoading(true);
      setErr("");
      try {
        const d = await window.sa.graphql(GQL.list, {
          search: q || null,
          limit: 25,
          nextToken: token,
        });
        setPage(d?.adminListUsers || { items: [], nextToken: null });
      } catch (e) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    },
    [q]
  );

  useEffect(() => {
    (async () => {
      if (window.sa?.ready) {
        await window.sa.ready().catch(() => {});
      }
      await fetchUsers(null);
    })();
  }, [fetchUsers]);

  async function changeRole(u, role, tier) {
    try {
      await window.sa.graphql(GQL.setRole, {
        input: { userId: u.id, email: u.email, role, tier },
      });
      await fetchUsers(null);
    } catch (e) {
      alert(e?.message || String(e));
    }
  }

  async function bestie(email, active) {
    try {
      await window.sa.graphql(
        active ? GQL.grantBestie : GQL.revokeBestie,
        { email }
      );
      await fetchUsers(null);
    } catch (e) {
      alert(e?.message || String(e));
    }
  }

  const total = page.items.length || 0;
  const adminCount = page.items.filter((u) => u.role === "ADMIN").length;
  const bestieCount = page.items.filter((u) => u.role === "BESTIE").length;
  const primeCount = page.items.filter((u) => u.tier === "PRIME").length;

  return (
    <div className="admin-users">
      <style>{styles}</style>

      {/* Hero / header card */}
      <section className="admin-users__hero">
        <div className="admin-users__hero-main">
          <span className="admin-users__kicker">Admin · People & access</span>
          <h1 className="admin-users__title">User directory</h1>
          <p className="admin-users__subtitle">
            Search fans, upgrade Besties, and keep roles in sync. Changes here
            flow straight into what people unlock in Lala&apos;s world.
          </p>
        </div>
        <div className="admin-users__hero-stats">
          <div className="admin-users__pill">
            <span className="admin-users__pill-label">Users loaded</span>
            <span className="admin-users__pill-count">{total}</span>
          </div>
          <div className="admin-users__hero-badges">
            <span className="admin-users__miniStat">
              <span className="admin-users__miniDot admin-users__miniDot--admin" />
              Admins: <strong>{adminCount}</strong>
            </span>
            <span className="admin-users__miniStat">
              <span className="admin-users__miniDot admin-users__miniDot--bestie" />
              Besties: <strong>{bestieCount}</strong>
            </span>
            <span className="admin-users__miniStat">
              <span className="admin-users__miniDot admin-users__miniDot--prime" />
              Prime: <strong>{primeCount}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Search + controls */}
      <section className="admin-users__controls">
        <div className="admin-users__searchRow">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email…"
            className="admin-users__searchInput"
          />
          <button
            className="btn btn-primary"
            onClick={() => fetchUsers(null)}
            disabled={loading}
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setQ("");
              fetchUsers(null);
            }}
            disabled={loading && !q}
          >
            Clear
          </button>
        </div>

        <p className="admin-users__hint">
          Tip: start typing an email to narrow quickly. The list below shows the
          current page of matches.
        </p>
      </section>

      {/* Error + loading states */}
      {err && <div className="admin-users__error">⚠ {err}</div>}
      {loading && !page.items.length && (
        <div className="admin-users__loading">Loading users…</div>
      )}
      {!loading && !page.items.length && !err && (
        <div className="admin-users__empty">
          No users found for that search yet.
        </div>
      )}

      {/* User list */}
      {page.items.length > 0 && (
        <section className="admin-users__list">
          {page.items.map((u) => {
            const created = u.createdAt
              ? new Date(u.createdAt).toLocaleString()
              : "—";
            const updated = u.updatedAt
              ? new Date(u.updatedAt).toLocaleString()
              : "—";
            const tier = u.tier || "FREE";
            const role = u.role || "FAN";
            const isBestieRole = role === "BESTIE";

            return (
              <article key={u.id} className="admin-user-card">
                {/* Top section: email + meta + tags */}
                <div className="admin-user-card__top">
                  <div className="admin-user-card__main">
                    <div className="admin-user-card__email">
                      {u.email || "(no email)"}
                    </div>
                    <div className="admin-user-card__meta">
                      <span className="admin-chip">
                        id:{" "}
                        <span className="admin-chip__mono">{u.id}</span>
                      </span>
                      <span className="admin-chip admin-chip--soft">
                        Created: {created}
                      </span>
                      <span className="admin-chip admin-chip--light">
                        Updated: {updated}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-card__tags">
                    <span className="admin-tag admin-tag--role">
                      Role: {role}
                    </span>
                    <span className="admin-tag admin-tag--tier">
                      Tier: {tier}
                    </span>
                    {isBestieRole && (
                      <span className="admin-tag admin-tag--bestie">
                        Bestie
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom section: controls */}
                <div className="admin-user-card__bottom">
                  {/* Role + tier controls */}
                  <div className="admin-user-card__controls">
                    <div className="admin-user-card__field">
                      <label className="admin-user-card__label">Role</label>
                      <select
                        value={role}
                        onChange={(e) =>
                          changeRole(u, e.target.value, tier)
                        }
                        className="admin-select"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-user-card__field">
                      <label className="admin-user-card__label">Tier</label>
                      <select
                        value={tier}
                        onChange={(e) =>
                          changeRole(u, role, e.target.value)
                        }
                        className="admin-select"
                      >
                        {TIERS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bestie actions */}
                  <div className="admin-user-card__bestieRow">
                    <span className="admin-user-card__bestieHint">
                      Bestie grants perks and access on top of their role.
                    </span>
                    <div className="admin-user-card__bestieActions">
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => bestie(u.email, true)}
                        disabled={loading}
                      >
                        Grant Bestie
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => bestie(u.email, false)}
                        disabled={loading}
                      >
                        Revoke Bestie
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Pagination */}
      <div className="admin-users__footer">
        <button
          className="btn btn-ghost"
          onClick={() => fetchUsers(page.nextToken)}
          disabled={!page.nextToken || loading}
        >
          {page.nextToken ? "Load more users" : "No more users"}
        </button>
      </div>
    </div>
  );
}

const styles = `
.admin-users {
  display:flex;
  flex-direction:column;
  gap:16px;
}

/* HERO HEADER */
.admin-users__hero {
  border-radius:22px;
  padding:16px 18px;
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  flex-wrap:wrap;
  background:
    radial-gradient(circle at top left, rgba(252,231,243,0.96), rgba(249,250,251,0.98)),
    radial-gradient(circle at bottom right, rgba(224,231,255,0.95), #ffffff);
  border:1px solid #e5e7eb;
  box-shadow:0 18px 38px rgba(148,163,184,0.34);
}

.admin-users__hero-main {
  display:flex;
  flex-direction:column;
  gap:4px;
  max-width:540px;
}

.admin-users__kicker {
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:.16em;
  color:#9ca3af;
  font-weight:600;
}

.admin-users__title {
  margin:0;
  font-size:1.45rem;
  font-weight:700;
  letter-spacing:-0.02em;
}

.admin-users__subtitle {
  margin:2px 0 0;
  font-size:0.9rem;
  color:#4b5563;
}

.admin-users__hero-stats {
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:8px;
}

.admin-users__hero-badges {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  justify-content:flex-end;
}

.admin-users__miniStat {
  display:inline-flex;
  align-items:center;
  gap:4px;
  font-size:0.78rem;
  padding:3px 8px;
  border-radius:999px;
  background:rgba(255,255,255,0.85);
  border:1px solid rgba(209,213,219,0.9);
  color:#4b5563;
}
.admin-users__miniDot {
  width:7px;
  height:7px;
  border-radius:999px;
}
.admin-users__miniDot--admin {
  background:#4f46e5;
}
.admin-users__miniDot--bestie {
  background:#f59e0b;
}
.admin-users__miniDot--prime {
  background:#22c55e;
}

.admin-users__pill {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:6px 10px;
  border-radius:999px;
  background:#eff6ff;
  border:1px solid #dbeafe;
}
.admin-users__pill-label {
  font-size:0.75rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
  color:#1d4ed8;
}
.admin-users__pill-count {
  font-size:0.9rem;
  font-weight:600;
  color:#111827;
}

@media (max-width: 720px) {
  .admin-users__hero-stats {
    align-items:flex-start;
  }
}

/* CONTROLS */
.admin-users__controls {
  padding:10px 12px;
  border-radius:14px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
}

.admin-users__searchRow {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.admin-users__searchInput {
  flex:1 1 220px;
  min-width:0;
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#ffffff;
  padding:8px 12px;
  font-size:0.9rem;
}
.admin-users__searchInput:focus {
  outline:none;
  border-color:#4f46e5;
  box-shadow:0 0 0 1px rgba(79,70,229,0.2);
}

.admin-users__hint {
  margin:6px 0 0;
  font-size:0.78rem;
  color:#9ca3af;
}

/* STATES */
.admin-users__error {
  padding:10px 12px;
  border-radius:10px;
  border:1px solid #fecaca;
  background:#fee2e2;
  color:#7f1d1d;
  font-size:0.9rem;
}
.admin-users__loading,
.admin-users__empty {
  padding:10px 2px;
  font-size:0.9rem;
  color:#4b5563;
}

/* LIST + CARDS */
.admin-users__list {
  display:grid;
  gap:10px;
}

.admin-user-card {
  border-radius:18px;
  border:1px solid #e5e7eb;
  background:#ffffff;
  padding:12px 14px;
  box-shadow:0 10px 22px rgba(148,163,184,0.32);
  display:flex;
  flex-direction:column;
  gap:10px;
}

.admin-user-card__top {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:10px;
  flex-wrap:wrap;
}

.admin-user-card__main {
  min-width:0;
}
.admin-user-card__email {
  font-weight:600;
  font-size:0.96rem;
  word-break:break-all;
}
.admin-user-card__meta {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:4px;
}

.admin-chip {
  display:inline-flex;
  align-items:center;
  gap:4px;
  padding:3px 8px;
  border-radius:999px;
  background:#f3f4f6;
  font-size:0.75rem;
  color:#4b5563;
}
.admin-chip--soft {
  background:#eff6ff;
  color:#1d4ed8;
}
.admin-chip--light {
  background:#fefce8;
  color:#854d0e;
}
.admin-chip__mono {
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
}

.admin-user-card__tags {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.admin-tag {
  font-size:0.7rem;
  border-radius:999px;
  padding:4px 8px;
  background:#f3f4f6;
  color:#374151;
}
.admin-tag--role {
  background:#eef2ff;
  color:#4338ca;
}
.admin-tag--tier {
  background:#ecfdf3;
  color:#166534;
}
.admin-tag--bestie {
  background:#fef3c7;
  color:#92400e;
}

/* bottom row */
.admin-user-card__bottom {
  display:flex;
  flex-direction:column;
  gap:8px;
  border-top:1px dashed #e5e7eb;
  padding-top:8px;
}

.admin-user-card__controls {
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}
.admin-user-card__field {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.admin-user-card__label {
  font-size:0.7rem;
  text-transform:uppercase;
  letter-spacing:0.12em;
  color:#9ca3af;
}

.admin-select {
  min-width:140px;
  height:32px;
  border-radius:999px;
  border:1px solid #d1d5db;
  background:#f9fafb;
  padding:0 10px;
  font-size:0.85rem;
  color:#374151;
}
.admin-select:focus {
  outline:none;
  border-color:#4f46e5;
  box-shadow:0 0 0 1px rgba(79,70,229,0.2);
}

.admin-user-card__bestieRow {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}
.admin-user-card__bestieHint {
  font-size:0.75rem;
  color:#9ca3af;
}
.admin-user-card__bestieActions {
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}

/* footer */
.admin-users__footer {
  margin-top:8px;
}

/* BUTTONS – match admin style */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:9px 16px;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:500;
}
.btn-sm {
  padding:7px 13px;
  font-size:0.8rem;
}
.btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.btn:active {
  transform:translateY(1px);
}

.btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.btn-ghost {
  background:#ffffff;
  color:#374151;
}
`;
