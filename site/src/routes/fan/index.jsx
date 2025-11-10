import React from "react";
import { NavLink, Outlet } from "react-router-dom";

/** Small “pills” for the Fan section */
function Tab({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center justify-center h-8 px-3 rounded-full border ${isActive ? "bg-black text-white border-black" : "bg-white text-black border-[#e5e7eb]"}`
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 32,
        padding: "0 12px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "white",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {children}
    </NavLink>
  );
}

export default function FanLayout() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Tab to="/fan">Fan</Tab>
        <Tab to="/fan/episodes">Episodes</Tab>
        <Tab to="/fan/closet">Closet</Tab>
        <Tab to="/fan/community">Community</Tab>
        <Tab to="/fan/profile">Profile</Tab>
      </div>

      {/* Content */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <Outlet />
      </div>
    </div>
  );
}
