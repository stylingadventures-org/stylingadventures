// site/src/lib/episodes.js

// -----------------------------------------------------------------------------
// Central catalog of your episodes + shared helpers for Episodes / Watch / Fan
// -----------------------------------------------------------------------------

// All times are UTC milliseconds since epoch.
export const EPISODES = [
  {
    id: "pilot",
    slug: "pilot-closet-confessions",
    title: "Pilot: Closet Confessions",
    // 11/30/2025, 2:00 PM ET → 19:00 UTC
    publicAt: Date.UTC(2025, 10, 30, 19, 0, 0),
    hasEarly: true,
    // video: "https://…", // optional video URL
  },
  {
    id: "holiday-glam",
    slug: "holiday-glam-drop",
    title: "Holiday Glam Drop",
    // 12/7/2025, 2:00 PM ET → 19:00 UTC
    publicAt: Date.UTC(2025, 11, 7, 19, 0, 0),
    hasEarly: true,
  },
  {
    id: "creator-collab-bts",
    slug: "creator-collab-bts",
    title: "Creator Collab BTS",
    // 12/14/2025, 2:00 PM ET → 19:00 UTC
    publicAt: Date.UTC(2025, 11, 14, 19, 0, 0),
    hasEarly: true,
  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Simple countdown formatter used for "Public in 15d 6h".
 * Expects `targetMs` as UTC ms since epoch.
 */
export function fmtCountdown(targetMs, nowMs = Date.now()) {
  const target = Number(targetMs);
  const now = Number(nowMs);
  const diff = target - now;

  if (!Number.isFinite(diff) || diff <= 0) return "0m";

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Look up an episode by id or slug.
 */
export function getEpisodeById(idOrSlug) {
  if (!idOrSlug) return undefined;
  return EPISODES.find(
    (ep) => ep.id === idOrSlug || ep.slug === idOrSlug
  );
}

/**
 * Ordered list (soonest public date first).
 */
export function getEpisodesOrdered() {
  return [...EPISODES].sort((a, b) => a.publicAt - b.publicAt);
}

/**
 * Next episode after currentId, or undefined.
 */
export function getNextEpisode(currentId, list = getEpisodesOrdered()) {
  const idx = list.findIndex((e) => e.id === currentId);
  if (idx === -1) return undefined;
  return list[idx + 1];
}

/**
 * Related list – neighbors in the ordered list, excluding current.
 */
export function getRelatedEpisodes(
  currentId,
  limit = 4,
  list = getEpisodesOrdered()
) {
  const idx = list.findIndex((e) => e.id === currentId);
  if (idx === -1) return [];
  const before = list.slice(Math.max(0, idx - 2), idx);
  const after = list.slice(idx + 1, idx + 1 + (limit - before.length));
  return [...before, ...after].slice(0, limit);
}

/**
 * Returns true if there is at least one episode that has an
 * early-access window and is not public yet (for the red dot).
 */
export function hasEarlyContentNow(nowMs = Date.now()) {
  const now = Number(nowMs);
  return EPISODES.some(
    (ep) => ep.hasEarly && now < Number(ep.publicAt)
  );
}
