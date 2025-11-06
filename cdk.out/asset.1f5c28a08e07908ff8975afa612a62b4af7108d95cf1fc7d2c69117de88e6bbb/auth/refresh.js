// auth/refresh.js

function parseJwt(t){
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

function getIdToken(){
  return sessionStorage.getItem('id_token') ||
         (JSON.parse(sessionStorage.getItem('tokens') || '{}').id_token);
}

let _timer = null;
let _inFlight = null;
const bc = ('BroadcastChannel' in self) ? new BroadcastChannel('sa-token-chan') : null;

/** Merge and persist tokens safely */
function persist(tokens){
  const prev = JSON.parse(sessionStorage.getItem('tokens') || '{}');
  const merged = { ...prev, ...tokens };
  if (tokens.id_token)     sessionStorage.setItem('id_token', tokens.id_token);
  if (tokens.access_token) sessionStorage.setItem('access_token', tokens.access_token);
  if (tokens.refresh_token)sessionStorage.setItem('refresh_token', tokens.refresh_token);
  sessionStorage.setItem('tokens', JSON.stringify(merged));
  bc?.postMessage({ type: 'TOKENS_UPDATED', tokens: merged });
  return merged;
}

/** Refresh with small retry for transient errors */
export async function refreshTokens({ domain, clientId, retries = 2 }) {
  // de-dupe concurrent calls
  if (_inFlight) return _inFlight;

  const refresh =
    sessionStorage.getItem('refresh_token') ||
    (JSON.parse(sessionStorage.getItem('tokens') || '{}').refresh_token);

  if (!refresh) throw new Error('No refresh_token available');

  const tokenUrl = `${domain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refresh
  });

  async function attempt(left, delayMs = 400){
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    }).catch(err => ({ ok:false, status:0, _err:err }));

    if (!res.ok) {
      // Don’t retry for client errors
      if (res.status === 400 || res.status === 401) {
        const t = typeof res.text === 'function' ? await res.text().catch(()=> '') : String(res._err||'');
        throw new Error(`Refresh failed: ${res.status} ${t}`); // likely invalid/expired refresh
      }
      if (left > 0) {
        await new Promise(r => setTimeout(r, delayMs));
        return attempt(left - 1, delayMs * 1.6);
      }
      const t = typeof res.text === 'function' ? await res.text().catch(()=> '') : String(res._err||'');
      throw new Error(`Refresh failed: ${res.status} ${t}`);
    }

    const tokens = await res.json();
    return persist(tokens);
  }

  _inFlight = attempt(retries).finally(() => { _inFlight = null; });
  return _inFlight;
}

export function cancelRotation(){
  if (_timer) { clearTimeout(_timer); _timer = null; }
}

export function scheduleRotation(tokens, { domain, clientId }) {
  cancelRotation();

  const id = tokens?.id_token || getIdToken();
  const parsed = parseJwt(id);
  if (!parsed?.exp) return; // cannot schedule without exp

  const now = Math.floor(Date.now()/1000);
  const secondsLeft = Math.max(0, parsed.exp - now);
  const skew = 60; // refresh 60s before expiry
  const delayMs = Math.max(10, (secondsLeft - skew)) * 1000;

  _timer = setTimeout(async () => {
    try {
      const out = await refreshTokens({ domain, clientId });
      scheduleRotation(out, { domain, clientId });
    } catch (e) {
      console.error('Auto refresh failed:', e);
      // Try again closer to expiry if something transient happened
      _timer = setTimeout(() => scheduleRotation({}, { domain, clientId }), 15_000);
    }
  }, delayMs);
}

// Keep tabs in sync to avoid multiple simultaneous refreshes
bc?.addEventListener?.('message', (e) => {
  if (e?.data?.type === 'TOKENS_UPDATED') {
    persist(e.data.tokens);
  }
});

// Optional: on tab focus, if we’re within 90s of expiry, refresh now
export function enableFocusTopUp({ domain, clientId, windowObj = window } = {}){
  const handler = async () => {
    const parsed = parseJwt(getIdToken());
    const now = Math.floor(Date.now()/1000);
    const left = parsed?.exp ? parsed.exp - now : 0;
    if (left > 0 && left < 90 && !_inFlight) {
      try {
        const out = await refreshTokens({ domain, clientId });
        scheduleRotation(out, { domain, clientId });
      } catch (e) {
        console.warn('Focus refresh skipped:', e.message);
      }
    }
  };
  windowObj.addEventListener('visibilitychange', () => {
    if (!document.hidden) handler();
  });
}
