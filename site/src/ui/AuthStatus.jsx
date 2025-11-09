import React, { useEffect, useState } from "react";

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
  const id = sessionStorage.getItem("id_token") || localStorage.getItem("sa_id_token") || "";
  const access = sessionStorage.getItem("access_token") || "";
  const refresh = sessionStorage.getItem("refresh_token") || "";
  return { id, access, refresh };
}

export default function AuthStatus() {
  const [ready, setReady] = useState(false);
  const [{ id }, setTok] = useState(getTokens());
  const [role, setRole] = useState("FAN");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // When SA is ready, capture role & email from the token
    const onReady = async () => {
      try {
        const SA = window.SA || (await window.SAReady);
        const t = getTokens();
        setTok(t);
        setRole(SA?.getRole?.() || "FAN");
        const claims = parseJwt(t.id);
        setEmail(claims.email || claims["cognito:username"] || "");
      } catch {}
      setReady(true);
    };

    // Run now if SA already injected; otherwise wait for our custom event
    if (window.SA) onReady();
    else window.addEventListener("sa:ready", onReady, { once: true });

    // Keep status fresh if another tab logs in/out
    const onStorage = (e) => {
      if (["id_token", "sa_id_token", "access_token", "refresh_token"].includes(e.key)) {
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
    background: authed ? "#16a34a" : "#f59e0b",
    boxShadow: authed ? "0 0 0 2px #dcfce7 inset" : "0 0 0 2px #ffedd5 inset",
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

  if (!ready) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f8fafc" }}
          onClick={() => window.SA?.logoutEverywhere?.()}
        >
          Sign out
        </button>
      ) : (
        <button
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #111827",
            background: "#111827",
            color: "#fff",
          }}
          onClick={() => window.SA?.startLogin?.()}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
