// site/src/routes/prime/Layout.jsx
import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom";
import PrimeNav from "./PrimeNav.jsx";

export default function PrimeLayout() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Guard: ADMIN-ONLY (secret company feature)
    const allowedRoles = ["ADMIN"];
    if (!user || !allowedRoles.includes(role)) {
      navigate("/");
    }
  }, [user, role, navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <PrimeNav />
      <main style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
