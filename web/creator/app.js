// web/creator/app.js
// Creator dashboard: list items, request approval, edit media key,
// show thumbnail preview, and delete media file from S3 (Uploads API).

import { ensureToken, enableFocusTopUp, scheduleRotation } from '/auth/refresh.js';

const q  = (s,r=document)=>r.querySelector(s);
const qq = (s,r=document)=>Array.from(r.querySelectorAll(s));
const h  = (html)=>{ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };
const toast=(txt,type='info',ms=1800)=>{ let w=q('#toasts'); if(!w){w=document.createElement('div');w.id='toasts';document.body.appendChild(w);} const el=document.createElement('div'); el.className=`toast ${type==='ok'?'ok':type==='error'?'err':''}`; el.textContent=txt; w.appendChild(el); setTimeout(()=>{el.style.opacity='0';},ms); setTimeout(()=>el.remove(),ms+240); };

async function loadCfg(){ const r=await fetch('/config.v2.json?ts='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error('config missing'); return r.json(); }
const cfg = await loadCfg();

const domain = `https://${(cfg.domain||cfg.hostedUiDomain)}.auth.${cfg.region}.amazoncognito.com`;
sessionStorage.setItem('oauth_domain', domain);
sessionStorage.setItem('oauth_clientId', String(cfg.clientId));
enableFocusTopUp({ domain, clientId: cfg.clientId });
scheduleRotation({}, { domain, clientId: cfg.clientId });

async function idToken(){ return ensureToken({ domain, clientId: cfg.clientId }); }
async function gql(query, variables={}){
  const id = await idToken();
  const r = await fetch(cfg.appsyncUrl, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:id },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error((j.errors && j.errors[0]?.message) || 'GraphQL error');
  return j.data;
}
async function uploads(method, path, body, isJson=true){
  const id = await idToken();
  const init = { method, headers:{ Authorization:id } };
  if (isJson && body){ init.headers['Content-Type']='application/json'; init.body=JSON.stringify(body); }
  const r = await fetch(cfg.uploadsApiBase + path, init);
  if(!r.ok) throw new Error(`${method} ${path} failed`);
  return isJson ? r.json() : r.text();
}

/* ---------- UI helpers ---------- */
const pretty = iso=> iso? new Date(iso).toLocaleString() : '—';

function mediaCell(it){
  if (!it.mediaKey) return `<span class="mini">—</span>`;
  const key = it.mediaKey;
  const thumb = `/thumbs/${key}`;
  // NOTE: the <img> auto-hides if thumb not generated yet
  return `
    <div class="flex items-center gap-2">
      <img src="${thumb}" width="54" height="54" alt="" style="border-radius:.5rem;object-fit:cover;display:none"
           onload="this.style.display='inline-block'" onerror="this.style.display='none'"/>
      <a href="/${key}" target="_blank" class="linklike">${key}</a>
      <button class="sa-btn-sm js-del-media" data-key="${key}" data-id="${it.id}">Delete file</button>
    </div>
  `;
}

function renderRows(items){
  const tbody = q('#items-body');
  const note  = q('#items-note');
  tbody.innerHTML='';
  if (!items?.length){ note.textContent='0 item(s)'; tbody.innerHTML=`<tr><td colspan="5" class="mini">No items</td></tr>`; return; }
  note.textContent=`${items.length} item(s)`;

  for (const it of items){
    const row = h(`
      <tr data-id="${it.id}">
        <td>${String(it.title||'').replace(/</g,'&lt;')}</td>
        <td>${String(it.status)}</td>
        <td class="mini">${pretty(it.updatedAt)}</td>
        <td>${mediaCell(it)}</td>
        <td class="mini">
          <button class="sa-btn-sm js-req">Request approval</button>
          <button class="sa-btn-sm js-edit">Edit key</button>
          <button class="sa-btn-sm js-copy">Copy ID</button>
        </td>
      </tr>
    `);
    tbody.appendChild(row);

    // actions
    row.querySelector('.js-req')?.addEventListener('click', async ()=>{
      try{ await gql(`mutation R($id:ID!){ requestClosetApproval(id:$id) }`, { id: it.id }); toast('Requested','ok'); await reloadItems(); }
      catch(e){ toast(String(e),'error'); }
    });
    row.querySelector('.js-edit')?.addEventListener('click', async ()=>{
      const k = prompt('New media key (e.g. users/{sub}/file.jpg)', it.mediaKey||'');
      if (k==null) return;
      try{ await gql(`mutation U($id:ID!,$k:String!){ updateClosetMediaKey(id:$id,mediaKey:$k){ id mediaKey updatedAt } }`, { id: it.id, k }); toast('Updated','ok'); await reloadItems(); }
      catch(e){ toast(String(e),'error'); }
    });
    row.querySelector('.js-copy')?.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(it.id); toast('Copied','ok'); }catch{}
    });
    row.querySelector('.js-del-media')?.addEventListener('click', async (ev)=>{
      const key = ev.currentTarget.getAttribute('data-key');
      if (!confirm(`Delete ${key}?`)) return;
      try{
        await uploads('DELETE', '/delete?key='+encodeURIComponent(key));
        toast('Deleted file','ok');
        // optional: clear mediaKey after delete
        await gql(`mutation U($id:ID!,$k:String!){ updateClosetMediaKey(id:$id,mediaKey:$k){ id mediaKey updatedAt } }`, { id: it.id, k: "" });
        await reloadItems();
      }catch(e){ toast(String(e),'error'); }
    });
  }
}

/* ---------- Data loaders ---------- */
async function reloadItems(){
  const out=q('#items-note'); out.textContent='Loading…';
  try{
    const d = await gql(`query { myCloset { id title status mediaKey updatedAt } }`);
    renderRows(d.myCloset||[]);
  }catch(e){
    out.textContent=String(e); renderRows([]);
  }
}
q('#btn-reload')?.addEventListener('click', (e)=>{ e.preventDefault(); reloadItems(); });

/* ---------- Create new item ---------- */
q('#btn-create')?.addEventListener('click', async ()=>{
  const title = q('#title')?.value?.trim();
  const key   = q('#media-key')?.value?.trim();
  try{
    await gql(`mutation C($t:String,$k:String){ createClosetItem(title:$t,mediaKey:$k){ id } }`, { t:title||null, k:key||null });
    toast('Created','ok'); q('#title').value=''; q('#media-key').value=''; await reloadItems();
  }catch(e){ toast(String(e),'error'); }
});

// Init
reloadItems();
