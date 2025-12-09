// site/src/routes/creator/story/ErasSeasons.jsx
import React from "react";

export default function ErasSeasons() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Story & Content Studio</span>
        <h1 className="creator-page__title">Eras & Seasons</h1>
        <p className="creator-page__subtitle">
          Define the era you&apos;re in (and the one you&apos;re stepping into)
          so content feels cohesive, not random.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Era planner</h2>
          <p className="creator-page__card-subtitle">
            Think of this as your “season bible” — mood, goals, themes, and the
            kind of story you&apos;re telling right now.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Later, this can influence prompts in Director Suite and trend
            suggestions in Social Pulse.
          </p>
        </div>
      </div>
    </section>
  );
}
