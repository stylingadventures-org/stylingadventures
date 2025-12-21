// site/src/routes/collab/Layout.jsx
import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";
import CollabNav from "./CollabNav.jsx";

export default function CollabLayout() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Guard: only COLLAB, ADMIN, PRIME can access
    const allowedRoles = ["COLLAB", "ADMIN", "PRIME"];
    if (!user || !allowedRoles.includes(role)) {
      navigate("/");
    }
  }, [user, role, navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <CollabNav />
      <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
