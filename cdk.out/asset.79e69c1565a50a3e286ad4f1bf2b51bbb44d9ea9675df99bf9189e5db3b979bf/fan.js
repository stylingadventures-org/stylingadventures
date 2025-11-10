// Fan dashboard wiring — waits for SA to be ready
(function () {
  function $(s, r = document) { return r.querySelector(s); }
  function $$(s, r = document) { return Array.from(r.querySelectorAll(s)); }
  const byText = (tag, text) =>
    Array.from(document.getElementsByTagName(tag)).find(
      (el) => (el.textContent || '').trim().toLowerCase() === text.toLowerCase()
    );
  const setPre = (sel, val) => {
    const el = $(sel) || document.createElement('pre');
    if (!el.parentNode) document.body.appendChild(el);
    el.textContent = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  async function wire() {
    const SA = await window.SAReady;

    byText('button','Call { hello }')?.addEventListener('click', async () => {
      try {
        const data = await SA.gql(`query { hello }`);
        setPre('.fan-hello', { statusCode: 200, body: data.hello + ' 👋' });
      } catch (e) { alert(e.message || e); }
    });

    byText('button','Load Profile')?.addEventListener('click', async () => {
      try {
        const data = await SA.gql(`query { profile { id email role tier } }`);
        setPre('.fan-profile', data.profile);
      } catch (e) { alert(e.message || e); }
    });

    byText('button','List my files')?.addEventListener('click', async () => {
      try {
        const rest = await fetch('/list').then(r => r.ok ? r.json() : null).catch(()=>null);
        const files = rest?.files || (await SA.gql(`query { listFiles }`)).listFiles || [];
        setPre('.fan-files', files.map(f=>`• ${f}`).join('\n') || '(no files)');
      } catch (e) { alert(e.message || e); }
    });
  }

  if (window.SAReady) wire();
  else {
    console.warn('SA (from app.js) not loaded');
    window.addEventListener('sa:ready', wire, { once: true });
  }
})();
