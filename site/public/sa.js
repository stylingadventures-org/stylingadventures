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
      (cfg.cognitoDomain || "").trim().replace(/\/+$/, "");
    const fromPrefix = (
      cfg.cognitoDomainPrefix ||
      cfg.hostedUiDomain ||
      cfg.domain ||
      ""
    ).trim();

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
    // Implicit flow callback (handled by /callback/index.html)
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

  // Single source of truth setters that persist + reflect in window.sa
  function syncSaSession(patch) {
    if (!window.sa) {
      window.sa = {
        cfg: {},
        session: { idToken: "", accessToken: "", email: "" },
        graphql: undefined,
      };
    }
    const s =
      window.sa.session ||
      (window.sa.session = { idToken: "", accessToken: "", email: "" });
    Object.assign(s, patch || {});
  }

  function setIdToken(tok) {
    if (!tok) return;
    // Store in both legacy + new keys so older code still works
    sessionStorage.setItem("id_token", tok);
    localStorage.setItem("sa_id_token", tok);
    localStorage.setItem("sa:idToken", tok);
    const email = parseJwt(tok).email || "";
    syncSaSession({ idToken: tok, email });
  }

  function setAccessToken(tok) {
    if (!tok) return;
    sessionStorage.setItem("access_token", tok);
    localStorage.setItem("sa:accessToken", tok);
    syncSaSession({ accessToken: tok });
  }

  function getStoredIdToken() {
    return (
      sessionStorage.getItem("id_token") ||
      localStorage.getItem("sa_id_token") ||
      localStorage.getItem("sa:idToken") ||
      ""
    );
  }

  function getStoredAccessToken() {
    return (
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("sa:accessToken") ||
      ""
    );
  }

  // Implicit flow: no refresh token. Just ensure token is not obviously expired.
  async function ensureFreshToken() {
    const tok = getStoredIdToken();
    if (!tok) {
      throw new Error("Not signed in.");
    }

    let expMs = 0;
    try {
      expMs = (parseJwt(tok).exp | 0) * 1000;
    } catch {}

    // If we don't have exp or it's still > 60s in the future, just use it.
    if (!expMs || expMs - Date.now() > 60_000) {
      syncSaSession({ idToken: tok, email: parseJwt(tok).email || "" });
      return;
    }

    // Token expired -> clear local state and force re-login
    try {
      window.SA && window.SA.logoutLocal();
    } catch {}
    throw new Error("Session expired. Please sign in again.");
  }

  // ---------- SA install (existing API) ----------
  function installSA() {
    if (window.SA && typeof window.SA.gql === "function") return window.SA;

    window.SA = {
      cfg: () => window.__cfg || {},

      isSignedIn: () => !!getStoredIdToken(),

      getUser: () => {
        const c = parseJwt(getStoredIdToken());
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
        const c = parseJwt(getStoredIdToken());
        return (
          (Array.isArray(c["cognito:groups"]) && c["cognito:groups"][0]) ||
          c["custom:role"] ||
          c.role ||
          "FAN"
        );
      },

      // Start Hosted UI login using IMPLICIT (token) flow.
      startLogin: (returnTo) => {
        const cfg = window.__cfg || {};
        if (!cfg._hostBase || !cfg.clientId) {
          alert("Auth misconfigured.");
          return;
        }

        // Remember where we wanted to go (callback page will use this).
        const dest =
          typeof returnTo === "string"
            ? returnTo
            : window.location.pathname + window.location.search;
        try {
          sessionStorage.setItem("sa:returnTo", dest);
        } catch {}

        const scope = (cfg._scopes && cfg._scopes.join(" ")) || "openid email";

        const qp = new URLSearchParams({
          client_id: String(cfg.clientId),
          response_type: "token", // <<< implicit flow
          scope,
          redirect_uri: cfg.redirectUri,
        });

        (window.top || window).location.assign(
          `${cfg._hostBase}/login?${qp.toString()}`
        );
      },

      logoutLocal: () => {
        ["id_token", "access_token", "refresh_token"].forEach((k) =>
          sessionStorage.removeItem(k)
        );
        localStorage.removeItem("sa_id_token");
        localStorage.removeItem("sa:idToken");
        localStorage.removeItem("sa:accessToken");
        localStorage.removeItem("sa:expiresAt");
        syncSaSession({ idToken: "", accessToken: "", email: "" });
      },

      // ALWAYS clear local tokens first, then bounce to Hosted UI logout so you can choose a different user next time.
      logoutEverywhere: () => {
        const cfg = window.__cfg || {};

        try {
          window.SA.logoutLocal();
        } catch {}

        if (cfg._hostBase && cfg.clientId) {
          const qp = new URLSearchParams({
            client_id: String(cfg.clientId),
            logout_uri: cfg.logoutUri || `${location.origin}/`,
          });
          (window.top || window).location.href = `${cfg._hostBase}/logout?${qp.toString()}`;
          return;
        }

        (window.top || window).location.assign(cfg.logoutUri || "/");
      },

      gql: async (query, variables) => {
        const cfg = window.__cfg || {};
        if (!cfg.appsyncUrl)
          throw new Error("Missing appsyncUrl in config.");
        await ensureFreshToken();
        const tok = getStoredIdToken();
        syncSaSession({ idToken: tok, email: parseJwt(tok).email || "" });

        const r = await fetch(cfg.appsyncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: tok,
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
  /**
   * Global upload helper.
   *
   * NEW: accepts optional options:
   *   signedUpload(file, { key: "uuid.jpg", kind: "closet" })
   */
  async function signedUpload(fileOrText, opts = {}) {
    const SA = window.SA || {};
    const cfg = (SA.cfg && SA.cfg()) || window.__cfg || {};
    if (!cfg.uploadsApiUrl) {
      throw new Error("Missing uploadsApiUrl in config.v2.json");
    }

    let blob;
    let key;

    // Support File/Blob or string
    if (fileOrText instanceof Blob) {
      blob = fileOrText;
      const name = fileOrText.name || `upload-${Date.now()}.bin`;
      key = opts.key || name;
    } else {
      const text = String(fileOrText ?? "hello from Styling Adventures");
      blob = new Blob([text], { type: "text/plain" });
      key = opts.key || `dev-tests/${Date.now()}.txt`;
    }

    // Try to get an id token, but don't *require* it.
    const maybeIdToken = getStoredIdToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (maybeIdToken) {
      headers.Authorization = maybeIdToken;
    }

    const body = {
      key,
      contentType: blob.type || "application/octet-stream",
    };
    if (opts.kind) {
      body.kind = opts.kind;
    }

    const presignRes = await fetch(
      `${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!presignRes.ok) {
      const t = await presignRes.text().catch(() => "");
      throw new Error(`presign failed (${presignRes.status}) ${t}`);
    }

    const presign = await presignRes.json();

    // POST-style presign (form fields)
    if (presign.method === "POST" || presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields || {}).forEach(([k, v]) =>
        form.append(k, v)
      );
      form.append("file", blob);

      const up = await fetch(presign.url, { method: "POST", body: form });
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error(`upload failed (${up.status}) ${t}`);
      }

      return {
        key: presign.key || key,
        bucket: presign.bucket,
        url: presign.publicUrl || presign.url,
        publicUrl: presign.publicUrl || null,
      };
    }

    // PUT-style presign
    const uploadUrl = presign.url || presign.putUrl;
    if (!uploadUrl) {
      console.error("Unexpected presign payload:", presign);
      throw new Error("presign payload missing url/putUrl");
    }

    const method = presign.method || "PUT";
    const uploadHeaders =
      presign.headers || {
        "Content-Type": blob.type || "application/octet-stream",
      };

    const up = await fetch(uploadUrl, {
      method,
      headers: uploadHeaders,
      body: blob,
    });

    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }

    return {
      key: presign.key || key,
      bucket: presign.bucket,
      url: presign.publicUrl || presign.getUrl || uploadUrl,
      publicUrl: presign.publicUrl || null,
    };
  }

  // expose upload to React
  window.signedUpload = signedUpload;

  // ---------- minimal window.sa API (always exposes idToken) ----------
  function installWindowSaAlias(cfg) {
    const currentId = getStoredIdToken();
    const email = parseJwt(currentId).email || "";
    if (!window.sa) window.sa = {};
    window.sa.cfg = cfg || window.__cfg || {};
    window.sa.session = {
      idToken: currentId || "",
      accessToken: getStoredAccessToken() || "",
      email,
    };
    window.sa.graphql = async (query, variables) => {
      const SA = window.SA || installSA();
      return SA.gql(query, variables);
    };
  }

  // convenient getter for React code (returns window.sa)
  window.getSA = async function getSA() {
    if (!window.sa) installWindowSaAlias(window.__cfg || {});
    await new Promise((r) => setTimeout(r, 0));
    return window.sa;
  };

  // ---------- boot ----------
  let resolveReady;
  window.SAReady = new Promise((r) => (resolveReady = r));

  document.addEventListener("DOMContentLoaded", async () => {
    const cfg = await loadCfg();

    const saApi = installSA();
    installWindowSaAlias(cfg); // ensure window.sa is ready & populated

    // If a token already exists from a previous session, reflect it
    const t = getStoredIdToken();
    if (t) {
      setIdToken(t);
      const at = getStoredAccessToken();
      if (at) setAccessToken(at);
    }

    if (resolveReady) resolveReady(saApi);
    window.dispatchEvent(new Event("sa:ready"));

    console.log(
      "[app] ready; role =",
      saApi.getRole(),
      "cfg.appsyncUrl =",
      cfg.appsyncUrl || "(missing)"
    );
  });
})();
