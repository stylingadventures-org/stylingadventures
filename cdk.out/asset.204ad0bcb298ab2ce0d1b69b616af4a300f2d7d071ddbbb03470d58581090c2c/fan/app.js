@'
/* Fan Dashboard bootstrap */
async function loadCfg(){
  const r = await fetch("/config.v2.json?ts="+Date.now(), { cache:"no-store" });
  if(!r.ok) throw new Error("config.v2.json missing");
  return r.json();
}
const cfg = await loadCfg();
const domain = `https://${(cfg.domain||cfg.hostedUiDomain)}.auth.${cfg.region}.amazoncognito.com`;
const redirectUri = cfg.redirectUri;
const logoutUri   = cfg.logoutUri;
const appsyncUrl  = cfg.appsyncUrl;
const uploadsApi  = (cfg.uploadsApiUrl||cfg.uploadsUrl||cfg.apiUrl||"").replace(/\/+$/,"");

const q = (s,r=document)=>r.querySelector(s);
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const sha256 = txt => crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
const genVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const parseJwt = t => { try{ return JSON.parse(atob((t||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return null;} };

async function buildLoginUrl(){
  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem('oauth_state', state);
  const verifier = genVerifier();
  sessionStorage.setItem('pkce_verifier', verifier);
  const challenge = b64url(await sha256(verifier));
  const p = new URLSearchParams({
    response_type:'code', client_id: cfg.clientId, redirect_uri: redirectUri,
    scope:'openid email profile', state, code_challenge: challenge, code_challenge_method:'S256'
  });
  return `${domain}/oauth2/authorize?${p.toString()}`;
}

function setAuthUi(){
  const id = sessionStorage.getItem('id_token');
  q('#btn-login').style.display  = id ? 'none' : 'inline-block';
  q('#btn-logout').style.display = id ? 'inline-block' : 'none';
  q('#btn-logout-global').style.display = id ? 'inline-block' : 'none';
  const p = parseJwt(id||'');
  q('#auth-state').textContent = id ? `Signed in as ${p?.email||'(no email)'}` : 'Signed out';
}

q('#btn-login').addEventListener('click', async (e) => {
  e.preventDefault();
  const url = await buildLoginUrl();
  q('#auth-url').textContent = url;
  location.assign(url);
});
q('#btn-logout').addEventListener('click', (e) => { e.preventDefault(); sessionStorage.clear(); setAuthUi(); });
q('#btn-logout-global').addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.clear();
  const url = `${domain}/logout?client_id=${encodeURIComponent(cfg.clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`;
  location.assign(url);
});

async function gql(query, variables={}){
  const id = sessionStorage.getItem('id_token');
  if (!id) throw new Error('Please sign in first');
  const r = await fetch(appsyncUrl, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization: id },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error(j.errors?.[0]?.message || 'GraphQL error');
  return j.data;
}

q('#btn-hello').addEventListener('click', async () => {
  try {
    const d = await gql('query { hello }');
    q('#hello-out').textContent = d.hello ?? '(no data)';
  } catch (e) {
    q('#hello-out').textContent = String(e);
  }
});

q('#btn-load-me').addEventListener('click', async () => {
  try {
    const d = await gql('query { me { id email role tier createdAt updatedAt } }');
    q('#me').textContent = JSON.stringify(d.me, null, 2);
  } catch (e) {
    q('#me').textContent = String(e);
  }
});

q('#btn-list').addEventListener('click', async () => {
  q('#closet-meta').textContent = 'Loading…';
  q('#closet-list').innerHTML = '';
  try {
    const id = sessionStorage.getItem('id_token');
    const r = await fetch(`${uploadsApi}/list`, { headers: { Authorization: id }});
    if (!r.ok) throw new Error(`Uploads list ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.items ?? data.keys ?? []);
    q('#closet-meta').textContent = `${items.length} item(s)`;
    items.slice(0,25).forEach(it => {
      const key = typeof it === 'string' ? it : it.key;
      const li = document.createElement('li'); li.textContent = key;
      q('#closet-list').appendChild(li);
    });
  } catch(e) {
    q('#closet-meta').textContent = String(e);
  }
});

setAuthUi();
'@ | Set-Content -Path web\fan\app.js -Encoding UTF8
