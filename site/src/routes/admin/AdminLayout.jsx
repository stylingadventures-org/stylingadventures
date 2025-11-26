// site/src/routes/admin/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

function useIsAdmin() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        if (window.sa?.ready) await window.sa.ready();
        const groups =
          window.sa?.session?.groups ||
          (window.sa?.session?.idTokenPayload?.["cognito:groups"] ?? []);

        if (!gone) {
          setIsAdmin(Array.isArray(groups) && groups.includes("ADMIN"));
          setReady(true);
        }
      } catch {
        if (!gone) {
          setIsAdmin(false);
          setReady(true);
        }
      }
    })();

    return () => {
      gone = true;
    };
  }, []);

  return { ready, isAdmin };
}

export default function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { ready, isAdmin } = useIsAdmin();

  // Soft-redirect non-admins
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

            {/* Closet library + Bestie sub-page */}
            <NavLink to="/admin/closet-library" className={navClass}>
              <span className="section-nav-pill-icon">📚</span>
              <span>Closet library</span>
            </NavLink>

            {/* Subpage under closet library: Bestie closet */}
            <NavLink
              to="/admin/closet-library/bestie"
              className={navClass}
            >
              <span className="section-nav-pill-icon">🧺</span>
              <span>Bestie closet</span>
            </NavLink>

            <NavLink to="/admin/users" className={navClass}>
              <span className="section-nav-pill-icon">👥</span>
              <span>Users</span>
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


