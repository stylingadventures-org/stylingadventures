// site/src/lib/closetLikes.js
const KEY = "sa:closetLikes";

function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLikes(map) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getLikedIds() {
  const map = loadLikes();
  return Object.keys(map).filter((k) => !!map[k]);
}

export function hasLiked(id) {
  return !!loadLikes()[id];
}

export function toggleLikeLocal(id) {
  const map = loadLikes();
  map[id] = !map[id];
  saveLikes(map);
  return !!map[id];
}
