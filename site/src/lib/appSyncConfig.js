// Get config from window.__cfg (loaded by public/sa.js) or use defaults
const cfg = typeof window !== "undefined" && window.__cfg ? window.__cfg : {};

// Export Cognito configuration
export const cognitoConfig = {
  region: cfg.region || "us-east-1",
  userPoolId: cfg.userPoolId || "us-east-1_aXLKIxbqK",
  userPoolWebClientId: cfg.userPoolWebClientId || "51uc25i7ob3otirvgi66mpht79",
  clientId: cfg.clientId || "51uc25i7ob3otirvgi66mpht79",
  identityPoolId: cfg.identityPoolId || "us-east-1:c73ff0f8-f70b-4eb4-93b8-9397ba61e7f8",
  cognitoDomain: cfg.cognitoDomain || "https://sa-dev-637423256673.auth.us-east-1.amazoncognito.com",
  cognitoDomainPrefix: cfg.cognitoDomainPrefix || "sa-dev-637423256673",
  redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "http://localhost:5173/callback",
  logoutUri: typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:5173/",
  scopes: ["openid", "email", "profile"],
};

// Export AppSync configuration
export const appSyncConfig = {
  url: cfg.appsyncUrl || "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
  region: cfg.region || "us-east-1",
};

// Export general app configuration
export const appConfig = {
  env: cfg.env || "dev",
  region: cfg.region || "us-east-1",
  appsyncUrl: cfg.appsyncUrl || "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
  uploadsApiUrl: cfg.uploadsApiUrl || "https://6bogi2ehy2.execute-api.us-east-1.amazonaws.com/prod",
  uploadsBucket: cfg.uploadsBucket || "uploadsstack-uploadsbucket5e5e9b64-k9dx30tzfgh5",
};
