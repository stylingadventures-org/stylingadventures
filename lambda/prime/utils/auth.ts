// lambda/prime/utils/auth.ts
export function assertInternalUser(identity: any, allowedGroups: string[]) {
  const claims = identity?.claims ?? {};
  const groups: string[] =
    claims["cognito:groups"] ||
    claims["cognito:groups:custom"] ||
    [];

  const asArray = Array.isArray(groups) ? groups : `${groups}`.split(",");
  const ok = asArray.some((g) => allowedGroups.includes(g.trim()));

  if (!ok) {
    const msg = "Forbidden: internal studio/admin access only";
    console.warn(msg, { groups: asArray });
    throw new Error(msg);
  }
}
