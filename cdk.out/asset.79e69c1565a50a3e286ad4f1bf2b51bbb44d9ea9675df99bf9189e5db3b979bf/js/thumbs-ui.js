// web/js/thumbs-ui.js
// Shared thumbnail helpers for Fan/Creator/Admin pages.

let _cfg;
async function loadCfg() {
  if (_cfg) return _cfg;
  const r = await fetch('/config.v2.json?ts=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('config.v2.json missing');
  _cfg = await r.json();
  return _cfg;
}

export async function buildThumbUrl(key) {
  const cfg = await loadCfg();
  const base = (cfg.thumbsCdn || cfg.cdnUrl || cfg.webOrigin || location.origin).replace(/\/+$/, '');
  const jpg  = String(key || '').replace(/\.[^.]+$/, '.jpg');
  const enc  = jpg.split('/').map(encodeURIComponent).join('/');
  return `${base}/thumbs/${enc}`;
}

/**
 * Decorate an <img class="thumb" data-key="users/....png"> with its thumbnail,
 * and hide the image element if the key is missing.
 */
export async function decorateThumb(img) {
  const key = img?.dataset?.key || img?.getAttribute('data-key');
  if (!img || !key) { if (img) img.style.display = 'none'; return; }
  try {
    const url = await buildThumbUrl(key);
    img.src = url;
    img.alt = (img.alt || 'thumbnail');
    img.loading = 'lazy';
  } catch {
    img.style.display = 'none';
  }
}

/**
 * Renders a simple list of upload items (keys) into a container.
 * Each row shows: thumb • key • “open” • “delete”
 */
export async function renderUploadList(container, items, { onDelete } = {}) {
  if (!container) return;
  const keys = (items || []).map(it => typeof it === 'string' ? it : (it.key || it.Key || it.name)).filter(Boolean);

  if (!keys.length) {
    container.innerHTML = `<div class="mini sa-muted">No files found.</div>`;
    return;
  }

  const rows = await Promise.all(keys.map(async (k) => {
    const t = await buildThumbUrl(k);
    return `
      <div class="row upload-row" data-key="${k}">
        <img class="thumb" data-key="${k}" src="${t}" alt="thumb"
             style="width:56px;height:56px;object-fit:cover;border-radius:.5rem;margin-right:.5rem" />
        <div class="grow mini">${k}</div>
        <a class="sa-link" href="${t}" target="_blank" rel="noopener">open</a>
        <button class="sa-btn sa-btn-outline mini js-del" style="margin-left:.5rem">Delete</button>
      </div>
    `.trim();
  }));

  container.innerHTML = rows.join('');

  container.querySelectorAll('.js-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.upload-row');
      const key = row?.getAttribute('data-key');
      if (!key) return;
      onDelete?.(key);
    });
  });
}
