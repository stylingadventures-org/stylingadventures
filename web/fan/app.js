(function () {
  // ---------- tiny helpers ----------
  const q  = (s,r=document)=>r.querySelector(s);
  const h  = (html)=>{const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild;};
  const toast=(txt,type='info',ms=1800)=>{
    const wrap=(q('#toasts')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'toasts'})));
    const el=document.createElement('div');
    el.className=`toast ${type==='ok'?'ok':type==='error'?'err':''}`;
    el.textContent=txt; wrap.appendChild(el);
    setTimeout(()=>{el.style.opacity='0';},ms); setTimeout(()=>el.remove(),ms+240);
  };

  // jwt helpers
  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const sha256 = t => crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  const genVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
  const parseJwt = t=>{ try { return JSON.parse(atob((t||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; } };

  let cfg = null;
  let appsyncUrl = '';
  let uploadsApi = '';
  let cognitoDomain = '';
  let clientId = '';
  let logoutUri = '';
  let redirectUri = '';

  function setAuthUi(){
    const id = sessionStorage.getItem('id_token');
    const who = q('#who-email');
    if (who) {
      const p = parseJwt(id||'');
      who.textContent = id ? (p?.email || '(unknown)') : 'Not signed in';
    }
    const show = !!id;
    const si = q('#btn-signin'), lo = q('#btn-signout-local'), go=q('#btn-signout-global');
    if (si) si.style.display = show ? 'none' : '';
    if (lo) lo.style.display = show ? '' : 'none';
    if (go) go.style.display = show ? '' : 'none';
  }

  async function buildLoginUrl(){
    const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    sessionStorage.setItem('oauth_state', state);
    const verifier = genVerifier(); sessionStorage.setItem('pkce_verifier', verifier);
    const challenge = b64url(await sha256(verifier));
    const p = new URLSearchParams({
      response_type:'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope:'openid email profile',
      state,
      code_challenge: challenge,
      code_challenge_method:'S256'
    });
    return `${cognitoDomain}/oauth2/authorize?${p.toString()}`;
  }

  // ---------- actions ----------
  async function doHello(){
    const id = sessionStorage.getItem('id_token');
    if (!id) { toast('Please sign in','error'); return; }
    const r = await fetch(String(appsyncUrl||''), {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:id },
      body: JSON.stringify({ query: 'query{ hello }' })
    });
    const j = await r.json().catch(()=>({}));
    const out = q('#hello-out');
    if (!r.ok || j.errors) { if(out) out.textContent = String(j.errors?.[0]?.message || 'GraphQL error'); return; }
    if (out) out.textContent = JSON.stringify({ statusCode:r.status, body:j.data.hello }, null, 2);
  }

  async function loadMe(){
    const id = sessionStorage.getItem('id_token');
    if (!id) { toast('Please sign in','error'); return; }
    const r = await fetch(String(appsyncUrl||''), {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:id },
      body: JSON.stringify({ query:'{ me { id email role tier createdAt updatedAt } }' })
    });
    const j = await r.json().catch(()=>({}));
    const out = q('#me-out');
    if (!r.ok || j.errors) { if(out) out.textContent = String(j.errors?.[0]?.message || 'GraphQL error'); return; }
    if (out) out.textContent = JSON.stringify(j.data.me, null, 2);
  }

  async function uploadFile(){
    const id = sessionStorage.getItem('id_token');
    if (!id) { toast('Please sign in','error'); return; }
    if (!uploadsApi) { toast('Uploads API not configured','error'); return; }

    const file = q('#file')?.files?.[0];
    const msgEl = q('#up-msg');
    if (!file){ msgEl && (msgEl.textContent = 'Choose a file first.'); return; }

    const sub = parseJwt(id)?.sub;
    if (!sub){ toast('Missing sub in token','error'); return; }

    const hintEl = q('#keyhint');
    const key = (hintEl?.value?.trim()) || `users/${sub}/${file.name}`;

    try{
      msgEl && (msgEl.textContent = 'Requesting presign…');
      const presignUrl = `${uploadsApi}/presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type||'application/octet-stream')}`;
      const pr = await fetch(presignUrl, { headers: { Authorization:id }});
      const pj = await pr.json().catch(()=>({}));
      if (!pr.ok) throw new Error(pj?.message || 'Presign error');

      const putUrl = pj?.url || pj?.signedUrl || pj?.putUrl;
      if (!putUrl) throw new Error('No presigned URL in response');

      msgEl && (msgEl.textContent = 'Uploading…');
      const put = await fetch(putUrl, { method:'PUT', headers:{ 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      if (!put.ok) throw new Error(`Upload failed (${put.status})`);

      msgEl && (msgEl.textContent = `Uploaded to ${key}`);
      toast('Upload complete ✅','ok');
      await listMine();
    }catch(e){
      msgEl && (msgEl.textContent = String(e.message || e));
      toast(String(e.message || e),'error');
    }
  }

  async function listMine(){
    const id = sessionStorage.getItem('id_token');
    if (!id) { toast('Please sign in','error'); return; }
    if (!uploadsApi) { toast('Uploads API not configured','error'); return; }
    const sub = parseJwt(id)?.sub;
    if (!sub) { toast('Missing sub in token','error'); return; }

    const prefix = `users/${sub}/`;
    q('#list-out').textContent = 'Loading…';
    q('#list-ul').innerHTML = '';

    try {
      const url = `${uploadsApi}/list?prefix=${encodeURIComponent(prefix)}`;
      const r = await fetch(url, { headers: { Authorization:id }});
      const j = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(j?.message || 'List error');

      let raw = j?.items ?? j?.keys ?? j?.data ?? j?.Contents ?? j;
      if (!Array.isArray(raw)) raw = [];

      const keys = raw.map(it => {
        if (typeof it === 'string') return it;
        return it?.key ?? it?.Key ?? it?.name ?? it?.s3Key ?? it?.path ?? '';
      }).filter(Boolean);

      q('#list-out').textContent = `${keys.length} item(s)`;

      const base = (cfg.thumbsCdn || location.origin).replace(/\/+$/,'');
      for (const key of keys) {
        const ks = String(key);
        const enc = ks.split('/').map(encodeURIComponent).join('/');
        const li  = h(`<li><a class="sa-link" target="_blank" rel="noopener">${ks}</a></li>`);
        li.querySelector('a').href = `${base}/thumbs/${enc}`;
        q('#list-ul').appendChild(li);
      }
    } catch (e) {
      q('#list-out').textContent = String(e.message || e);
    }
  }

  // ---------- wire UI (plus fallback globals) ----------
  function wireHandlers(){
    q('#btn-hello')?.addEventListener('click', doHello);
    q('#btn-loadme')?.addEventListener('click', loadMe);
    q('#btn-upload')?.addEventListener('click', uploadFile);
    q('#btn-list')?.addEventListener('click', listMine);

    q('#btn-signin')?.addEventListener('click', async (e)=>{
      e.preventDefault();
      try { location.assign(await buildLoginUrl()); }
      catch(err){ toast(String(err?.message||err),'error'); }
    });
    q('#btn-signout-local')?.addEventListener('click', (e)=>{
      e.preventDefault();
      sessionStorage.clear(); setAuthUi(); toast('Signed out locally','ok');
    });
    q('#btn-signout-global')?.addEventListener('click', (e)=>{
      e.preventDefault();
      sessionStorage.clear(); setAuthUi();
      location.assign(`${cognitoDomain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`);
    });

    // fallback globals (in case the above doesn’t bind for any reason)
    window.saSignIn = async ()=>location.assign(await buildLoginUrl());
    window.saSignOutLocal  = ()=>{ sessionStorage.clear(); setAuthUi(); };
    window.saSignOutGlobal = ()=>{ sessionStorage.clear(); setAuthUi(); location.assign(`${cognitoDomain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`); };
  }

  // ---------- init ----------
  async function init(){
    try{
      const r = await fetch('/config.v2.json?ts=' + Date.now(), { cache:'no-store' });
      cfg = await r.json();

      const region        = cfg.region || 'us-east-1';
      const domain        = cfg.hostedUiDomain || cfg.domain;
      clientId            = cfg.clientId;
      redirectUri         = cfg.redirectUri || `${location.origin}/callback/`;
      logoutUri           = cfg.logoutUri   || `${location.origin}/`;
      cognitoDomain       = `https://${domain}.auth.${region}.amazoncognito.com`;
      appsyncUrl          = cfg.appsyncUrl || cfg.appSyncUrl || '';
      uploadsApi          = String(cfg.uploadsApiUrl || cfg.uploadsUrl || cfg.apiUrl || '').replace(/\/+$/,'');

      wireHandlers();
      setAuthUi();
    }catch(e){
      console.error('init error', e);
      toast('Config error: ' + (e.message||e),'error');
    }
  }

  // run once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
