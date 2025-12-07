// site/src/routes/creator/Layout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getSA } from "../../lib/sa";

function isCreatorTier(role) {
  return ["CREATOR", "COLLAB", "ADMIN", "PRIME"].includes(role);
}

export default function CreatorLayout() {
  const [role, setRole] = useState("FAN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sa = await getSA();
        const r = sa?.getRole?.() || "FAN";
        if (!alive) return;
        setRole(r);
      } catch (err) {
        console.warn("[CreatorLayout] SA load failed", err);
        if (!alive) return;
        setRole("FAN");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const allowed = isCreatorTier(role);

  if (!loading && !allowed) {
    return (
      <div className="creator-shell">
        <style>{creatorLayoutStyles}</style>
        <div className="creator-guard">
          <h1>Creator studio</h1>
          <p>
            This area is for Styling Adventures creators and collaborators.
            Your current access level is <strong>{role}</strong>.
          </p>
          <p className="creator-guard-sub">
            If you think this is a mistake, reach out to the team or check your
            Bestie / Creator invites.
          </p>
          <a href="/fan" className="creator-btn">
            Back to fan pages
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-shell">
      <style>{creatorLayoutStyles}</style>
      <header className="creator-header">
        <div className="creator-header-main">
          <div className="creator-title-block">
            <div className="creator-badge">Creator studio</div>
            <h1 className="creator-title">Your production workspace</h1>
            <p className="creator-sub">
              Plan stories, organize your filing cabinets, and ship new looks
              and episodes.
            </p>
          </div>
        </div>

        <nav className="creator-nav" aria-label="Creator navigation">
          <NavLink
            to="/creator"
            end
            className={({ isActive }) =>
              "creator-tab" + (isActive ? " creator-tab--active" : "")
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/creator/tools"
            className={({ isActive }) =>
              "creator-tab" + (isActive ? " creator-tab--active" : "")
            }
          >
            AI tools
          </NavLink>
          <NavLink
            to="/creator/library"
            className={({ isActive }) =>
              "creator-tab" + (isActive ? " creator-tab--active" : "")
            }
          >
            Filing cabinets
          </NavLink>
          <NavLink
            to="/creator/stories"
            className={({ isActive }) =>
              "creator-tab" + (isActive ? " creator-tab--active" : "")
            }
          >
            Story planner
          </NavLink>
          <NavLink
            to="/creator/earnings"
            className={({ isActive }) =>
              "creator-tab" + (isActive ? " creator-tab--active" : "")
            }
          >
            Earnings
          </NavLink>
        </nav>
      </header>

      <main className="creator-main">
        <Outlet />
      </main>
    </div>
  );
}

const creatorLayoutStyles = `
.creator-shell {
  max-width:1100px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.creator-header {
  background:#f9fafb;
  border-radius:18px;
  border:1px solid #e5e7eb;
  padding:16px 18px 12px;
  box-shadow:0 14px 32px rgba(15,23,42,0.12);
}

.creator-header-main {
  display:flex;
  justify-content:space-between;
  gap:12px;
}

.creator-title-block {
  display:flex;
  flex-direction:column;
  gap:6px;
}

.creator-badge {
  display:inline-flex;
  align-items:center;
  padding:2px 9px;
  border-radius:999px;
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:0.08em;
  background:#111827;
  color:#e5e7eb;
}

.creator-title {
  margin:0;
  font-size:1.3rem;
  letter-spacing:-0.03em;
  color:#111827;
}
.creator-sub {
  margin:0;
  font-size:0.9rem;
  color:#6b7280;
}

.creator-nav {
  margin-top:10px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  border-top:1px solid #e5e7eb;
  padding-top:8px;
}
.creator-tab {
  border-radius:999px;
  padding:6px 12px;
  font-size:0.86rem;
  border:1px solid transparent;
  background:transparent;
  color:#4b5563;
  cursor:pointer;
  text-decoration:none;
}
.creator-tab--active {
  background:#111827;
  color:#f9fafb;
  border-color:#111827;
}

.creator-main {
  margin-top:6px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

/* guard */
.creator-guard {
  background:#111827;
  color:#e5e7eb;
  border-radius:18px;
  padding:24px 22px;
  box-shadow:0 18px 40px rgba(15,23,42,0.65);
}
.creator-guard h1 {
  margin:0 0 6px;
  font-size:1.4rem;
}
.creator-guard-sub {
  margin:8px 0 14px;
  font-size:0.9rem;
  color:#9ca3af;
}
.creator-btn {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  border-radius:999px;
  padding:8px 16px;
  background:#f9fafb;
  color:#111827;
  font-size:0.88rem;
  text-decoration:none;
}
`;
