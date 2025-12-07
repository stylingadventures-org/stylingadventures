// lambda/auth/seed-admin.ts
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;
const ADMIN_EMAILS = (process.env.ADMIN_SEED_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// which groups to seed into
const GROUPS_TO_SEED = (process.env.ADMIN_SEED_GROUPS || "ADMIN")
  .split(",")
  .map((g) => g.trim())
  .filter(Boolean);

async function seedUser(email: string) {
  // find user by email
  const list = await client.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );

  const user = list.Users?.[0];
  if (!user || !user.Username) {
    console.log(`No Cognito user found for email=${email}, skipping.`);
    return;
  }

  const username = user.Username;
  console.log(
    `Seeding user ${username} (${email}) into groups: ${GROUPS_TO_SEED.join(
      ",",
    )}`,
  );

  for (const groupName of GROUPS_TO_SEED) {
    await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: groupName,
      }),
    );
  }
}

export const handler = async (event: any) => {
  console.log("SeedAdmin event:", JSON.stringify(event, null, 2));

  // idempotent: on Create and Update, try seeding. On Delete, do nothing.
  if (event.RequestType === "Create" || event.RequestType === "Update") {
    for (const email of ADMIN_EMAILS) {
      try {
        await seedUser(email);
      } catch (err) {
        console.error(`Error seeding admin for email=${email}`, err);
        // don't throw; we want stack deploy to succeed even if user doesn't exist yet
      }
    }
  }

  return {
    PhysicalResourceId:
      event.PhysicalResourceId ||
      event.LogicalResourceId ||
      "SeedAdminCustomResource",
    Status: "SUCCESS",
  };
};
