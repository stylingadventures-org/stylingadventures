import React from "react";
import { getSA, Auth } from "../lib/sa";

/** Tiny helper to decode a JWT */
function parseJwt(t = "") {
  try {
    const base = t.split(".")[1];
    return JSON.parse(atob(base.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (err) {
    console.error("AuthStatus.parseJwt: failed to decode token", err);
    return {};
  }
}

/** Read tokens the same way sa.js stores them */
function getTokens() {
  try {
    const id =
      sessionStorage.getItem("id_token") ||
      localStorage.getItem("sa_id_token") ||
      "";
    const access = sessionStorage.getItem("access_token") || "";
    const refresh = sessionStorage.getItem("refresh_token") || "";
    return { id, access, refresh };
  } catch (err) {
    console.error("AuthStatus.getTokens: storage error", err);
    return { id: "", access: "", refresh: "" };
  }
}

/** Clear all local copies of auth tokens */
function clearLocalTokens() {
  const keys = ["id_token", "access_token", "refresh_token", "sa_id_token"];
  for (const key of keys) {
    try {
      sessionStorage.removeItem(key);
    } catch (err) {
      // Ignore but log once for debugging
      console.warn(
        `AuthStatus.clearLocalTokens: failed session key ${key}`,
        err,
      );
    }
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(
        `AuthStatus.clearLocalTokens: failed local key ${key}`,
        err,
      );
    }
  }
}

export default function AuthStatus() {
  const [ready, setReady] = React.useState(false);
  const [{ id }, setTok] = React.useState(getTokens());
  const [role, setRole] = React.useState("FAN");
  const [email, setEmail] = React.useState("");

  // Initialize from SA when ready
  React.useEffect(() => {
    const onReady = async () => {
      try {
        const SA = await getSA();
        const t = getTokens();
        setTok(t);
        setRole(SA?.getRole?.() || "FAN");

        const claims = parseJwt(t.id);
        setEmail(claims.email || claims["cognito:username"] || "");
      } catch (err) {
        console.error("AuthStatus: error during SA init", err);
      } finally {
        setReady(true);
      }
    };

    if (window.SA) {
      onReady();
    } else {
      window.addEventListener("sa:ready", onReady, { once: true });
    }

    // Keep status fresh if another tab logs in/out
    const onStorage = (e) => {
      if (
        ["id_token", "sa_id_token", "access_token", "refresh_token"].includes(
          e.key,
        )
      ) {
        const t = getTokens();
        setTok(t);
        const claims = parseJwt(t.id);
        setEmail(claims.email || claims["cognito:username"] || "");
        setRole(window.SA?.getRole?.() || "FAN");
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sa:ready", onReady);
    };
  }, []);

  const authed = Boolean(id);

  const dotStyle = {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "999px",
    marginRight: 8,
    background: authed ? "#16a34a" : "#9ca3af",
    boxShadow: authed ? "0 0 0 2px #dcfce7 inset" : "0 0 0 2px #e5e7eb inset",
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  // 🔐 Login via direct Cognito auth (not OAuth Hosted UI)
  const onSignIn = async () => {
    try {
      window.dispatchEvent(new CustomEvent('openLoginModal'));
    } catch (e) {
      console.error("AuthStatus: login failed", e);
    }
  };

  // 📴 Logout via Cognito Hosted UI, using shared Auth helper
  const onSignOut = async () => {
    // Clear local tokens immediately so UI flips to Guest asap
    clearLocalTokens();
    setTok({ id: "", access: "", refresh: "" });
    setRole("FAN");
    setEmail("");

    try {
      await Auth.logout(); // redirects through Cognito logout
    } catch (e) {
      console.error("AuthStatus: logout failed; falling back", e);
      // Fallback: just go home
      window.location.assign("/");
    }
  };

  if (!ready) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
        zIndex: 1,
      }}
    >
      <span style={chipStyle}>
        <span style={dotStyle} />
        {authed ? (
          <>
            <strong>{role}</strong>
            <span>•</span>
            <span style={{ color: "#374151" }}>{email || "Signed in"}</span>
          </>
        ) : (
          <span style={{ color: "#6b7280" }}>Guest</span>
        )}
      </span>

      {authed ? (
        <button
          type="button"
          onClick={onSignOut}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      ) : (
        <button
          type="button"
          onClick={onSignIn}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #111827",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
