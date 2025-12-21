// site/src/routes/admin/Moderation.jsx
import { useState } from "react";

const PENDING_UPLOADS = [
  {
    id: 1,
    creator: "Sofia Martinez",
    creatorId: "creator_456",
    type: "Episode clip",
    uploaded: "2 hours ago",
    status: "pending",
    thumbnail: "https://via.placeholder.com/160x90?text=Episode+Clip",
    brandSafety: "passing",
    flagged: false,
    issues: []
  },
  {
    id: 2,
    creator: "Jordan Lee",
    creatorId: "creator_789",
    type: "Closet item",
    uploaded: "4 hours ago",
    status: "pending",
    thumbnail: "https://via.placeholder.com/160x90?text=Closet+Item",
    brandSafety: "warning",
    flagged: true,
    issues: ["Potential copyright concern"]
  },
  {
    id: 3,
    creator: "Alex Chen",
    creatorId: "creator_123",
    type: "Community post",
    uploaded: "6 hours ago",
    status: "pending",
    thumbnail: "https://via.placeholder.com/160x90?text=Community+Post",
    brandSafety: "passing",
    flagged: false,
    issues: []
  }
];

const COMMENT_QUEUE = [
  {
    id: 1,
    author: "FashionFan22",
    comment: "This outfit is amazing! Where can I get it?",
    on: "Episode 5: Spring Refresh",
    timestamp: "1 hour ago",
    status: "approved"
  },
  {
    id: 2,
    author: "SkepticalJosh",
    comment: "This is way too expensive. Nobody can afford this.",
    on: "Closet item: Designer jacket",
    timestamp: "2 hours ago",
    status: "pending"
  },
  {
    id: 3,
    author: "StyleSpreader",
    comment: "[SPAM] Check out my channel for fashion tips!",
    on: "Episode 3: Winter Collection",
    timestamp: "3 hours ago",
    status: "flagged"
  },
  {
    id: 4,
    author: "CrewSupporter",
    comment: "The production quality this episode is incredible!",
    on: "Behind the Scenes: Production",
    timestamp: "4 hours ago",
    status: "approved"
  }
];

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState("uploads");
  const [uploadStatuses, setUploadStatuses] = useState(PENDING_UPLOADS);
  const [commentStatuses, setCommentStatuses] = useState(COMMENT_QUEUE);
  const [expandedUpload, setExpandedUpload] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandSafetyEnabled, setBrandSafetyEnabled] = useState(true);

  // Filter uploads by search
  const filteredUploads = uploadStatuses.filter(u =>
    u.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter comments by search
  const filteredComments = commentStatuses.filter(c =>
    c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle upload status change
  const updateUploadStatus = (id, newStatus) => {
    setUploadStatuses(
      uploadStatuses.map(u => u.id === id ? { ...u, status: newStatus } : u)
    );
  };

  // Handle comment status change
  const updateCommentStatus = (id, newStatus) => {
    setCommentStatuses(
      commentStatuses.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
  };

  const pendingCount = uploadStatuses.filter(u => u.status === "pending").length;
  const flaggedCount = uploadStatuses.filter(u => u.flagged).length;
  const commentPendingCount = commentStatuses.filter(c => c.status === "pending" || c.status === "flagged").length;

  return (
    <div className="admin-moderation">
      <style>{styles}</style>

      {/* HERO */}
      <section className="am-hero card">
        <div className="am-hero-main">
          <div>
            <p className="am-pill">🛡️ MODERATION</p>
            <h1 className="am-title">Content Review Center</h1>
            <p className="am-sub">
              Review and approve uploads, comments, and user-generated content. 
              Monitor brand safety and community guidelines.
            </p>
          </div>
          <div className="am-hero-stats">
            <div className="am-stat">
              <p className="am-stat-label">Pending Reviews</p>
              <p className="am-stat-value">{pendingCount}</p>
            </div>
            <div className="am-stat">
              <p className="am-stat-label">Flagged Items</p>
              <p className="am-stat-value">{flaggedCount}</p>
            </div>
            <div className="am-stat">
              <p className="am-stat-label">Comment Queue</p>
              <p className="am-stat-value">{commentPendingCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTERS */}
      <div className="am-controls card">
        <input
          type="text"
          placeholder="Search by creator, content type, or comment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="am-search"
        />
        
        <div className="am-filters">
          <label className="am-checkbox">
            <input
              type="checkbox"
              checked={brandSafetyEnabled}
              onChange={(e) => setBrandSafetyEnabled(e.target.checked)}
            />
            <span>Brand Safety Checks</span>
          </label>
        </div>
      </div>

      {/* TABS */}
      <div className="am-tabs card">
        <button
          className={`am-tab ${activeTab === "uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("uploads")}
        >
          Upload Review ({uploadStatuses.length})
        </button>
        <button
          className={`am-tab ${activeTab === "comments" ? "active" : ""}`}
          onClick={() => setActiveTab("comments")}
        >
          Comment Moderation ({commentStatuses.length})
        </button>
        <button
          className={`am-tab ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* UPLOADS TAB */}
      {activeTab === "uploads" && (
        <div className="am-content">
          <div className="am-uploads-grid">
            {filteredUploads.map(upload => {
              const isExpanded = expandedUpload === upload.id;
              return (
                <div
                  key={upload.id}
                  className={`am-upload-card card ${isExpanded ? "expanded" : ""}`}
                  onClick={() => setExpandedUpload(isExpanded ? null : upload.id)}
                >
                  <div className="am-upload-header">
                    <img
                      src={upload.thumbnail}
                      alt={upload.type}
                      className="am-thumbnail"
                    />
                    <div className="am-upload-info">
                      <p className="am-creator-name">{upload.creator}</p>
                      <p className="am-content-type">{upload.type}</p>
                      <p className="am-timestamp">{upload.uploaded}</p>
                    </div>
                    <div className="am-upload-badges">
                      {upload.flagged && <span className="badge flagged">🚩 Flagged</span>}
                      <span className={`badge brand-safety ${upload.brandSafety}`}>
                        {upload.brandSafety === "passing" ? "✓ Safe" : "⚠ Warning"}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="am-upload-details">
                      {upload.issues.length > 0 && (
                        <div className="am-issues">
                          <p className="am-detail-label">Issues:</p>
                          <ul className="am-issues-list">
                            {upload.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="am-actions">
                        <button
                          className="btn btn-approve"
                          onClick={() => updateUploadStatus(upload.id, "approved")}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => updateUploadStatus(upload.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                        <button className="btn btn-secondary">Ask Creator</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === "comments" && (
        <div className="am-content">
          <div className="am-comments-list">
            {filteredComments.map(comment => (
              <div key={comment.id} className="am-comment-item card">
                <div className="am-comment-header">
                  <div className="am-comment-author">
                    <p className="am-author-name">@{comment.author}</p>
                    <p className="am-comment-context">{comment.on}</p>
                    <p className="am-comment-time">{comment.timestamp}</p>
                  </div>
                  <span className={`badge status ${comment.status}`}>
                    {comment.status === "approved" && "✓ Approved"}
                    {comment.status === "pending" && "⏱ Pending"}
                    {comment.status === "flagged" && "🚩 Flagged"}
                  </span>
                </div>

                <p className="am-comment-text">"{comment.comment}"</p>

                {comment.status !== "approved" && (
                  <div className="am-comment-actions">
                    <button
                      className="btn btn-approve"
                      onClick={() => updateCommentStatus(comment.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => updateCommentStatus(comment.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="am-content am-settings">
          <div className="am-settings-card card">
            <h3 className="am-settings-title">Moderation Settings</h3>

            <div className="am-setting-group">
              <label className="am-setting-label">
                <input
                  type="checkbox"
                  checked={brandSafetyEnabled}
                  onChange={(e) => setBrandSafetyEnabled(e.target.checked)}
                />
                <span>Enable Automated Brand Safety Checks</span>
              </label>
              <p className="am-setting-desc">
                Automatically flag content that may violate brand guidelines
              </p>
            </div>

            <div className="am-setting-group">
              <label className="am-setting-label">
                <input type="checkbox" defaultChecked />
                <span>Auto-Approve Comments from Verified Creators</span>
              </label>
              <p className="am-setting-desc">
                Comments from admin-verified creators skip the review queue
              </p>
            </div>

            <div className="am-setting-group">
              <label className="am-setting-label">
                <input type="checkbox" defaultChecked />
                <span>Flag Spam & Promotional Content</span>
              </label>
              <p className="am-setting-desc">
                Automatically flag comments containing links and promotional language
              </p>
            </div>

            <div className="am-setting-group">
              <label className="am-setting-label">
                <input type="checkbox" />
                <span>Require Admin Approval for Sensitive Content</span>
              </label>
              <p className="am-setting-desc">
                Flag and require manual review of content tagged as sensitive
              </p>
            </div>

            <div className="am-settings-footer">
              <button className="btn btn-primary">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* AFFIRM */}
      <section className="am-affirm card">
        <p className="am-affirm-main">Keep the LaLa-Verse safe and authentic.</p>
        <p className="am-affirm-sub">
          Strong moderation protects creators, fans, and the community. 
          Review thoughtfully, act decisively.
        </p>
      </section>
    </div>
  );
}

const styles = `
.admin-moderation {
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
.am-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(219, 234, 254, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(191, 219, 254, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.am-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .am-hero-main {
    grid-template-columns: 1fr;
  }
}

.am-pill {
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

.am-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.am-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.am-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 900px) {
  .am-hero-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

.am-stat {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 16px;
  padding: 10px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  text-align: center;
}

.am-stat-label {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

.am-stat-value {
  margin: 4px 0 0;
  font-weight: 700;
  font-size: 1.4rem;
  color: #1e40af;
}

/* CONTROLS */
.am-controls {
  padding: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.am-search {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9rem;
  outline: none;
}

.am-search:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.am-filters {
  display: flex;
  gap: 10px;
}

.am-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
}

.am-checkbox input {
  cursor: pointer;
}

/* TABS */
.am-tabs {
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 22px 22px 0 0;
}

.am-tab {
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

.am-tab:hover {
  color: #111827;
}

.am-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* CONTENT */
.am-content {
  padding: 18px 0;
}

.am-uploads-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  padding: 0 0 18px;
}

.am-upload-card {
  padding: 12px;
  cursor: pointer;
  transition: all 200ms ease;
}

.am-upload-card:hover {
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.am-upload-header {
  display: flex;
  gap: 10px;
}

.am-thumbnail {
  width: 80px;
  height: 45px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.am-upload-info {
  flex: 1;
  min-width: 0;
}

.am-creator-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.am-content-type {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.am-timestamp {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.am-upload-badges {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.flagged {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.badge.brand-safety.passing {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.badge.brand-safety.warning {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}

.am-upload-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.am-issues {
  margin-bottom: 10px;
}

.am-detail-label {
  margin: 0 0 6px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 600;
}

.am-issues-list {
  margin: 0;
  padding: 0 0 0 20px;
}

.am-issues-list li {
  font-size: 0.85rem;
  color: #dc2626;
  margin-bottom: 4px;
}

.am-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* COMMENTS */
.am-comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0 18px;
}

.am-comment-item {
  padding: 14px;
}

.am-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.am-comment-author {
  flex: 1;
  min-width: 0;
}

.am-author-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: #111827;
}

.am-comment-context {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.am-comment-time {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

.badge.status {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.badge.status.approved {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.badge.status.pending {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}

.badge.status.flagged {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.am-comment-text {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
  font-style: italic;
}

.am-comment-actions {
  display: flex;
  gap: 6px;
}

/* SETTINGS */
.am-settings {
  padding: 18px;
}

.am-settings-card {
  padding: 18px;
}

.am-settings-title {
  margin: 0 0 14px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.am-setting-group {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.am-setting-group:last-child {
  border-bottom: none;
}

.am-setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #111827;
}

.am-setting-label input {
  cursor: pointer;
}

.am-setting-desc {
  margin: 6px 0 0 24px;
  font-size: 0.85rem;
  color: #6b7280;
}

.am-settings-footer {
  margin-top: 14px;
  text-align: right;
}

/* AFFIRM */
.am-affirm {
  padding: 18px;
  text-align: center;
}

.am-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.am-affirm-sub {
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
  padding: 6px 10px;
  cursor: pointer;
  transition: all 140ms ease;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-approve {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #16a34a;
}

.btn-approve:hover {
  background: rgba(34, 197, 94, 0.2);
}

.btn-reject {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #dc2626;
}

.btn-reject:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
  color: #fff;
  padding: 9px 14px;
  border-radius: 8px;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}
`;
