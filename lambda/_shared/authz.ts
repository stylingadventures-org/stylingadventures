// lambda/_shared/authz.ts
import { AppSyncIdentityCognito } from "aws-lambda";

export type UserTier = "FREE" | "BESTIE" | "CREATOR" | "COLLAB" | "ADMIN" | "PRIME";

// AppSync sometimes sends groups: null – accept null|undefined.
export type SAIdentity =
  | (AppSyncIdentityCognito & { groups?: string[] | null })
  | null
  | undefined;

// Prefer explicit token tier claim; fall back to Cognito groups.
export function getUserTier(identity: SAIdentity): UserTier {
  const claims = (identity as any)?.claims || {};

  const claimTier =
    (claims["tier"] as string | undefined) ??
    (claims["custom:tier"] as string | undefined);

  const validTiers: UserTier[] = [
    "FREE",
    "BESTIE",
    "CREATOR",
    "COLLAB",
    "ADMIN",
    "PRIME",
  ];

  if (claimTier && validTiers.includes(claimTier as UserTier)) {
    return claimTier as UserTier;
  }

  const rawGroups = claims["cognito:groups"];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  if (groups.includes("ADMIN")) return "ADMIN";
  if (groups.includes("PRIME")) return "PRIME";
  if (groups.includes("CREATOR")) return "CREATOR";
  if (groups.includes("COLLAB")) return "COLLAB";
  if (groups.includes("BESTIE")) return "BESTIE";

  return "FREE";
}

export function assertAuth(identity: SAIdentity) {
  if (!identity?.sub) throw new Error("Unauthenticated");
}

export function requireBestieTier(identity: SAIdentity): UserTier {
  assertAuth(identity);
  const tier = getUserTier(identity);
  if (tier === "FREE") {
    throw new Error("This is a Bestie feature. Upgrade to unlock it.");
  }
  return tier;
}

/**
 * Creator-or-higher gate:
 * - blocks: FREE, BESTIE
 * - allows: CREATOR, COLLAB, ADMIN, PRIME
 */
export function requireCreatorOrHigher(identity: SAIdentity): UserTier {
  assertAuth(identity);
  const tier = getUserTier(identity);
  if (tier === "FREE" || tier === "BESTIE") {
    throw new Error(
      "Creator tools are only for Creators, Collabs, Admins, or Prime.",
    );
  }
  return tier;
}

export function isAdminIdentity(identity: SAIdentity): boolean {
  const claims = (identity as any)?.claims || {};
  const raw = claims["cognito:groups"];
  const groups = Array.isArray(raw)
    ? raw
    : String(raw || "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

  return groups.includes("ADMIN") || groups.includes("COLLAB");
}
