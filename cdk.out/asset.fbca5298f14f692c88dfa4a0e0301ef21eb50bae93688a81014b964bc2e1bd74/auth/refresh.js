// auth/refresh.js  (ES module)

/** Decode a JWT (no signature verification; for client-side UX only). */
export function parseJwt(token) {
  const [, payload] = token.split('.');
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

function idTokenExpSeconds(id) {
  try { return parseJwt(id).exp || 0; } catch { return 0; }
}

/** Basic session storage helpers */
export function saveTokens(t) {
  sessionStorage.setItem('tokens', JSON.stringify(t));
}
export function loadTokens() {
  const r = sessionStorage.getItem('tokens');
  return r ? JSON.parse(r) : null;
}

/**
 * Resolve the Hosted UI base URL from config.
 * - If config.domain already looks like a URL, use it as-is.
 * - If it's just the short domain prefix, construct the full Hosted UI domain.
 *   e.g. domain: "lala-637...", region: "us-east-1"
 *   -> https://lala-637....auth.us-east-1.amazoncognito.com
 */
function resolveHostedUiBase({ domain, region }) {
  if (!domain) throw new Error('Missing Cognito domain in config');
  if (/^https?:\/\//i.test(domain)) return domain.replace(/\/+$/, '');
  if (!region) throw new Error('Missing region to build Hosted UI domain');
  return `https://${domain}.auth.${region}.amazoncognito.com`;
}

/** Call Cognito’s /oauth2/token to rotate tokens using the refresh token. */
export async function refreshTokens({ domain, clientId, region }) {
  const current = loadTokens();
  if (!current?.refresh_token) throw new Error('No refresh token');

  const hostedUiBase = resolveHostedUiBase({ domain, region });

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: current.refresh_token,
  });

  const res = await fetch(`${hostedUiBase}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // On refresh, Cognito may omit refresh_token if it doesn't rotate it.
  const next = {
    id_token: data.id_token,
    access_token: data.access_token,
    refresh_token: data.refresh_token || current.refresh_token,
    token_type: data.token_type || 'Bearer',
    expires_in: data.expires_in, // seconds
  };

  saveTokens(next);
  return next;
}

/** Seconds until the current id_token expires (0 if missing/expired). */
export function secondsUntilExpiry(tokens) {
  if (!tokens?.id_token) return 0;
  const exp = idTokenExpSeconds(tokens.id_token);
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

/**
 * Ensure you have a fresh id_token.
 * If < minSecondsLeft, it will try to refresh immediately.
 * Returns the (possibly refreshed) tokens.
 */
export async function ensureFreshIdToken({ domain, clientId, region }, minSecondsLeft = 300) {
  const t = loadTokens();
  if (!t) throw new Error('Not signed in');
  if (secondsUntilExpiry(t) > minSecondsLeft) return t;
  const refreshed = await refreshTokens({ domain, clientId, region });
  return refreshed;
}

let _timer;
/**
 * Schedule automatic rotation of the id_token.
 * - Renews ~5 minutes before expiry (minus a small skew).
 * - Has a minimum delay so we don’t thrash.
 */
export function scheduleRotation(tokens, { domain, clientId, region }) {
  if (_timer) clearTimeout(_timer);

  const nowMs = Date.now();
  const expSec = idTokenExpSeconds(tokens?.id_token);
  if (!expSec) return; // nothing to schedule

  // Renew 5 minutes before expiry, with 60s skew.
  const targetMs = (expSec - 300 - 60) * 1000;
  const delay = Math.max(5_000, targetMs - nowMs);

  _timer = setTimeout(async () => {
    try {
      const t = await refreshTokens({ domain, clientId, region });
      scheduleRotation(t, { domain, clientId, region });
    } catch (e) {
      console.warn('Token refresh failed; clearing session.', e);
      sessionStorage.clear();
      // Redirect to a logout route you host (adjust path if needed)
      window.location.href = '/logout/';
    }
  }, delay);
}

/** Optional helper to clear timers & session on manual logout. */
export function clearAuthState() {
  if (_timer) clearTimeout(_timer);
  sessionStorage.clear();
}
