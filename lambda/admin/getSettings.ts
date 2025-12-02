import { loadSettingsFromDb } from "./_settingsDb";

const DEFAULT_SETTINGS = {
  animationsEnabled: true,
  soundsEnabled: true,
  autoBadgeGrant: true,
  badgeRules: [] as any[],
};

export async function handler(event: any) {
  // event kept as any because this function is legacy / not used by AppSync directly
  const existing = await loadSettingsFromDb();
  return existing ?? DEFAULT_SETTINGS;
}
