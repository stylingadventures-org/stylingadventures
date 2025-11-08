// web/admin/app.js
// Admin pending queue + approve/reject, using config.v2.json and Cognito Hosted UI.

const q  = (s,r=document)=>r.querySelector(s);
const qq = (s,r=document)=>Array.from(r.querySelectorAll(s));
const h  = (html)=>{ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };

const parseJwt = t=>{ try { return JSON.parse(atob((t||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; } };
const b64url   = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const sha256   = t => crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
const genVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

async function loadCfg(){
  const r = await fetch('/config.v2.json?ts='+Date.now(), { cache:'no-store' });
  if(!r.ok) throw new Error('config.v2.json missing');
  return r.json();
}
const cfg = await loadCfg();

const region   = cfg.region || 'us-east-1';
const domain   = cfg.hostedUiDomain || cfg.domain;
const clientId = cfg.clientId;
const redirect = cfg.redirectUri;
const logout   = cfg.logoutUri;
const appsync  = cfg.appsyncUrl;

// ===== Auth helpers (same pattern as fan/creator) =====
const cognitoDomain = `https://${domain}.auth.${region}.amazoncognito.com`;

async function buildLoginUrl(){
  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem('oauth_state', state);
  const verifier  = genVerifier();
  sessionStorage.setItem('pkce_verifier', verifier);
  const challenge = b64url(await sha256(verifier));
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: String(clientId||''),
    redirect_uri: String(redirect||''),
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  });
  return `${cognitoDomain}/oauth2/authorize?${p.toString()}`;
}

function setAuthUi(){
  const id = sessionStorage.getItem('id_token');
  const who = q('#who');
  const signIn  = q('#signin');
  const signOut = q('#signout');
  const signAll = q('#signout-global');
  const claims  = parseJwt(id||'') || {};
  who.textContent = id ? `Signed in as ${claims.email || '(unknown)'}` : 'Not signed in';
  signIn.style.display  = id ? 'none' : 'inline-block';
  signOut.style.display = id ? 'inline-block' : 'none';
  signAll.style.display = id ? 'inline-block' : 'none';

  const groups = claims['cognito:groups'];
  const roles  = Array.isArray(groups) ? groups.join(', ') : (groups || '(none)');
  q('#role-msg').textContent = id ? `Roles: ${roles}` : '';
}

q('#signin')?.addEventListener('click', async (e)=>{
  e.preventDefault();
  location.assign(await buildLoginUrl());
});
q('#signout')?.addEventListener('click', (e)=>{
  e.preventDefault();
  sessionStorage.clear();
  setAuthUi();
});
q('#signout-global')?.addEventListener('click', (e)=>{
  e.preventDefault();
  sessionStorage.clear();
  setAuthUi();
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(String(clientId||''))}&logout_uri=${encodeURIComponent(String(logout||''))}`;
  location.assign(url);
});

// ===== GraphQL helper =====
async function gql(query, variables={}){
  const id = sessionStorage.getItem('id_token');
  if (!id) throw new Error('Please sign in first');
  const r = await fetch(String(appsync||''), {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization: id },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error((j.errors && j.errors[0]?.message) || 'GraphQL error');
  return j.data;
}

const prettyDate = iso => iso ? new Date(iso).toLocaleString() : '—';

function renderRows(items){
  const tb = q('#pending-body');
  const note = q('#pending-out');
  if (!items?.length){
    tb.innerHTML = `<tr><td colspan="5" class="mini">No data</td></tr>`;
    if (note) note.textContent = '0 item(s)';
    return;
  }
  if (note) note.textContent = `${items.length} item(s)`;

  tb.innerHTML = '';
  for (const it of items){
    const tr = h(`
      <tr data-id="${it.id}">
        <td>${String(it.title||'(untitled)').replace(/</g,'&lt;')}</td>
        <td>${String(it.status||'PENDING')}</td>
        <td class="mini">${prettyDate(it.updatedAt || it.createdAt)}</td>
        <td class="mini">${String(it.ownerId || it.owner || '—').replace(/</g,'&lt;')}</td>
        <td>
          <button class="linklike js-approve">Approve</button>
          <button class="linklike js-reject">Reject</button>
        </td>
      </tr>
    `);
    q('#pending-body').appendChild(tr);
  }

  // bind actions
  qq('#pending-body tr[data-id]').forEach(tr=>{
    const id = tr.getAttribute('data-id');
    tr.querySelector('.js-approve')?.addEventListener('click', async ()=>{
      try { await gql(`mutation($id:ID!){ adminApproveItem(id:$id){id status} }`, { id }); await reload(); }
      catch(e){ alert(String(e)); }
    });
    tr.querySelector('.js-reject')?.addEventListener('click', async ()=>{
      try { await gql(`mutation($id:ID!){ adminRejectItem(id:$id){id status} }`, { id }); await reload(); }
      catch(e){ alert(String(e)); }
    });
  });
}

async function reload(){
  const note = q('#pending-out');
  if (note) note.textContent = 'Loading…';
  try{
    const d = await gql(`query { adminListPending { id title status createdAt updatedAt ownerId owner } }`);
    renderRows(d.adminListPending || []);
  }catch(e){
    if (note) note.textContent = String(e);
    renderRows([]);
  }
}

q('#btn-reload')?.addEventListener('click', (e)=>{ e.preventDefault(); reload(); });

// boot
setAuthUi();
if (sessionStorage.getItem('id_token')) reload();
