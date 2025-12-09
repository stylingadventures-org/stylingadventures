// site/src/routes/creator/improve/AestheticBrandStudio.jsx
import React from "react";

export default function AestheticBrandStudio() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Improve · Aesthetic</span>
        <h1 className="creator-page__title">Aesthetic & Brand Studio</h1>
        <p className="creator-page__subtitle">
          Keep your aesthetic, palette, and vibe consistent across every post so
          your brand is instantly recognisable.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Brand identity hub</h2>
          <p className="creator-page__card-subtitle">
            This is where you&apos;ll define your brand colors, fonts, visual
            references, and first impression score.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Your PM can evolve this into a visual checklist and link it with
            Asset Library so creators always know what “on-brand” looks like.
          </p>
        </div>
      </div>
    </section>
  );
}
