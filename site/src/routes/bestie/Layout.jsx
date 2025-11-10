import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import TierTabs from "../../components/TierTabs";

export default function BestieLayout() {
  const loc = useLocation();
  const active = (to) => (loc.pathname === to ? "font-weight:600;color:#111827" : "color:#4b5563");

  return (
    <div style={{ maxWidth: 1120, margin: "16px auto", padding: "0 16px", display: "grid", gap: 24, gridTemplateColumns: "260px 1fr" }}>
      {/* Left rail */}
      <aside style={{ alignSelf: "start" }}>
        <nav style={{ display: "grid", gap: 6 }}>
          <NavLink to="/bestie" end style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", ...(loc.pathname === "/bestie" ? { background: "#f3f4f6" } : {}) }}>
            <span style={parseStyle(active("/bestie"))}>Overview</span>
          </NavLink>
          <NavLink to="/bestie/perks" style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", ...(loc.pathname === "/bestie/perks" ? { background: "#f3f4f6" } : {}) }}>
            <span style={parseStyle(active("/bestie/perks"))}>Perks</span>
          </NavLink>
          <NavLink to="/bestie/content" style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", ...(loc.pathname === "/bestie/content" ? { background: "#f3f4f6" } : {}) }}>
            <span style={parseStyle(active("/bestie/content"))}>Exclusive Content</span>
          </NavLink>
          {/* Add Messages / Orders / Settings similarly */}
        </nav>
      </aside>

      {/* Main */}
      <section>
        <TierTabs activeTier="Bestie" />
        <Outlet />
      </section>
    </div>
  );
}

function parseStyle(css) {
  // tiny helper to turn "a:b;c:d" into style object
  return css.split(";").filter(Boolean).reduce((acc, decl) => {
    const [k, v] = decl.split(":");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
}
