// site/src/routes/creator/grow/SocialPulse.jsx
import React from "react";

export default function SocialPulse() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Grow · Social Pulse</span>
        <h1 className="creator-page__title">Creator Social Pulse</h1>
        <p className="creator-page__subtitle">
          Trend briefings, dead-trend warnings, and niche-specific content
          prompts — all tuned to your goals.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Trend briefings</h2>
          <p className="creator-page__card-subtitle">
            This page will become your daily/weekly brief about what&apos;s
            happening in your corner of the internet.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            As you build this out, think about showing “do this, not that”
            examples, plus how each idea ties back to your Lala Goal Compass.
          </p>
        </div>
      </div>
    </section>
  );
}
