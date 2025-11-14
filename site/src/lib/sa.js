// site/src/lib/sa.js

/** Wait for the global SA helper (set by public/sa.js) */
export async function getSA() {
  if (window.SA) return window.SA;
  if (window.SAReady) return window.SAReady;
  await new Promise((r) => setTimeout(r, 0));
  return window.SA;
}

/* -----------------------------------------------------------------------------
   Auth utilities (Cognito Hosted UI – code grant)
----------------------------------------------------------------------------- */

function readCfg(SA) {
  const raw = SA?.cfg?.() || window.__cfg || {};
  const cfg = { ...raw };

  // Build full Hosted UI domain if needed
  let domain = (cfg.cognitoDomain || "").trim().replace(/\/+$/, "");
  if (!domain) {
    const pref = (cfg.cognitoDomainPrefix || cfg.hostedUiDomain || cfg.domain || "").trim();
    const region = (cfg.region || "").trim();
    if (pref && region) domain = `https://${pref}.auth.${region}.amazoncognito.com`;
  }
  cfg.cognitoDomain = domain;

  if (!cfg.cognitoDomain) {
    console.warn("[SA] Missing cognitoDomain or (cognitoDomainPrefix/hostedUiDomain + region) in config.v2.json");
  }
  if (!cfg.userPoolWebClientId && !cfg.clientId) {
    console.warn("[SA] Missing userPoolWebClientId/clientId in config.v2.json");
  }

  cfg.clientId = cfg.clientId || cfg.userPoolWebClientId;

  // Default scopes; you can add "profile" if you like
  if (!Array.isArray(cfg.scopes) || cfg.scopes.length === 0) {
    cfg.scopes = ["openid", "email"];
  }

  return cfg;
}

function withQuery(base, params) {
  const u = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

/** Normalised origin (no trailing slash) */
function webOrigin() {
  return window.location.origin.replace(/\/+$/, "");
}

/**
 * ⚠️ Choose ONE of these callback paths and keep it consistent
 * in BOTH this file and the Cognito app client's Callback URLs.
 */
const CALLBACK_PATH = "/callback"; // or "/callback/" if you prefer trailing slash

function currentRedirectUri() {
  return `${webOrigin()}${CALLBACK_PATH}`;
}

/** Home after login/logout */
function homeUri() {
  return `${webOrigin()}/`;
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
    sessionStorage.setItem("token_exp_at", String(Date.now() + Number(expires_in) * 1000));
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
  } catch {}
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
    redirect_uri: currentRedirectUri(), // must match /login redirect_uri
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
  // Treat /callback and /callback/ as equivalent
  const path = window.location.pathname.replace(/\/+$/, "");
  const cbPath = CALLBACK_PATH.replace(/\/+$/, "");

  const isCallback = path === cbPath;
  if (!isCallback) return false;

  if (!new URL(window.location.href).searchParams.get("code")) return false;

  try {
    await exchangeCodeForTokens();
    // After successful login, go "home"
    window.history.replaceState({}, "", homeUri());
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

  const loginUrl = withQuery(`${cfg.cognitoDomain.replace(/\/+$/, "")}/login`, {
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

  const target = redirectUri || homeUri();

  if (!cfg.cognitoDomain || !cfg.clientId) {
    window.location.assign(target);
    return;
  }

  const logoutUrl = withQuery(`${cfg.cognitoDomain.replace(/\/+$/, "")}/logout`, {
    client_id: cfg.clientId,
    logout_uri: target,
  });

  window.location.assign(logoutUrl);
}

export function clearTokens() {
  ["id_token", "access_token", "refresh_token", "token_exp_at"].forEach((k) => {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  });
  ["sa_id_token", "sa_access_token", "sa_refresh_token"].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

export const Auth = { login, logout, handleCallbackIfPresent, clearTokens, getIdToken };

/* -----------------------------------------------------------------------------
   Upload helpers
----------------------------------------------------------------------------- */

/** Return a short-lived signed GET URL for an existing object key. */
export async function getSignedGetUrl(key) {
  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.uploadsApiUrl) throw new Error("Missing uploadsApiUrl in config.v2.json");

  const url = `${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign?${new URLSearchParams({
    key,
    method: "GET",
  }).toString()}`;

  const res = await fetch(url, { method: "GET", headers: { Authorization: await getIdToken() } });
  if (!res.ok) throw new Error(`presign(GET) failed (${res.status})`);
  const j = await res.json();
  return j.publicUrl || j.url || j.getUrl;
}

/** Upload a Blob or text via API Gateway presign to S3. */
export async function signedUpload(fileOrText) {
  // Prefer native helper exposed by public/sa.js if present
  if (typeof window.signedUpload === "function") return window.signedUpload(fileOrText);

  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.uploadsApiUrl) throw new Error("Missing uploadsApiUrl in config.v2.json");

  // Prepare payload
  let blob, keyRaw;
  if (fileOrText instanceof Blob) {
    blob = fileOrText;
    const name = fileOrText.name || `upload-${Date.now()}.bin`;
    keyRaw = name; // API may scope under users/<sub>/ server-side
  } else {
    const text = String(fileOrText ?? "hello");
    blob = new Blob([text], { type: "text/plain" });
    keyRaw = `dev-tests/${Date.now()}.txt`;
  }

  // Ask API for a presigned request
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

  // Upload to S3 using method returned by API
  if (presign.method === "POST" || presign.fields) {
    const form = new FormData();
    Object.entries(presign.fields || {}).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);
    const up = await fetch(presign.url, { method: "POST", body: form });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }
  } else {
    const up = await fetch(presign.url, {
      method: presign.method || "PUT",
      headers: presign.headers || { "Content-Type": blob.type || "application/octet-stream" },
      body: blob,
    });
    if (!up.ok) {
      const t = await up.text().catch(() => "");
      throw new Error(`upload failed (${up.status}) ${t}`);
    }
  }

  return {
    key: presign.key || keyRaw,
    bucket: presign.bucket,
    url: presign.publicUrl || presign.url || presign.getUrl,
  };
}

/* -----------------------------------------------------------------------------
   Fans/Game helpers (profile, leaderboard, badges, daily login)
----------------------------------------------------------------------------- */

// Once/day guard (per browser) for DAILY_LOGIN
const DAILY_KEY = "sa.lastDailyLoginAt";

export async function dailyLoginOnce() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(DAILY_KEY);
    if (last === today) return false;

    const SA = await getSA();
    await SA.gql(
      `mutation ($t:String!){
         logGameEvent(input:{ type:$t }) { xp coins lastEventAt }
       }`,
      { t: "DAILY_LOGIN" }
    );
    localStorage.setItem(DAILY_KEY, today);
    return true;
  } catch {
    return false; // non-fatal if not signed in yet
  }
}

/** Tolerant fetch: will retry without displayName if backend hasn't rolled out yet. */
export async function fetchProfile() {
  const SA = await getSA();

  const withName = `query {
    getMyProfile {
      userId
      displayName
      level
      xp
      coins
      badges
      lastEventAt
    }
  }`;

  const noName = `query {
    getMyProfile {
      userId
      level
      xp
      coins
      badges
      lastEventAt
    }
  }`;

  try {
    const data = await SA.gql(withName);
    return data?.getMyProfile;
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("FieldUndefined") && msg.includes("displayName")) {
      const data = await SA.gql(noName);
      return data?.getMyProfile;
    }
    throw e;
  }
}

/** Updated to match your requested shape & variable name. */
export async function setDisplayName(name) {
  const SA = await getSA();
  const q = `
    mutation SetDisplayName($name: String!) {
      setDisplayName(displayName: $name) {
        userId
        level
        xp
        coins
        displayName
        lastEventAt
      }
    }
  `;
  const d = await SA.gql(q, { name: String(name ?? "").trim() });
  return d?.setDisplayName;
}

/** Tolerant leaderboard query (with/without displayName). */
export async function fetchLeaderboard(n = 10) {
  const SA = await getSA();

  const withName = `query ($n:Int){
    topXP(limit:$n){
      rank userId xp coins displayName
    }
  }`;
  const noName = `query ($n:Int){
    topXP(limit:$n){
      rank userId xp coins
    }
  }`;

  try {
    const data = await SA.gql(withName, { n });
    return data?.topXP ?? [];
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("FieldUndefined") && msg.includes("displayName")) {
      const data = await SA.gql(noName, { n });
      return data?.topXP ?? [];
    }
    throw e;
  }
}

export async function grantBadgeTo(userId, badge) {
  const SA = await getSA();
  const data = await SA.gql(
    `mutation ($uid:ID!, $b:String!){
       grantBadge(userId:$uid, badge:$b){ userId badges xp coins level }
     }`,
    { uid: userId, b: badge }
  );
  return data?.grantBadge;
}

/* -----------------------------------------------------------------------------
   ✨ Compatibility bridge for Admin pages (drop-in safe)
   - Exposes window.sa.ready / window.sa.graphql / window.sa.session / window.sa.cfg
   - Provides a named export `graphql(query, variables)`
----------------------------------------------------------------------------- */

function parseJwt(t) {
  try {
    const [, payload] = String(t || "").split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function pickSessionCompat(idToken) {
  const payload = idToken ? parseJwt(idToken) : {};
  const groups = payload?.["cognito:groups"] || [];
  return { idToken, idTokenPayload: payload, groups };
}

// Fallback GraphQL (direct AppSync HTTP) when SA.gql is unavailable.
async function directGraphql(query, variables) {
  const SA = await getSA().catch(() => undefined);
  const cfg = readCfg(SA || {});
  const appsyncUrl =
    window.sa?.cfg?.appsyncUrl || window.__cfg?.appsyncUrl || cfg?.appsyncUrl;
  const idToken = await getIdToken();
  if (!appsyncUrl || !idToken) throw new Error("Auth not ready");
  const r = await fetch(appsyncUrl, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: idToken },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
}

async function readyCompat() {
  // Best-effort wait until config + token exist
  const start = Date.now();
  while (true) {
    const idTok = await getIdToken();
    const appsyncUrl =
      window.sa?.cfg?.appsyncUrl ||
      window.__cfg?.appsyncUrl ||
      (await getSA().then((SA) => readCfg(SA).appsyncUrl).catch(() => undefined));
    if (idTok && appsyncUrl) break;
    if (Date.now() - start > 5000) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  const idToken = await getIdToken();
  const SA = await getSA().catch(() => undefined);
  const cfg = {
    ...(window.sa?.cfg || {}),
    ...(window.__cfg || {}),
    ...(SA ? readCfg(SA) : {}),
  };

  window.sa = window.sa || {};
  window.sa.session = pickSessionCompat(idToken);
  window.sa.cfg = cfg;
  // Prefer SA.gql if present; otherwise fallback to directGraphql
  window.sa.graphql =
    window.sa.graphql ||
    (SA?.gql
      ? (q, v) => SA.gql(q, v)
      : (q, v) => directGraphql(q, v));
  return true;
}

// Initialize the compat surface once at import time (non-blocking)
window.sa = window.sa || {};
window.sa.ready = window.sa.ready || readyCompat;
window.sa.cfg = window.sa.cfg || window.__cfg || {};

// Named export mirroring the drop-in helper’s API
export async function graphql(query, variables) {
  await (window.sa.ready?.() || Promise.resolve());
  if (typeof window.sa.graphql === "function") {
    return window.sa.graphql(query, variables);
  }
  // Absolute last-resort fallback
  return directGraphql(query, variables);
}
