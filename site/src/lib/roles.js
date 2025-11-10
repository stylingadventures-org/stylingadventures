// Minimal helpers to read the highest tier and booleans per tier
export function normalizeRole(role = "") {
  return String(role || "").toUpperCase();
}
export function canAccessTier(role, tier) {
  const r = normalizeRole(role);
  if (r === "ADMIN") return true;            // admins see all tiers
  if (tier === "Fan") return true;           // every signed-in user is at least Fan
  return r === tier.toUpperCase();           // e.g. BESTIE
}
