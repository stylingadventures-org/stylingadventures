/* app.js - Styling Adventures (no build tools) */

/* ---------- tiny helpers ---------- */
const loadScript = (src) =>
  new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

async function ensureReact() {
  if (window.React && window.ReactDOM) return;
  await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
}
const e = (...args) => React.createElement(...args);

/* crypto utilities (PKCE) */
const b64url = (u8) =>
  btoa(String.fromCharCode(...u8)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const randomStr = (len = 32) => b64url(crypto.getRandomValues(new Uint8Array(len)));
async function sha256B64Url(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(digest));
}

/* base64url decode (JWT payload) */
function decodeJwt(jwt) {
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = atob(normalized);
    return JSON.parse(json);
  } catch { return null; }
}

/* token storage */
const tokens = {
  get id()      { return sessionStorage.getItem('id_token') || ''; },
  get access()  { return sessionStorage.getItem('access_token') || ''; },
  get refresh() { return sessionStorage.getItem('refresh_token') || ''; },
  setAll(t) {
    if (t.id_token)     sessionStorage.setItem('id_token', t.id_token);
    if (t.access_token) sessionStorage.setItem('access_token', t.access_token);
    if (t.refresh_token)sessionStorage.setItem('refresh_token', t.refresh_token);
  },
  clear() {
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  }
};

/* ---------- React App ---------- */
function App() {
  const [cfg, setCfg]           = React.useState(null);
  const [busy, setBusy]         = React.useState(false);
  const [error, setError]       = React.useState('');
  const [hello, setHello]       = React.useState('');
  const [uploadKey, setKey]     = React.useState('test.txt');
  const [list, setList]         = React.useState([]);
  const [claims, setClaims]     = React.useState(() => decodeJwt(tokens.id));
  const [now, setNow]           = React.useState(() => Math.floor(Date.now() / 1000));

  const authed = !!tokens.id;

  /* load config.json once */
  React.useEffect(() => {
    (async () => {
      try {
        const c = await (await fetch('/config.json', { cache: 'no-store' })).json();
        setCfg(c);
      } catch (err) {
        setError('Failed to load config.json: ' + err);
      }
    })();
  }, []);

  /* tick every 15s to update the “expires in” display */
  React.useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => clearInterval(t);
  }, []);

  /* whenever id token changes, re-decode claims */
  React.useEffect(() => {
    setClaims(decodeJwt(tokens.id));
  }, [tokens.id]);

  /* auto-refresh with refresh_token when ID token is close to expiring */
  React.useEffect(() => {
    if (!cfg) return;
    if (!tokens.refresh) return;
    if (!claims?.exp) return;

    let cancelled = false;
    const refreshIfNeeded = async () => {
      const secondsLeft = claims.exp - Math.floor(Date.now() / 1000);
      // refresh ~60s before expiry
      if (secondsLeft <= 60) {
        try {
          const url = `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`;
          const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: cfg.clientId,
            refresh_token: tokens.refresh
          });
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          });
          if (!res.ok) throw new Error('Refresh failed');
          const t = await res.json();
          if (cancelled) return;
          tokens.setAll(t);
          setClaims(decodeJwt(t.id_token || tokens.id));
        } catch (err) {
          // soft-fail to signed out state
          console.warn(err);
          if (!cancelled) setError('Session refresh failed. Please sign in again.');
        }
      }
    };

    const check = setInterval(refreshIfNeeded, 20_000);
    return () => { cancelled = true; clearInterval(check); };
  }, [cfg, claims?.exp]);

  async function startLogin() {
    try {
      if (!cfg) throw new Error('App not ready (no config).');
      setError('');
      const verifier  = randomStr(32);
      const challenge = await sha256B64Url(verifier);
      sessionStorage.setItem('pkce_verifier', verifier);

      const url = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/login`);
      url.searchParams.set('client_id', cfg.clientId);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('redirect_uri', cfg.redirectUri);
      url.searchParams.set('code_challenge_method', 'S256');
      url.searchParams.set('code_challenge', challenge);
      location.href = url.toString();
    } catch (err) {
      setError(String(err));
    }
  }

  function logout() {
    tokens.clear(); // flip UI immediately
    if (!cfg) return;
    const url = new URL(`https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/logout`);
    url.searchParams.set('client_id', cfg.clientId);
    url.searchParams.set('logout_uri', cfg.logoutUri);
    location.href = url.toString();
  }

  async function callHello() {
    setBusy(true); setError(''); setHello('');
    try {
      const body = { query: '{ hello }' };
      const res  = await fetch(cfg.appsyncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': tokens.id },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      setHello(json.data.hello);
    } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  async function presignAndUpload() {
    setBusy(true); setError('');
    try {
      // presign
      const pre = await fetch(cfg.uploadsUrl + 'presign', {
        method: 'POST',
        headers: { 'Authorization': tokens.id, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: uploadKey, contentType: 'text/plain' })
      }).then(r => r.json());

      // upload small text
      await fetch(pre.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: 'hello from the browser'
      });

      // list
      const lst = await fetch(cfg.uploadsUrl + 'list', {
        headers: { 'Authorization': tokens.id }
      }).then(r => r.json());
      setList(lst.items || []);
    } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }

  if (!cfg) {
    return e('div', { className: 'p-8 text-sm text-zinc-600' },
      'Loading config… ',
      error && e('span', { className: 'text-red-500' }, String(error))
    );
  }

  const secondsLeft = claims?.exp ? Math.max(0, claims.exp - now) : null;
  const email = claims?.email;
  const sub   = claims?.sub;
  const name  = claims?.name || claims?.given_name || claims?.cognito_username;

  return e('div', { className: 'max-w-3xl mx-auto p-6 space-y-6' },

    /* Header */
    e('header', { className: 'flex items-center justify-between' },
      e('h1', { className: 'text-2xl font-semibold' }, 'Styling Adventures'),
      authed
        ? e('button', { className: 'btn', onClick: logout }, 'Sign out')
        : e('button', { className: 'btn-primary', onClick: startLogin }, 'Sign in')
    ),

    /* Status */
    e('section', { className: 'card space-y-2' },
      e('h2', { className: 'card-title' }, 'Status'),
      !authed && e('p', null, 'You are signed out.'),
      authed && e('div', { className: 'space-y-1 text-sm text-zinc-700 dark:text-zinc-300' }, [
        e('div', { key: 'signed' }, 'You are signed in.'),
        e('div', { key: 'prefix', className: 'break-all text-xs' },
          'ID token (prefix): ', tokens.id.slice(0, 30), '…'
        ),
        (email || name || sub) && e('div', { key: 'who', className: 'mt-2' },
          e('strong', null, 'Signed-in user: '),
          e('div', null, name || '(no name)'),
          email && e('div', { className: 'opacity-80' }, email),
          sub && e('div', { className: 'opacity-60 text-xs' }, 'id: ', sub)
        ),
        secondsLeft != null && e('div', { key: 'exp', className: 'opacity-70 text-xs' },
          `Token expires in ~${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
        )
      ])
    ),

    /* AppSync hello */
    authed && e('section', { className: 'card space-y-4' },
      e('h2', { className: 'card-title' }, 'AppSync hello'),
      e('div', { className: 'flex gap-3' },
        e('button', { className: 'btn', onClick: callHello, disabled: busy }, busy ? 'Calling…' : 'Call { hello }'),
        hello && e('code', { className: 'px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded' }, hello)
      )
    ),

    /* Uploads */
    authed && e('section', { className: 'card space-y-4' },
      e('h2', { className: 'card-title' }, 'Uploads'),
      e('div', { className: 'flex items-center gap-2' },
        e('label', { className: 'text-sm' }, 'Key:'),
        e('input', { className: 'input', value: uploadKey, onChange: (ev) => setKey(ev.target.value) }),
        e('button', { className: 'btn', onClick: presignAndUpload, disabled: busy }, busy ? 'Uploading…' : 'Upload + List')
      ),
      list.length > 0 && e('ul', { className: 'text-sm list-disc pl-5 space-y-1' },
        list.map((k) => e('li', { key: k }, k))
      )
    ),

    /* Errors */
    error && e('p', { className: 'text-sm text-red-500' }, String(error))
  );
}

/* ---------- bootstrap ---------- */
(async function main() {
  await ensureReact();
  ReactDOM.createRoot(document.getElementById('root')).render(e(App));
})();
