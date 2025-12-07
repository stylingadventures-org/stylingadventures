// site/src/routes/creator/CabinetView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { graphql } from "../../lib/sa";

const CABINET_QUERY = `
  query CreatorCabinetView($cabinetId: ID!) {
    creatorCabinet(id: $cabinetId) {
      id
      name
    }
    creatorCabinetAssets(cabinetId: $cabinetId) {
      id
      key
      label
      url
      kind
      createdAt
    }
  }
`;

// Adjust this to your actual mutation shape if needed.
const CREATE_UPLOAD_MUTATION = `
  mutation CreateCreatorAssetUpload(
    $cabinetId: ID!
    $filename: String!
    $contentType: String
  ) {
    createCreatorAssetUpload(
      cabinetId: $cabinetId
      filename: $filename
      contentType: $contentType
    ) {
      uploadUrl
      asset {
        id
        key
        label
        url
        kind
        createdAt
      }
    }
  }
`;

export default function CreatorCabinetView() {
  const { cabinetId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cabinet, setCabinet] = useState(null);
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!cabinetId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await graphql(CABINET_QUERY, { cabinetId });
        if (cancelled) return;

        setCabinet(data?.creatorCabinet || null);
        const raw = data?.creatorCabinetAssets || [];
        setAssets(Array.isArray(raw) ? raw : []);
      } catch (e) {
        console.error("[CreatorCabinetView] load error", e);
        if (!cancelled) {
          setError("We couldn’t load this cabinet. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cabinetId]);

  const sortedAssets = useMemo(
    () =>
      [...assets].sort((a, b) => {
        const da = a.createdAt ? Date.parse(a.createdAt) : 0;
        const db = b.createdAt ? Date.parse(b.createdAt) : 0;
        return db - da;
      }),
    [assets],
  );

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !cabinetId) return;

    setUploading(true);
    setError("");

    try {
      // 1) Ask backend for an upload URL + asset stub
      const data = await graphql(CREATE_UPLOAD_MUTATION, {
        cabinetId,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });

      const payload = data?.createCreatorAssetUpload;
      if (!payload?.uploadUrl) {
        throw new Error("Missing uploadUrl from createCreatorAssetUpload");
      }

      const uploadUrl = payload.uploadUrl;

      // 2) Upload file directly to S3 (or wherever the URL points)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        const txt = await putRes.text().catch(() => "");
        throw new Error(`Upload failed (${putRes.status}) ${txt}`);
      }

      // 3) If API returned an asset object, add it to the list
      if (payload.asset) {
        setAssets((prev) => [payload.asset, ...prev]);
      }
    } catch (e) {
      console.error("[CreatorCabinetView] upload error", e);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // reset input so the same file can be re-selected
      e.target.value = "";
    }
  }

  function handleBack() {
    navigate("/creator/library");
  }

  const assetCount = assets.length;

  return (
    <section className="section section-tight">
      <header className="section-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="link-muted"
              style={{ marginBottom: 4 }}
            >
              ← Back to library
            </button>
            <h2 className="section-title" style={{ marginTop: 4 }}>
              {cabinet?.name || "Cabinet"}
            </h2>
            <p className="section-subtitle">
              Upload and organize reference images, looks, and episode assets
              for this cabinet.
            </p>
          </div>
          <div className="muted">
            {assetCount} asset{assetCount === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      {/* Upload panel */}
      <div
        className="card card-ghost"
        style={{
          padding: "1rem 1.2rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <div>
          <div className="field-label">Upload new asset</div>
          <p className="muted" style={{ marginTop: 4, maxWidth: 420 }}>
            JPEG, PNG, or GIF. Files are stored in your creator bucket and
            linked to this cabinet.
          </p>
        </div>
        <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
          {uploading ? "Uploading…" : "Choose file"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Assets grid / empty state */}
      {loading ? (
        <p className="muted">Loading assets…</p>
      ) : sortedAssets.length === 0 ? (
        <div className="muted">
          No assets in this cabinet yet. Upload your first reference or look.
        </div>
      ) : (
        <div
          className="creator-assets-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "0.9rem",
          }}
        >
          {sortedAssets.map((asset) => (
            <article
              key={asset.id || asset.key}
              className="card card-ghost"
              style={{ padding: "0.5rem 0.5rem 0.75rem" }}
            >
              {asset.url ? (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  <img
                    src={asset.url}
                    alt={asset.label || asset.key || "Asset"}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    borderRadius: 8,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  No preview
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {asset.label || asset.key || "Untitled asset"}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {asset.kind || "image"}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
