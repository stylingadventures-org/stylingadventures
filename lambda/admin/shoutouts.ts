// lambda/admin/shoutouts.ts
//
// Admin-only shoutouts & targeted invites.
// This is a minimal stub so AdminStack can deploy cleanly.
// You can later wire this into SNS/SES/EventBridge, etc.

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

  switch (field) {
    // Admin → send a broadcast shoutout (e.g. SNS / push in future)
    case "adminSendShoutout": {
      const { message, audience } = event.arguments || {};
      return {
        ok: true,
        delivered: false, // will flip to true once SNS/SES is wired
        message: message ?? "",
        audience: audience ?? "ALL",
        sentAt: new Date().toISOString(),
      };
    }

    // Admin → send a targeted invite (email or userId list)
    case "adminSendTargetedInvite": {
      const { email, userId, templateId } = event.arguments || {};
      return {
        ok: true,
        delivered: false,
        email: email ?? null,
        userId: userId ?? null,
        templateId: templateId ?? null,
        sentAt: new Date().toISOString(),
      };
    }

    // Fallback for any future admin shoutout fields
    default:
      return {
        ok: true,
        handled: false,
        field,
      };
  }
};
