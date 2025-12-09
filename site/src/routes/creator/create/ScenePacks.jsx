// site/src/routes/creator/create/ScenePacks.jsx
import React from "react";

export default function ScenePacks() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Create · Director Suite</span>
        <h1 className="creator-page__title">Scene Packs</h1>
        <p className="creator-page__subtitle">
          Save and reuse your favorite shot recipes. Soon you&apos;ll be able to
          apply them to new videos with one tap.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Coming soon</h2>
          <p className="creator-page__card-subtitle">
            Scene Packs will let you build reusable combinations like
            “Hook → B-roll → Talking head CTA” for common content formats.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            For now, use the Director Suite shot list to experiment with what
            works. This space will become your library of “recipes” for
            production days.
          </p>
        </div>
      </div>
    </section>
  );
}
