export function checkAndGrantBadges(profile, existing = []) {
  const badges = [];

  if ((profile?.streak || 0) >= 1 && !existing.find((b) => b.id === "first-checkin")) {
    badges.push({ id: "first-checkin", label: "First Check-In!" });
  }

  if ((profile?.streak || 0) >= 7 && !existing.find((b) => b.id === "loyal-bestie")) {
    badges.push({ id: "loyal-bestie", label: "7-Day Streak!" });
  }

  if ((profile?.tasksCompleted || 0) >= 10 && !existing.find((b) => b.id === "fashion-lover")) {
    badges.push({ id: "fashion-lover", label: "Fashion Lover!" });
  }

  return badges;
}
