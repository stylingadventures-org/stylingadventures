// site/src/routes/admin/ClosetQueue.jsx
import React, { useEffect, useState, useCallback } from "react";
import { getSignedGetUrl } from "../../lib/sa";

const GQL = {
  list: /* GraphQL */ `
    query AdminListPending {
      adminListPending {
        id
        title
        status
        mediaKey
        rawMediaKey
        createdAt
        updatedAt
        userId
        ownerSub
        reason
        audience
      }
    }
  `,
  approve: /* GraphQL */ `
    mutation Approve($id: ID!) {
      adminApproveItem(id: $id) {
        id
        status
        updatedAt
        audience
      }
    }
  `,
  reject: /* GraphQL */ `
    mutation Reject($id: ID!, $reason: String) {
      adminRejectItem(id: $id, reason: $reason) {
        id
        status
        reason
        updatedAt
      }
    }
  `,
  // 🔴 IMPORTANT: only ask for `audience` here.
  setAudience: /* GraphQL */ `
    mutation SetAudience($id: ID!, $audience: ClosetAudience!) {
      adminSetClosetAudience(id: $id, audience: $audience) {
        audience
      }
    }
  `,
};

const AUDIENCE_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "BESTIE", label: "Bestie" },
  { value: "EXCLUSIVE", label: "Exclusive" },
];

export default function ClosetQueue() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [authReady, setAuthReady] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      const data = await window.sa.graphql(GQL.list);
      const baseList = (data?.adminListPending || []).map((it) => ({
        ...it,
        userId: it.userId || it.ownerSub || "",
        audience: it.audience || "PUBLIC",
      }));

      const withThumbs = await Promise.all(
        baseList.map(async (it) => {
          const key = it.mediaKey || it.rawMediaKey || null;
          if (!key) return it;
          try {
            const url = await getSignedGetUrl(key);
            return { ...it, mediaUrl: url };
          } catch (e) {
            console.warn("[ClosetQueue] thumb presign failed", e);
            return it;
          }
        }),
      );

      setItems(withThumbs);
    } catch (e) {
      console.error(e);
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (window.sa?.ready) await window.sa.ready();
        setAuthReady(true);
        await refresh();
      } catch (e) {
        console.error(e);
        setErr(e?.message || String(e));
      }
    })();
  }, [refresh]);

  async function approve(id, audience) {
    try {
      const aud = audience || "PUBLIC";
      await window.sa.graphql(GQL.approve, { id });
      await window.sa.graphql(GQL.setAudience, { id, audience: aud });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    }
  }

  async function reject(id) {
    const reason = prompt("Reason (optional):") || null;
    try {
      await window.sa.graphql(GQL.reject, { id, reason });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    }
  }

  async function saveAudience(id, audience) {
    try {
      await window.sa.graphql(GQL.setAudience, { id, audience });
      await refresh();
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
    }
  }

  function updateLocalAudience(id, audience) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, audience } : it)),
    );
  }

  return (
    <div className="sa-card">
      <h2 style={{ marginTop: 0 }}>Closet queue</h2>
      <p className="sa-muted" style={{ marginTop: 4 }}>
        Approve or reject closet uploads, and choose who can see them.
      </p>

      {!authReady && <div className="error-text">Auth not ready</div>}
      {err && <div className="error-text">{err}</div>}

      <div style={{ marginBottom: 8 }}>
        <button
          className="sa-btn sa-btn--ghost"
          onClick={refresh}
          disabled={!authReady || loading}
        >
          Refresh
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="sa-muted">No pending items.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => {
          const isPending = it.status === "PENDING";
          const isApproved = it.status === "APPROVED";

          const s3Key = it.mediaKey || it.rawMediaKey || null;

          return (
            <article key={it.id} className="sa-card" style={{ padding: 12 }}>
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {it.title || "(Untitled)"}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="pill">
                    {isPending ? "Pending" : it.status}
                  </span>
                </div>
              </header>

              <div className="sa-muted" style={{ margin: "4px 0 8px" }}>
                User: <code>{it.userId || it.ownerSub}</code> • Created:{" "}
                {new Date(it.createdAt).toLocaleString()}
              </div>

              {it.mediaUrl && (
                <div style={{ margin: "8px 0" }}>
                  <img
                    src={it.mediaUrl}
                    alt={it.title || "Closet item image"}
                    style={{
                      maxWidth: 200,
                      borderRadius: 12,
                      display: "block",
                      boxShadow: "0 8px 18px rgba(15,23,42,0.18)",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{ fontSize: 12, color: "#6b7280", minWidth: 70 }}
                  htmlFor={`aud-${it.id}`}
                >
                  Audience
                </label>
                <select
                  id={`aud-${it.id}`}
                  value={it.audience || "PUBLIC"}
                  onChange={async (e) => {
                    const val = e.target.value;
                    updateLocalAudience(it.id, val);
                    if (isApproved) {
                      await saveAudience(it.id, val);
                    }
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="sa-btn"
                  disabled={!isPending}
                  onClick={() => approve(it.id, it.audience)}
                >
                  {isPending ? "Approve" : "Approved"}
                </button>
                <button
                  className="sa-btn sa-btn--ghost"
                  onClick={() => reject(it.id)}
                >
                  Reject
                </button>
                {s3Key && (
                  <a
                    className="sa-btn sa-btn--ghost"
                    href={`https://s3.console.aws.amazon.com/s3/object/${encodeURIComponent(
                      s3Key.split("/")[0],
                    )}?region=${
                      window.__cfg?.region || "us-east-1"
                    }&prefix=${encodeURIComponent(s3Key)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in S3
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
