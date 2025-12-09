// site/src/routes/creator/create/OnSetAssistant.jsx
import React from "react";

export default function OnSetAssistant() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Create · Director Suite</span>
        <h1 className="creator-page__title">On-Set Assistant</h1>
        <p className="creator-page__subtitle">
          A calm little control room that keeps you on script, on schedule, and
          in frame while you film.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Live filming helper</h2>
          <p className="creator-page__card-subtitle">
            This page is intended to become the “second brain” you open while
            filming — with line prompts, checklists, and scene progress.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            For now, it is a shell. When you connect Director Suite to this
            page, the scenes you plan will show up here as a step-by-step
            filming flow.
          </p>
        </div>
      </div>
    </section>
  );
}
