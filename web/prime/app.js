"use strict";

// ===== tiny helpers =====
const $ = (s, r=document) => r.querySelector(s);
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const sha256 = (t) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
const genVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const parseJwt = (t)=>{ try{ return JSON.parse(atob((t||"").split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))); }catch{return null;} };

// ===== config loader =====
async function loadCfg(){
  const r = await fetch("/config.v2.json?ts="+Date.now(), {cache:"no-store"});
  if(!r.ok) throw new Error("config.v2.json missing");
  return r.json();
}
const cfg = await loadCfg();

// ===== constants =====
const region   = cfg.region || "us-east-1";
const domain   = cfg.hostedUiDomain || cfg.domain;
const clientId = cfg.clientId;

const PROD_CF = "https://d1so4qr6zsby5r.cloudfront.net";
const isLocal = location.origin.startsWith("http://localhost:");
const EXPECTED_REDIRECT = isLocal ? "http://localhost:5173/callback/" : `${PROD_CF}/callback/`;
const EXPECTED_LOGOUT   = isLocal ? "http://localhost:5173/"          : `${PROD_CF}/`;

const cognitoDomain = `https://${domain}.auth.${region}.amazoncognito.com`;
const appsyncUrl    = (cfg.appSyncUrl || cfg.appsyncUrl || "").trim();

// ===== auth url (PKCE) – return target encoded in state =====
async function buildLoginUrl(){
  const state = "rt:/prime/|" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem("oauth_state", state);

  const verifier = genVerifier();
  sessionStorage.setItem("pkce_verifier", verifier);
  const challenge = b64url(await sha256(verifier));

  const p = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: EXPECTED_REDIRECT,
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  return `${cognitoDomain}/oauth2/authorize?${p.toString()}`;
}

// ===== handle code exchange if present =====
async function handleAuthCodeIfPresent(){
  const qs = new URLSearchParams(location.search);
  const code = qs.get("code");
  if(!code) return;

  const verifier = sessionStorage.getItem("pkce_verifier") || "";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: EXPECTED_REDIRECT,
    code_verifier: verifier,
    code
  });

  const resp = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
    body: body.toString()
  });
  const tok = await resp.json();
  if(!resp.ok){
    console.error("Token exchange failed", tok);
    alert("Sign-in failed. Please try again.");
    return;
  }
  if (tok.id_token)      sessionStorage.setItem("id_token", tok.id_token);
  if (tok.access_token)  sessionStorage.setItem("access_token", tok.access_token);
  if (tok.refresh_token) sessionStorage.setItem("refresh_token", tok.refresh_token);
  try{ if(tok.id_token) localStorage.setItem("sa_id_token", tok.id_token); }catch{}

  history.replaceState({}, "", "/prime/");
}

// ===== UI wiring =====
function setAuthUi(){
  const id = sessionStorage.getItem("id_token");
  $("#btn-login").style.display  = id ? "none" : "inline-block";
  $("#btn-logout").style.display = id ? "inline-block" : "none";
  $("#btn-logout-global").style.display = id ? "inline-block" : "none";
  const p = parseJwt(id || "");
  $("#auth-state").textContent = id ? (`Signed in as ${p?.email || "(no email)"}`) : "Signed out";
}

$("#btn-login").addEventListener("click", async (e)=>{
  e.preventDefault();
  const url = await buildLoginUrl();
  $("#auth-url").textContent = url;
  location.assign(url);
});
$("#btn-logout").addEventListener("click", (e)=>{
  e.preventDefault();
  sessionStorage.clear();
  setAuthUi();
});
$("#btn-logout-global").addEventListener("click", (e)=>{
  e.preventDefault();
  sessionStorage.clear();
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(EXPECTED_LOGOUT)}`;
  location.assign(url);
});

// ===== GraphQL helper =====
async function gql(query, variables={}){
  const id = sessionStorage.getItem("id_token");
  if(!id) throw new Error("Please sign in first");
  const r = await fetch(appsyncUrl, {
    method: "POST",
    headers: {"Content-Type":"application/json", "Authorization": id},
    body: JSON.stringify({query, variables})
  });
  const j = await r.json();
  if(!r.ok || j.errors) throw new Error((j.errors && j.errors[0]?.message) || "GraphQL error");
  return j.data;
}

// Buttons
$("#btn-hello").addEventListener("click", async ()=>{
  try{
    const d = await gql("query { hello }");
    $("#hello-out").textContent = d?.hello || "(no data)";
  }catch(e){ $("#hello-out").textContent = String(e.message||e); }
});
$("#btn-load-me").addEventListener("click", async ()=>{
  try{
    const d = await gql("query { me { id email role tier createdAt updatedAt } }");
    $("#me").textContent = JSON.stringify(d.me, null, 2);
  }catch(e){ $("#me").textContent = String(e.message||e); }
});

// startup
await handleAuthCodeIfPresent();
setAuthUi();
