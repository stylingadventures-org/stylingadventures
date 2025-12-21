// site/src/routes/prime/Magazine.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const ISSUES = [
  {
    id: "issue-001",
    number: 12,
    title: "Winter Glow Up Special",
    subtitle: "Fashion Forward in the Cold Months",
    date: "Dec 2025",
    status: "published",
    articles: 8,
    views: "124K",
    image: "❄️",
    featured: true
  },
  {
    id: "issue-002",
    number: 11,
    title: "Creator Spotlight: Rising Stars",
    subtitle: "Meet the Next Generation",
    date: "Nov 2025",
    status: "published",
    articles: 6,
    views: "98K",
    image: "⭐"
  },
  {
    id: "issue-003",
    number: 10,
    title: "Behind the Scenes",
    subtitle: "Styling Adventures Uncovered",
    date: "Oct 2025",
    status: "published",
    articles: 10,
    views: "156K",
    image: "🎬"
  },
  {
    id: "issue-004",
    number: 13,
    title: "Spring Refresh Collection",
    subtitle: "2026 Fashion Forecast",
    date: "Jan 2026",
    status: "drafting",
    articles: 3,
    views: "—",
    image: "🌸"
  }
];

const ARTICLE_TEMPLATES = [
  { id: "tmpl-1", name: "Feature Story", desc: "Long-form narrative", icon: "📖" },
  { id: "tmpl-2", name: "Interview", desc: "Creator/Expert Q&A", icon: "💬" },
  { id: "tmpl-3", name: "Style Guide", desc: "Outfit & tips", icon: "👗" },
  { id: "tmpl-4", name: "Behind-the-Scenes", desc: "Production diary", icon: "🎥" },
  { id: "tmpl-5", name: "Trend Report", desc: "Data & analysis", icon: "📊" },
  { id: "tmpl-6", name: "Creator Profile", desc: "Bio & achievements", icon: "👤" }
];

export default function PrimeMagazine() {
  const [activeView, setActiveView] = useState("issues");
  const [expandedIssue, setExpandedIssue] = useState(null);

  const publishedIssues = ISSUES.filter(i => i.status === "published").length;
  const totalArticles = ISSUES.reduce((sum, i) => sum + i.articles, 0);
  const totalViews = ISSUES.filter(i => i.status === "published")
    .reduce((sum, i) => {
      const views = parseFloat(i.views.replace(/[KM,]/g, ""));
      const mult = i.views.includes("M") ? 1000000 : 1000;
      return sum + (isNaN(views) ? 0 : views * mult);
    }, 0);

  return (
    <div className="prime-magazine">
      <style>{styles}</style>

      {/* HERO */}
      <section className="pm-hero card">
        <div className="pm-hero-main">
          <div>
            <p className="pm-pill">👑 PRIME STUDIOS</p>
            <h1 className="pm-title">Magazine Hub</h1>
            <p className="pm-sub">
              Create, curate, and publish editorial content. 
              Reach millions with Styling Adventures Magazine.
            </p>
          </div>
          <div className="pm-hero-right">
            <div className="pm-hero-card">
              <p className="pm-hero-label">Magazine Stats</p>
              <div className="pm-stats-grid">
                <div className="pm-stat-item">
                  <p className="pm-stat-value">{publishedIssues}</p>
                  <p className="pm-stat-label">Published</p>
                </div>
                <div className="pm-stat-item">
                  <p className="pm-stat-value">{totalArticles}</p>
                  <p className="pm-stat-label">Articles</p>
                </div>
                <div className="pm-stat-item">
                  <p className="pm-stat-value">{(totalViews / 1000).toFixed(0)}K</p>
                  <p className="pm-stat-label">Total Views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="pm-tabs">
        <button
          className={`pm-tab ${activeView === "issues" ? "active" : ""}`}
          onClick={() => setActiveView("issues")}
        >
          📑 Issues
        </button>
        <button
          className={`pm-tab ${activeView === "articles" ? "active" : ""}`}
          onClick={() => setActiveView("articles")}
        >
          📝 Articles
        </button>
        <button
          className={`pm-tab ${activeView === "templates" ? "active" : ""}`}
          onClick={() => setActiveView("templates")}
        >
          📋 Templates
        </button>
      </div>

      {/* ISSUES VIEW */}
      {activeView === "issues" && (
        <div className="pm-content">
          {ISSUES.map(issue => {
            const isExpanded = expandedIssue === issue.id;
            return (
              <div
                key={issue.id}
                className={`pm-issue-card card ${issue.status} ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
              >
                <div className="pm-issue-header">
                  <div className="pm-issue-image">{issue.image}</div>
                  <div className="pm-issue-info">
                    <p className="pm-issue-number">Issue #{issue.number}</p>
                    <h3 className="pm-issue-title">{issue.title}</h3>
                    <p className="pm-issue-subtitle">{issue.subtitle}</p>
                  </div>
                  <div className="pm-issue-meta">
                    <span className={`pm-status ${issue.status}`}>
                      {issue.status === "published" && "✓ Published"}
                      {issue.status === "drafting" && "✏️ Drafting"}
                    </span>
                    <p className="pm-issue-date">{issue.date}</p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pm-issue-details">
                    <div className="pm-detail-row">
                      <span className="pm-detail-label">Articles:</span>
                      <span className="pm-detail-value">{issue.articles}</span>
                    </div>
                    <div className="pm-detail-row">
                      <span className="pm-detail-label">Views:</span>
                      <span className="pm-detail-value">{issue.views}</span>
                    </div>
                    <div className="pm-actions">
                      <button className="btn btn-primary">Edit Issue</button>
                      <button className="btn btn-secondary">View Articles</button>
                      {issue.status === "drafting" && (
                        <button className="btn btn-primary">Publish</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ARTICLES VIEW */}
      {activeView === "articles" && (
        <div className="pm-content">
          <div className="pm-articles-grid">
            {ISSUES.flatMap(issue =>
              Array.from({ length: issue.articles }).map((_, i) => (
                <div key={`${issue.id}-${i}`} className="pm-article-card card">
                  <div className="pm-article-header">
                    <h4 className="pm-article-title">Article Title {i + 1}</h4>
                    <p className="pm-article-issue">Issue #{issue.number}</p>
                  </div>
                  <p className="pm-article-preview">Preview of the article content goes here...</p>
                  <div className="pm-article-footer">
                    <span className="pm-article-status">Draft</span>
                    <button className="btn btn-secondary">Edit</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TEMPLATES VIEW */}
      {activeView === "templates" && (
        <div className="pm-content">
          <div className="pm-templates-grid">
            {ARTICLE_TEMPLATES.map(template => (
              <div key={template.id} className="pm-template-card card">
                <p className="pm-template-icon">{template.icon}</p>
                <h4 className="pm-template-name">{template.name}</h4>
                <p className="pm-template-desc">{template.desc}</p>
                <button className="btn btn-primary">Use Template</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <section className="pm-actions card">
        <h2 className="pm-card-title">Publishing Tools</h2>
        <div className="pm-action-grid">
          <div className="pm-action-box">
            <h3 className="pm-action-title">📄 New Issue</h3>
            <p className="pm-action-sub">Start a new magazine issue</p>
            <button className="btn btn-primary">Create Issue</button>
          </div>
          <div className="pm-action-box">
            <h3 className="pm-action-title">📝 New Article</h3>
            <p className="pm-action-sub">Write an article from scratch</p>
            <button className="btn btn-primary">New Article</button>
          </div>
          <div className="pm-action-box">
            <h3 className="pm-action-title">📊 Analytics</h3>
            <p className="pm-action-sub">View engagement and reach metrics</p>
            <button className="btn btn-secondary">View Analytics</button>
          </div>
          <div className="pm-action-box">
            <h3 className="pm-action-title">📤 Distribution</h3>
            <p className="pm-action-sub">Share to newsletter and social</p>
            <button className="btn btn-secondary">Schedule</button>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="pm-affirm card">
        <div className="pm-affirm-text">
          <p className="pm-affirm-label">Magazine Platform</p>
          <p className="pm-affirm-main">Stories that inspire millions.</p>
          <p className="pm-affirm-sub">
            {publishedIssues} published issues reaching {(totalViews / 1000).toFixed(0)}K viewers. 
            Styling Adventures Magazine sets the tone for fashion culture. 👑
          </p>
        </div>
        <div className="pm-affirm-actions">
          <Link to="/prime" className="btn btn-primary">Back to Prime</Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.prime-magazine {
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
.pm-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(254, 215, 170, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(253, 190, 118, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.pm-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .pm-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.pm-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #b45309;
  border: 1px solid rgba(254, 243, 230, 0.9);
}

.pm-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.pm-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.pm-hero-right {
  display: flex;
  justify-content: flex-end;
}

.pm-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
  max-width: 280px;
}

.pm-hero-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.pm-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.pm-stat-item {
  text-align: center;
}

.pm-stat-value {
  margin: 0;
  font-weight: 700;
  font-size: 1.2rem;
  color: #111827;
}

.pm-stat-label {
  margin: 2px 0 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
}

/* TABS */
.pm-tabs {
  display: flex;
  gap: 8px;
}

.pm-tab {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.pm-tab:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.pm-tab.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  border-color: #f59e0b;
}

/* CONTENT */
.pm-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ISSUES */
.pm-issue-card {
  padding: 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.pm-issue-card:hover {
  box-shadow: 0 20px 50px rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
}

.pm-issue-header {
  display: flex;
  gap: 14px;
  align-items: center;
}

.pm-issue-image {
  font-size: 2.4rem;
  flex-shrink: 0;
}

.pm-issue-info {
  flex: 1;
  min-width: 0;
}

.pm-issue-number {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #9ca3af;
}

.pm-issue-title {
  margin: 4px 0 2px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.pm-issue-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.pm-issue-meta {
  text-align: right;
  flex-shrink: 0;
}

.pm-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.pm-status.published {
  background: #dbeafe;
  color: #0c4a6e;
}

.pm-status.drafting {
  background: #fef3c7;
  color: #b45309;
}

.pm-issue-date {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

.pm-issue-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.pm-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.pm-detail-label {
  color: #6b7280;
}

.pm-detail-value {
  font-weight: 600;
  color: #111827;
}

.pm-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* ARTICLES GRID */
.pm-articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.pm-article-card {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pm-article-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.pm-article-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pm-article-issue {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.pm-article-preview {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
  flex: 1;
}

.pm-article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pm-article-status {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
}

/* TEMPLATES GRID */
.pm-templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.pm-template-card {
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.pm-template-icon {
  margin: 0;
  font-size: 2rem;
}

.pm-template-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pm-template-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

/* QUICK ACTIONS */
.pm-actions {
  padding: 16px;
}

.pm-card-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.pm-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.pm-action-box {
  padding: 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
}

.pm-action-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.pm-action-sub {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* AFFIRM */
.pm-affirm {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, rgba(254, 243, 230, 0.9), #ffffff);
}

.pm-affirm-text {
  flex: 1 1 260px;
  min-width: 0;
}

.pm-affirm-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.pm-affirm-main {
  margin: 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.pm-affirm-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 520px;
}

.pm-affirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .pm-affirm-actions {
    align-items: flex-end;
    justify-content: center;
  }
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
  transition: transform 40ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #fff8f0;
  border-color: #fed7aa;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #f59e0b;
  color: #fff;
  box-shadow: 0 8px 18px rgba(245, 158, 11, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  border-color: #d97706;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}`;
