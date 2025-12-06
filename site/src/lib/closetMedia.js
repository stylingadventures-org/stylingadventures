// Shared helpers for signing closet media keys and building preview URLs.
// Used by:
//   - admin/ClosetLibrary
//   - fan/ClosetFeed
// (ClosetUpload can keep using signedUpload as-is.)

import { getSignedGetUrl } from "./sa";

// IMPORTANT: same public CDN you’re using elsewhere
const PUBLIC_UPLOADS_CDN = "https://d3fghr37bcpbig.cloudfront.net";

/**
 * Prefer rawMediaKey first, then mediaKey, then any existing effectiveKey.
 * Strip leading slashes so keys work cleanly with CloudFront.
 */
export function effectiveClosetKey(item) {
  const key = item?.effectiveKey || item?.rawMediaKey || item?.mediaKey || null;
  if (!key) return null;
  return String(key).replace(/^\/+/, "");
}

/**
 * Given an array of closet items, attach a short-lived, signed GET URL.
 *
 * - `urlField` is the property name we put the URL on (e.g. "mediaUrl" or "previewUrl").
 * - If presigning fails, we fall back to PUBLIC_UPLOADS_CDN + key.
 */
export async function hydrateClosetItems(items, options = {}) {
  const { urlField = "previewUrl", logPrefix = "[closetMedia]" } = options || {};

  if (!Array.isArray(items) || items.length === 0) return [];

  return Promise.all(
    items.map(async (item) => {
      const key = effectiveClosetKey(item);
      if (!key) {
        return { ...item, [urlField]: null };
      }

      let url = null;

      try {
        url = await getSignedGetUrl(key);
        if (url) {
          // helpful in dev, quiet enough in prod
          // eslint-disable-next-line no-console
          console.log(`${logPrefix} signed URL ok`, { key, url });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`${logPrefix} getSignedGetUrl failed → fallback`, {
          key,
          error: err,
        });
      }

      // Fallback: raw CloudFront path
      if (!url && PUBLIC_UPLOADS_CDN) {
        const encodedKey = String(key)
          .replace(/^\/+/, "")
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");

        url = PUBLIC_UPLOADS_CDN.replace(/\/+$/, "") + "/" + encodedKey;

        // eslint-disable-next-line no-console
        console.log(`${logPrefix} Fallback URL built`, { key, url });
      }

      return { ...item, [urlField]: url || null };
    }),
  );
}
