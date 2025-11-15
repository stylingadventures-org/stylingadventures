// site/src/lib/episodes.ts

export interface Episode {
  id: string;
  slug: string;
  title: string;
  /** UTC ms since epoch */
  publicAt: number;
  /** Is there an early-access window for Besties? */
  hasEarly?: boolean;
  /** Optional video URL (YouTube or direct) */
  video?: string;
  /** Optional tags */
  tags?: string[];
}

/**
 * Central catalog of your episodes.
 * Keep this in sync with what you actually publish.
 */
export const EPISODES: Episode[] = [
  {
    id: "pilot",
    slug: "pilot-closet-confessions",
    title: "Pilot: Closet Confessions",
    publicAt: Date.UTC(2025, 10, 30, 19, 0, 0), // 11/30/2025 2:00 PM ET
    hasEarly: true,
    // video: "https://…", // optional
  },
  {
    id: "holiday-glam",
    slug: "holiday-glam-drop",
    title: "Holiday Glam Drop",
    publicAt: Date.UTC(2025, 11, 7, 19, 0, 0), // 12/7/2025 2:00 PM ET
    hasEarly: true,
  },
  {
    id: "creator-collab-bts",
    slug: "creator-collab-bts",
    title: "Creator Collab BTS",
    publicAt: Date.UTC(2025, 11, 14, 19, 0, 0), // 12/14/2025 2:00 PM ET
    hasEarly: true,
  },
];

/** Simple countdown formatter used for “Public in 15d 6h”. */
export function fmtCountdown(targetMs: number, nowMs: number = Date.now()): string {
  const diff = targetMs - nowMs;
  if (!Number.isFinite(diff) || diff <= 0) return "0m";

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Find an episode by id or slug. */
export function getEpisodeById(idOrSlug?: string | null): Episode | undefined {
  if (!idOrSlug) return undefined;
  return EPISODES.find(
    (ep) => ep.id === idOrSlug || ep.slug === idOrSlug
  );
}

/** Ordered list (soonest public date first). */
export function getEpisodesOrdered(): Episode[] {
  return [...EPISODES].sort((a, b) => a.publicAt - b.publicAt);
}

/** Next episode after currentId, or undefined. */
export function getNextEpisode(
  currentId: string,
  list: Episode[] = getEpisodesOrdered()
): Episode | undefined {
  const idx = list.findIndex((e) => e.id === currentId);
  if (idx === -1) return undefined;
  return list[idx + 1];
}

/**
 * Related list – by default: neighbors in the ordered list,
 * excluding the current episode.
 */
export function getRelatedEpisodes(
  currentId: string,
  limit = 4,
  list: Episode[] = getEpisodesOrdered()
): Episode[] {
  const idx = list.findIndex((e) => e.id === currentId);
  if (idx === -1) return [];
  const before = list.slice(Math.max(0, idx - 2), idx);
  const after = list.slice(idx + 1, idx + 1 + (limit - before.length));
  return [...before, ...after].slice(0, limit);
}
