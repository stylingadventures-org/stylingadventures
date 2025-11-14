// Build Cognito Hosted UI URLs for localhost + prod.
// Use implicit flow for quick dev: we get id_token in the URL hash.
export function hostedUiLoginUrl(cfg) {
  const redirect = new URL("/callback/index.html", window.location.origin).toString();
  const u = new URL(`https://${cfg.cognitoDomain}/login`);
  u.searchParams.set("client_id", cfg.cognitoWebClientId);
  u.searchParams.set("response_type", "token"); // 👈 use implicit flow for dev
  u.searchParams.set("scope", "openid profile email");
  u.searchParams.set("redirect_uri", redirect);
  return u.toString();
}

export function hostedUiLogoutUrl(cfg) {
  const redirect = new URL("/", window.location.origin).toString();
  const u = new URL(`https://${cfg.cognitoDomain}/logout`);
  u.searchParams.set("client_id", cfg.cognitoWebClientId);
  u.searchParams.set("logout_uri", redirect);
  return u.toString();
}
