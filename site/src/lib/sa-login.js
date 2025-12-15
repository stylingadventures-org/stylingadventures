// site/src/lib/sa-login.js
// Legacy shim: keep older imports working, but route everything to sa.js

export { getSA, getIdToken, signedUpload, graphql, Auth, clearTokens } from "./sa";
export { getSignedGetUrl } from "./sa";

