// site/src/routes/creator/monetization/Affiliate.jsx
import React from "react";

export default function Affiliate() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Monetization HQ</span>
        <h1 className="creator-page__title">Lala Affiliate (Future)</h1>
        <p className="creator-page__subtitle">
          Reserved for future affiliate and revenue-share features inside the
          Lala ecosystem.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Future feature space</h2>
          <p className="creator-page__card-subtitle">
            This page exists in IA so your team can plan how Lala-powered
            affiliate programs will show up for creators.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Until those features are ready, the rest of Monetization HQ can
            still feel complete and intentional.
          </p>
        </div>
      </div>
    </section>
  );
}
