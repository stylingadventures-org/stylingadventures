/* Styling Adventures – tiny auth + dashboards glue (no build step) */

/* -------------------- utilities -------------------- */
const $ = s => document.querySelector(s);
const setText = (s, t) => { const el = $(s); if (el) el.textContent = t; };
const b64url = u8 => btoa(String.fromCharCode(...u8)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const rand = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
async function sha256B64Url(str) {
  const data = new TextEncoder().encode(str);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return b64url(new Uint8Array(dig));
}
function qs(obj) { const u = new URLSearchParams(); Object.entries(obj).forEach(([k,v]) => u.append(k, v)); return u.toString(); }
function stripEndSlash(s) { return String(s || "").replace(/\/+$/, ""); }

/* -------------------- config -------------------- */
async function loadConfig() {
  for (const path of ["/config.v2.json", "/config.json"]) {
    try {
      const r = await fetch(`${path}?ts=${Date.now()}`, { cache: "no-store" });
      if (r.ok) {
        const c = await r.json();
        c._uploadsBase = stripEndSlash(c.uploadsApiUrl || c.uploadsUrl || "");
        c._thumbsCdn   = stripEndSlash(c.thumbsCdn || location.origin);
        if (!c.hostedUiDomain || !c.clientId || !c.region || !c.redirectUri) {
          console.error("config missing required keys", c);
        }
        return c;
      }
    } catch {}
  }
  throw new Error("Could not load config");
}

/* -------------------- token store -------------------- */
const tokens = {
  get id()      { return sessionStorage.getItem("id_token") || ""; },
  get access()  { return sessionStorage.getItem("access_token") || ""; },
  get refresh() { return sessionStorage.getItem("refresh_token") || ""; },
  setAll(t) {
    if (t.id_token)     { sessionStorage.setItem("id_token", t.id_token);     localStorage.setItem("sa_id_token", t.id_token); }
    if (t.access_token) sessionStorage.setItem("access_token", t.access_token);
    if (t.refresh_token)sessionStorage.setItem("refresh_token", t.refresh_token);
  },
  clear() {
    ["id_token","access_token","refresh_token"].forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem("sa_id_token");
  }
};
function parseJwt(t) { try { return JSON.parse(atob(String(t).split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); } catch { return {}; } }
function tokenSecondsLeft() {
  const t = tokens.id; if (!t) return 0;
  try { const { exp } = parseJwt(t); return Math.max(0, Math.floor(exp - Date.now()/1000 - 10)); } catch { return 0; }
}

/* -------------------- Cognito Hosted UI -------------------- */
function hostedBase(cfg) {
  // NOTE: **hostedUiDomain** is required (e.g., "sa-dev-637423256673")
  return `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com`;
}
async function startLogin(cfg) {
  const verifier  = rand(32);
  const challenge = await sha256B64Url(verifier);
  sessionStorage.setItem("pkce_verifier", verifier);

  const url = new URL(hostedBase(cfg) + "/login");
  url.search = qs({
    client_id: cfg.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: cfg.redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  console.log("[auth] redirecting to Hosted UI:", url.toString());
  location.assign(url.toString());
}

async function maybeHandleCallback(cfg) {
  if (!location.pathname.startsWith("/callback")) return;
  console.log("[auth] callback page – processing…");

  const u = new URL(location.href);
  const code = u.searchParams.get("code");
  const verifier = sessionStorage.getItem("pkce_verifier");

  if (!code) { console.warn("[auth] no code in URL"); return; }
  if (!verifier) { console.error("[auth] missing PKCE verifier in sessionStorage"); return; }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: verifier
  });

  const tokenUrl = hostedBase(cfg) + "/oauth2/token";
  let res;
  try {
    res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
  } catch (e) {
    console.error("[auth] token request failed:", e);
    setText("#cb-msg", "Network error contacting Cognito. See console.");
    return;
  }

  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    console.error("[auth] token exchange failed", res.status, txt);
    setText("#cb-msg", `Token exchange failed (${res.status}). See console.`);
    return;
  }

  const t = await res.json();
  tokens.setAll(t);
  console.log("[auth] token exchange success");

  // Clean URL and go back to Fan
  history.replaceState({}, "", "/callback/");
  location.replace("/fan/");
}

function logoutEverywhere(cfg) {
  const url = new URL(hostedBase(cfg) + "/logout");
  url.search = qs({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutUri || (location.origin + "/")
  });
  tokens.clear();
  location.assign(url.toString());
}
function logoutLocal(cfg) {
  tokens.clear();
  if (cfg.logoutUri) location.href = cfg.logoutUri;
}

/* -------------------- GraphQL + uploads -------------------- */
async function ensureFreshToken(cfg) {
  if (tokenSecondsLeft() > 60) return;
  const rt = tokens.refresh;
  if (!rt) throw new Error("Session expired. Please sign in again.");
  const res = await fetch(hostedBase(cfg) + "/oauth2/token", {
    method: "POST",
    headers: { "Content-Type":"application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type:"refresh_token", client_id: cfg.clientId, refresh_token: rt })
  });
  if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
  tokens.setAll(await res.json());
}

async function gql(cfg, query, variables) {
  await ensureFreshToken(cfg);
  const r = await fetch(cfg.appsyncUrl, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": tokens.id },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`GraphQL ${r.status}`);
  if (j.errors) throw new Error(j.errors.map(e => e.message).join("; "));
  return j.data;
}

/* -------------------- UI wiring for /fan -------------------- */
function wireFan(cfg) {
  const who = $("#who-email");
  if (who && tokens.id) {
    const { email } = parseJwt(tokens.id) || {};
    if (email) who.textContent = email;
  }

  const signin = $("#signin");
  if (signin) signin.addEventListener("click", e => { e.preventDefault(); startLogin(cfg); });

  const so = $("#signout");
  if (so) so.addEventListener("click", e => { e.preventDefault(); logoutLocal(cfg); });

  const sog = $("#signout-global");
  if (sog) sog.addEventListener("click", e => { e.preventDefault(); logoutEverywhere(cfg); });

  const helloBtn = $("#btn-hello");
  if (helloBtn) helloBtn.addEventListener("click", async () => {
    setText("#hello-out", "Loading…");
    try { const d = await gql(cfg, "query Q{ hello }"); setText("#hello-out", String(d.hello ?? "(no response)")); }
    catch(e){ setText("#hello-out", "Error: " + e.message); }
  });

  const meBtn = $("#btn-load-me");
  if (meBtn) meBtn.addEventListener("click", async () => {
    setText("#me", "Loading…");
    try { const d = await gql(cfg, "query Me{ me { id email roles } }"); $("#me").textContent = JSON.stringify(d.me, null, 2); }
    catch(e){ setText("#me", "Error: " + e.message); }
  });

  const listBtn = $("#btn-list");
  if (listBtn) listBtn.addEventListener("click", async () => {
    setText("#closet-meta", "Loading…");
    try {
      if (!cfg._uploadsBase) throw new Error("uploadsApiUrl not configured");
      await ensureFreshToken(cfg);
      const r = await fetch(cfg._uploadsBase + "/list", { headers: { "Authorization": tokens.id } });
      if (!r.ok) throw new Error(`List failed (${r.status})`);
      const data = await r.json();
      const ul = $("#closet-list"); ul.innerHTML = "";
      (data.items || []).forEach(k => { const li = document.createElement("li"); li.textContent = k.key || k; ul.appendChild(li); });
      setText("#closet-meta", `${(data.items || []).length} file(s)`);
    } catch(e){ setText("#closet-meta", "Error: " + e.message); }
  });
}

/* -------------------- boot -------------------- */
(async () => {
  try {
    const cfg = await loadConfig();
    window.__cfg = cfg; // handy in DevTools
    await maybeHandleCallback(cfg); // handles /callback/ and returns to /fan/

    // If we're on any dashboard, wire it
    if ($("#signin") || $("#btn-hello") || $("#btn-load-me") || $("#btn-list") || $("#signout") || $("#signout-global")) {
      wireFan(cfg);
    }
  } catch (e) {
    console.error("Boot failed:", e);
    setText("#cb-msg", String(e.message || e));
  }
})();
