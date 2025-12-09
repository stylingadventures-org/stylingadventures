// site/src/routes/creator/monetization/BrandDeals.jsx
import React from "react";

export default function BrandDeals() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Monetization HQ</span>
        <h1 className="creator-page__title">Brand Deals & Sponsorships</h1>
        <p className="creator-page__subtitle">
          Keep track of your deal pipeline, rates, deliverables, and payments.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Deal pipeline</h2>
          <p className="creator-page__card-subtitle">
            Think of this as your sales CRM for brand partnerships — from
            outreach to signed to paid.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            This stub gives PMs a dedicated space to design that flow without
            blocking on back-end work yet.
          </p>
        </div>
      </div>
    </section>
  );
}
