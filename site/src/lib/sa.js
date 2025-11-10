// site/src/lib/sa.js

/** Wait for the global SA helper (set by public/sa.js) */
export async function getSA() {
  if (window.SA) return window.SA;
  if (window.SAReady) return window.SAReady;
  await new Promise((r) => setTimeout(r, 0));
  return window.SA;
}

/* -------------------------------------------------------------------------------------- */
/* Auth utilities                                                                          */
/* -------------------------------------------------------------------------------------- */

function readCfg(SA) {
  const raw = SA?.cfg?.() || {};
  const cfg = { ...raw };

  // Build full Cognito Hosted UI domain if needed
  let domain = (cfg.cognitoDomain || "").trim().replace(/\/+$/, "");
  if (!domain) {
    const pref = (cfg.cognitoDomainPrefix || cfg.hostedUiDomain || cfg.domain || "").trim();
    const region = (cfg.region || "").trim();
    if (pref && region) {
      domain = `https://${pref}.auth.${region}.amazoncognito.com`;
    }
  }
  cfg.cognitoDomain = domain;

  if (!cfg.cognitoDomain) {
    console.warn("[SA] Missing cognitoDomain or (cognitoDomainPrefix/hostedUiDomain + region) in config.v2.json");
  }
  if (!cfg.userPoolWebClientId && !cfg.clientId) {
    console.warn("[SA] Missing userPoolWebClientId/clientId in config.v2.json");
  }

  cfg.clientId = cfg.clientId || cfg.userPoolWebClientId;
  if (!Array.isArray(cfg.scopes) || cfg.scopes.length === 0) cfg.scopes = ["openid", "email"];
  return cfg;
}

function withQuery(base, params) {
  const u = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

function currentRedirectUri() {
  // no trailing slash — matches your Cognito Allowed callback URL
  return `${window.location.origin}/callback`;
}

function saveTokens(tokens) {
  const { id_token, access_token, refresh_token, expires_in } = tokens || {};
  if (id_token) {
    sessionStorage.setItem("id_token", id_token);
    localStorage.setItem("sa_id_token", id_token);
  }
  if (access_token) {
    sessionStorage.setItem("access_token", access_token);
    localStorage.setItem("sa_access_token", access_token);
  }
  if (refresh_token) {
    sessionStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("sa_refresh_token", refresh_token);
  }
  if (expires_in) {
    const expAt = Date.now() + Number(expires_in) * 1000;
    sessionStorage.setItem("token_exp_at", String(expAt));
  }
}

function readToken(name) {
  return sessionStorage.getItem(name) || localStorage.getItem(`sa_${name}`) || "";
}

/** Best-effort Cognito ID token for Authorization header */
export async function getIdToken() {
  try {
    const SA = await getSA();
    const tok =
      SA?.auth?.idToken?.() ||
      SA?.auth?.tokens?.()?.idToken?.toString?.() ||
      SA?.tokens?.idToken?.toString?.();
    if (tok) return String(tok);
  } catch {
    /* SA not ready — fall through */
  }
  return readToken("id_token");
}

export async function exchangeCodeForTokens() {
  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.cognitoDomain || !cfg.clientId) {
    throw new Error("Auth misconfigured: missing cognitoDomain/clientId");
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (!code) throw new Error("Missing ?code on callback URL");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    code,
    redirect_uri: currentRedirectUri(),
  });

  const tokenEndpoint = `${cfg.cognitoDomain.replace(/\/+$/, "")}/oauth2/token`;
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Token exchange failed (${res.status}) ${t}`);
  }

  const tokens = await res.json();
  saveTokens(tokens);
  return tokens;
}

export async function handleCallbackIfPresent() {
  const isCallback = window.location.pathname.replace(/\/+$/, "") === "/callback";
  if (!isCallback) return false;
  const hasCode = new URL(window.location.href).searchParams.get("code");
  if (!hasCode) return false;

  try {
    await exchangeCodeForTokens();
    window.history.replaceState({}, "", `${window.location.origin}/`);
  } catch (e) {
    console.error("[SA] Callback error:", e);
  }
  return true;
}

export async function login(redirectUri) {
  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.cognitoDomain || !cfg.clientId) {
    throw new Error("Auth misconfigured: missing cognitoDomain/clientId");
  }
  const loginUrl = withQuery(`${cfg.cognitoDomain}/login`, {
    client_id: cfg.clientId,
    response_type: "code",
    scope: cfg.scopes.join(" "),
    redirect_uri: redirectUri || currentRedirectUri(),
  });
  window.location.assign(loginUrl);
}

export async function logout(redirectUri) {
  const SA = await getSA();
  const cfg = readCfg(SA);
  clearTokens();
  if (!cfg.cognitoDomain || !cfg.clientId) {
    window.location.assign(redirectUri || `${window.location.origin}/`);
    return;
  }
  const logoutUrl = withQuery(`${cfg.cognitoDomain}/logout`, {
    client_id: cfg.clientId,
    logout_uri: redirectUri || `${window.location.origin}/`,
  });
  window.location.assign(logoutUrl);
}

export function clearTokens() {
  ["id_token", "access_token", "refresh_token", "token_exp_at"].forEach((k) => {
    try { sessionStorage.removeItem(k); } catch {}
  });
  ["sa_id_token", "sa_access_token", "sa_refresh_token"].forEach((k) => {
    try { localStorage.removeItem(k); } catch {}
  });
}

/* -------------------------------------------------------------------------------------- */
/* Upload helpers                                                                          */
/* -------------------------------------------------------------------------------------- */

/**
 * Return a short-lived signed GET URL for an existing object key.
 * Uses GET /presign?key=...&method=GET (Cognito-authorized).
 */
export async function getSignedGetUrl(key) {
  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.uploadsApiUrl) throw new Error("Missing uploadsApiUrl in config.v2.json");

  const url = `${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign?${new URLSearchParams({
    key,
    method: "GET",
  }).toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: await getIdToken() },
  });

  if (!res.ok) throw new Error(`presign(GET) failed (${res.status})`);
  const j = await res.json();
  // Support any shape the presign function returns
  return j.publicUrl || j.url || j.getUrl;
}

/**
 * Upload a Blob or text via API Gateway presign to S3.
 * Supports both S3 POST (form fields) and direct PUT flows.
 */
export async function signedUpload(fileOrText) {
  // If public/sa.js exposed a native helper, prefer that
  if (typeof window.signedUpload === "function") {
    return window.signedUpload(fileOrText);
  }

  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.uploadsApiUrl) throw new Error("Missing uploadsApiUrl in config.v2.json");

  // Prepare payload
  let blob, keyRaw;
  if (fileOrText instanceof Blob) {
    blob = fileOrText;
    const name = fileOrText.name || `upload-${Date.now()}.bin`;
    keyRaw = name; // API can scope to users/<sub>/ server-side
  } else {
    const text = String(fileOrText ?? "hello");
    blob = new Blob([text], { type: "text/plain" });
    keyRaw = `dev-tests/${Date.now()}.txt`;
  }

  // 1) Ask API for a presigned request
  const presignRes = await fetch(`${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await getIdToken(),
    },
    body: JSON.stringify({
      key: keyRaw,
      contentType: blob.type || "application/octet-stream",
    }),
  });

  if (!presignRes.ok) {
    const text = await presignRes.text().catch(() => "");
    throw new Error(`presign failed (${presignRes.status}) ${text}`);
  }
  const presign = await presignRes.json();

  // 2) Upload to S3 using the method the API returned
  if (presign.method === "POST" || presign.fields) {
    // Multipart form POST
    const form = new FormData();
    Object.entries(presign.fields || {}).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);
    const up = await fetch(presign.url, { method: "POST", body: form });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }
  } else {
    // Direct PUT
    const up = await fetch(presign.url, {
      method: presign.method || "PUT",
      headers:
        presign.headers || {
          "Content-Type": blob.type || "application/octet-stream",
        },
      body: blob,
    });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }
  }

  // Shape the return to what your Home.jsx expects
  return {
    key: presign.key || keyRaw,
    bucket: presign.bucket,
    url: presign.publicUrl || presign.url || presign.getUrl, // may be signed/expiring
  };
}

export const Auth = { login, logout, handleCallbackIfPresent, clearTokens, getIdToken };

