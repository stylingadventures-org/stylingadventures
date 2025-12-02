import { loadSettingsFromDb, saveSettingsToDb } from "./_settingsDb";

const DEFAULT_SETTINGS = {
  animationsEnabled: true,
  soundsEnabled: true,
  autoBadgeGrant: true,
  badgeRules: [] as any[],
};

export async function handler(event: any) {
  const input =
    event?.arguments?.input ??
    event?.arguments?.data ??
    {};

  const existing = (await loadSettingsFromDb()) ?? {};
  const merged = {
    ...DEFAULT_SETTINGS,
    ...existing,
    ...input,
  };

  await saveSettingsToDb(merged);

  return merged;
}
