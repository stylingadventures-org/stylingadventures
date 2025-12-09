// site/src/routes/creator/story/ContentPlannerCalendar.jsx
import React from "react";

export default function ContentPlannerCalendar() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Story & Content Studio</span>
        <h1 className="creator-page__title">Content Planner & Calendar</h1>
        <p className="creator-page__subtitle">
          A calendar-style view of your upcoming posts, launches, and series
          episodes.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Calendar shell</h2>
          <p className="creator-page__card-subtitle">
            This is the future home of your full content calendar, with
            per-platform variants and tags.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            For now, it&apos;s a visual placeholder so PMs can design the
            calendar interaction before implementation.
          </p>
        </div>
      </div>
    </section>
  );
}
