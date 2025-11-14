// Central place for episode metadata + helpers used by Episodes/Watch/nav

export const EPISODES = [
  {
    id: "ep-001",
    title: "Pilot: Closet Confessions",
    publicAt: new Date("2025-11-30T19:00:00Z").getTime(),
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    introSkipSecs: 12,         // ⏭ Skip intro length (seconds) for the Skip-Intro button
    // thumb: "https://..."    // Optional custom thumbnail (otherwise auto-from YouTube if possible)
  },
  {
    id: "ep-002",
    title: "Holiday Glam Drop",
    publicAt: new Date("2025-12-07T19:00:00Z").getTime(),
    video: "https://www.youtube.com/embed/oHg5SJYRHA0",
    introSkipSecs: 15,
  },
  {
    id: "ep-003",
    title: "Creator Collab BTS",
    publicAt: new Date("2025-12-14T19:00:00Z").getTime(),
    video: "",                 // add later
    introSkipSecs: 10,
  },
];

export function hasEarlyContentNow() {
  const now = Date.now();
  // "Early content" means: not public yet (Besties get it now)
  return EPISODES.some((e) => now < e.publicAt);
}

export function countdownParts(msLeft) {
  if (msLeft <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(msLeft / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec };
}

export function fmtCountdown(targetTs) {
  const { d, h, m, s } = countdownParts(targetTs - Date.now());
  if (targetTs - Date.now() <= 0) return "Public";
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function getEpisodeById(id) {
  return EPISODES.find((e) => e.id === id) || null;
}

// --- Ordering + Next/Related helpers ---

/** Return all episodes in a consistent order (early → later by publicAt, fallback to title). */
export function getEpisodesOrdered(all = []) {
  const arr = Array.isArray(all) && all.length ? all : (EPISODES || []);
  return [...arr].sort((a, b) => {
    const pa = +new Date(a.publicAt || 0);
    const pb = +new Date(b.publicAt || 0);
    if (pa && pb && pa !== pb) return pa - pb;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/** Get the episode immediately after the given id, or null. */
export function getNextEpisode(currentId, all = []) {
  const list = getEpisodesOrdered(all);
  const i = list.findIndex((e) => e.id === currentId);
  if (i >= 0 && i < list.length - 1) return list[i + 1];
  return null;
}

/** Simple related: same list minus current; first N (default 6). */
export function getRelatedEpisodes(currentId, n = 6, all = []) {
  const list = getEpisodesOrdered(all);
  return list.filter((e) => e.id !== currentId).slice(0, n);
}
