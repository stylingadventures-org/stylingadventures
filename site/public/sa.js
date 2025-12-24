/* Styling Adventures — sa.js
   Global auth + GraphQL + uploads helper (no external deps) */

(function () {
  "use strict";

  const FALLBACK_APPSYNC_URL =
    "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql";

  // ⚠️ REPLACE abc123def4 WITH YOUR REAL API ID (UploadsStack.UploadsApiUrl)
  const FALLBACK_UPLOADS_API_URL =
    "https://6bogi2ehy2.execute-api.us-east-1.amazonaws.com/prod";

  // Hardcoded production config - fallback if all config files fail to load
  // This prevents being stuck with old CloudFront-cached configs
  const PRODUCTION_CONFIG = {
    env: "prd",
    region: "us-east-1",
    appsyncUrl: "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
    uploadsApiUrl: "https://6bogi2ehy2.execute-api.us-east-1.amazonaws.com/prod",
    userPoolId: "us-east-1_aXLKIxbqK",
    userPoolWebClientId: "51uc25i7ob3otirvgi66mpht79",
    clientId: "51uc25i7ob3otirvgi66mpht79",
    identityPoolId: "us-east-1:c73ff0f8-f70b-4eb4-93b8-9397ba61e7f8",
    cognitoDomainPrefix: "sa-dev-637423256673",
    cognitoDomain: "https://sa-dev-637423256673.auth.us-east-1.amazoncognito.com",
    scopes: ["openid", "email", "profile"],
  };

  const BAD_UPLOAD_HOSTS = [
    // Old dead endpoint we never want to use again
    "r9mrarhdxa.execute-api.us-east-1.amazonaws.com",
    // Old dead AppSync endpoint
    "3ezwfbtqlfh75ge7vwkz7umhbi.appsync-api.us-east-1.amazonaws.com",
  ];

  // ---------- configuration ----------
  async function loadCfg() {
    async function tryJson(url) {
      try {
        const r = await fetch(`${url}?ts=${Date.now()}`, {
          cache: "no-store",
        });
        if (r.ok) {
          const data = r.json();
          console.log(`[sa] ✓ Successfully loaded config from: ${url}`);
          return data;
        } else {
          console.debug(`[sa] Config not found at: ${url} (status ${r.status})`);
        }
      } catch (e) {
        console.debug("[sa] config fetch failed", url, e.message);
      }
      return null;
    }

    // Determine if we're in production based on hostname
    const hostname = location.hostname.toLowerCase();
    const isProd = 
      hostname === "app.stylingadventures.com" ||
      hostname === "staging.stylingadventures.com" ||
      hostname === "stylingadventures.com";

    console.log(`[sa] Hostname: ${hostname}, isProd: ${isProd}`);

    // Try production config first if we're on a production domain, otherwise dev config
    const configUrls = isProd
      ? ["/config.prod.json", "/config.v2.json", "/config.json"]
      : ["/config.v2.json", "/config.json", "/config.prod.json"];

    console.log(`[sa] Trying configs in order: ${configUrls.join(", ")}`);

    let raw;
    for (const url of configUrls) {
      raw = await tryJson(url);
      if (raw) {
        console.log("[sa] ✓ Using config:", raw);
        break;
      }
    }
    raw = raw || {};

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

    console.log(`[sa] Raw appsyncUrl from config: ${cfg.appsyncUrl}`);

    // Check if the URL is known to be BAD (old/deleted endpoints)
    const isKnownBadHost = BAD_UPLOAD_HOSTS.some(host => cfg.appsyncUrl.includes(host));
    if (isKnownBadHost) {
      console.error(`[sa] ⚠️ Config contains KNOWN BAD AppSync endpoint: ${cfg.appsyncUrl}`);
      console.error(`[sa] This endpoint no longer exists. Using hardcoded production config.`);
      cfg = { ...PRODUCTION_CONFIG };
    }

    // 🔐 Hard override if missing / not an AppSync URL
    if (
      !cfg.appsyncUrl ||
      typeof cfg.appsyncUrl !== "string" ||
      !cfg.appsyncUrl.includes("appsync-api.us-east-1.amazonaws.com")
    ) {
      console.warn(
        "[sa] appsyncUrl missing, invalid, or suspicious in config; using fallback",
        FALLBACK_APPSYNC_URL,
      );
      cfg.appsyncUrl = FALLBACK_APPSYNC_URL;
    }

    console.log(`[sa] ✓ Final appsyncUrl: ${cfg.appsyncUrl}`);

    // ClientId normalization
    cfg.clientId = cfg.clientId || cfg.userPoolWebClientId || "";

    // Build the Hosted UI BASE (full https://{prefix}.auth.{region}.amazoncognito.com)
    const region = (cfg.region || "").trim();

    // cognitoDomain can be either bare host or full https://host
    const fromCognitoDomain = (cfg.cognitoDomain || "")
      .trim()
      .replace(/\/+$/, "");
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

    // Auth code callback handled by /callback route in the SPA
    cfg.redirectUri = cfg.redirectUri || `${origin}/callback`;
    cfg.logoutUri = cfg.logoutUri || `${origin}/`;

    // ----- uploadsApiUrl normalisation + override -----
    let uploadsUrl =
      cfg.uploadsApiUrl ||
      raw.uploadsApiUrl ||
      raw.uploadsApi ||
      raw.uploadsOrigin ||
      raw.uploadApiUrl ||
      "";

    uploadsUrl = String(uploadsUrl || "").trim();

    const uploadsUrlIsBad =
      !uploadsUrl ||
      BAD_UPLOAD_HOSTS.some((host) => uploadsUrl.includes(host));

    if (uploadsUrlIsBad) {
      // Prefer an explicit good URL from config if present
      const candidate =
        (raw.uploadsApiUrl || "").trim() ||
        (raw.uploadsApi || "").trim() ||
        (raw.uploadsOrigin || "").trim() ||
        (raw.uploadApiUrl || "").trim() ||
        "";

      const candidateIsGood =
        candidate &&
        !BAD_UPLOAD_HOSTS.some((host) => candidate.includes(host));

      cfg.uploadsApiUrl = candidateIsGood
        ? candidate
        : FALLBACK_UPLOADS_API_URL;

      console.warn(
        "[sa] uploadsApiUrl missing or stale; using",
        cfg.uploadsApiUrl,
      );
    } else {
      cfg.uploadsApiUrl = uploadsUrl;
    }

    window.__cfg = cfg;
    return cfg;
  }

  // ---------- token helpers ----------
  function parseJwt(t) {
    try {
      return JSON.parse(
        atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
    } catch {
      // Invalid / missing token – treat as anonymous
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

  // Simple “fresh enough” check for the id_token
  async function ensureFreshToken() {
    const tok = getStoredIdToken();
    if (!tok) {
      throw new Error("Not signed in.");
    }

    let expMs = 0;
    try {
      expMs = (parseJwt(tok).exp | 0) * 1000;
    } catch (err) {
      // ignore parse errors; we’ll treat as expired below if needed
      void err;
    }

    // If we don't have exp or it's still > 60s in the future, just use it.
    if (!expMs || expMs - Date.now() > 60_000) {
      syncSaSession({ idToken: tok, email: parseJwt(tok).email || "" });
      return;
    }

    // Token expired -> clear local state and force re-login
    try {
      window.SA && window.SA.logoutLocal();
    } catch (err) {
      // ignore logout errors; user will be treated as signed out
      void err;
    }
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

      // Start Hosted UI login using AUTHORIZATION CODE flow.
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
        } catch (err) {
          // ignore storage quota errors
          void err;
        }

        const scope = (cfg._scopes && cfg._scopes.join(" ")) || "openid email";

        const qp = new URLSearchParams({
          client_id: String(cfg.clientId),
          response_type: "code", // 👈 authorization code flow
          scope,
          redirect_uri: cfg.redirectUri,
        });

        (window.top || window).location.assign(
          `${cfg._hostBase}/login?${qp.toString()}`,
        );
      },

      logoutLocal: () => {
        ["id_token", "access_token", "refresh_token"].forEach((k) => {
          try {
            sessionStorage.removeItem(k);
          } catch (err) {
            void err;
          }
        });
        try {
          localStorage.removeItem("sa_id_token");
          localStorage.removeItem("sa:idToken");
          localStorage.removeItem("sa:accessToken");
          localStorage.removeItem("sa:expiresAt");
        } catch (err) {
          void err;
        }
        syncSaSession({ idToken: "", accessToken: "", email: "" });
      },

      // Clear local tokens, then bounce to Hosted UI logout.
      logoutEverywhere: () => {
        const cfg = window.__cfg || {};

        try {
          window.SA.logoutLocal();
        } catch (err) {
          void err;
        }

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
        if (j.errors)
          throw new Error(j.errors.map((e) => e.message).join("; "));
        return j.data;
      },
    };

    console.log("[SA] global helpers ready, role =", window.SA.getRole());
    return window.SA;
  }

  // ---------- uploads (signed S3 via API Gateway) ----------
  async function signedUpload(fileOrText, opts = {}) {
    const SA = window.SA || {};
    const cfg = (SA.cfg && SA.cfg()) || window.__cfg || {};
    if (!cfg.uploadsApiUrl) {
      throw new Error("Missing uploadsApiUrl in config.v2.json");
    }

    console.log("[SA public] uploadsApiUrl:", cfg.uploadsApiUrl);

    let blob;
    let key;

    if (fileOrText instanceof Blob) {
      blob = fileOrText;
      const name = fileOrText.name || `upload-${Date.now()}.bin`;
      key = opts.key || name;
    } else {
      const text = String(fileOrText ?? "hello from Styling Adventures");
      blob = new Blob([text], { type: "text/plain" });
      key = opts.key || `dev-tests/${Date.now()}.txt`;
    }

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
      },
    );

    if (!presignRes.ok) {
      const t = await presignRes.text().catch(() => "");
      throw new Error(`presign failed (${presignRes.status}) ${t}`);
    }

    const presign = await presignRes.json();

    if (presign.method === "POST" || presign.fields) {
      const form = new FormData();
      Object.entries(presign.fields || {}).forEach(([k, v]) =>
        form.append(k, v),
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

  window.getSA = async function getSA() {
    if (!window.sa) installWindowSaAlias(window.__cfg || {});
    await new Promise((r) => setTimeout(r, 0));
    return window.sa;
  };

  // ---------- boot ----------
  let resolveReady;
  window.SAReady = new Promise((r) => (resolveReady = r));

  // Load config IMMEDIATELY (don't wait for DOMContentLoaded)
  // This ensures window.__cfg is available before React app initializes
  async function initializeSA() {
    try {
      const cfg = await loadCfg();

      const saApi = installSA();
      installWindowSaAlias(cfg);

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
        cfg.appsyncUrl || "(missing)",
      );
    } catch (err) {
      console.error("[sa] Initialization failed:", err);
      if (resolveReady) resolveReady(null);
    }
  }

  // Start initialization immediately (don't wait for DOMContentLoaded)
  // This prevents race conditions where React tries to use config before it's loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSA);
  } else {
    // If DOM is already ready, initialize immediately
    initializeSA();
  }
})();
