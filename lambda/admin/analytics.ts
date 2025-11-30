// lambda/admin/analytics.ts
//
// Admin-facing analytics helpers for the dashboard.
// This is a safe stub: it enforces admin auth and returns
// placeholder aggregates until wired to real data sources.

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

  // IdentityStack created "admin" and "creator" groups.
  // Analytics is admin-only.
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
    /**
     * Example: adminDashboardSummary
     * High-level KPIs for the admin dashboard.
     * Later we can back this with:
     *  - AnalyticsStack (S3/Athena/QuickSight)
     *  - DDB aggregates
     */
    case "adminDashboardSummary": {
      const now = new Date().toISOString();

      return {
        generatedAt: now,
        xpEventsLast7Days: 0,
        coinsIssuedLast7Days: 0,
        activeUsersLast7Days: 0,
        activeCreatorsLast7Days: 0,
        livestreamMinutesWatchedLast7Days: 0,
      };
    }

    /**
     * Example: adminCreatorAnalytics(creatorId)
     * Per-creator engagement + revenue snapshot (stubbed).
     */
    case "adminCreatorAnalytics": {
      const { creatorId } = event.arguments || {};
      const now = new Date().toISOString();

      return {
        creatorId: creatorId ?? null,
        generatedAt: now,
        totalViewsLast30Days: 0,
        totalCoinsEarnedLast30Days: 0,
        totalBesties: 0,
        avgWatchTimeSeconds: 0,
      };
    }

    /**
     * Example: adminEconomyReport
     * XP / coins economy totals (stubbed).
     */
    case "adminEconomyReport": {
      const now = new Date().toISOString();

      return {
        generatedAt: now,
        totalCoinsIssuedAllTime: 0,
        totalCoinsBurnedAllTime: 0,
        totalXpEventsAllTime: 0,
      };
    }

    default:
      // For any future fields wired in AdminStack but not yet implemented.
      return {
        ok: true,
        handled: false,
        field,
      };
  }
};
