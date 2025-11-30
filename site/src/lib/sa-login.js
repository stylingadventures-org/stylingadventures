// Build Cognito Hosted UI URLs for localhost + prod.
// Use authorization code flow (response_type=code).
export function hostedUiLoginUrl(cfg) {
  // SPA route that handles the auth code callback
  const redirect = new URL("/callback", window.location.origin).toString();

  // cfg.cognitoDomain may be with or without protocol
  const rawDomain = (cfg.cognitoDomain || "").replace(/^https?:\/\//, "");
  const base = `https://${rawDomain}`;

  const clientId =
    cfg.cognitoWebClientId || cfg.clientId || cfg.userPoolWebClientId;

  const u = new URL("/login", base);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("response_type", "code"); // 👈 auth code flow
  u.searchParams.set("scope", "email openid profile");
  u.searchParams.set("redirect_uri", redirect);
  return u.toString();
}

export function hostedUiLogoutUrl(cfg) {
  const redirect = new URL("/", window.location.origin).toString();

  const rawDomain = (cfg.cognitoDomain || "").replace(/^https?:\/\//, "");
  const base = `https://${rawDomain}`;

  const clientId =
    cfg.cognitoWebClientId || cfg.clientId || cfg.userPoolWebClientId;

  const u = new URL("/logout", base);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("logout_uri", redirect);
  return u.toString();
}
