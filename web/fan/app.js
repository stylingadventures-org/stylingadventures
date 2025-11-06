"use strict";

/* ────────── tiny helpers ────────── */
function $(s, r){ return (r||document).querySelector(s); }
function b64url(buf){
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
    .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function sha256(text){ return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); }
function genVerifier(){ return b64url(crypto.getRandomValues(new Uint8Array(32))); }
function parseJwt(t){
  try {
    var part = (t||"").split(".")[1] || "";
    part = part.replace(/-/g,"+").replace(/_/g,"/");
    return JSON.parse(atob(part));
  } catch(e){ return null; }
}

/* ────────── config loader ────────── */
async function loadCfg(){
  var url = "/config.v2.json?ts=" + Date.now();
  var r = await fetch(url, { method: "GET", cache: "no-store" });
  if (!r.ok) throw new Error("config.v2.json missing");
  return r.json();
}
var cfg = await loadCfg();

/* ────────── constants & normalized URIs ────────── */
const pick = (...keys) => { for (const k of keys) if (cfg && cfg[k]) return cfg[k]; };

const region   = pick('region') || 'us-east-1';
const domain   = pick('hostedUiDomain','domain');   // Hosted UI domain prefix
const clientId = pick('clientId');

const PROD_CF = 'https://d1so4qr6zsby5r.cloudfront.net';
const isLocal = location.origin.startsWith('http://localhost:');
const EXPECTED_REDIRECT = isLocal ? 'http://localhost:5173/callback/' : `${PROD_CF}/callback/`;
const EXPECTED_LOGOUT   = isLocal ? 'http://localhost:5173/'          : `${PROD_CF}/`;

/* derived endpoints */
var cognitoDomain = "https://" + domain + ".auth." + region + ".amazoncognito.com";
var appsyncUrl    = String(pick('appSyncUrl','appsyncUrl') || "").trim();
var uploadsApi    = String(pick('uploadsApiUrl','uploadsUrl','apiUrl') || "").replace(/\/+$/,"");

/* ────────── PKCE login url (encode return target as state prefix) ────────── */
async function buildLoginUrl(){
  var state = "rt:/fan/|" + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem("oauth_state", state);

  var verifier = genVerifier();
  sessionStorage.setItem("pkce_verifier", verifier);
  var challenge = b64url(await sha256(verifier));

  var p = new URLSearchParams();
  p.set("response_type","code");
  p.set("client_id", String(clientId||""));
  // Always the normalized value we allow in Cognito
  p.set("redirect_uri", EXPECTED_REDIRECT);
  p.set("scope","openid email profile");
  p.set("state", state);
  p.set("code_challenge", challenge);
  p.set("code_challenge_method","S256");
  return cognitoDomain + "/oauth2/authorize?" + p.toString();
}

/* ────────── handle callback on /fan/?code=... ────────── */
async function handleAuthCodeIfPresent(){
  var qs = new URLSearchParams(location.search);
  var code = qs.get("code");
  if (!code) return;

  var verifier = sessionStorage.getItem("pkce_verifier") || "";
  var body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id",  String(clientId||""));
  // Must match the authorize request exactly
  body.set("redirect_uri", EXPECTED_REDIRECT);
  body.set("code_verifier", verifier);
  body.set("code", code);

  var resp = await fetch(cognitoDomain + "/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  var tok = await resp.json();
  if (!resp.ok) {
    console.error("Token exchange failed", tok);
    alert("Sign-in failed. Please try again.");
    return;
  }

  if (tok.id_token)      sessionStorage.setItem("id_token", tok.id_token);
  if (tok.access_token)  sessionStorage.setItem("access_token", tok.access_token);
  if (tok.refresh_token) sessionStorage.setItem("refresh_token", tok.refresh_token);

  // Mirror id token for role-aware nav helpers that read localStorage
  if (tok.id_token) try { localStorage.setItem("sa_id_token", tok.id_token); } catch(_){}

  // Extend role-aware nav
  addRoleLinksFromToken();

  // Clean the URL (remove ?code=...) and render
  history.replaceState({}, "", "/fan/");
}

/* ────────── UI wiring ────────── */
function setAuthUi(){
  var id = sessionStorage.getItem("id_token");
  $("#btn-login").style.display  = id ? "none" : "inline-block";
  $("#btn-logout").style.display = id ? "inline-block" : "none";
  $("#btn-logout-global").style.display = id ? "inline-block" : "none";
  var p = parseJwt(id || "");
  $("#auth-state").textContent = id ? ("Signed in as " + (p && p.email ? p.email : "(no email)")) : "Signed out";
}

$("#btn-login").addEventListener("click", async function(e){
  e.preventDefault();
  var url = await buildLoginUrl();
  $("#auth-url").textContent = url;
  location.assign(url);
});

$("#btn-logout").addEventListener("click", function(e){
  e.preventDefault();
  sessionStorage.clear();
  setAuthUi();
});

$("#btn-logout-global").addEventListener("click", function(e){
  e.preventDefault();
  sessionStorage.clear();
  var url = cognitoDomain + "/logout?client_id=" + encodeURIComponent(String(clientId||"")) +
            "&logout_uri=" + encodeURIComponent(EXPECTED_LOGOUT);
  location.assign(url);
});

/* ────────── GraphQL helper ────────── */
async function gql(query, variables){
  variables = variables || {};
  var id = sessionStorage.getItem("id_token");
  if (!id) throw new Error("Please sign in first");
  var r = await fetch(String(appsyncUrl||""), {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": id },
    body: JSON.stringify({ query: query, variables: variables })
  });
  var j = await r.json();
  if (!r.ok || j.errors) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || "GraphQL error");
  return j.data;
}

/* ────────── buttons ────────── */
$("#btn-hello").addEventListener("click", async function(){
  try {
    var d = await gql("query { hello }");
    $("#hello-out").textContent = (d && d.hello) || "(no data)";
  } catch (e) {
    $("#hello-out").textContent = String(e.message || e);
  }
});

$("#btn-load-me").addEventListener("click", async function(){
  try {
    var d = await gql("query { me { id email role tier createdAt updatedAt } }");
    $("#me").textContent = JSON.stringify(d.me, null, 2);
  } catch (e) {
    $("#me").textContent = String(e.message || e);
  }
});

$("#btn-list").addEventListener("click", async function(){
  $("#closet-meta").textContent = "Loading…";
  $("#closet-list").innerHTML = "";
  try {
    var id = sessionStorage.getItem("id_token");
    var r = await fetch(uploadsApi + "/list", { headers: { "Authorization": id }});
    if (!r.ok) throw new Error("Uploads list " + r.status);
    var data = await r.json();
    var items = Array.isArray(data) ? data : (data.items || data.keys || []);
    $("#closet-meta").textContent = String(items.length) + " item(s)";
    items.slice(0,25).forEach(function(it){
      var key = (typeof it === "string") ? it : it.key;
      var li = document.createElement("li");
      li.textContent = key;
      $("#closet-list").appendChild(li);
    });
  } catch(e) {
    $("#closet-meta").textContent = String(e.message || e);
  }
});

/* ────────── Role-aware nav extender (Creator/Admin links) ────────── */
function addRoleLinksFromToken() {
  const t = localStorage.getItem("sa_id_token");
  if (!t) return;
  let claims = {};
  try { claims = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch {}
  const groups = claims["cognito:groups"];
  const has = (name) => Array.isArray(groups) ? groups.includes(name) : String(groups || "").includes(name);

  const nav = document.querySelector("nav, .sa-nav, header") || document.body;

  if (has("CREATOR") && !document.querySelector('a[href="/creator/"]')) {
    const a = document.createElement("a");
    a.href = "/creator/"; a.textContent = "Creator dashboard"; a.style.marginLeft = "0.75rem";
    nav.appendChild(a);
  }

  if (has("ADMIN") && !document.querySelector('a[href="/admin/"]')) {
    const a = document.createElement("a");
    a.href = "/admin/"; a.textContent = "Admin dashboard"; a.style.marginLeft = "0.75rem";
    nav.appendChild(a);
  }
}

/* ────────── startup ────────── */
await handleAuthCodeIfPresent();
setAuthUi();

// Backfill sa_id_token from session if missing, then apply links
try {
  if (!localStorage.getItem("sa_id_token")) {
    const t = sessionStorage.getItem("id_token");
    if (t) localStorage.setItem("sa_id_token", t);
  }
} catch(_) {}
addRoleLinksFromToken();

