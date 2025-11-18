// site/src/routes/fan/FanLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { hasEarlyContentNow } from "../../lib/episodes";

const navItems = [
  { to: "/fan", label: "Dashboard", icon: "🏰", end: true },
  { to: "/fan/episodes", label: "Episodes", icon: "🎬", key: "episodes" },
  { to: "/fan/closet", label: "Style Games", icon: "🧪" },
  { to: "/fan/closet-feed", label: "Lala's Closet", icon: "✨" },
  { to: "/fan/community", label: "Community", icon: "💬" },
  { to: "/fan/profile", label: "Profile", icon: "👤" },
];

export default function FanLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const showEarlyDot = hasEarlyContentNow();

  const closeNav = () => setNavOpen(false);

  return (
    <div className="fan-layout-page">
      <style>{`
        .fan-layout-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: 16px 16px 32px;
          box-sizing: border-box;
        }

        /* Top row – only visible on mobile to open drawer */
        .fan-header-row {
          display: flex;
          justify-content: flex-start;
          margin: 0 auto 12px;
          max-width: 1100px;
        }

        .fan-pages-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(209,213,219,1);
          background: rgba(255,255,255,0.96);
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #4b5563;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(15,23,42,0.12);
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.04s ease;
        }
        .fan-pages-chip:hover {
          background: #fdf2ff;
          border-color: #e5d5ff;
          box-shadow: 0 14px 40px rgba(79,70,229,0.24);
          transform: translateY(-1px);
        }
        .fan-pages-chip:active {
          transform: translateY(0);
          box-shadow: 0 8px 22px rgba(148,163,184,0.4);
        }

        .fan-pages-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .fan-pages-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 0 2px #ffffff;
        }

        /* DESKTOP SHELL – always-on sidebar + main */
        .fan-layout-shell {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 20px;
          align-items: flex-start;
        }

        /* Sidebar panel (desktop) */
        .fan-sidebar {
          background: rgba(255,255,255,0.97);
          border-radius: 26px;
          padding: 16px 14px 18px;
          box-shadow: 0 20px 50px rgba(15,23,42,0.18);
          border: 1px solid rgba(226,232,240,0.95);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .fan-sidebar-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fan-sidebar-logo {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          object-fit: cover;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.95),
                      0 12px 30px rgba(79,70,229,0.35);
        }

        .fan-sidebar-brand-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .fan-sidebar-brand-sub {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af;
        }

        .fan-sidebar-nav {
          margin-top: 4px;
          display: grid;
          gap: 6px;
        }

        .fan-sidebar-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 11px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.04s ease;
        }
        .fan-sidebar-link-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .fan-sidebar-icon {
          font-size: 16px;
        }

        .fan-sidebar-link:hover {
          background: #ffffff;
          border-color: #d1d5db;
          box-shadow: 0 10px 28px rgba(148,163,184,0.3);
        }
        .fan-sidebar-link:active {
          transform: translateY(1px);
        }

        .fan-sidebar-link--active {
          background: #020617;
          color: #f9fafb;
          border-color: #020617;
          box-shadow: 0 18px 40px rgba(15,23,42,0.65);
        }

        .fan-sidebar-early-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f97316;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.95);
        }

        /* Main panel where Outlet renders */
        .fan-main-panel {
          background: rgba(255,255,255,0.98);
          border-radius: 28px;
          padding: 18px 18px 24px;
          box-shadow: 0 22px 55px rgba(15,23,42,0.11);
          box-sizing: border-box;
        }

        /* ===== Drawer (mobile) ===== */

        .fan-drawer-backdrop {
          position: fixed;
          inset: 72px 0 0 0;
          background: rgba(15,23,42,0.4);
          backdrop-filter: blur(3px);
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          z-index: 39;
        }

        .fan-drawer {
          position: fixed;
          top: 72px;
          bottom: 0;
          left: 0;
          width: 320px;
          max-width: calc(100% - 40px);
          background:
            radial-gradient(circle at top left, #fdf2ff, #eef2ff 55%),
            radial-gradient(circle at bottom right, #e0f2fe, #ffffff 60%);
          border-radius: 0 24px 24px 0;
          box-shadow: 0 24px 70px rgba(15,23,42,0.55);
          border: 1px solid rgba(255,255,255,0.9);
          padding: 16px 16px 20px;
          box-sizing: border-box;
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fan-drawer__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .fan-drawer__brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fan-drawer-logo {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          object-fit: cover;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.95),
                      0 10px 26px rgba(79,70,229,0.35);
        }

        .fan-drawer__title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }
        .fan-drawer__subtitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #9ca3af;
        }

        .fan-drawer__close {
          border: none;
          background: rgba(255,255,255,0.9);
          border-radius: 999px;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(15,23,42,0.25);
          transition: background 0.12s ease, transform 0.04s ease;
        }
        .fan-drawer__close:hover {
          background: #e5e7eb;
        }
        .fan-drawer__close:active {
          transform: translateY(1px);
        }

        .fan-drawer__nav {
          margin-top: 4px;
          display: grid;
          gap: 6px;
        }

        .fan-drawer-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 11px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: rgba(248,250,252,0.95);
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.04s ease;
        }
        .fan-drawer-link-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .fan-drawer-icon {
          font-size: 16px;
        }
        .fan-drawer-link:hover {
          background: #ffffff;
          border-color: #d1d5db;
          box-shadow: 0 10px 28px rgba(148,163,184,0.4);
        }
        .fan-drawer-link:active {
          transform: translateY(1px);
        }
        .fan-drawer-link--active {
          background: #020617;
          color: #f9fafb;
          border-color: #020617;
          box-shadow: 0 18px 40px rgba(15,23,42,0.65);
        }

        .fan-drawer-early-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f97316;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.95);
        }

        /* ====== Responsive tweaks ====== */

        @media (min-width: 900px) {
          /* desktop: no drawer trigger, no drawer */
          .fan-header-row {
            display: none;
          }
        }

        @media (max-width: 899px) {
          /* mobile/tablet: no persistent sidebar, just main + drawer */
          .fan-layout-shell {
            display: block;
          }
          .fan-sidebar {
            display: none;
          }
          .fan-main-panel {
            border-radius: 24px;
            padding: 16px 14px 22px;
          }
        }

        @media (max-width: 720px) {
          .fan-layout-page {
            padding-inline: 12px;
          }
          .fan-drawer {
            width: 100%;
            max-width: 100%;
            border-radius: 0 0 24px 24px;
          }
          .fan-drawer-backdrop {
            inset: 56px 0 0 0;
          }
        }
      `}</style>

      {/* Mobile-only “Fan Pages” chip to open the drawer */}
      <div className="fan-header-row">
        <button
          type="button"
          className="fan-pages-chip"
          onClick={() => setNavOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={navOpen ? "true" : "false"}
        >
          <span className="fan-pages-label">
            FAN PAGES
            {showEarlyDot && <span className="fan-pages-dot" />}
          </span>
        </button>
      </div>

      {/* Desktop shell: sidebar + main */}
      <div className="fan-layout-shell">
        <aside className="fan-sidebar" aria-label="Fan navigation">
          <div className="fan-sidebar-head">
            {/* Your real logo from /public */}
            <img
              src="/lala-logo.png"
              alt="Lala logo"
              className="fan-sidebar-logo"
            />
            <div>
              <div className="fan-sidebar-brand-title">Styling Adventures</div>
              <div className="fan-sidebar-brand-sub">Fan Pages</div>
            </div>
          </div>

          <nav className="fan-sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  "fan-sidebar-link" +
                  (isActive ? " fan-sidebar-link--active" : "")
                }
              >
                <span className="fan-sidebar-link-main">
                  <span className="fan-sidebar-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </span>

                {item.to === "/fan/episodes" && showEarlyDot && (
                  <span
                    className="fan-sidebar-early-dot"
                    title="New early drop"
                  />
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="fan-main-panel">
          <Outlet />
        </section>
      </div>

      {/* Mobile drawer overlay */}
      {navOpen && (
        <>
          <button
            type="button"
            className="fan-drawer-backdrop"
            onClick={closeNav}
            aria-label="Close fan navigation backdrop"
          />
          <aside
            className="fan-drawer"
            aria-label="Fan navigation"
            role="dialog"
          >
            <div className="fan-drawer__header">
              <div className="fan-drawer__brand">
                <img
                  src="/lala-logo.png"
                  alt="Lala logo"
                  className="fan-drawer-logo"
                />
                <div>
                  <div className="fan-drawer__title">Styling Adventures</div>
                  <div className="fan-drawer__subtitle">Fan Pages</div>
                </div>
              </div>
              <button
                type="button"
                className="fan-drawer__close"
                onClick={closeNav}
                aria-label="Close fan navigation"
              >
                ✕
              </button>
            </div>

            <nav className="fan-drawer__nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    "fan-drawer-link" +
                    (isActive ? " fan-drawer-link--active" : "")
                  }
                  onClick={closeNav}
                >
                  <span className="fan-drawer-link-main">
                    <span className="fan-drawer-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </span>

                  {item.to === "/fan/episodes" && showEarlyDot && (
                    <span
                      className="fan-drawer-early-dot"
                      title="New early drop"
                    />
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
