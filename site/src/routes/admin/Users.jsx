// site/src/routes/admin/Users.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";

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

  const fetchUsers = useCallback(async (token = null) => {
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
  }, [q]);

  useEffect(() => {
    (async () => {
      if (window.sa?.ready) await window.sa.ready().catch(() => {});
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
      await window.sa.graphql(active ? GQL.grantBestie : GQL.revokeBestie, { email });
      await fetchUsers(null);
    } catch (e) {
      alert(e?.message || String(e));
    }
  }

  return (
    <div className="sa-card">
      <h2 style={{ marginTop: 0 }}>Users</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email…"
          className="sa-input"
          style={{ maxWidth: 320 }}
        />
        <button className="sa-btn" onClick={() => fetchUsers(null)} disabled={loading}>
          Search
        </button>
      </div>

      {err && <div className="error-text">{err}</div>}
      {loading && <div>Loading…</div>}

      {!loading && page.items.length === 0 && <div className="sa-muted">No users.</div>}

      <div style={{ display: "grid", gap: 8 }}>
        {page.items.map((u) => (
          <article key={u.id} className="sa-card" style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{u.email || "(no email)"}</div>
                <div className="sa-muted">id: {u.id}</div>
                <div className="sa-muted">
                  created {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value, u.tier || "FREE")}
                  className="sa-input"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={u.tier || "FREE"}
                  onChange={(e) => changeRole(u, u.role, e.target.value)}
                  className="sa-input"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <button className="sa-btn sa-btn--ghost" onClick={() => bestie(u.email, true)}>
                  Grant Bestie
                </button>
                <button className="sa-btn sa-btn--ghost" onClick={() => bestie(u.email, false)}>
                  Revoke Bestie
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          className="sa-btn sa-btn--ghost"
          onClick={() => fetchUsers(page.nextToken)}
          disabled={!page.nextToken || loading}
        >
          {page.nextToken ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}
