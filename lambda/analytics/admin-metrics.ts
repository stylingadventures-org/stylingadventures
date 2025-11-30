// lambda/analytics/admin-metrics.ts
//
// Lightweight placeholder lambda for admin analytics.
// This unblocks CDK synth/deploy while giving you a
// secure, admin-only resolver you can wire up later.

type AppSyncEvent = {
  identity?: {
    sub?: string;
    username?: string;
    claims?: {
      [key: string]: any;
    };
    groups?: string[] | null;
  };
  info?: {
    fieldName?: string;
  };
  arguments?: any;
};

type AdminAnalyticsSummary = {
  generatedAt: string;
  notes: string;
};

function isAdmin(identity: AppSyncEvent["identity"]): boolean {
  if (!identity) return false;

  // Prefer JWT claims from Cognito
  const claimsGroups =
    identity.claims?.["cognito:groups"] ??
    identity.claims?.["custom:groups"] ??
    identity.groups;

  const groups = Array.isArray(claimsGroups)
    ? claimsGroups
    : typeof claimsGroups === "string"
    ? claimsGroups.split(",")
    : [];

  // We’re using the lowercase "admin" group from IdentityStack
  return groups.includes("admin") || groups.includes("ADMIN");
}

export const handler = async (
  event: AppSyncEvent,
): Promise<AdminAnalyticsSummary> => {
  const field = event.info?.fieldName || "";
  const identity = event.identity;

  if (!identity?.sub) {
    throw new Error("Unauthorized");
  }

  if (!isAdmin(identity)) {
    throw new Error("Forbidden");
  }

  // For now we just support a single field; you can add more later
  if (field === "adminAnalyticsSummary") {
    const now = new Date().toISOString();

    // TODO: hook into S3 logs, DDB, or whatever pipeline you build
    // For now, return a stub summary so frontend can integrate.
    return {
      generatedAt: now,
      notes:
        "Admin analytics backend is wired. Replace this placeholder with real metrics (XP, coins, livestream engagement, etc).",
    };
  }

  throw new Error(`Unknown field ${field} in admin-metrics lambda`);
};
