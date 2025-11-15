// site/src/ui/AuthStatus.jsx
import React from "react";
import { getSA } from "../lib/sa";

/** Tiny helper to decode a JWT */
function parseJwt(t = "") {
  try {
    const base = t.split(".")[1];
    return JSON.parse(atob(base.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

/** Read tokens the same way sa.js stores them */
function getTokens() {
  const id =
    sessionStorage.getItem("id_token") ||
    localStorage.getItem("sa_id_token") ||
    "";
  const access = sessionStorage.getItem("access_token") || "";
  const refresh = sessionStorage.getItem("refresh_token") || "";
  return { id, access, refresh };
}

/** Clear all local copies of auth tokens */
function clearLocalTokens() {
  const keys = ["id_token", "access_token", "refresh_token", "sa_id_token"];
  for (const key of keys) {
    try {
      sessionStorage.removeItem(key);
    } catch {}
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

// cache config so we only fetch once
let cachedCfg = null;
async function loadCfg() {
  if (cachedCfg) return cachedCfg;
  try {
    const res = await fetch("/config.v2.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`config.v2.json ${res.status}`);
    cachedCfg = await res.json();
    return cachedCfg;
  } catch (e) {
    console.error("AuthStatus: failed to load config.v2.json", e);
    return null;
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
      } finally {
        setReady(true);
      }
    };

    if (window.SA) onReady();
    else window.addEventListener("sa:ready", onReady, { once: true });

    // Keep status fresh if another tab logs in/out
    const onStorage = (e) => {
      if (
        ["id_token", "sa_id_token", "access_token", "refresh_token"].includes(
          e.key
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

    return () => window.removeEventListener("storage", onStorage);
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

  // 🔐 NEW: build the same Hosted UI URL the landing button uses
  const onSignIn = async () => {
    const cfg = await loadCfg();
    if (cfg) {
      const domain =
        (cfg.cognitoDomain && cfg.cognitoDomain.replace(/\/+$/, "")) ||
        `https://${cfg.cognitoDomainPrefix}.auth.${cfg.region}.amazoncognito.com`;

      const clientId = cfg.clientId || cfg.userPoolWebClientId;
      const redirect =
        cfg.redirectUri || `${window.location.origin}/callback`;
      const scopes = Array.isArray(cfg.scopes) && cfg.scopes.length
        ? cfg.scopes.join(" ")
        : "openid email";

      const url =
        `${domain}/login?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&redirect_uri=${encodeURIComponent(redirect)}`;

      window.location.assign(url);
      return;
    }

    // Fallback: use SA helper if config failed for some reason
    try {
      const SA = await getSA();
      SA?.startLogin?.();
    } catch (e) {
      console.error("AuthStatus: fallback startLogin failed", e);
    }
  };

  const onSignOut = async () => {
    // 1) Clear local tokens immediately so UI flips to Guest
    clearLocalTokens();
    setTok({ id: "", access: "", refresh: "" });
    setRole("FAN");
    setEmail("");

    // 2) Best-effort hosted UI logout (to clear Cognito cookies)
    try {
      const sa = await getSA();
      await sa?.logoutEverywhere?.();
    } catch {
      // ignore; local sign-out already done
    } finally {
      // 3) Hard reload so Layout, routes, etc. re-mount in a signed-out state
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
