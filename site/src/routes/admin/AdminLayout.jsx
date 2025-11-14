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

  useEffect(() => {
    if (ready && !isAdmin) {
      // Soft-redirect non-admins away
      nav("/fan", { replace: true });
    }
  }, [ready, isAdmin, nav]);

  if (!ready) {
    return (
      <div className="wrap">
        <div className="sa-card">Checking admin access…</div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1 style={{ marginBottom: 10 }}>Admin</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Tab to="/admin/bestie" label="Bestie" active={loc.pathname.startsWith("/admin/bestie")} />
        <Tab to="/admin/closet" label="Closet" active={loc.pathname.startsWith("/admin/closet")} />
        <Tab to="/admin/users"  label="Users"  active={loc.pathname.startsWith("/admin/users")} />
      </div>

      <Outlet />
    </div>
  );
}

function Tab({ to, label, active }) {
  return (
    <NavLink
      to={to}
      className="pill"
      style={{
        textDecoration: "none",
        background: active ? "var(--pill-bg-strong)" : "var(--pill-bg)",
        color: "var(--pill-fg)",
        padding: "8px 14px",
        borderRadius: 999,
        fontWeight: 600,
      }}
    >
      {label}
    </NavLink>
  );
}

