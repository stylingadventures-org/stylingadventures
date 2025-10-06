/** @ts-nocheck */
/* global React, ReactDOM */
const e = React.createElement;

function App() {
  // ---------- State ----------
  const [cfg, setCfg]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [error, setError]     = React.useState('');
  const [hello, setHello]     = React.useState('');
  const [list, setList]       = React.useState([]);
  const [uploadKey, setUploadKey] = React.useState('test.txt');

  // keep tokens in sessionStorage so refresh survives a single-tab nav
  const [tok, setTok] = React.useState(() => ({
    id:      sessionStorage.getItem('id_token') || '',
    access:  sessionStorage.getItem('access_token') || '',
    refresh: sessionStorage.getItem('refresh_token') || ''
  }));

  // ---------- Effects ----------
  React.useEffect(() => {
    // load /config.json once
    (async () => {
      try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        setCfg(await res.json());
      } catch (err) {
        setError('Failed to load config.json: ' + String(err));
      }
    })();
  }, []);

  // ---------- Auth helpers ----------
  async function sha256Base64Url(str) {
    const data = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  function randomString(len = 32) {
    const b = crypto.getRandomValues(new Uint8Array(len));
    return btoa(String.fromCharCode(...b)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  async function startLogin() {
    if (!cfg) return;
    const verifier  = randomString(32);
    const challenge = await sha256Base64Url(verifier);
    sessionStorage.setItem('pkce_verifier', verifier);

    const url = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/login`);
    url.searchParams.set('client_id', cfg.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('redirect_uri', cfg.redirectUri);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', challenge);

    location.href = url.toString();
  }

  function logout() {
    if (!cfg) return;
    // clear local tokens then bounce to Hosted UI logout
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    setTok({ id: '', access: '', refresh: '' });

    const u = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/logout`);
    u.searchParams.set('client_id', cfg.clientId);
    u.searchParams.set('logout_uri', cfg.logoutUri);
    location.href = u.toString();
  }

  // ---------- API calls ----------
  async function callHello() {
    if (!cfg || !tok.id) return;
    setBusy(true); setError(''); setHello('');
    try {
      const res = await fetch(cfg.appsyncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': tok.id
        },
        body: JSON.stringify({ query: '{ hello }' })
      });
      if (!res.ok) throw new Error('AppSync call failed: ' + res.status);
      const j = await res.json();
      setHello(j?.data?.hello ?? '');
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  // ---------- Uploads (yours; unchanged logic) ----------
  async function presignAndUpload() {
    setBusy(true); setError('');
    try {
      // presign
      const r = await fetch(cfg.uploadsUrl + 'presign', {
        method: 'POST',
        headers: { 'Authorization': tok.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: uploadKey, contentType: 'text/plain' })
      }).then(r => r.json());

      // PUT small content
      await fetch(r.url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'hello from the browser' });

      // list
      const lst = await fetch(cfg.uploadsUrl + 'list', { headers: { 'Authorization': tok.id } }).then(r => r.json());
      setList(lst.items || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  // ---------- UI ----------
  if (!cfg) {
    return e('div', { className: 'p-8' }, 'Loading config… ', error && e('span', { className: 'text-red-500' }, error));
  }

  const authed = !!tok.id;

  return e('div', { className: 'max-w-3xl mx-auto p-6 space-y-6' },
    e('header', { className: 'flex items-center justify-between' },
      e('h1', { className: 'text-2xl font-semibold' }, 'Styling Adventures'),
      authed
        ? e('button', { className: 'btn', onClick: logout }, 'Sign out')
        : e('button', { className: 'btn-primary', onClick: startLogin }, 'Sign in')
    ),

    e('section', { className: 'card' },
      e('h2', { className: 'card-title' }, 'Status'),
      e('p', null, authed ? 'You are signed in.' : 'You are signed out.'),
      authed && e('p', { className: 'text-xs text-zinc-500 break-all' }, 'ID token (prefix): ', tok.id.slice(0, 30), '…')
    ),

    authed && e('section', { className: 'card space-y-4' },
      e('h2', { className: 'card-title' }, 'AppSync hello'),
      e('div', { className: 'flex gap-3' },
        e('button', { className: 'btn', onClick: callHello, disabled: busy }, busy ? 'Calling…' : 'Call { hello }'),
        hello && e('code', { className: 'px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded' }, hello)
      )
    ),

    authed && e('section', { className: 'card space-y-4' },
      e('h2', { className: 'card-title' }, 'Uploads'),
      e('div', { className: 'flex items-center gap-2' },
        e('label', { className: 'text-sm' }, 'Key:'),
        e('input', { className: 'input', value: uploadKey, onChange: ev => setUploadKey(ev.target.value) }),
        e('button', { className: 'btn', onClick: presignAndUpload, disabled: busy }, busy ? 'Uploading…' : 'Upload + List')
      ),
      list.length > 0 && e('ul', { className: 'text-sm list-disc pl-5 space-y-1' }, list.map(k => e('li', { key: k }, k)))
    ),

    error && e('p', { className: 'text-sm text-red-500' }, String(error))
  );
}

// boot
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
