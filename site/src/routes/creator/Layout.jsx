// site/src/routes/creator/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/creator", label: "Overview", end: true },
  { to: "/creator/tools", label: "AI tools" },
  { to: "/creator/library", label: "Filing cabinets" },
  { to: "/creator/stories", label: "Story planner" },
  { to: "/creator/earnings", label: "Earnings" },
];

export default function CreatorLayout() {
  return (
    <div className="creator-shell">
      <header className="creator-header">
        <div className="creator-header-main">
          <div className="creator-title-block">
            <span className="creator-badge">Creator studio</span>
            <h1 className="creator-title">Your production workspace</h1>
            <p className="creator-sub">
              Plan stories, organize your filing cabinets, and ship new looks
              and episodes.
            </p>
          </div>

          <div className="creator-header-meta">
            <span className="creator-pill">Beta tools</span>
          </div>
        </div>

        <nav className="creator-nav">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                "creator-tab" + (isActive ? " creator-tab--active" : "")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="creator-main">
        <Outlet />
      </main>
    </div>
  );
}
