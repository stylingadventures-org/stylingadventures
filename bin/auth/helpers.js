// /auth/helpers.js
export function resolveHostedBase(cfg) {
  if (cfg.hostedUiDomain) return `https://${cfg.hostedUiDomain}.auth.${cfg.region}.amazoncognito.com`;
  if (cfg.domain && cfg.domain.includes('amazoncognito.com')) return cfg.domain.replace(/\/+$/, '');
  if (cfg.domain && !cfg.domain.includes('_')) return `https://${cfg.domain}.auth.${cfg.region}.amazoncognito.com`;
  throw new Error('config.v2.json: provide "hostedUiDomain" (prefix) or full "domain" URL for Cognito Hosted UI.');
}

export function normalizedUris() {
  const PROD_CF = 'https://d1so4qr6zsby5r.cloudfront.net';
  const isLocal = location.origin.startsWith('http://localhost:');
  return {
    redirect: isLocal ? 'http://localhost:5173/callback/' : `${PROD_CF}/callback/`,
    logout:   isLocal ? 'http://localhost:5173/'          : `${PROD_CF}/`,
  };
}

export async function loadCfg() {
  // add timestamp but also require CloudFront not to cache (we'll set headers)
  const res = await fetch('/config.v2.json?ts=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load /config.v2.json');
  return res.json();
}

export async function buildLoginUrl(cfg) {
  const CLIENT_ID = cfg.clientId || cfg.clientID;
  const hostedBase = resolveHostedBase(cfg);
  const { redirect } = normalizedUris();

  // PKCE
  const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const sha256 = (text) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await sha256(verifier));
  sessionStorage.setItem('pkce_verifier', verifier);

  const state = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  sessionStorage.setItem('oauth_state', state);

  const p = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirect,                // hard-normalized
    scope: 'email openid profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  return `${hostedBase}/oauth2/authorize?${p.toString()}`;
}
