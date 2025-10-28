export function decorateThumb(imgEl){
  if (!imgEl || imgEl.dataset._readyDecorated === '1') return;
  const parent = imgEl.parentNode;
  if (!parent.classList || !parent.classList.contains('sa-thumb-wrap')) {
    const wrap = document.createElement('span');
    wrap.className = 'sa-thumb-wrap';
    parent.insertBefore(wrap, imgEl);
    wrap.appendChild(imgEl);
  }
  const wrap = imgEl.parentNode;
  if (!wrap.querySelector('.sa-thumb-badge')){
    const badge = document.createElement('span');
    badge.className = 'sa-thumb-badge';
    badge.title = 'Thumbnail ready';
    badge.textContent = '✔';
    wrap.appendChild(badge);
  }
  imgEl.dataset._readyDecorated = '1';
  imgEl.classList.remove('sa-thumb-pulse');
  requestAnimationFrame(() => imgEl.classList.add('sa-thumb-pulse'));
}
