// auth/refresh.js (ES module)

// ---------- Utilities ----------
function b64urlToUtf8(str) {
  // Convert base64url -> base64, then decode
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  // atob handles ASCII; decodeURIComponent/escape expands UTF-8 correctly
  const bin = atob(base64);
  try {
    return decodeURIComponent(escape(bin));
  } catch {
    // Fallback if bytes are plain ASCII
    return bin;
  }
}

// ---------- Tokens ----------
export function parseJwt(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) {
    throw new Error('Invalid JWT');
  }
  const [, payload] = token.split('.');
  return JSON.parse(b64urlToUtf8(payload));
}

function idTokenExpSeconds(id) {
  const exp = Number(parseJwt(id).exp || 0);
  if (!Number.isFinite(exp) || exp <= 0) throw new Error('Missing exp in id_token');
  return exp;
}

const STORAGE_KEY = 'tokens';

export function saveTokens(t) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(t || {}));
}

export function loadTokens() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTokens() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ---------- Refresh flow ----------
export async function refreshTokens({ domain, clientId }) {
  const current = loadTokens();
  if (!current?.refresh_token) throw new Error('No refresh token');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: current.refresh_token,
  });

  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  const next = {
    id_token: data.id_token,         // required for your APIs
    access_token: data.access_token, // optional for your current flow
    refresh_token: current.refresh_token, // Cognito may omit it on refresh
    expires_in: data.expires_in,     // seconds (from now)
  };

  saveTokens(next);
  return next;
}

// ---------- Scheduler ----------
let _timer = null;

/**
 * Schedules the next background refresh.
 * - Refreshes ~5 min before the JWT exp (with extra skew).
 * - Also listens to visibility changes (sleep/wake).
 */
export function scheduleRotation(tokens, { domain, clientId }, { onRefresh = () => {}, onError = defaultLogout } = {}) {
  if (_timer) clearTimeout(_timer);

  const SKEW = 60;       // seconds of extra safety
  const EARLY = 300;     // refresh 5 minutes early
  let whenMs;

  try {
    const expSec = idTokenExpSeconds(tokens.id_token);
    whenMs = (expSec - EARLY - SKEW) * 1000;
  } catch {
    // If token is malformed, try in 30s so we don't spin
    whenMs = Date.now() + 30_000;
  }

  const delay = Math.max(5_000, whenMs - Date.now());

  const run = async () => {
    try {
      const t = await refreshTokens({ domain, clientId });
      onRefresh(t);
      // re-schedule with new token
      scheduleRotation(t, { domain, clientId }, { onRefresh, onError });
    } catch (e) {
      console.error('Token refresh failed:', e);
      onError(e);
    }
  };

  _timer = setTimeout(run, delay);

  // Re-check when user returns to the tab (machine was asleep, etc.)
  const visHandler = () => {
    if (document.visibilityState === 'visible') {
      try {
        const expMs = idTokenExpSeconds(loadTokens()?.id_token || 0) * 1000;
        if (Date.now() > expMs - 120_000) {
          // within 2 minutes of exp (or past it) → refresh now
          if (_timer) clearTimeout(_timer);
          run();
        }
      } catch {
        // If parsing failed, force a refresh attempt
        if (_timer) clearTimeout(_timer);
        run();
      }
    }
  };
  // Ensure only one listener is attached
  document.removeEventListener('visibilitychange', visHandler);
  document.addEventListener('visibilitychange', visHandler, { once: true });
}

function defaultLogout() {
  clearTokens();
  // Your app already has a /logout route that clears cookies/session
  window.location.href = '/logout/';
}

// ---------- Convenience for API calls ----------
export function getIdToken() {
  return loadTokens()?.id_token || '';
}

export function authHeaders(extra = {}) {
  const id = getIdToken();
  return id ? { ...extra, Authorization: `Bearer ${id}` } : { ...extra };
}

/**
 * Fetch wrapper that automatically attaches
 *   Authorization: Bearer <id_token>
 * and JSON encodes/decodes when body is an object.
 */
export async function authFetch(url, options = {}) {
  const opts = { ...options };
  const headers = new Headers(options.headers || {});
  const id = getIdToken();
  if (id) headers.set('Authorization', `Bearer ${id}`);

  // Auto JSON
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    opts.body = JSON.stringify(opts.body);
  }

  opts.headers = headers;
  const res = await fetch(url, opts);

  // Try to parse JSON if possible
  const ct = res.headers.get('content-type') || '';
  const parse = async () => (ct.includes('application/json') ? res.json() : res.text());

  if (!res.ok) {
    const msg = await parse().catch(() => res.statusText);
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }

  return parse();
}
