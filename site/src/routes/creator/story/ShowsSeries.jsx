// site/src/routes/creator/story/ShowsSeries.jsx
import React from "react";

export default function ShowsSeries() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Story & Content Studio</span>
        <h1 className="creator-page__title">Shows & Series</h1>
        <p className="creator-page__subtitle">
          Turn random posts into recurring shows that your audience can fall in
          love with.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Series builder</h2>
          <p className="creator-page__card-subtitle">
            This page will list your recurring formats — GRWMs, closet raids,
            “day in the life”, and more.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Later, your team can connect each show to posting cadence,
            thumbnail patterns, and monetization tags.
          </p>
        </div>
      </div>
    </section>
  );
}
