// site/src/routes/creator/monetization/SocialMonetization.jsx
import React from "react";

export default function SocialMonetization() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Monetization HQ</span>
        <h1 className="creator-page__title">Social Monetization</h1>
        <p className="creator-page__subtitle">
          Track payouts from TikTok, YouTube, Instagram, and other platforms.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Platform payouts</h2>
          <p className="creator-page__card-subtitle">
            This page will eventually show estimated and actual payouts by
            platform, plus top earning posts.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Right now it&apos;s a clean canvas that your team can wire to data
            when the time is right.
          </p>
        </div>
      </div>
    </section>
  );
}
