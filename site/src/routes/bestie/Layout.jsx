// site/src/routes/bestie/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function BestieLayout() {
  const navClass = ({ isActive }) =>
    "section-nav-pill" + (isActive ? " section-nav-pill--active" : "");

  return (
    <div className="section-page">
      <div className="section-shell">
        {/* Sidebar */}
        <aside className="section-sidebar" aria-label="Bestie navigation">
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
                Bestie Club
              </div>
            </div>
          </div>

          <div className="section-sidebar-label">Bestie Pages</div>

          <nav className="section-sidebar-nav">
            <NavLink to="/bestie" end className={navClass}>
              <span className="section-nav-pill-icon">👑</span>
              <span>Overview</span>
            </NavLink>

            <NavLink to="/bestie/closet" className={navClass}>
              <span className="section-nav-pill-icon">🧺</span>
              <span>My Closet</span>
            </NavLink>

            <NavLink to="/bestie/content" className={navClass}>
              <span className="section-nav-pill-icon">🎬</span>
              <span>Content</span>
            </NavLink>

            <NavLink to="/bestie/perks" className={navClass}>
              <span className="section-nav-pill-icon">🎁</span>
              <span>Perks</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main panel */}
        <main className="section-main">
          {/* No extra TierTabs here anymore – just the page content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
