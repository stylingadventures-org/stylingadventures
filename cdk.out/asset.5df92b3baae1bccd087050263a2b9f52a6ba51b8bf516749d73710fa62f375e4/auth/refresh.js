// Minimal helpers to refresh tokens and auto-rotate before expiry.

function parseJwt(t){
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

export async function refreshTokens({ domain, clientId }) {
  const refresh = sessionStorage.getItem('refresh_token')
               || (JSON.parse(sessionStorage.getItem('tokens') || '{}').refresh_token);
  if (!refresh) throw new Error('No refresh_token available');

  const tokenUrl = `${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refresh
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new Error(`Refresh failed: ${res.status} ${t}`);
  }
  const tokens = await res.json();

  // Persist
  if (tokens.id_token) sessionStorage.setItem('id_token', tokens.id_token);
  if (tokens.access_token) sessionStorage.setItem('access_token', tokens.access_token);
  // Refresh token may or may not be returned; keep the old one if omitted.
  if (tokens.refresh_token) sessionStorage.setItem('refresh_token', tokens.refresh_token);

  // Keep a merged view for scheduling
  const prev = JSON.parse(sessionStorage.getItem('tokens') || '{}');
  const merged = { ...prev, ...tokens };
  sessionStorage.setItem('tokens', JSON.stringify(merged));

  return merged;
}

let _timer;
export function scheduleRotation(tokens, { domain, clientId }) {
  clearTimeout(_timer);

  const id = tokens.id_token || sessionStorage.getItem('id_token');
  const parsed = parseJwt(id);
  if (!parsed?.exp) return; // can't schedule without exp

  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Math.max(0, parsed.exp - now);

  // Refresh 60s before expiry (min 10s from now)
  const skew = 60;
  const delayMs = Math.max(10, (secondsLeft - skew)) * 1000;

  _timer = setTimeout(async () => {
    try {
      const out = await refreshTokens({ domain, clientId });
      scheduleRotation(out, { domain, clientId }); // reschedule
    } catch (e) {
      console.error('Auto refresh failed:', e);
    }
  }, delayMs);
}
