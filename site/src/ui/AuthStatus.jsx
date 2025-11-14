// site/src/ui/AuthStatus.jsx
import React, { useEffect, useState } from "react";
import { Auth, getSA } from "../lib/sa";

function parseJwt(t) {
  try {
    const [, payload] = String(t || "").split(".");
    return JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
  } catch {
    return {};
  }
}

export default function AuthStatus() {
  const [state, setState] = useState({
    loading: true,
    email: "",
    role: "FAN",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const SA = await getSA().catch(() => null);

        let email = "";
        let role = "FAN";

        if (SA?.getUser) {
          const u = SA.getUser();
          email = u?.email || "";
          role = u?.role || "FAN";
        } else if (Auth.getIdToken) {
          const idTok = await Auth.getIdToken();
          const payload = parseJwt(idTok);
          email = payload.email || "";
          const groups = Array.isArray(payload["cognito:groups"])
            ? payload["cognito:groups"]
            : [];
          role =
            groups[0] ||
            payload["custom:role"] ||
            payload.role ||
            "FAN";
        }

        if (!cancelled) {
          setState({ loading: false, email, role });
        }
      } catch {
        if (!cancelled) {
          setState({ loading: false, email: "", role: "FAN" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, email, role } = state;
  const isSignedIn = !!email;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {isSignedIn && (
        <>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: "#ecfdf5",
              color: "#166534",
              border: "1px solid #bbf7d0",
              whiteSpace: "nowrap",
            }}
          >
            ● {role}
          </span>
          <span
            style={{
              fontSize: 14,
              color: "#4b5563",
              maxWidth: 220,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
            title={email}
          >
            {email}
          </span>
        </>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => (isSignedIn ? Auth.logout() : Auth.login())}
        style={{
          height: 32,
          padding: "0 14px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: isSignedIn ? "#ffffff" : "#111827",
          color: isSignedIn ? "#111827" : "#ffffff",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {isSignedIn ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
