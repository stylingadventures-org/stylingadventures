// Export Cognito configuration
export const cognitoConfig = {
  region: import.meta.env.VITE_API_REGION || "us-east-1",
  userPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_aXLKIxbqK",
  userPoolWebClientId: import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID || "51uc25i7ob3otirvgi66mpht79",
  clientId: import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID || "51uc25i7ob3otirvgi66mpht79",
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || "us-east-1:c73ff0f8-f70b-4eb4-93b8-9397ba61e7f8",
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN || "https://sa-dev-637423256673.auth.us-east-1.amazoncognito.com",
  cognitoDomainPrefix: import.meta.env.VITE_COGNITO_DOMAIN_PREFIX || "sa-dev-637423256673",
  redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "http://localhost:5173/callback",
  logoutUri: typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:5173/",
  scopes: ["openid", "email", "profile"],
};

// Export AppSync configuration
export const appSyncConfig = {
  url: import.meta.env.VITE_APPSYNC_URL || "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
  region: import.meta.env.VITE_API_REGION || "us-east-1",
};

// Export general app configuration
export const appConfig = {
  env: import.meta.env.VITE_APP_ENV || "dev",
  region: import.meta.env.VITE_API_REGION || "us-east-1",
  appsyncUrl: import.meta.env.VITE_APPSYNC_URL || "https://z6cqsgghgvg3jd5vyv3xpyia7y.appsync-api.us-east-1.amazonaws.com/graphql",
  uploadsApiUrl: import.meta.env.VITE_UPLOADS_API_URL || "https://6bogi2ehy2.execute-api.us-east-1.amazonaws.com/prod",
  uploadsBucket: import.meta.env.VITE_UPLOADS_BUCKET || "uploadsstack-uploadsbucket5e5e9b64-k9dx30tzfgh5",
};
