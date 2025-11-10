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
        console.debug("[sa] config fetch failed", url, e);
      }
      return null;
    }

    const raw =
      (await tryJson("/config.v2.json")) ||
      (await tryJson("/config.json")) ||
      {};

    const cfg = { ...raw };

    // GraphQL endpoint normalization
    cfg.appsyncUrl =
      cfg.appsyncUrl ||
      cfg.aws_appsync_graphqlEndpoint ||
      cfg.graphqlEndpoint ||
      cfg.graphQLEndpoint ||
      cfg.apiUrl ||
      cfg.apiURL ||
      "";

    // ClientId normalization
    cfg.clientId = cfg.clientId || cfg.userPoolWebClientId || "";

    // Build the Hosted UI BASE (full https://{prefix}.auth.{region}.amazoncognito.com)
    const region = (cfg.region || "").trim();
    const fromCognitoDomain =
      (cfg.cognitoDomain || "").trim().replace(/\/+$/, ""); // may already be full https://...amazoncognito.com
    const fromPrefix = (cfg.cognitoDomainPrefix || cfg.hostedUiDomain || cfg.domain || "").trim();

    let hostBase = "";
    if (fromCognitoDomain) {
      hostBase = fromCognitoDomain.startsWith("http")
        ? fromCognitoDomain
        : `https://${fromCognitoDomain}`;
    } else if (fromPrefix && region) {
      hostBase = `https://${fromPrefix}.auth.${region}.amazoncognito.com`;
    }
    cfg._hostBase = hostBase; // used everywhere else

    // Scopes
    cfg._scopes = Array.isArray(cfg.scopes)
      ? cfg.scopes
      : typeof cfg.scope === "string"
      ? cfg.scope.split(/[,\s]+/).filter(Boolean)
      : ["openid", "email"];

    const origin = location.origin;
    // no trailing slash to avoid redirect_mismatch
    cfg.redirectUri = cfg.redirectUri || `${origin}/callback`;
    cfg.logoutUri = cfg.logoutUri || `${origin}/`;

    // Optional uploads API base (APIGW)
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
    } catch (e) {}
    if (tok && expMs && expMs - Date.now() > 60_000) return;

    const cfg = window.__cfg || {};
    if (!cfg._hostBase || !cfg.clientId) throw new Error("Auth misconfigured.");
    const rt = refreshToken();
    if (!rt) throw new Error("Not signed in (no refresh token).");

    const tokenUrl = `${cfg._hostBase}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: String(cfg.clientId),
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
      (window.top || window).location.replace(`/`);
      return true;
    }

    const code = url.searchParams.get("code");
    if (!onCallback || !code) return false;

    const cfg = window.__cfg || {};
    if (!cfg._hostBase || !cfg.clientId) throw new Error("Auth misconfigured.");
    const tokenUrl = `${cfg._hostBase}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: String(cfg.clientId),
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

    // back to app root (or your preferred tab)
    (window.top || window).location.replace(`/`);
    return true;
  }

  // ---------- SA install ----------
  function installSA() {
    if (window.SA && typeof window.SA.gql === "function") return window.SA;

    window.SA = {
      cfg: () => window.__cfg || {},

      isSignedIn: () =>
        !!(sessionStorage.getItem("id_token") || localStorage.getItem("sa_id_token")),

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
        if (!cfg._hostBase || !cfg.clientId) {
          alert("Auth misconfigured.");
          return;
        }
        const scope = (cfg._scopes && cfg._scopes.join(" ")) || "openid email";
        const qp = new URLSearchParams({
          client_id: String(cfg.clientId),
          response_type: "code",
          scope,
          redirect_uri: cfg.redirectUri,
        });
        (window.top || window).location.assign(`${cfg._hostBase}/login?${qp.toString()}`);
      },

      logoutLocal: () => {
        ["id_token", "access_token", "refresh_token"].forEach((k) =>
          sessionStorage.removeItem(k)
        );
        localStorage.removeItem("sa_id_token");
      },

      // ALWAYS clear local tokens first, then bounce to Hosted UI logout if present
      logoutEverywhere: () => {
        const cfg = window.__cfg || {};

        try { window.SA.logoutLocal(); } catch {}

        if (cfg._hostBase && cfg.clientId) {
          const qp = new URLSearchParams({
            client_id: String(cfg.clientId),
            // must be in Cognito “Allowed sign-out URLs”
            logout_uri: cfg.logoutUri || `${location.origin}/`,
          });
          (window.top || window).location.href = `${cfg._hostBase}/logout?${qp.toString()}`;
          return;
        }

        (window.top || window).location.assign(cfg.logoutUri || "/");
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
      key = name; // API can scope to users/<sub>/ if it wants
    } else {
      const text = String(fileOrText ?? "hello from Styling Adventures");
      blob = new Blob([text], { type: "text/plain" });
      key = `dev-tests/${Date.now()}.txt`;
    }

    // 1) ask API for a presigned request
    const presignRes = await fetch(`${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign`, {
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

    if (!presignRes.ok) {
      const t = await presignRes.text().catch(() => "");
      throw new Error(`presign failed (${presignRes.status}) ${t}`);
    }
    const presign = await presignRes.json();

    // 2) Upload using whatever shape we received
    // A) POST with form fields (S3 POST policy)
    if (presign.method === "POST" || presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields || {}).forEach(([k, v]) => form.append(k, v));
      form.append("file", blob);
      const up = await fetch(presign.url, { method: "POST", body: form });
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error(`upload failed (${up.status}) ${t}`);
      }
      return {
        key,
        bucket: presign.bucket,
        url: presign.publicUrl || presign.url,
        publicUrl: presign.publicUrl || null,
      };
    }

    // B) PUT to a presigned URL
    const uploadUrl = presign.url || presign.putUrl; // tolerate both
    if (!uploadUrl) {
      console.error("Unexpected presign payload:", presign);
      throw new Error("presign payload missing url/putUrl");
    }
    const method = presign.method || "PUT";
    const headers =
      presign.headers || { "Content-Type": blob.type || "application/octet-stream" };

    const up = await fetch(uploadUrl, { method, headers, body: blob });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }

    return {
      key,
      bucket: presign.bucket,
      url: presign.publicUrl || presign.getUrl || uploadUrl, // for immediate preview
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

    if (resolveReady) resolveReady(sa);
    window.dispatchEvent(new Event("sa:ready"));

    console.log(
      "[app] ready; role =",
      sa.getRole(),
      "cfg.appsyncUrl =",
      cfg.appsyncUrl || "(missing)"
    );
  });
})();
