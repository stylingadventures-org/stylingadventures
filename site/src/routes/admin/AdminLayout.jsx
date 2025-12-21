// site/src/routes/admin/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { decodeJWT } from "../../lib/jwtDecoder.js";

function useIsAdmin() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { idToken } = useAuth();

  useEffect(() => {
    // Try new AuthContext-based auth first
    if (idToken) {
      try {
        const decoded = decodeJWT(idToken);
        const groups = decoded["cognito:groups"] || [];
        setIsAdmin(groups.includes("ADMIN"));
        setReady(true);
        return;
      } catch (e) {
        console.error("[useIsAdmin] Error decoding token:", e);
        setIsAdmin(false);
        setReady(true);
        return;
      }
    }

    // No token, not admin
    setIsAdmin(false);
    setReady(true);
  }, [idToken]);

  return { ready, isAdmin };
}

export default function AdminLayout() {
  const nav = useNavigate();
  const { ready, isAdmin } = useIsAdmin();

  useEffect(() => {
    if (ready && !isAdmin) {
      nav("/fan", { replace: true });
    }
  }, [ready, isAdmin, nav]);

  if (!ready) {
    return (
      <div className="section-page">
        <div className="section-shell">
          <main className="section-main">
            <div className="sa-card">Checking admin access…</div>
          </main>
        </div>
      </div>
    );
  }

  const navClass = ({ isActive }) =>
    "section-nav-pill" + (isActive ? " section-nav-pill--active" : "");

  return (
    <div className="section-page">
      <div className="section-shell">
        {/* Sidebar */}
        <aside className="section-sidebar" aria-label="Admin navigation">
          {/* Logo + label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <img
              src="/lala-logo.png"
              alt="Styling Adventures"
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: "0 8px 20px rgba(15,23,42,0.15)",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 2,
                }}
              >
                Styling Adventures
              </div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#9ca3af",
                }}
              >
                Admin tools
              </div>
            </div>
          </div>

          <div className="section-sidebar-label">Admin pages</div>

          <nav className="section-sidebar-nav">
            <NavLink to="/admin" end className={navClass}>
              <span className="section-nav-pill-icon">📊</span>
              <span>Overview</span>
            </NavLink>

            <NavLink to="/admin/bestie" className={navClass}>
              <span className="section-nav-pill-icon">💜</span>
              <span>Bestie tools</span>
            </NavLink>

            <NavLink to="/admin/closet-upload" className={navClass}>
              <span className="section-nav-pill-icon">📤</span>
              <span>Closet upload</span>
            </NavLink>

            <NavLink to="/admin/closet-library" className={navClass}>
              <span className="section-nav-pill-icon">📚</span>
              <span>Closet library</span>
            </NavLink>

            {/* Creator moderation section */}
            <div className="section-sidebar-label" style={{ marginTop: 16 }}>
              Creator
            </div>

            <NavLink to="/admin/creator-assets" className={navClass}>
              <span className="section-nav-pill-icon">🎨</span>
              <span>Creator uploads</span>
            </NavLink>

            {/* Episodes & game section with Game overview link */}
            <div className="section-sidebar-label" style={{ marginTop: 16 }}>
              Episodes & game
            </div>

            <NavLink to="/admin/game-overview" className={navClass}>
              <span className="section-nav-pill-icon">🏦</span>
              <span>Game overview</span>
            </NavLink>

            <NavLink to="/admin/episodes" className={navClass}>
              <span className="section-nav-pill-icon">🎬</span>
              <span>Episode studio</span>
            </NavLink>

            <NavLink to="/admin/game-rules" className={navClass}>
              <span className="section-nav-pill-icon">📜</span>
              <span>Game rules</span>
            </NavLink>

            <div className="section-sidebar-label" style={{ marginTop: 16 }}>
              Platform Control
            </div>

            <NavLink to="/admin/ai-management" className={navClass}>
              <span className="section-nav-pill-icon">🤖</span>
              <span>AI Management</span>
            </NavLink>

            <NavLink to="/admin/roles-permissions" className={navClass}>
              <span className="section-nav-pill-icon">🔐</span>
              <span>Roles & Perms</span>
            </NavLink>

            <NavLink to="/admin/feature-flags" className={navClass}>
              <span className="section-nav-pill-icon">🚩</span>
              <span>Feature Flags</span>
            </NavLink>

            <NavLink to="/admin/prompt-library" className={navClass}>
              <span className="section-nav-pill-icon">📚</span>
              <span>Prompt Library</span>
            </NavLink>

            <div className="section-sidebar-label" style={{ marginTop: 16 }}>
              Operations
            </div>

            <NavLink to="/admin/users" className={navClass}>
              <span className="section-nav-pill-icon">👥</span>
              <span>Users</span>
            </NavLink>

            <NavLink to="/admin/support" className={navClass}>
              <span className="section-nav-pill-icon">💬</span>
              <span>Support</span>
            </NavLink>

            <NavLink to="/admin/automations" className={navClass}>
              <span className="section-nav-pill-icon">⚙️</span>
              <span>Automations</span>
            </NavLink>

            <NavLink to="/admin/integrations" className={navClass}>
              <span className="section-nav-pill-icon">🔗</span>
              <span>Integrations</span>
            </NavLink>

            <div className="section-sidebar-label" style={{ marginTop: 16 }}>
              Security & Strategy
            </div>

            <NavLink to="/admin/security" className={navClass}>
              <span className="section-nav-pill-icon">🔒</span>
              <span>Security</span>
            </NavLink>

            <NavLink to="/admin/roadmap" className={navClass}>
              <span className="section-nav-pill-icon">🗺️</span>
              <span>Roadmap</span>
            </NavLink>

            <NavLink to="/admin/brand-settings" className={navClass}>
              <span className="section-nav-pill-icon">🎨</span>
              <span>Brand Settings</span>
            </NavLink>

            <NavLink to="/admin/settings" className={navClass}>
              <span className="section-nav-pill-icon">⚙️</span>
              <span>Admin Settings</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main panel */}
        <main className="section-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

