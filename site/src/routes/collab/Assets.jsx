// site/src/routes/collab/Assets.jsx
import { useState } from "react";

const ASSET_LIBRARY = [
  { id: 1, name: "Lala Logo", category: "branding", status: "approved", size: "2.4 MB", format: "PNG" },
  { id: 2, name: "Product Shot - Dress", category: "product", status: "approved", size: "3.1 MB", format: "JPG" },
  { id: 3, name: "Brand Guidelines", category: "guidelines", status: "approved", size: "1.8 MB", format: "PDF" },
  { id: 4, name: "New Product - Shoes", category: "product", status: "pending", size: "4.2 MB", format: "JPG" },
  { id: 5, name: "Campaign Banner", category: "marketing", status: "pending", size: "2.9 MB", format: "PNG" },
];

export default function CollabAssets() {
  const [activeTab, setActiveTab] = useState("browse");
  const [expandedAsset, setExpandedAsset] = useState(null);

  const toggleAsset = (assetId) => {
    setExpandedAsset(expandedAsset === assetId ? null : assetId);
  };

  const approved = ASSET_LIBRARY.filter(a => a.status === "approved");
  const pending = ASSET_LIBRARY.filter(a => a.status === "pending");

  return (
    <div className="collab-assets">
      <style>{styles}</style>

      {/* HERO */}
      <section className="ca-hero card">
        <div className="ca-hero-main">
          <div>
            <p className="ca-pill">📦 ASSET LIBRARY</p>
            <h1 className="ca-title">Brand Assets & Resources</h1>
            <p className="ca-sub">
              Upload, manage, and organize your brand assets. Share logos, product images, 
              guidelines, and promotional materials with partners.
            </p>
          </div>
          <div className="ca-hero-card">
            <p className="ca-stat-label">Total Assets</p>
            <p className="ca-stat-value">{ASSET_LIBRARY.length}</p>
            <p className="ca-stat-sub">{approved.length} approved, {pending.length} pending</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="ca-tabs card">
        <button
          className={`ca-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse Assets
        </button>
        <button
          className={`ca-tab ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload New
        </button>
        <button
          className={`ca-tab ${activeTab === "guidelines" ? "active" : ""}`}
          onClick={() => setActiveTab("guidelines")}
        >
          Brand Guidelines
        </button>
      </div>

      {/* BROWSE */}
      {activeTab === "browse" && (
        <div className="ca-content card">
          <h3 className="ca-section-title">Asset Library</h3>
          <p className="ca-section-sub">All available brand assets and resources</p>

          <div className="ca-assets-list">
            {ASSET_LIBRARY.map(asset => (
              <div key={asset.id} className="ca-asset-card">
                <div
                  className="ca-asset-header"
                  onClick={() => toggleAsset(asset.id)}
                >
                  <div className="ca-asset-info">
                    <div className="ca-asset-icon">
                      {asset.category === "branding" && "🎨"}
                      {asset.category === "product" && "📸"}
                      {asset.category === "guidelines" && "📋"}
                      {asset.category === "marketing" && "📢"}
                    </div>
                    <div className="ca-asset-details">
                      <h4 className="ca-asset-name">{asset.name}</h4>
                      <p className="ca-asset-meta">{asset.format} • {asset.size}</p>
                    </div>
                  </div>
                  <div className="ca-asset-status">
                    <span className={`ca-status-badge ${asset.status}`}>
                      {asset.status === "approved" && "✓ Approved"}
                      {asset.status === "pending" && "⏳ Pending"}
                    </span>
                    <span className="ca-chevron">{expandedAsset === asset.id ? "▼" : "▶"}</span>
                  </div>
                </div>

                {expandedAsset === asset.id && (
                  <div className="ca-asset-details-panel">
                    <div className="ca-detail-row">
                      <span className="ca-detail-label">Format</span>
                      <span className="ca-detail-value">{asset.format}</span>
                    </div>
                    <div className="ca-detail-row">
                      <span className="ca-detail-label">File Size</span>
                      <span className="ca-detail-value">{asset.size}</span>
                    </div>
                    <div className="ca-detail-row">
                      <span className="ca-detail-label">Category</span>
                      <span className="ca-detail-value">{asset.category}</span>
                    </div>
                    <div className="ca-detail-actions">
                      <button className="btn btn-primary">Download</button>
                      <button className="btn btn-secondary">View Details</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && (
        <div className="ca-content card">
          <h3 className="ca-section-title">Upload New Asset</h3>
          <p className="ca-section-sub">Add logos, product images, or promotional materials</p>

          <div className="ca-upload-section">
            <div className="ca-upload-zone">
              <p className="ca-upload-icon">📁</p>
              <h4 className="ca-upload-title">Drop files here or click to upload</h4>
              <p className="ca-upload-sub">PNG, JPG, PDF up to 10 MB</p>
              <input type="file" className="ca-file-input" />
            </div>

            <div className="ca-upload-form">
              <div className="ca-form-group">
                <label className="ca-form-label">Asset Name</label>
                <input type="text" className="ca-form-input" placeholder="e.g., Holiday Campaign Banner" />
              </div>

              <div className="ca-form-group">
                <label className="ca-form-label">Category</label>
                <select className="ca-form-select">
                  <option>Select category...</option>
                  <option>Branding</option>
                  <option>Product Images</option>
                  <option>Marketing</option>
                  <option>Guidelines</option>
                </select>
              </div>

              <div className="ca-form-group">
                <label className="ca-form-label">Description</label>
                <textarea className="ca-form-textarea" placeholder="Add notes about this asset..." />
              </div>

              <div className="ca-upload-actions">
                <button className="btn btn-primary">Upload Asset</button>
                <button className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GUIDELINES */}
      {activeTab === "guidelines" && (
        <div className="ca-content card">
          <h3 className="ca-section-title">Brand Guidelines</h3>
          <p className="ca-section-sub">Essential information for using brand assets</p>

          <div className="ca-guidelines-grid">
            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Logo Usage</h4>
              <ul className="ca-guideline-list">
                <li>Always maintain minimum clear space of 20px</li>
                <li>Never modify, stretch, or rotate the logo</li>
                <li>Use approved color variations only</li>
                <li>Ensure adequate contrast on all backgrounds</li>
              </ul>
            </div>

            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Color Palette</h4>
              <div className="ca-color-swatches">
                <div className="ca-swatch">
                  <div className="ca-color" style={{background: "#d97706"}}></div>
                  <p className="ca-swatch-name">Primary Gold</p>
                  <p className="ca-swatch-code">#d97706</p>
                </div>
                <div className="ca-swatch">
                  <div className="ca-color" style={{background: "#8b5cf6"}}></div>
                  <p className="ca-swatch-name">Accent Purple</p>
                  <p className="ca-swatch-code">#8b5cf6</p>
                </div>
              </div>
            </div>

            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Typography</h4>
              <ul className="ca-guideline-list">
                <li>Headlines: Inter Bold 32px</li>
                <li>Body: Inter Regular 16px</li>
                <li>Accents: Inter Medium 14px</li>
                <li>Line height: 1.5x for readability</li>
              </ul>
            </div>

            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Asset Formats</h4>
              <ul className="ca-guideline-list">
                <li>Logos: PNG with transparency (SVG preferred)</li>
                <li>Photos: JPG at 72 DPI minimum</li>
                <li>Documents: PDF for archival</li>
                <li>Web: Optimized for mobile devices</li>
              </ul>
            </div>

            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Social Media</h4>
              <ul className="ca-guideline-list">
                <li>YouTube: 1280×720 banner</li>
                <li>Instagram: Square (1080×1080) or Reel (1080×1920)</li>
                <li>TikTok: Vertical (1080×1920)</li>
                <li>Always include watermark</li>
              </ul>
            </div>

            <div className="ca-guideline-card">
              <h4 className="ca-guideline-title">Approval Process</h4>
              <ul className="ca-guideline-list">
                <li>Submit assets for review before use</li>
                <li>Approval typically takes 48-72 hours</li>
                <li>Final decision rests with brand team</li>
                <li>Contact support for urgent requests</li>
              </ul>
            </div>
          </div>

          <div className="ca-guidelines-action">
            <button className="btn btn-secondary">Download Brand Book</button>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="ca-affirm card">
        <p className="ca-affirm-main">Brand consistency builds trust.</p>
        <p className="ca-affirm-sub">
          Use approved assets, follow guidelines, maintain visual identity. Every touchpoint matters. ✨
        </p>
      </section>
    </div>
  );
}

const styles = `
.collab-assets {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.ca-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(147, 197, 253, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.ca-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .ca-hero-main {
    grid-template-columns: 1fr;
  }
}

.ca-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #1e40af;
  border: 1px solid rgba(219, 234, 254, 0.9);
}

.ca-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.ca-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.ca-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.ca-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.ca-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.ca-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TABS */
.ca-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.ca-tab {
  appearance: none;
  background: transparent;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 150ms ease;
  flex: 1;
}

.ca-tab:hover {
  color: #111827;
}

.ca-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* CONTENT */
.ca-content {
  padding: 18px;
}

.ca-section-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.ca-section-sub {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* ASSETS LIST */
.ca-assets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.ca-asset-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}

.ca-asset-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: all 150ms ease;
  background: #f9fafb;
}

.ca-asset-header:hover {
  background: #f3f4f6;
}

.ca-asset-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ca-asset-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.ca-asset-details {
  display: flex;
  flex-direction: column;
}

.ca-asset-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ca-asset-meta {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.ca-asset-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ca-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.ca-status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.ca-status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.ca-chevron {
  font-size: 0.85rem;
  color: #9ca3af;
  transition: transform 200ms ease;
}

/* DETAILS PANEL */
.ca-asset-details-panel {
  padding: 12px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.ca-detail-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.ca-detail-label {
  color: #6b7280;
  font-weight: 500;
}

.ca-detail-value {
  color: #111827;
}

.ca-detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* UPLOAD */
.ca-upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin: 12px 0;
}

@media (max-width: 900px) {
  .ca-upload-section {
    grid-template-columns: 1fr;
  }
}

.ca-upload-zone {
  padding: 24px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.ca-upload-zone:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.ca-upload-icon {
  font-size: 2.4rem;
  margin: 0 0 8px;
}

.ca-upload-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ca-upload-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.ca-file-input {
  display: none;
}

.ca-upload-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ca-form-group {
  display: flex;
  flex-direction: column;
}

.ca-form-label {
  margin-bottom: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.ca-form-input,
.ca-form-select,
.ca-form-textarea {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 150ms ease;
}

.ca-form-input:focus,
.ca-form-select:focus,
.ca-form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ca-form-textarea {
  resize: vertical;
  min-height: 80px;
}

.ca-upload-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* GUIDELINES */
.ca-guidelines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.ca-guideline-card {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.ca-guideline-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.ca-guideline-list {
  margin: 0;
  padding-left: 18px;
  list-style: none;
}

.ca-guideline-list li {
  margin-bottom: 6px;
  font-size: 0.85rem;
  color: #4b5563;
  position: relative;
  padding-left: 12px;
}

.ca-guideline-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: 700;
}

.ca-color-swatches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ca-swatch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ca-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.ca-swatch-name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
}

.ca-swatch-code {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-family: monospace;
}

.ca-guidelines-action {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* AFFIRM */
.ca-affirm {
  padding: 18px;
  text-align: center;
}

.ca-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.ca-affirm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #4b5563;
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
`;
