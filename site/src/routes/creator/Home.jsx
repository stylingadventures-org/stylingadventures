import React from "react";

export default function CreatorHome() {
  return (
    <div className="creator-home">
      <section className="creator-grid">
        <div className="creator-card creator-card-main">
          <h2>Today&apos;s snapshot</h2>
          <p className="creator-sub">
            High-level view of how your outfits and stories are doing.
          </p>

          <div className="creator-metrics">
            <div className="creator-metric">
              <div className="creator-metric-label">Story reach</div>
              <div className="creator-metric-value">—</div>
              <div className="creator-metric-sub">Coming soon</div>
            </div>
            <div className="creator-metric">
              <div className="creator-metric-label">Closet saves</div>
              <div className="creator-metric-value">—</div>
              <div className="creator-metric-sub">
                Track how often fans save your fits.
              </div>
            </div>
            <div className="creator-metric">
              <div className="creator-metric-label">XP from content</div>
              <div className="creator-metric-value">—</div>
              <div className="creator-metric-sub">
                Creator game economy hooks in here.
              </div>
            </div>
          </div>
        </div>

        <div className="creator-card">
          <h3>Quick actions</h3>
          <ul className="creator-list">
            <li>
              <a href="/creator/tools">Use AI to draft captions</a>
            </li>
            <li>
              <a href="/creator/stories">Plan a story from closet looks</a>
            </li>
            <li>
              <a href="/bestie/closet">Upload new fits in your closet</a>
            </li>
          </ul>
        </div>

        <div className="creator-card">
          <h3>What&apos;s included in Creator tier</h3>
          <ul className="creator-list bullets">
            <li>Access to AI caption + hashtag tools</li>
            <li>Story planner for Styling Adventures episodes</li>
            <li>Deeper stats on saves, reactions, and XP</li>
          </ul>
        </div>
      </section>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.creator-home {
  display:flex;
  flex-direction:column;
  gap:12px;
}

.creator-grid {
  display:grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr);
  gap:12px;
}
@media (max-width: 900px) {
  .creator-grid {
    grid-template-columns: minmax(0,1fr);
  }
}

.creator-card {
  background:#ffffff;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:12px 14px;
  box-shadow:0 10px 26px rgba(15,23,42,0.12);
}
.creator-card-main {
  grid-column:1 / -1;
}
.creator-card h2,
.creator-card h3 {
  margin:0;
  font-size:1.05rem;
  font-weight:600;
  color:#111827;
}
.creator-sub {
  margin:3px 0 8px;
  font-size:0.86rem;
  color:#6b7280;
}

.creator-metrics {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
  gap:10px;
}
.creator-metric {
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:8px 10px;
  background:#f9fafb;
}
.creator-metric-label {
  font-size:0.8rem;
  color:#6b7280;
}
.creator-metric-value {
  font-size:1.2rem;
  font-weight:600;
  color:#111827;
  margin-top:2px;
}
.creator-metric-sub {
  font-size:0.8rem;
  color:#9ca3af;
  margin-top:2px;
}

.creator-list {
  list-style:none;
  padding:0;
  margin:8px 0 0;
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:0.9rem;
}
.creator-list a {
  color:#111827;
  text-decoration:none;
}
.creator-list a:hover {
  text-decoration:underline;
}
.creator-list.bullets {
  list-style:disc;
  padding-left:16px;
}
.creator-list.bullets li {
  margin-left:2px;
}
`;
