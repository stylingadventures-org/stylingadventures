// lambda/admin/moderation.ts
//
// Admin moderation + tools entrypoint (placeholder).
// This enforces ADMIN-only access and gives you a few
// stub resolvers you can wire up in the schema/AppSync.
//
// You can expand this later to:
// - approve/reject uploads, bios, comments, bg changes, affiliate links
// - launch challenges/polls/games
// - send shoutouts / targeted invites, etc.

type AppSyncIdentity = {
  sub?: string;
  username?: string;
  claims?: { [key: string]: any };
  groups?: string[] | null;
};

type AppSyncEvent = {
  identity?: AppSyncIdentity;
  info: { fieldName: string };
  arguments: any;
};

const { TABLE_NAME = "" } = process.env;
// NOTE: we don't *require* TABLE_NAME yet in this stub – you can
// start reading/writing Dynamo later without breaking deploy.

/** Check if the caller is in the Cognito "admin" group. */
function isAdmin(identity?: AppSyncIdentity): boolean {
  if (!identity) return false;

  const claimsGroups =
    identity.claims?.["cognito:groups"] ??
    identity.claims?.["custom:groups"] ??
    identity.groups;

  const groups = Array.isArray(claimsGroups)
    ? claimsGroups
    : typeof claimsGroups === "string"
    ? claimsGroups.split(",")
    : [];

  // IdentityStack creates groups "admin" and "creator"
  return groups.includes("admin") || groups.includes("ADMIN");
}

export const handler = async (event: AppSyncEvent) => {
  const field = event.info.fieldName;
  const identity = event.identity;

  if (!identity?.sub) {
    throw new Error("Unauthorized");
  }

  if (!isAdmin(identity)) {
    throw new Error("Forbidden");
  }

  // 🔐 From this point on, we know it's an admin.

  switch (field) {
    // Simple health-check / can-I-hit-admin-endpoints?
    case "adminModerationPing":
      return {
        ok: true,
        at: new Date().toISOString(),
      };

    // Placeholder moderation queue
    case "adminListModerationQueue":
      return {
        items: [],
        nextToken: null,
      };

    // Placeholder approve/reject / status update
    case "adminUpdateModerationStatus":
      return {
        ok: true,
        updatedAt: new Date().toISOString(),
      };

    // Placeholder for community/event management
    case "adminLaunchChallenge":
      return {
        ok: true,
        challengeId: "placeholder",
      };

    // Placeholder for shoutouts / targeted invites
    case "adminSendShoutout":
      return {
        ok: true,
      };

    default:
      throw new Error(`No resolver implemented for field ${field}`);
  }
};
