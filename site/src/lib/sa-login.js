/**
 * Build a viewable URL for an object key.
 *
 * Prefer:
 *   1) uploadsApiUrl `/get` (returns a presigned GET URL)
 *   2) CDN / uploads CNAME (thumbsCdn, uploadsCdn, uploadsOrigin, etc.)
 *   3) Raw S3 bucket URL (only works if bucket / objects are public)
 */
export async function getSignedGetUrl(key) {
  if (!key) return null;

  // Already a full URL? Just use it directly.
  if (/^https?:\/\//i.test(String(key))) {
    return String(key);
  }

  const cleanedKey = String(key).replace(/^\/+/, "");

  try {
    const SA = await getSA().catch(() => undefined);
    const cfg = readCfg(SA);

    let url = null;

    // 1) Try uploads API `/get` for a presigned GET URL
    if (cfg.uploadsApiUrl) {
      try {
        const resp = await fetch(
          `${cfg.uploadsApiUrl.replace(/\/+$/, "")}/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // No Authorization header → simpler CORS; security is handled in the API itself
            body: JSON.stringify({ key: cleanedKey }),
          },
        );

        if (resp.ok) {
          const data = await resp.json().catch(() => ({}));
          if (data && data.url) {
            url = String(data.url);
          } else {
            console.warn(
              "[getSignedGetUrl] /get response missing url field",
              data,
            );
          }
        } else {
          console.warn(
            "[getSignedGetUrl] uploadsApi /get failed",
            resp.status,
            await resp.text().catch(() => ""),
          );
        }
      } catch (e) {
        console.warn("[getSignedGetUrl] error calling uploadsApi /get", e);
      }
    }

    // 2) If /get didn’t give us anything, try CDN / uploads base URL
    if (!url) {
      const baseUrl = (
        cfg.thumbsCdn ||
        cfg.uploadsCdn ||
        cfg.uploadsUrl ||
        cfg.uploadsOrigin ||
        cfg.assetsBaseUrl ||
        cfg.mediaBaseUrl ||
        cfg.webBucketOrigin ||
        ""
      ).replace(/\/+$/, "");

      if (baseUrl) {
        url = `${baseUrl}/${encodeURIComponent(cleanedKey)}`;
      }
    }

    // 3) Final fallback: raw S3 URL (only works if bucket is public)
    if (!url) {
      const bucket =
        cfg.uploadsBucket ||
        cfg.mediaBucket ||
        cfg.webBucket ||
        cfg.assetsBucket ||
        cfg.bucket ||
        cfg.BUCKET ||
        "";
      const region = cfg.region || "us-east-1";

      if (!bucket) {
        console.warn(
          "[getSignedGetUrl] No uploadsApiUrl / CDN / bucket configured",
          { cfg },
        );
        return null;
      }

      url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
        cleanedKey,
      )}`;
    }

    return url;
  } catch (e) {
    console.warn("[getSignedGetUrl] unexpected error", e);
    return null;
  }
}

