"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/auth/seed-admin.ts
var seed_admin_exports = {};
__export(seed_admin_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(seed_admin_exports);
var import_client_cognito_identity_provider = require("@aws-sdk/client-cognito-identity-provider");
var client = new import_client_cognito_identity_provider.CognitoIdentityProviderClient({});
var USER_POOL_ID = process.env.USER_POOL_ID;
var ADMIN_EMAILS = (process.env.ADMIN_SEED_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
var GROUPS_TO_SEED = (process.env.ADMIN_SEED_GROUPS || "ADMIN").split(",").map((g) => g.trim()).filter(Boolean);
async function seedUser(email) {
  const list = await client.send(
    new import_client_cognito_identity_provider.ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1
    })
  );
  const user = list.Users?.[0];
  if (!user || !user.Username) {
    console.log(`No Cognito user found for email=${email}, skipping.`);
    return;
  }
  const username = user.Username;
  console.log(
    `Seeding user ${username} (${email}) into groups: ${GROUPS_TO_SEED.join(
      ","
    )}`
  );
  for (const groupName of GROUPS_TO_SEED) {
    await client.send(
      new import_client_cognito_identity_provider.AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName
      })
    );
  }
}
var handler = async (event) => {
  console.log("SeedAdmin event:", JSON.stringify(event, null, 2));
  if (event.RequestType === "Create" || event.RequestType === "Update") {
    for (const email of ADMIN_EMAILS) {
      try {
        await seedUser(email);
      } catch (err) {
        console.error(`Error seeding admin for email=${email}`, err);
      }
    }
  }
  return {
    PhysicalResourceId: event.PhysicalResourceId || event.LogicalResourceId || "SeedAdminCustomResource",
    Status: "SUCCESS"
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
