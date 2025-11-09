// site/src/routes/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSA, signedUpload } from "../lib/sa";

const LS_KEY = "sa.lastUpload"; // { bucket, key, url }

const card = {
  wrap: { marginTop: 16, padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" },
  good: { color: "#166534" },
  bad:  { color: "#991b1b" },
  hint: { fontSize: 12, color: "#6b7280" },
};

const btn = {
  base: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    cursor: "pointer",
  },
  primary: {
    background: "#111827",
    color: "white",
    border: "1px solid #111827",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};

const box = {
  preview: { width: 270, height: 270, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" },
};

function truncate(str, n = 80) {
  if (!str) return "";
  return str.length <= n ? str : str.slice(0, n) + "…";
}

export default function Home() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(null); // live upload result
  const [saved, setSaved] = useState(null);       // restored from localStorage
  const [busy, setBusy] = useState(false);
  const blobUrlRef = useRef("");

  // Say hello + auto-dismiss
  useEffect(() => {
    (async () => {
      try {
        const SA = await getSA();
        const data = await SA.gql(`query { hello }`);
        setMsg(`${data.hello} 👋`);
        setTimeout(() => setMsg(""), 4500);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    })();
  }, []);

  // Restore last upload on mount
  useEffect(() => {
    try {
      const j = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (j && (j.url || (j.bucket && j.key))) setSaved(j);
    } catch {}
  }, []);

  // Build a temporary blob URL for a *new* file preview
  const filePreviewUrl = useMemo(() => {
    if (file instanceof Blob) {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const u = URL.createObjectURL(file);
      blobUrlRef.current = u;
      return u;
    }
    return "";
  }, [file]);

  // Clean up blob on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Helper: compute a public URL from upload result or saved record
  function derivePublicUrl(rec, regionFallback = "us-east-1") {
    if (!rec) return "";
    if (rec.publicUrl) return rec.publicUrl;           // from your presigner (if provided)
    if (rec.url && /^https?:\/\//.test(rec.url)) return rec.url; // already usable
    if (rec.bucket && rec.key) {
      const region = (window.SA?.cfg?.().region) || regionFallback;
      return `https://${rec.bucket}.s3.${region}.amazonaws.com/${rec.key}`;
    }
    return "";
  }

  async function doUpload() {
    if (!file) return;
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await signedUpload(file);
      setUploaded(res);

      // Decide on the best long-lived URL to persist
      const publicUrl = derivePublicUrl(res);

      // Save to localStorage so it survives refreshes
      const toSave = { bucket: res.bucket || null, key: res.key || null, url: publicUrl || res.url || null };
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
      setSaved(toSave);

      setMsg("✅ Upload succeeded!");
      setTimeout(() => setMsg(""), 5000);
    } catch (e) {
      setErr(`Upload failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // Choose which preview to show:
  const persistedUrl = derivePublicUrl(saved);
  const showUrl = filePreviewUrl || persistedUrl;

  return (
    <main>
      <h1>Home</h1>

      <div style={card.wrap}>
        <p>
          AppSync says:{" "}
          {err ? <strong style={card.bad}>{err}</strong> : <span style={card.good}>{msg || "…"}</span>}
        </p>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ ...btn.base }}>
          <input
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFile(f || null);
              setUploaded(null);
              setErr("");
              setMsg("");
            }}
          />
          Choose file
        </label>

        <button
          onClick={doUpload}
          disabled={!file || busy}
          style={{
            ...btn.base,
            ...btn.primary,
            ...(busy || !file ? btn.disabled : {}),
          }}
        >
          {busy ? "Uploading…" : "Upload file"}
        </button>
      </div>

      {(uploaded || showUrl) && (
        <div style={{ ...card.wrap, marginTop: 16 }}>
          {uploaded && <p style={card.good}>Upload succeeded!</p>}

          {(uploaded?.key || saved?.key) && (
            <div style={card.hint}>
              S3 key: <code>{uploaded?.key || saved?.key}</code>
            </div>
          )}

          {(uploaded?.url || persistedUrl) && (
            <div style={{ marginTop: 6 }}>
              <span>Upload URL:&nbsp;</span>
              <a href={uploaded?.url || persistedUrl} target="_blank" rel="noreferrer">
                {truncate(uploaded?.url || persistedUrl, 120)}
              </a>
              <div style={card.hint}>(If this is a signed URL, it may expire.)</div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Preview:</div>
            {showUrl ? (
              <img src={showUrl} alt="preview" style={box.preview} />
            ) : (
              <div style={{ ...box.preview, display: "grid", placeItems: "center", color: "#6b7280" }}>
                No image yet
              </div>
            )}
          </div>
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: "#6b7280" }}>© Styling Adventures</p>
    </main>
  );
}

