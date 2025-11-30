// lambda/admin/community-tools.ts
//
// Admin-only community & event management:
// - challenges
// - polls/games hooks
// - shoutouts / targeted invites
//
// This is a stub implementation so CDK can deploy cleanly.
// You can flesh out the real logic later (Dynamo, EventBridge, SNS/SES, etc).

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

  // IdentityStack created "admin" and "creator" groups
  return groups.includes("admin") || groups.includes("ADMIN");
}

export const handler = async (event: AppSyncEvent) => {
  const identity = event.identity;
  const field = event.info.fieldName;

  if (!identity?.sub) {
    throw new Error("Unauthorized");
  }

  if (!isAdmin(identity)) {
    throw new Error("Forbidden");
  }

  // From here on, caller is an ADMIN.

  switch (field) {
    // Launch a challenge (placeholder)
    case "adminLaunchChallenge":
      return {
        ok: true,
        challengeId: "placeholder-challenge-id",
        createdAt: new Date().toISOString(),
      };

    // List challenges (placeholder)
    case "adminListChallenges":
      return {
        items: [],
        nextToken: null,
      };

    // Trigger a game / event (placeholder)
    case "adminTriggerCommunityEvent":
      return {
        ok: true,
        triggeredAt: new Date().toISOString(),
      };

    // Send shoutout (placeholder)
    case "adminSendShoutout":
      return {
        ok: true,
        sentAt: new Date().toISOString(),
      };

    // Targeted invite (placeholder)
    case "adminSendTargetedInvite":
      return {
        ok: true,
        sentAt: new Date().toISOString(),
      };

    default:
      // Safe default so adding new fields later won't break deploys
      return {
        ok: true,
        handled: false,
        field,
      };
  }
};
