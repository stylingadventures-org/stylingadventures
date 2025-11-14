// site/src/routes/Profile.jsx
import React, { useEffect, useState } from "react";
import { getSA, fetchProfile, setDisplayName } from "../lib/sa";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [closet, setCloset] = useState([]);
  const [error, setError] = useState("");
  const [nameEdit, setNameEdit] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    let gone = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const sa = await getSA();

        // 1) Game profile (level, coins, badges, displayName)
        const prof = await fetchProfile().catch(() => null);

        // 2) Basic user info (email / role) from SA.getUser if available
        let userMeta = {};
        try {
          if (sa?.getUser) {
            userMeta = sa.getUser() || {};
          }
        } catch {}

        // 3) My closet items
        let closetItems = [];
        try {
          const data = await sa.gql(`
            query {
              myCloset {
                id
                title
                status
                mediaKey
                createdAt
              }
            }
          `);
          closetItems = data?.myCloset ?? [];
        } catch (e) {
          console.warn("[Profile] myCloset query failed:", e);
        }

        if (!gone) {
          const merged = {
            ...prof,
            email: userMeta.email || prof?.email || "",
            role: userMeta.role || "FAN",
          };
          setProfile(merged);
          setNameEdit(merged?.displayName || "");
          setCloset(closetItems);
        }
      } catch (e) {
        if (!gone) setError(e?.message || String(e));
      } finally {
        if (!gone) setLoading(false);
      }
    })();

    return () => {
      gone = true;
    };
  }, []);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!nameEdit.trim()) return;
    try {
      setSavingName(true);
      const updated = await setDisplayName(nameEdit.trim());
      setProfile((p) => ({ ...(p || {}), ...updated }));
    } catch (e) {
      alert(e?.message || String(e));
    } finally {
      setSavingName(false);
    }
  }

  if (loading && !profile) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="sa-card">Loading your profile…</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="sa-card sa-card-error">
          <h2>We couldn’t load your profile</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const p = profile || {};
  const badges = Array.isArray(p.badges) ? p.badges : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 20 }}>
      <style>{`
        .sa-card {
          background:#fff;
          border-radius:16px;
          border:1px solid #e5e7eb;
          padding:18px 18px 16px;
        }
        .sa-card h2 {
          margin:0 0 8px;
          font-size:18px;
        }
        .sa-row {
          display:flex;
          gap:16px;
          align-items:flex-start;
          flex-wrap:wrap;
        }
        .sa-avatar {
          width:64px;height:64px;border-radius:999px;
          background:#111827;color:#fff;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:24px;
        }
        .sa-label { font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:.08em; }
        .sa-stat-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
          gap:12px;
          margin-top:10px;
        }
        .sa-pill {
          display:inline-flex;
          align-items:center;
          padding:4px 10px;
          border-radius:999px;
          background:#f3f4f6;
          font-size:12px;
          color:#4b5563;
          margin:4px 4px 0 0;
        }
        .sa-closet-grid {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
          gap:10px;
          margin-top:12px;
        }
        .sa-closet-item {
          border-radius:12px;
          border:1px solid #e5e7eb;
          padding:8px;
          background:#f9fafb;
          font-size:13px;
        }
        .sa-chip {
          display:inline-flex;
          align-items:center;
          padding:2px 8px;
          border-radius:999px;
          font-size:11px;
          background:#eef2ff;
          color:#4f46e5;
          font-weight:500;
          margin-top:4px;
        }
        .sa-link {
          font-size:13px;
          color:#2563eb;
          text-decoration:none;
        }
        .sa-link:hover {
          text-decoration:underline;
        }
        @media (max-width:640px){
          .sa-row { align-items:center; }
        }
      `}</style>

      {/* Profile header + name edit */}
      <section className="sa-card">
        <div className="sa-row">
          <div className="sa-avatar">
            {(p.displayName || p.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div className="sa-label">Profile</div>
            <h2 style={{ marginTop: 2 }}>{p.displayName || "Your display name"}</h2>
            {p.email && (
              <div style={{ fontSize: 14, color: "#6b7280" }}>{p.email}</div>
            )}
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Role: <strong>{p.role || "FAN"}</strong>
            </div>

            <form
              onSubmit={handleSaveName}
              style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              <input
                type="text"
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                placeholder="Update your display name"
                style={{
                  minWidth: 180,
                  maxWidth: 260,
                  flex: "0 0 auto",
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={savingName || !nameEdit.trim()}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: savingName ? "default" : "pointer",
                  opacity: savingName ? 0.7 : 1,
                }}
              >
                {savingName ? "Saving…" : "Save name"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Game stats */}
      <section className="sa-card">
        <div className="sa-label">Progress</div>
        <h2>Game stats</h2>
        <div className="sa-stat-grid">
          <Stat label="Level" value={p.level ?? 1} />
          <Stat label="XP" value={p.xp ?? 0} />
          <Stat label="Coins" value={p.coins ?? 0} />
          <Stat label="Streak" value={p.streakCount ?? 0} suffix=" days" />
        </div>

        {badges.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="sa-label" style={{ marginBottom: 4 }}>
              Badges
            </div>
            {badges.map((b) => (
              <span key={b} className="sa-pill">
                {b}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* My Closet preview */}
      <section className="sa-card">
        <div className="sa-label">Your looks</div>
        <h2>My Closet</h2>
        {closet.length === 0 ? (
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
            You haven’t added any items yet.
            {" "}
            <a href="/fan/closet" className="sa-link">
              Start styling in the Closet →
            </a>
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Showing your latest {closet.length} items. You can manage them on the{" "}
              <a href="/fan/closet" className="sa-link">
                Closet page
              </a>.
            </p>
            <div className="sa-closet-grid">
              {closet.map((item) => (
                <div key={item.id} className="sa-closet-item">
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      marginBottom: 4,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.title || "Untitled look"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {item.mediaKey || "No media key yet"}
                  </div>
                  <div className="sa-chip">
                    {item.status || "DRAFT"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
        {value}
        {suffix ? <span style={{ fontSize: 13, color: "#6b7280" }}> {suffix}</span> : null}
      </div>
    </div>
  );
}
