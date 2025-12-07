// site/src/routes/creator/Stories.jsx
import React from "react";

const demoStories = [
  {
    id: "st1",
    title: "Holiday Glam Drop teaser",
    status: "SCHEDULED",
    when: "Fri • 5:00 PM",
  },
  {
    id: "st2",
    title: "Episode 3: BTS mirror checks",
    status: "DRAFT",
    when: "Unscheduled",
  },
];

export default function CreatorStories() {
  return (
    <section className="creator-stories">
      <style>{styles}</style>

      <div className="creator-card">
        <div className="stories-head">
          <div>
            <h2>Story planner</h2>
            <p className="stories-sub">
              Connect closet looks into sequences for drops, episodes, and
              events. This will later wire into the Besties story workflow +
              Step Functions.
            </p>
          </div>
          <button
            type="button"
            className="stories-btn"
            onClick={() =>
              alert("New story flow will integrate with Bestie stories.")
            }
          >
            New story
          </button>
        </div>

        <ul className="stories-list">
          {demoStories.map((s) => (
            <li key={s.id} className="stories-row">
              <div className="stories-main">
                <div className="stories-title">{s.title}</div>
                <div className="stories-meta">
                  {s.status === "SCHEDULED" ? "Scheduled" : "Draft"} •{" "}
                  {s.when}
                </div>
              </div>
              <div className="stories-actions">
                <button
                  type="button"
                  className="stories-link"
                  onClick={() =>
                    alert(
                      "Here we will show attached closet items + schedule controls.",
                    )
                  }
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const styles = `
.creator-card {
  background:#f9fafb;
  border-radius:16px;
  border:1px solid #e5e7eb;
  padding:14px;
  box-shadow:0 10px 24px rgba(15,23,42,0.08);
}

.creator-stories h2 {
  margin:0 0 4px;
  font-size:1rem;
}
.stories-sub {
  margin:0;
  font-size:0.86rem;
  color:#6b7280;
}

.stories-head {
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
.stories-btn {
  border-radius:999px;
  border:none;
  background:#111827;
  color:#f9fafb;
  font-size:0.86rem;
  padding:6px 12px;
  cursor:pointer;
}

.stories-list {
  margin:10px 0 0;
  padding:0;
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:6px;
}
.stories-row {
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  background:#f3f4f6;
}
.stories-main {
  display:flex;
  flex-direction:column;
  gap:2px;
}
.stories-title {
  font-size:0.92rem;
  font-weight:600;
}
.stories-meta {
  font-size:0.8rem;
  color:#6b7280;
}
.stories-actions {
  display:flex;
  align-items:center;
}
.stories-link {
  background:transparent;
  border:none;
  padding:0;
  font-size:0.82rem;
  color:#111827;
  cursor:pointer;
}
`;
