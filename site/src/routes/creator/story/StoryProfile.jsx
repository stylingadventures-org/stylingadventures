// site/src/routes/creator/story/StoryProfile.jsx
import React from "react";

export default function StoryProfile() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Story & Content Studio</span>
        <h1 className="creator-page__title">Story Profile</h1>
        <p className="creator-page__subtitle">
          Capture who you are, who you speak to, and how their life changes when
          they follow you.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Creator story basics</h2>
          <p className="creator-page__card-subtitle">
            This is your bio on steroids — the internal story reference that
            powers your hooks, intros, and series.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Your team can extend this into an editable profile that other tools
            (Director Suite, Business Content Fixer) can read from.
          </p>
        </div>
      </div>
    </section>
  );
}
