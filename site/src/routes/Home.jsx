// site/src/routes/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSA, signedUpload, getSignedGetUrl } from "../lib/sa";

const LS_KEY = "sa.lastUpload"; // we persist only { bucket, key }

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
  primary: { background: "#111827", color: "white", border: "1px solid #111827" },
  danger:  { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" },
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
  const [uploaded, setUploaded] = useState(null);   // result of current upload: {bucket,key,url(get)}
  const [saved, setSaved] = useState(null);         // {bucket, key} from localStorage
  const [freshUrl, setFreshUrl] = useState("");     // short-lived GET for saved key
  const [busy, setBusy] = useState(false);
  const blobUrlRef = useRef("");

  // Greet via AppSync and auto-dismiss
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

  // Restore last upload (bucket/key only) on mount
  useEffect(() => {
    try {
      const j = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (j?.bucket && j?.key) setSaved({ bucket: j.bucket, key: j.key });
    } catch {}
  }, []);

  // When we have a saved key, mint a fresh GET URL for preview
  useEffect(() => {
    (async () => {
      if (!saved?.key) { setFreshUrl(""); return; }
      try {
        const url = await getSignedGetUrl(saved.key);
        setFreshUrl(url);
      } catch (e) {
        console.warn("getSignedGetUrl failed:", e);
        setFreshUrl("");
      }
    })();
  }, [saved?.key]);

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

  async function doUpload() {
    if (!file) return;
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      const res = await signedUpload(file); // { bucket, key, url(get) }
      setUploaded(res);                     // immediate preview with res.url

      // Persist only bucket/key; presigned URLs expire
      const toSave = { bucket: res.bucket || null, key: res.key || null };
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
      setSaved(toSave);                     // triggers fresh GET URL fetch
      setMsg("✅ Upload succeeded!");
      setTimeout(() => setMsg(""), 5000);
    } catch (e) {
      setErr(`Upload failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // Choose preview priority:
  // 1) New file blob preview
  // 2) Just-uploaded signed GET url
  // 3) Freshly-minted GET url for saved key
  const showUrl = filePreviewUrl || uploaded?.url || freshUrl;

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
          style={{ ...btn.base, ...btn.primary, ...(busy || !file ? btn.disabled : {}) }}
        >
          {busy ? "Uploading…" : "Upload file"}
        </button>

        {saved?.key && (
          <button
            onClick={async () => {
              try { setFreshUrl(await getSignedGetUrl(saved.key)); }
              catch (e) { setErr(String(e?.message || e)); }
            }}
            style={{ ...btn.base }}
            title="Mint a new signed GET URL for the saved object"
          >
            Refresh preview URL
          </button>
        )}

        {saved?.key && (
          <button
            onClick={() => {
              localStorage.removeItem(LS_KEY);
              setSaved(null);
              setFreshUrl("");
              setUploaded(null);
              setFile(null);
            }}
            style={{ ...btn.base, ...btn.danger }}
          >
            Clear saved preview
          </button>
        )}
      </div>

      {(uploaded || showUrl || saved?.key) && (
        <div style={{ ...card.wrap, marginTop: 16 }}>
          {uploaded && <p style={card.good}>Upload succeeded!</p>}

          {(uploaded?.key || saved?.key) && (
            <div style={card.hint}>
              S3 key: <code>{uploaded?.key || saved?.key}</code>
            </div>
          )}

          {(uploaded?.url || freshUrl) && (
            <div style={{ marginTop: 6 }}>
              <span>Upload URL:&nbsp;</span>
              <a href={uploaded?.url || freshUrl} target="_blank" rel="noreferrer">
                {truncate(uploaded?.url || freshUrl, 120)}
              </a>
              <div style={card.hint}>(This signed URL expires; use “Refresh preview URL” anytime.)</div>
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
