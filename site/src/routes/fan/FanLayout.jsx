// site/src/routes/fan/FanLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { hasEarlyContentNow } from "../../lib/episodes";

export default function FanLayout() {
  const showEarlyDot = hasEarlyContentNow();

  return (
    <div className="fan-shell">
      <style>{`
        .fan-shell {
          padding: 0 0 32px;
          overflow-x: hidden;
        }

        /* Big gradient Fan Garden hero – no extra side padding,
           inner content uses the same 20px as Layout's .container */
        .fan-hero {
          position: relative;
          border-radius: 24px;
          margin: 0 0 18px;
          background: linear-gradient(135deg, #fde7f4, #e8f4ff);
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 14px 40px rgba(15,23,42,0.08);
          overflow: hidden;
          box-sizing: border-box;
        }
        .fan-hero::before {
          content: "";
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 0 0, rgba(255,255,255,0.6), transparent 60%),
            radial-gradient(circle at 100% 0, rgba(255,255,255,0.45), transparent 60%);
          opacity: 0.7;
          pointer-events: none;
        }
        .fan-hero-inner {
          position: relative;
          padding: 18px 20px 16px; /* 20px matches Layout's container padding */
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fan-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          background: rgba(255,255,255,0.8);
          color: #6b21a8;
          border: 1px solid rgba(148,163,184,0.4);
        }
        .fan-title {
          margin: 4px 0 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .fan-subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: #4b5563;
        }

        /* Gradient stage – no extra side padding, inner grid uses 20px */
        .fan-main-wrap {
          margin-top: 4px;
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, #fde7f4 0, transparent 55%),
            radial-gradient(circle at bottom right, #e0f2fe 0, transparent 55%);
          box-sizing: border-box;
        }

        .fan-main {
          padding: 14px 20px 24px; /* same 20px horizontal as hero/header */
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 16px;
          align-items: flex-start;
        }

        /* Sidebar */
        .fan-sidebar {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e5e7eb;
          padding: 14px 10px;
          box-shadow: 0 18px 40px rgba(15,23,42,0.05);
          box-sizing: border-box;
        }
        .fan-sidebar-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3af;
          padding: 0 8px 6px;
        }
        .fan-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fan-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 999px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #111827;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          transition:
            background .15s ease,
            border-color .15s ease,
            color .15s ease,
            transform .05s ease;
        }
        .fan-pill:hover {
          background: #fdf2ff;
          border-color: #e5d5ff;
        }
        .fan-pill:active {
          transform: translateY(1px);
        }
        .fan-pill.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        .fan-pill-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .fan-pill-icon {
          font-size: 0.9rem;
        }

        .fan-early-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #f97316;
          box-shadow: 0 0 0 2px #fff;
        }

        /* Content panel */
        .fan-panel {
          background: #ffffff;
          border-radius: 22px;
          border: 1px solid #e5e7eb;
          padding: 18px 16px;
          box-shadow: 0 18px 40px rgba(15,23,42,0.08);
          box-sizing: border-box;
        }

        @media (max-width: 900px) {
          .fan-main {
            padding: 10px 14px 18px;
            grid-template-columns: minmax(0, 1fr);
          }
          .fan-sidebar {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .fan-nav {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .fan-nav::-webkit-scrollbar { display: none; }
          .fan-pill {
            white-space: nowrap;
            min-width: max-content;
          }
        }

        @media (max-width: 640px) {
          .fan-shell {
            padding-bottom: 24px;
          }
          .fan-hero-inner {
            padding: 14px 14px 12px;
          }
          .fan-title {
            font-size: 18px;
          }
          .fan-main {
            padding: 10px 10px 18px;
          }
          .fan-panel {
            padding: 14px 12px;
          }
        }
      `}</style>

      {/* Big “Fan Garden” hero */}
      <section className="fan-hero" aria-label="Fan hub">
        <div className="fan-hero-inner">
          <div className="fan-badge">✨ Fan Garden</div>
          <h1 className="fan-title">Your Styling Adventures hub</h1>
          <p className="fan-subtitle">
            Track XP, catch new episodes early, and play in your closet &amp; community.
          </p>
        </div>
      </section>

      {/* Sidebar + main content inside gradient stage */}
      <div className="fan-main-wrap">
        <div className="fan-main">
          <aside className="fan-sidebar" aria-label="Fan navigation">
            <div className="fan-sidebar-title">Fan Pages</div>
            <nav className="fan-nav">
              <NavLink
                end
                to="/fan"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">🏰</span>
                  <span>Dashboard</span>
                </span>
              </NavLink>

              <NavLink
                to="/fan/episodes"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">🎬</span>
                  <span>Episodes</span>
                  {showEarlyDot && (
                    <span className="fan-early-dot" title="New early drop!" />
                  )}
                </span>
              </NavLink>

              <NavLink
                to="/fan/closet"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">🧪</span>
                  <span>Style Games</span>
                </span>
              </NavLink>

              <NavLink
                to="/fan/closet-feed"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">✨</span>
                  <span>Lala&apos;s Closet</span>
                </span>
              </NavLink>

              <NavLink
                to="/fan/community"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">💬</span>
                  <span>Community</span>
                </span>
              </NavLink>

              <NavLink
                to="/fan/profile"
                className={({ isActive }) =>
                  `fan-pill ${isActive ? "active" : ""}`
                }
              >
                <span className="fan-pill-label">
                  <span className="fan-pill-icon">👤</span>
                  <span>Profile</span>
                </span>
              </NavLink>
            </nav>
          </aside>

          <section className="fan-panel">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
