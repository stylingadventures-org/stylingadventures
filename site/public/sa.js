/* Styling Adventures — sa.js
   Global auth + GraphQL + uploads helper (no external deps) */

(function () {
  "use strict";

  // ---------- configuration ----------
  async function loadCfg() {
    async function tryJson(url) {
      try {
        const r = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" });
        if (r.ok) return r.json();
      } catch (e) {
        // network error is fine — we fallback
        console.debug("[sa] config fetch failed", url, e);
      }
      return null;
    }

    const raw =
      (await tryJson("/config.v2.json")) ||
      (await tryJson("/config.json")) ||
      {};

    // Normalize common keys from various generations
    const cfg = { ...raw };

    cfg.appsyncUrl =
      cfg.appsyncUrl ||
      cfg.aws_appsync_graphqlEndpoint ||
      cfg.graphqlEndpoint ||
      cfg.graphQLEndpoint ||
      cfg.apiUrl ||
      cfg.apiURL ||
      "";

    if (!cfg.hostedUiDomain && cfg.domain) cfg.hostedUiDomain = cfg.domain;

    const scopes = Array.isArray(cfg.scopes)
      ? cfg.scopes
      : typeof cfg.scope === "string"
      ? cfg.scope.split(/[,\s]+/).filter(Boolean)
      : ["openid", "email"];
    cfg._scopes = scopes;

    const origin = location.origin;
    cfg.redirectUri = cfg.redirectUri || `${origin}/callback/`;
    cfg.logoutUri = cfg.logoutUri || `${origin}/`;

    // Optional: uploads API Gateway base url
    // e.g. "https://xxxxx.execute-api.us-east-1.amazonaws.com/prod"
    cfg.uploadsApiUrl = cfg.uploadsApiUrl || raw.uploadsApiUrl || "";

    window.__cfg = cfg;
    return cfg;
  }

  // ---------- token helpers ----------
  function parseJwt(t) {
    try {
      return JSON.parse(
        atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
    } catch (e) {
      return {};
    }
  }

  function idToken() {
    return (
      sessionStorage.getItem("id_token") ||
      localStorage.getItem("sa_id_token") ||
      ""
    );
  }

  function refreshToken() {
    return sessionStorage.getItem("refresh_token") || "";
  }

  async function ensureFreshToken() {
    const tok = idToken();
    let expMs = 0;
    try {
      expMs = (parseJwt(tok).exp | 0) * 1000;
    } catch (e) {
      // ignore
    }
    if (tok && expMs && expMs - Date.now() > 60_000) return;

    const cfg = window.__cfg || {};
    const rt = refreshToken();
    if (!rt) throw new Error("Not signed in (no refresh token).");

    const tokenUrl = `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: String(cfg.clientId || ""),
      refresh_token: rt,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
    const j = await res.json();
    if (j.id_token) {
      sessionStorage.setItem("id_token", j.id_token);
      localStorage.setItem("sa_id_token", j.id_token);
    }
    if (j.access_token) sessionStorage.setItem("access_token", j.access_token);
    if (j.refresh_token) sessionStorage.setItem("refresh_token", j.refresh_token);
  }

  // ---------- code-exchange helper ----------
  async function exchangeAuthCodeIfNeeded() {
    const onCallback = location.pathname.replace(/\/+$/, "") === "/callback";
    const url = new URL(location.href);
    const err = url.searchParams.get("error");
    const errd = url.searchParams.get("error_description");

    if (onCallback && err) {
      console.error("Cognito error:", err, errd || "");
      alert(`Sign-in failed: ${errd || err}`);
      (window.top || window).location.replace(`/?tab=fan`);
      return true;
    }

    const code = url.searchParams.get("code");
    if (!onCallback || !code) return false;

    const cfg = window.__cfg || {};
    const tokenUrl = `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: String(cfg.clientId || ""),
      code,
      redirect_uri: cfg.redirectUri,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) throw new Error(`Code exchange failed (${res.status})`);
    const j = await res.json();

    if (j.id_token) {
      sessionStorage.setItem("id_token", j.id_token);
      localStorage.setItem("sa_id_token", j.id_token);
    }
    if (j.access_token) sessionStorage.setItem("access_token", j.access_token);
    if (j.refresh_token) sessionStorage.setItem("refresh_token", j.refresh_token);

    const next = new URL(
      window.__cfg?.postLoginRedirect || "/?tab=fan",
      location.origin
    );
    (window.top || window).location.replace(next.toString());
    return true;
  }

  // ---------- SA install ----------
  function installSA() {
    if (window.SA && typeof window.SA.gql === "function") return window.SA;

    window.SA = {
      cfg: () => window.__cfg || {},

      // True if we currently have an id_token
      isSignedIn: () =>
        !!(sessionStorage.getItem("id_token") || localStorage.getItem("sa_id_token")),

      // Basic user info from the ID token (if present)
      getUser: () => {
        const c = parseJwt(idToken());
        return {
          email: c.email || "",
          name: c.name || c["cognito:username"] || "",
          role:
            (Array.isArray(c["cognito:groups"]) && c["cognito:groups"][0]) ||
            c["custom:role"] ||
            c.role ||
            "FAN",
        };
      },

      getRole: () => {
        const c = parseJwt(idToken());
        return (
          (Array.isArray(c["cognito:groups"]) && c["cognito:groups"][0]) ||
          c["custom:role"] ||
          c.role ||
          "FAN"
        );
      },

      startLogin: () => {
        const cfg = window.__cfg || {};
        const base = `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com/login`;
        const scope = (cfg._scopes && cfg._scopes.join(" ")) || "openid email";
        const qp = new URLSearchParams({
          client_id: String(cfg.clientId || ""),
          response_type: "code",
          scope,
          redirect_uri: cfg.redirectUri,
        });
        (window.top || window).location.assign(`${base}?${qp.toString()}`);
      },

      logoutLocal: () => {
        ["id_token", "access_token", "refresh_token"].forEach((k) =>
          sessionStorage.removeItem(k)
        );
        localStorage.removeItem("sa_id_token");
      },

      logoutEverywhere: () => {
        const cfg = window.__cfg || {};
        const base = `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com/logout`;
        const qp = new URLSearchParams({
          client_id: String(cfg.clientId || ""),
          logout_uri:
            cfg.logoutUri || cfg.redirectUri || `${location.origin}/?tab=fan`,
        });
        (window.top || window).location.assign(`${base}?${qp.toString()}`);
      },

      gql: async (query, variables) => {
        const cfg = window.__cfg || {};
        if (!cfg.appsyncUrl) throw new Error("Missing appsyncUrl in config.");
        await ensureFreshToken();
        const r = await fetch(cfg.appsyncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken(),
          },
          body: JSON.stringify({ query, variables }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(`GraphQL ${r.status}`);
        if (j.errors) throw new Error(j.errors.map((e) => e.message).join("; "));
        return j.data;
      },
    };

    console.log("[SA] global helpers ready, role =", window.SA.getRole());
    return window.SA;
  }

  // ---------- uploads (signed S3 via API Gateway) ----------
  async function signedUpload(fileOrText) {
    const SA = window.SA || {};
    const cfg = SA.cfg ? SA.cfg() : window.__cfg || {};
    if (!cfg.uploadsApiUrl) {
      throw new Error("Missing uploadsApiUrl in config.v2.json");
    }

    // Accept File/Blob or a string payload
    let blob;
    let key;
    if (fileOrText instanceof Blob) {
      blob = fileOrText;
      const name = fileOrText.name || `upload-${Date.now()}.bin`;
      key = `users/${name}`;
    } else {
      const text = String(fileOrText ?? "hello from Styling Adventures");
      blob = new Blob([text], { type: "text/plain" });
      key = `dev-tests/${Date.now()}.txt`;
    }

    // 1) ask API for a presigned request
    const presignRes = await fetch(`${cfg.uploadsApiUrl}/presign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          sessionStorage.getItem("id_token") ||
          localStorage.getItem("sa_id_token") ||
          "",
      },
      body: JSON.stringify({
        key,
        contentType: blob.type || "application/octet-stream",
      }),
    });

    if (!presignRes.ok)
      throw new Error(`presign failed (${presignRes.status})`);
    const presign = await presignRes.json();

    // 2) PUT or POST upload to S3
    if (presign.method === "POST" || presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields || {}).forEach(([k, v]) =>
        form.append(k, v)
      );
      form.append("file", blob);
      const up = await fetch(presign.url, { method: "POST", body: form });
      if (!up.ok) throw new Error(`upload failed (${up.status})`);
    } else {
      const up = await fetch(presign.url, {
        method: presign.method || "PUT",
        headers:
          presign.headers || {
            "Content-Type": blob.type || "application/octet-stream",
          },
        body: blob,
      });
      if (!up.ok) throw new Error(`upload failed (${up.status})`);
    }

    return {
      key,
      bucket: presign.bucket,
      url: presign.publicUrl || presign.url, // may be signed/expiring
      publicUrl: presign.publicUrl || null,
    };
  }

  // expose upload to React
  window.signedUpload = signedUpload;

  // convenient getter for React code (optional)
  window.getSA = async function getSA() {
    if (window.SA) return window.SA;
    if (window.SAReady) return window.SAReady;
    await new Promise((r) => setTimeout(r, 0));
    return window.SA;
  };

  // ---------- boot ----------
  let resolveReady;
  window.SAReady = new Promise((r) => (resolveReady = r));

  document.addEventListener("DOMContentLoaded", async () => {
    const cfg = await loadCfg();
    try {
      const handled = await exchangeAuthCodeIfNeeded();
      if (handled) return;
    } catch (e) {
      console.error("[SA] exchange error", e);
      alert(e.message || String(e));
    }

    const sa = installSA();

    // Wire header buttons if present (by label)
    const buttons = Array.from(document.querySelectorAll("button"));
    buttons.forEach((b) => {
      const txt = (b.textContent || "").trim().toLowerCase();
      if (txt === "sign in") b.addEventListener("click", sa.startLogin);
      if (txt === "sign out") b.addEventListener("click", sa.logoutEverywhere);
    });

    resolveReady && resolveReady(sa);
    window.dispatchEvent(new Event("sa:ready"));

    console.log(
      "[app] ready; role =",
      sa.getRole(),
      "cfg.appsyncUrl =",
      cfg.appsyncUrl || "(missing)"
    );
  });
})();



