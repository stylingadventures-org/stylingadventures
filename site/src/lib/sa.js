// site/src/lib/sa.js

/** Wait for the global SA helper (set by public/sa.js) */
export async function getSA() {
  if (window.SA) return window.SA;
  if (window.SAReady) return window.SAReady;
  await new Promise((r) => setTimeout(r, 0));
  return window.SA;
}

/* ---------------------------------------------------------------------------
   Auth utilities (Cognito Hosted UI – code grant)
--------------------------------------------------------------------------- */

function readCfg(SA) {
  // Prefer SA.cfg() (from public/sa.js), then any compat cfg, then window.__cfg
  const saCfg =
    (SA && typeof SA.cfg === "function" ? SA.cfg() : SA?.cfg) || {};
  const compatCfg = window.sa?.cfg || {};
  const jsonCfg = window.__cfg || {};

  // Merge with priority: SA base → compat → config.v2.json
  const cfg = {
    ...saCfg,
    ...compatCfg,
    ...jsonCfg,
  };

  // ─────────────────────────────────────
  // 🔐 Hard-override AppSync URL in dev
  // ─────────────────────────────────────
  const FALLBACK_APPSYNC_URL =
    "https://3ezwfbtqlfh75ge7vwkz7umhbi.appsync-api.us-east-1.amazonaws.com/graphql";

  // If missing OR looks suspicious, force the known-good value
  if (
    !cfg.appsyncUrl ||
    typeof cfg.appsyncUrl !== "string" ||
    !cfg.appsyncUrl.includes("appsync-api.us-east-1.amazonaws.com")
  ) {
    cfg.appsyncUrl = FALLBACK_APPSYNC_URL;
  }

  // Build full Hosted UI domain if needed
  let domain = (cfg.cognitoDomain || "").trim().replace(/\/+$/, "");
  if (!domain) {
    const pref =
      (cfg.cognitoDomainPrefix ||
        cfg.hostedUiDomain ||
        cfg.domain ||
        "").trim();
    const region = (cfg.region || "").trim();
    if (pref && region)
      domain = `https://${pref}.auth.${region}.amazoncognito.com`;
  }
  cfg.cognitoDomain = domain;

  if (!cfg.cognitoDomain) {
    console.warn(
      "[SA] Missing cognitoDomain or (cognitoDomainPrefix/hostedUiDomain + region) in config.v2.json",
    );
  }
  if (!cfg.userPoolWebClientId && !cfg.clientId) {
    console.warn("[SA] Missing userPoolWebClientId/clientId in config.v2.json");
  }

  cfg.clientId = cfg.clientId || cfg.userPoolWebClientId;

  // Default scopes; you can add "profile" if you like
  if (!Array.isArray(cfg.scopes) || cfg.scopes.length === 0) {
    cfg.scopes = ["openid", "email"];
  }

  // -----------------------------------------------------------------------
  // 📦 Uploads API compatibility: normalise uploadsApiUrl from legacy keys
  // -----------------------------------------------------------------------
  if (!cfg.uploadsApiUrl) {
    cfg.uploadsApiUrl =
      cfg.uploadsApiUrl ||
      cfg.uploadsApi || // e.g. older config key
      cfg.uploadsOrigin || // sometimes used for API origin
      cfg.uploadApiUrl ||
      "";
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
    sessionStorage.setItem(
      "token_exp_at",
      String(Date.now() + Number(expires_in) * 1000),
    );
  }
}

function readToken(name) {
  return (
    sessionStorage.getItem(name) || localStorage.getItem(`sa_${name}`) || ""
  );
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

  const tokenEndpoint = `${cfg.cognitoDomain.replace(
    /\/+$/,
    "",
  )}/oauth2/token`;
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

  const loginUrl = withQuery(
    `${cfg.cognitoDomain.replace(/\/+$/, "")}/login`,
    {
      client_id: cfg.clientId,
      response_type: "code",
      scope: cfg.scopes.join(" "),
      redirect_uri: redirectUri || currentRedirectUri(),
    },
  );

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

  const logoutUrl = withQuery(
    `${cfg.cognitoDomain.replace(/\/+$/, "")}/logout`,
    {
      client_id: cfg.clientId,
      logout_uri: target,
    },
  );

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

export const Auth = {
  login,
  logout,
  handleCallbackIfPresent,
  clearTokens,
  getIdToken,
};

/* ---------------------------------------------------------------------------
   Upload helpers
--------------------------------------------------------------------------- */

/**
 * Build a public URL for an existing object key (no GET presign).
 *
 * The uploads API's /presign endpoint is now POST-only for uploads,
 * so previews should just construct a URL using the configured CDN
 * or S3 bucket instead of calling /presign?method=GET.
 */
export async function getSignedGetUrl(key) {
  if (!key) return null;

  // Already a full URL? Just use it directly.
  if (/^https?:\/\//i.test(String(key))) {
    return String(key);
  }

  const SA = await getSA().catch(() => undefined);
  const cfg = readCfg(SA);
  const cleanedKey = String(key).replace(/^\/+/, "");

  // Prefer a CDN / base URL if present
  const baseUrl = (
    cfg.thumbsCdn ||
    cfg.uploadsCdn ||
    cfg.uploadsUrl ||
    cfg.uploadsOrigin ||
    cfg.assetsBaseUrl ||
    cfg.mediaBaseUrl ||
    cfg.webBucketOrigin ||
    ""
  ).replace(/\/+$/, "");

  if (baseUrl) {
    return `${baseUrl}/${encodeURIComponent(cleanedKey)}`;
  }

  // Fallback: construct standard S3 URL from bucket + region
  const bucket =
    cfg.uploadsBucket ||
    cfg.mediaBucket ||
    cfg.webBucket ||
    cfg.assetsBucket ||
    cfg.bucket ||
    cfg.BUCKET ||
    "";
  const region = cfg.region || "us-east-1";

  if (!bucket) {
    console.warn(
      "[getSignedGetUrl] No uploads base URL or bucket configured",
      { cfg },
    );
    return null;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
    cleanedKey,
  )}`;
}

/**
 * Upload a Blob or text via API Gateway presign to S3.
 *
 * NEW: accepts an optional options object:
 *   signedUpload(file, { key: "uuid.jpg", kind: "closet" })
 */
export async function signedUpload(fileOrText, opts = {}) {
  // Prefer native helper exposed by public/sa.js if present
  if (typeof window.signedUpload === "function")
    return window.signedUpload(fileOrText, opts);

  const SA = await getSA();
  const cfg = readCfg(SA);
  if (!cfg.uploadsApiUrl) {
    throw new Error("Missing uploadsApiUrl in config.v2.json");
  }

  console.log("[SA] uploadsApiUrl:", cfg.uploadsApiUrl);

  // Prepare payload
  let blob;
  let keyRaw;

  if (fileOrText instanceof Blob) {
    blob = fileOrText;
    const name = fileOrText.name || `upload-${Date.now()}.bin`;
    keyRaw = opts.key || name; // API may scope/prefix server-side
  } else {
    const text = String(fileOrText ?? "hello");
    blob = new Blob([text], { type: "text/plain" });
    keyRaw = opts.key || `dev-tests/${Date.now()}.txt`;
  }

  const presignBody = {
    key: keyRaw,
    contentType: blob.type || "application/octet-stream",
  };

  if (opts.kind) {
    presignBody.kind = opts.kind;
  }

  // Ask API for a presigned request
  const presignRes = await fetch(
    `${cfg.uploadsApiUrl.replace(/\/+$/, "")}/presign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: await getIdToken(),
      },
      body: JSON.stringify(presignBody),
    },
  );

  if (!presignRes.ok) {
    const text = await presignRes.text().catch(() => "");
    throw new Error(`presign failed (${presignRes.status}) ${text}`);
  }
  const presign = await presignRes.json();

  // Upload to S3 using method returned by API
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
  } else {
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

  return {
    key: presign.key || keyRaw,
    bucket: presign.bucket,
    url: presign.publicUrl || presign.url || presign.getUrl,
  };
}

/* ---------------------------------------------------------------------------
   Fans/Game helpers (profile, leaderboard, badges, daily login)
--------------------------------------------------------------------------- */

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
         logGameEvent(input:{ type:$t }) {
           success
           xp
           coins
           lastEventAt
         }
       }`,
      { t: "DAILY_LOGIN" },
    );
    localStorage.setItem(DAILY_KEY, today);
    return true;
  } catch {
    return false; // non-fatal if not signed in yet
  }
}

/** Fetch full profile shape defined in schema.graphql */
export async function fetchProfile() {
  const SA = await getSA();

  const q = `query {
    getMyProfile {
      userId
      displayName
      level
      xp
      coins
      badges {
        id
        name
        icon
      }
      lastEventAt
    }
  }`;

  const data = await SA.gql(q);
  return data?.getMyProfile;
}

/** Match Mutation.setDisplayName(name: String!): GameProfile! */
export async function setDisplayName(name) {
  const SA = await getSA();
  const q = `
    mutation SetDisplayName($name: String!) {
      setDisplayName(name: $name) {
        userId
        displayName
        level
        xp
        coins
        badges {
          id
          name
          icon
        }
        lastEventAt
      }
    }
  `;
  const d = await SA.gql(q, { name: String(name ?? "").trim() });
  return d?.setDisplayName;
}

/** Leaderboard: server-side rank via LeaderboardEntry */
export async function fetchLeaderboard(n = 10) {
  const SA = await getSA();

  const q = `query ($n:Int){
    topXP(limit:$n){
      rank
      userId
      xp
      coins
      displayName
    }
  }`;

  const data = await SA.gql(q, { n });
  return data?.topXP ?? [];
}

export async function grantBadgeTo(userId, badgeId) {
  const SA = await getSA();
  const q = `
    mutation ($uid:ID!, $bid:ID!){
      grantBadge(userId:$uid, badgeId:$bid){
        userId
        displayName
        level
        xp
        coins
        badges {
          id
          name
          icon
        }
        lastEventAt
      }
    }
  `;
  const d = await SA.gql(q, { uid: userId, bid: badgeId });
  return d?.grantBadge;
}

/* ---------------------------------------------------------------------------
   ✨ Compatibility bridge for Admin pages (drop-in safe)
   - Exposes window.sa.ready / window.sa.graphql / window.sa.session / window.sa.cfg
   - Provides a named export `graphql(query, variables)`
--------------------------------------------------------------------------- */

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
    window.sa?.cfg?.appsyncUrl ||
    window.__cfg?.appsyncUrl ||
    cfg?.appsyncUrl;

  const idToken = await getIdToken();

  console.log("[SA] GraphQL appsyncUrl in use:", appsyncUrl);

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
      (await getSA()
        .then((SA) => readCfg(SA).appsyncUrl)
        .catch(() => undefined));
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
    (SA?.gql ? (q, v) => SA.gql(q, v) : (q, v) => directGraphql(q, v));
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
