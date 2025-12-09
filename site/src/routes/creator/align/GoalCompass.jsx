// site/src/routes/creator/align/GoalCompass.jsx
import React from "react";

export default function GoalCompass() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Align · Lala Goal Compass</span>
        <h1 className="creator-page__title">Lala Goal Compass</h1>
        <p className="creator-page__subtitle">
          Set your season&apos;s main objective and keep every shoot aligned
          with what actually matters to you.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Goal presets & paths</h2>
          <p className="creator-page__card-subtitle">
            Soon, you&apos;ll pick between Growth, Balance, or Business-first
            modes — and we&apos;ll tune your prompts and suggestions around that.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Use this as the “strategy home” for your creator business. Your PM
            can define how chosen goals flow into Director Suite, Improve tools,
            and Monetization HQ.
          </p>
        </div>
      </div>
    </section>
  );
}
