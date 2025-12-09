// site/src/routes/creator/grow/SocialOS.jsx
import React from "react";

export default function SocialOS() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Grow · Social OS</span>
        <h1 className="creator-page__title">Creator Social OS</h1>
        <p className="creator-page__subtitle">
          Scheduling, engagement inbox, and cross-platform analytics — a simple
          operating system for your content.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Distribution control room</h2>
          <p className="creator-page__card-subtitle">
            Over time, this can evolve into your full scheduling and
            engagement hub across TikTok, IG, and YouTube.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            For now it&apos;s a clean shell, ready for your data and API
            integrations once you&apos;re ready to wire them up.
          </p>
        </div>
      </div>
    </section>
  );
}
