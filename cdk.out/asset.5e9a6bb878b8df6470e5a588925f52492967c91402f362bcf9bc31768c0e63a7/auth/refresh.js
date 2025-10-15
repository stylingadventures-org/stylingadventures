// auth/refresh.js (ES module)
export function parseJwt(token) {
  const [, payload] = token.split('.');
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}
function idTokenExpSeconds(id) { return parseJwt(id).exp; }

export function saveTokens(t) { sessionStorage.setItem('tokens', JSON.stringify(t)); }
export function loadTokens() { const r = sessionStorage.getItem('tokens'); return r ? JSON.parse(r) : null; }

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
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  const data = await res.json();
  const next = {
    id_token: data.id_token,
    access_token: data.access_token,
    refresh_token: current.refresh_token, // may be omitted on refresh
    expires_in: data.expires_in,
  };
  saveTokens(next);
  return next;
}

let timer;
export function scheduleRotation(tokens, { domain, clientId }) {
  if (timer) clearTimeout(timer);
  const skew = 60;
  const renewAt = (idTokenExpSeconds(tokens.id_token) - 300 - skew) * 1000;
  const delay = Math.max(5000, renewAt - Date.now());
  timer = setTimeout(async () => {
    try {
      const t = await refreshTokens({ domain, clientId });
      scheduleRotation(t, { domain, clientId });
    } catch {
      sessionStorage.clear();
      window.location.href = '/logout/';
    }
  }, delay);
}
