// site/src/lib/thumbs.js

function getUploadsBase() {
  const cfg = (window && window.__cfg) || {};
  const fromCfg = cfg.uploadsApiUrl;
  const fromEnv = import.meta.env.VITE_UPLOADS_API_URL;
  const base = fromCfg || fromEnv || "";
  return base.replace(/\/+$/, "");
}

/**
 * Get a short-lived GET URL for an existing S3 object.
 * Returns null on any error so callers can show a placeholder.
 */
export async function getThumbUrlForMediaKey(mediaKey) {
  if (!mediaKey) return null;

    const uploadsBase = getUploadsBase();
  if (
    !uploadsBase ||
    uploadsBase.includes("REPLACE_WITH_UPLOADS_API_URL") // dev placeholder
  ) {
    console.warn("[thumbs] uploadsApiUrl not set or placeholder; skipping thumb presign");
    return null;
  }

  const url = `${uploadsBase}/presign?key=${encodeURIComponent(
    mediaKey,
  )}&method=GET`;

  try {
    const res = await fetch(url, { credentials: "include" });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        "[thumbs] presign GET failed",
        res.status,
        res.statusText,
        text,
      );
      return null;
    }

    const json = await res.json().catch(() => null);
    if (!json) return null;

    return json.url || json.getUrl || json.publicUrl || null;
  } catch (err) {
    console.warn("[thumbs] presign request error", err);
    return null;
  }
}
