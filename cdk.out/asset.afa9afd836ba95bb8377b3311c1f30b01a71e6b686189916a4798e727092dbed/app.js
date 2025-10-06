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

/* fetch helpers */
const jpost = (url, body, headers = {}) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

/* ---------- JWT + Refresh helpers ---------- */
function decodeJwtPayload(jwt) {
  // returns {} if invalid
  try {
    const [, payload] = jwt.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch { return {}; }
}

let refreshTimer = null;
function clearRefreshTimer() { if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; } }

async function refreshTokens(cfg, setError) {
  if (!tokens.refresh) return false;
  try {
    const tokenEndpoint = `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: cfg.clientId,
      refresh_token: tokens.refresh
    });

    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) throw new Error(`Refresh failed (${res.status})`);
    const t = await res.json();
    // Cognito usually returns new id/access; refresh_token may be omitted—keep the old one.
    tokens.setAll({
      id_token: t.id_token,
      access_token: t.access_token,
      refresh_token: tokens.refresh
    });
    scheduleRefresh(cfg, setError); // reschedule using new exp
    return true;
  } catch (err) {
    setError?.('Session refresh failed. Please sign in again.');
    tokens.clear();
    clearRefreshTimer();
    return false;
  }
}

function scheduleRefresh(cfg, setError) {
  clearRefreshTimer();
  const { exp = 0 } = decodeJwtPayload(tokens.id);
  if (!exp) return; // nothing to schedule
  const now = Math.floor(Date.now() / 1000);

  // Aim to refresh 5 minutes before expiry; never less than 10s.
  const secondsUntil = Math.max(exp - now - 300, 10);
  refreshTimer = setTimeout(() => { refreshTokens(cfg, setError); }, secondsUntil * 1000);
}

/* ---------- React App ---------- */
function App() {
  const [cfg, setCfg]         = React.useState(null);
  const [busy, setBusy]       = React.useState(false);
  const [error, setError]     = React.useState('');
  const [hello, setHello]     = React.useState('');
  const [uploadKey, setKey]   = React.useState('test.txt');
  const [list, setList]       = React.useState([]);

  const authed = !!tokens.id;

  /* load config.json once */
  React.useEffect(() => {
    (async () => {
      try {
        const c = await (await fetch('/config.json', { cache: 'no-store' })).json();
        setCfg(c);

        // If we already have a token (e.g., returning to the page), schedule or refresh.
        if (tokens.id) {
          const { exp = 0 } = decodeJwtPayload(tokens.id);
          const now = Math.floor(Date.now() / 1000);
          if (!exp || exp <= now + 90) {
            // Expired / near expiry -> try immediate refresh (if refresh token exists)
            await refreshTokens(c, setError);
          } else {
            scheduleRefresh(c, setError);
          }
        }
      } catch (err) {
        setError('Failed to load config.json: ' + err);
      }
    })();

    // Housekeeping: clear timer on unmount
    return () => clearRefreshTimer();
  }, []);

  // If the tab was asleep and becomes visible, ensure we’re still fresh.
  React.useEffect(() => {
    function onVis() {
      if (document.visibilityState === 'visible' && cfg && tokens.id) {
        const { exp = 0 } = decodeJwtPayload(tokens.id);
        const now = Math.floor(Date.now() / 1000);
        if (exp <= now + 90) refreshTokens(cfg, setError);
      }
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [cfg]);

  async function startLogin() {
    try {
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
    tokens.clear();
    clearRefreshTimer();
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

  // Simple status extras (email/id/expiry) – optional
  const claims = decodeJwtPayload(tokens.id);
  const expIn = claims.exp ? Math.max(claims.exp - Math.floor(Date.now() / 1000), 0) : 0;
  const expM  = Math.floor(expIn / 60), expS = expIn % 60;

  if (!cfg) {
    return e('div', { className: 'p-8 text-sm text-zinc-600' },
      'Loading config… ',
      error && e('span', { className: 'text-red-500' }, String(error))
    );
  }

  const authed = !!tokens.id;

  return e('div', { className: 'max-w-3xl mx-auto p-6 space-y-6' },

    /* Header */
    e('header', { className: 'flex items-center justify-between' },
      e('h1', { className: 'text-2xl font-semibold' }, 'Styling Adventures'),
      authed
        ? e('button', { className: 'btn', onClick: logout }, 'Sign out')
        : e('button', { className: 'btn-primary', onClick: startLogin }, 'Sign in')
    ),

    /* Status */
    e('section', { className: 'card' },
      e('h2', { className: 'card-title' }, 'Status'),
      e('p', null, authed ? 'You are signed in.' : 'You are signed out.'),
      authed && e('div', { className: 'text-xs text-zinc-500 space-y-1 break-all' }, [
        e('div', { key: 'idpref' }, 'ID token (prefix): ', tokens.id.slice(0, 30), '…'),
        e('div', { key: 'user' }, 'Signed-in user:'),
        e('div', { key: 'name' }, (claims.name || '(no name)')),
        e('div', { key: 'email' }, claims.email || ''),
        e('div', { key: 'sub' }, 'id: ', claims.sub || ''),
        e('div', { key: 'exp' }, `Token expires in ~${expM}m ${expS}s`)
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
