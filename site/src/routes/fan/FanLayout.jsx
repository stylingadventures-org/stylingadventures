// site/src/routes/fan/FanLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function FanLayout() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 16px" }}>
      <style>{`
        .fan-tabs {
          display:flex; gap:10px; margin:16px 0 14px;
          overflow:auto; scrollbar-width:none;
        }
        .fan-tabs::-webkit-scrollbar{ display:none; }
        .fan-pill {
          display:inline-flex; align-items:center; justify-content:center;
          height:36px; padding:0 14px; border-radius:999px;
          background:#fff; border:1px solid #e5e7eb; color:#0f172a;
          text-decoration:none; font-weight:600; font-size:14px;
          transition:background .15s, border-color .15s, color .15s;
          white-space:nowrap;
        }
        .fan-pill:hover { background:#fbfbfe; border-color:#dcdfe5; }
        .fan-pill.active { background:#111827; color:#fff; border-color:#111827; }
      `}</style>

      <nav className="fan-tabs" aria-label="Fan section">
        <NavLink end to="/fan" className={({isActive}) => `fan-pill ${isActive ? "active" : ""}`}>
          Fan
        </NavLink>
        <NavLink to="/fan/episodes" className={({isActive}) => `fan-pill ${isActive ? "active" : ""}`}>
          Episodes
        </NavLink>
        <NavLink to="/fan/closet" className={({isActive}) => `fan-pill ${isActive ? "active" : ""}`}>
          Closet
        </NavLink>
        <NavLink to="/fan/community" className={({isActive}) => `fan-pill ${isActive ? "active" : ""}`}>
          Community
        </NavLink>
        <NavLink to="/fan/profile" className={({isActive}) => `fan-pill ${isActive ? "active" : ""}`}>
          Profile
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
