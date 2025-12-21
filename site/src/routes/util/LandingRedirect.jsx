import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { decodeJWT } from "../../lib/jwtDecoder.js";

export default function LandingRedirect() {
  const nav = useNavigate();
  const { idToken } = useAuth();

  useEffect(() => {
    if (!idToken) {
      nav("/", { replace: true });
      return;
    }

    try {
      const decoded = decodeJWT(idToken);
      const groups = decoded["cognito:groups"] || [];
      
      // Route based on groups
      if (groups.includes("BESTIE") || groups.includes("ADMIN")) {
        nav("/bestie", { replace: true });
      } else {
        nav("/fan", { replace: true });
      }
    } catch (err) {
      console.error("[LandingRedirect] Error decoding token:", err);
      nav("/fan", { replace: true });
    }
  }, [idToken, nav]);

  return <div style={{ padding: 24 }}>Loading your dashboard…</div>;
}
