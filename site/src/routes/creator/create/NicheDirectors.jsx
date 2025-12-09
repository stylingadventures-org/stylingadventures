// site/src/routes/creator/create/NicheDirectors.jsx
import React from "react";

export default function NicheDirectors() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Create · Director Suite</span>
        <h1 className="creator-page__title">Niche Directors</h1>
        <p className="creator-page__subtitle">
          Hair, nails, makeup, fashion, lifestyle — each mini-director will
          specialise in one part of your world.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Under construction</h2>
          <p className="creator-page__card-subtitle">
            This is where Niche Directors will live — expert assistive UIs for
            different content pillars (like “Hair day”, “Nail drop”, or
            “Morning routine”).
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Your PM can use this page to experiment with the first niche
            (e.g. hair or outfits) and then clone the pattern for others.
          </p>
        </div>
      </div>
    </section>
  );
}
