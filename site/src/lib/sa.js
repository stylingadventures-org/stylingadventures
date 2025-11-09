// site/src/lib/sa.js

/** Return the global SA helper once it's ready */
export async function getSA() {
  if (window.SA) return window.SA;
  if (window.SAReady) return window.SAReady;
  // Fallback: wait a tick and try again
  await new Promise(r => setTimeout(r, 0));
  return window.SA;
}

/** Upload helper for React code.
 *  Delegates to window.signedUpload (from public/sa.js) if present.
 */
export async function signedUpload(fileOrText) {
  if (typeof window.signedUpload === "function") {
    return window.signedUpload(fileOrText);
  }

  // Minimal inline implementation if global isn't present
  const SA = await getSA();
  const cfg = SA?.cfg?.() || {};
  if (!cfg.uploadsApiUrl) throw new Error("Missing uploadsApiUrl in config.v2.json");

  // Support a File/Blob or a string
  let blob, key;
  if (fileOrText instanceof Blob) {
    blob = fileOrText;
    const name = fileOrText.name || `upload-${Date.now()}.bin`;
    key = `users/${name}`;
  } else {
    blob = new Blob([String(fileOrText ?? "hello")], { type: "text/plain" });
    key = `dev-tests/${Date.now()}.txt`;
  }

  // Request a presign
  const presignRes = await fetch(`${cfg.uploadsApiUrl}/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        sessionStorage.getItem("id_token") ||
        localStorage.getItem("sa_id_token") ||
        "",
    },
    body: JSON.stringify({ key, contentType: blob.type || "application/octet-stream" }),
  });
  if (!presignRes.ok) throw new Error(`presign failed (${presignRes.status})`);
  const presign = await presignRes.json();

  // Upload (POST or PUT)
  if (presign.method === "POST" || presign.fields) {
    const form = new FormData();
    Object.entries(presign.fields || {}).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);
    const up = await fetch(presign.url, { method: "POST", body: form });
    if (!up.ok) throw new Error(`upload failed (${up.status})`);
  } else {
    const up = await fetch(presign.url, {
      method: presign.method || "PUT",
      headers: presign.headers || { "Content-Type": blob.type || "application/octet-stream" },
      body: blob,
    });
    if (!up.ok) throw new Error(`upload failed (${up.status})`);
  }

  return {
    key,
    bucket: presign.bucket,
    url: presign.publicUrl || presign.url, // may be signed; still useful to show
  };
}
