"use strict";
const fs = require("fs");

if (!fs.existsSync("cdk-outputs.json")) {
  console.error("cdk-outputs.json not found; run cdk deploy first.");
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync("cdk-outputs.json","utf8"));
const out = {
  Web: {
    cloudFrontUrl: raw.WebStack?.CloudFrontDistributionDomainName ? `https://${raw.WebStack.CloudFrontDistributionDomainName}` : null,
    staticBucket: raw.WebStack?.StaticSiteBucketName || null,
  },
  Identity: {
    userPoolId: raw.IdentityStack?.UserPoolId || null,
    userPoolClientId: raw.IdentityStack?.UserPoolClientId || null,
    identityPoolId: raw.IdentityStack?.IdentityPoolId || null,
    hostedUiDomain: raw.IdentityStack?.HostedUiDomain || null,
    hostedUiUrl: raw.IdentityStack?.HostedUiUrl || null,
  },
  Api: {
    appSyncApiId: raw.ApiStack?.AppSyncApiId || null,
    appSyncUrl: raw.ApiStack?.AppSyncUrl || null,
  },
  Uploads: {
    uploadsBucket: raw.UploadsStack?.UploadsBucketName || null,
    apiGatewayUrl: raw.UploadsStack?.ApiGatewayUrl || null,
  },
};
fs.writeFileSync("outputs.json", JSON.stringify(out, null, 2));
console.log("Wrote outputs.json");
