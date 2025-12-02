// site/src/logic/badgeHelper.ts

const BADGE_RULES = [
  {
    id: "streak‑7",
    label: "7‑Day Streak",
    trigger: (profile) => (profile?.streak || 0) >= 7,
  },
  {
    id: "coins‑1000",
    label: "1,000 Coins Club",
    trigger: (profile) => (profile?.coins || 0) >= 1000,
  },
  // add more rules...
];

export function checkAndGrantBadges(profile, existingBadgeIds = []) {
  const earned = [];
  BADGE_RULES.forEach((rule) => {
    if (!existingBadgeIds.includes(rule.id) && rule.trigger(profile)) {
      earned.push({ id: rule.id, label: rule.label });
    }
  });
  return earned;
}
