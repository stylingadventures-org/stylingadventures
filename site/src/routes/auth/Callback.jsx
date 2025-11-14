// site/src/routes/auth/Callback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../../lib/sa";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // This does the code → tokens exchange and stores tokens
        await Auth.handleCallbackIfPresent();
      } catch (e) {
        console.error("[Callback] Auth error", e);
      } finally {
        // Send the user into the app once tokens are stored
        navigate("/fan", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <h1>Signing you in…</h1>
      <p>You’ll be redirected in just a moment.</p>
    </div>
  );
}
