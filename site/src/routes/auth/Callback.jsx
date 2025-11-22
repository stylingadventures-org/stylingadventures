import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../../lib/sa";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // 1️⃣ Exchange the ?code=... for tokens & store them
        await Auth.handleCallbackIfPresent();
      } catch (err) {
        console.error("[Callback] Auth error", err);
      } finally {
        // 2️⃣ Once tokens are set, send user into the app
        navigate("/fan", { replace: true });
      }
    })();
  }, [navigate]);

  return <div>Signing you in…</div>;
}
