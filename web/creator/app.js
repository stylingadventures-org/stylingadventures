// web/creator/app.js
import { decorateThumb } from '/js/thumbs-ui.js';

const q  = (s,r=document)=>r.querySelector(s);
const qq = (s,r=document)=>Array.from(r.querySelectorAll(s));
const h  = (html)=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild;};
const toast = (txt,type='info',ms=1800)=>{
  const wrap=q('#toasts'); const el=document.createElement('div');
  el.className=`toast ${type==='ok'?'ok':type==='error'?'err':''}`; el.textContent=txt;
  wrap.appendChild(el); setTimeout(()=>{el.style.opacity='0';},ms); setTimeout(()=>el.remove(),ms+240);
};

async function loadCfg(){
  const r=await fetch('/config.v2.json?ts='+Date.now(),{cache:'no-store'});
  if(!r.ok) throw new Error('config.v2.json missing');
  return r.json();
}
const cfg = await loadCfg();
const domain = `https://${(cfg.domain||cfg.hostedUiDomain)}.auth.${cfg.region}.amazoncognito.com`;
const redirectUri = cfg.redirectUri;
const logoutUri   = cfg.logoutUri;
const appsyncUrl  = cfg.appsyncUrl;
const uploadsApi  = (cfg.uploadsApiUrl||cfg.uploadsUrl||cfg.apiUrl||'').replace(/\/+$/,'');

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const sha256 = t => crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
const genVerifier = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const parseJwt = t=>{try{return JSON.parse(atob((t||'').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return null;}};

async function buildLoginUrl(){
  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem('oauth_state',state);
  const verifier=genVerifier(); sessionStorage.setItem('pkce_verifier',verifier);
  const challenge=b64url(await sha256(verifier));
  const p=new URLSearchParams({
    response_type:'code', client_id:cfg.clientId, redirect_uri:redirectUri,
    scope:'openid email profile', state, code_challenge:challenge, code_challenge_method:'S256'
  });
  return `${domain}/oauth2/authorize?${p.toString()}`;
}

function setAuthUi(){
  const id=sessionStorage.getItem('id_token');
  q('#signin').style.display = id?'none':'inline';
  q('#signout').style.display = id?'inline-block':'none';
  q('#signout-global').style.display = id?'inline-block':'none';
  const p=parseJwt(id||'');
  q('#who-email').textContent = id?(p?.email||'(no email)'):'Not signed in';
}
q('#signin').addEventListener('click', async (e)=>{ e.preventDefault(); location.assign(await buildLoginUrl()); });
q('#signout').addEventListener('click', (e)=>{ e.preventDefault(); sessionStorage.clear(); setAuthUi(); });
q('#signout-global').addEventListener('click', (e)=>{
  e.preventDefault(); sessionStorage.clear();
  const url = `${domain}/logout?client_id=${encodeURIComponent(cfg.clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`;
  location.assign(url);
});

async function gql(query, variables={}){
  const id=sessionStorage.getItem('id_token');
  if(!id) throw new Error('Please sign in first');
  const r=await fetch(appsyncUrl,{method:'POST',headers:{'Content-Type':'application/json',Authorization:id},body:JSON.stringify({query,variables})});
  const j=await r.json(); if(!r.ok||j.errors) throw new Error((j.errors && j.errors[0]?.message)||'GraphQL error');
  return j.data;
}

const prettyDate = iso => new Date(iso).toLocaleString();
const statusPill = s=>{
  const st=String(s||'').toUpperCase();
  const cls=st==='APPROVED'?'approved':st==='REJECTED'?'rejected':st==='PUBLISHED'?'published':'pending';
  return `<span class="pill ${cls}">${st||'PENDING'}</span>`;
};

function getThumbsBase(){
  return (cfg.thumbsCdn || cfg.cdnUrl || cfg.webOrigin || location.origin).replace(/\/+$/,'');
}
function buildThumbUrl(key){
  const base=getThumbsBase();
  const jpg=String(key).replace(/\.[^.]+$/,'.jpg');
  const enc=jpg.split('/').map(encodeURIComponent).join('/');
  return `${base}/thumbs/${enc}`;
}

function renderRows(items){
  const tb=q('#body');
  if(!items?.length){ tb.innerHTML=`<tr><td colspan="5" class="mini">No data</td></tr>`; return; }
  tb.innerHTML='';
  for(const it of items){
    const media = it.mediaKey ? `<a class="sa-link" href="${buildThumbUrl(it.mediaKey)}" target="_blank" rel="noopener">open</a><div class="mini">${it.mediaKey}</div>` : '<span class="mini">—</span>';
    const row=h(`
      <tr data-id="${it.id}">
        <td>${(it.title||'').replace(/</g,'&lt;')}</td>
        <td>${statusPill(it.status)}</td>
        <td class="mini">${prettyDate(it.updatedAt||it.createdAt)}</td>
        <td>${media}</td>
        <td>
          <button class="linklike js-request">Request approval</button>
          <button class="linklike js-edit">Edit key</button>
          <button class="linklike js-copy">Copy ID</button>
        </td>
      </tr>
    `);
    q('#body').appendChild(row);
  }
  bindRowEvents(items);
}

function bindRowEvents(items){
  qq('tr[data-id]').forEach(tr=>{
    const id=tr.getAttribute('data-id');
    tr.querySelector('.js-copy')?.addEventListener('click', async ()=>{
      await navigator.clipboard.writeText(id); toast('Copied ID ✅','ok',1200);
    });
    tr.querySelector('.js-edit')?.addEventListener('click', async ()=>{
      const item=items.find(x=>x.id===id);
      const cur=item?.mediaKey||'';
      const key=prompt('New S3 key (from Uploads):', cur);
      if(key==null) return;
      try{
        await gql(`mutation U($id:ID!,$key:String!){ updateClosetMediaKey(id:$id,key:$key) }`,{id,key});
        toast('Updated media key','ok'); await reloadMine();
      }catch(e){ toast(String(e),'error'); }
    });
    tr.querySelector('.js-request')?.addEventListener('click', async ()=>{
      try{ await gql(`mutation R($id:ID!){ requestClosetApproval(id:$id) }`,{id}); toast('Requested approval 🚀','ok'); }
      catch(e){ toast(String(e),'error'); }
    });
  });
}

async function reloadMine(){
  q('#out').textContent='';
  try{
    const d=await gql(`query { myCloset { id title status mediaKey createdAt updatedAt } }`);
    renderRows(d.myCloset||[]);
  }catch(e){
    q('#out').textContent=String(e);
    renderRows([]);
  }
}
q('#btn-reload').addEventListener('click', e=>{ e.preventDefault(); reloadMine(); });

q('#btn-create').addEventListener('click', async e=>{
  e.preventDefault();
  const title=(q('#title').value||'').trim();
  const media=(q('#media').value||'').trim();
  if(!title){ toast('Please enter a title','error'); return; }
  try{
    const d=await gql(`mutation C($input:CreateClosetItemInput!){
      createClosetItem(input:$input){ id title status mediaKey createdAt updatedAt }
    }`,{ input:{ title, mediaKey: media || null }});
    toast('Created ✅','ok');
    q('#title').value=''; // keep media for next item
    await reloadMine();
  }catch(e){ toast(String(e),'error'); }
});

// initial
setAuthUi();
if(sessionStorage.getItem('id_token')) reloadMine();
