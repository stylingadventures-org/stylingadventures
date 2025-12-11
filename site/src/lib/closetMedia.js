// site/src/lib/closetMedia.js
import { getSignedGetUrl } from "./sa";

// IMPORTANT: this should match the public uploads CDN you’re already using
// in ClosetUpload admin UI.
const PUBLIC_UPLOADS_CDN = "https://d3fghr37bcpbig.cloudfront.net";

/**
 * Compute the effective S3 key for an item, with control over whether
 * we prefer the processed cutout (mediaKey) or the original upload (rawMediaKey).
 *
 * - preferRaw = false  → mediaKey first, then rawMediaKey
 * - preferRaw = true   → rawMediaKey first, then mediaKey
 */
function pickEffectiveKey(item, { preferRaw }) {
  const primary = preferRaw ? item.rawMediaKey : item.mediaKey;
  const secondary = preferRaw ? item.mediaKey : item.rawMediaKey;

  const k = primary || secondary || null;
  if (!k) return null;

  // normalize: strip leading slashes only
  return String(k).replace(/^\/+/, "");
}

/**
 * Given a list of closet items, attach a signed (or public CDN) URL
 * for their image keys.
 *
 * Usage examples:
 *
 *  - Admin Library (wants cutouts when available, fall back to raw):
 *      hydrateClosetItems(items, {
 *        preferRaw: false,
 *        urlField: "previewUrl",
 *        logPrefix: "[ClosetLibrary]",
 *      })
 *
 *  - Fan feed (always prefer cutout thumbnails):
 *      hydrateClosetItems(items, {
 *        preferRaw: false,
 *        urlField: "mediaUrl",
 *        logPrefix: "[ClosetFeed]",
 *      })
 *
 *  - If you wanted to always show the original photo:
 *      hydrateClosetItems(items, { preferRaw: true })
 *
 * @param {Array<Object>} items
 * @param {Object} [opts]
 * @param {boolean} [opts.preferRaw=false]  Prefer rawMediaKey over mediaKey
 * @param {string}  [opts.urlField="mediaUrl"] Field name to store URL on each item
 * @param {string}  [opts.logPrefix="[closetMedia]"] Console log prefix
 */
export async function hydrateClosetItems(items, opts = {}) {
  const {
    preferRaw = false,
    urlField = "mediaUrl",
    logPrefix = "[closetMedia]",
  } = opts;

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  // We keep logs very lightweight / dev-only
  const log = (...args) => {
    // eslint-disable-next-line no-console
    console.log(logPrefix, ...args);
  };
  const warn = (...args) => {
    // eslint-disable-next-line no-console
    console.warn(logPrefix, ...args);
  };

  return Promise.all(
    items.map(async (item) => {
      const key = pickEffectiveKey(item, { preferRaw });

      if (!key) {
        return {
          ...item,
          [urlField]: null,
        };
      }

      let url = null;

      // 1) Try signed URL through API
      try {
        url = await getSignedGetUrl(key);
        if (url) {
          log("signed URL ok", { key, url });
        }
      } catch (err) {
        warn("getSignedGetUrl failed → fallback to CDN", {
          key,
          error: err,
        });
      }

      // 2) Fallback to public CDN (same pattern as ClosetUpload)
      if (!url && PUBLIC_UPLOADS_CDN) {
        const encodedKey = String(key)
          .replace(/^\/+/, "") // strip only leading slashes
          .split("/")
          .map((seg) => encodeURIComponent(seg))
          .join("/");

        url = PUBLIC_UPLOADS_CDN.replace(/\/+$/, "") + "/" + encodedKey;

        log("built fallback CDN URL", { key, url });
      }

      return {
        ...item,
        [urlField]: url || null,
      };
    }),
  );
}
