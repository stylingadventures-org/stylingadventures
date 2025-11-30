import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../../lib/sa";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      // If we somehow hit /callback without a code or error, just go home.
      if (!code && !error) {
        navigate("/", { replace: true });
        return;
      }

      try {
        // 1️⃣ Exchange the ?code=... for tokens & store them
        await Auth.handleCallbackIfPresent();
      } catch (err) {
        console.error("[Callback] Auth error", err);
      } finally {
        // 2️⃣ Figure out where we meant to go (set in SA.startLogin)
        let dest = "/fan";
        try {
          const stored = sessionStorage.getItem("sa:returnTo");
          if (stored && typeof stored === "string") dest = stored;
          sessionStorage.removeItem("sa:returnTo");
        } catch {
          // ignore, fall back to /fan
        }

        // 3️⃣ Once tokens are set, send user into the app
        navigate(dest, { replace: true });
      }
    })();
  }, [navigate]);

  return <div>Signing you in…</div>;
}
