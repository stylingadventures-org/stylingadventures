import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSA } from "../../lib/sa";

export default function LandingRedirect() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const sa = await getSA();
        const role = sa?.getRole?.() || "FAN";
        if (role === "BESTIE" || role === "ADMIN") {
          nav("/bestie", { replace: true });
        } else {
          nav("/fan", { replace: true });
        }
      } catch {
        nav("/fan", { replace: true });
      }
    })();
  }, [nav]);

  return <div style={{ padding: 24 }}>Loading your dashboard…</div>;
}
