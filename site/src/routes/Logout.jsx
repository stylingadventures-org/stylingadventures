// site/src/routes/Logout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSA } from "../lib/sa";

function clearLocalTokens() {
  const keys = ["id_token", "access_token", "refresh_token", "sa_id_token"];

  for (const key of keys) {
    try {
      sessionStorage.removeItem(key);
    } catch (err) {
      console.warn("Failed to clear sessionStorage key", key, err);
    }
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn("Failed to clear localStorage key", key, err);
    }
  }
}

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        clearLocalTokens();

        // best effort: tell Cognito / SA to clear cookies / sessions
        try {
          const sa = await getSA();
          await sa?.logoutEverywhere?.();
        } catch (err) {
          console.warn("Logout route: logoutEverywhere failed", err);
        }
      } finally {
        // send them back home in a signed-out state
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div style={{ padding: 32 }}>
      <p>Signing you out…</p>
    </div>
  );
}
