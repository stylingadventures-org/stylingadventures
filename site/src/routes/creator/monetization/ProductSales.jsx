// site/src/routes/creator/monetization/ProductSales.jsx
import React from "react";

export default function ProductSales() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Monetization HQ</span>
        <h1 className="creator-page__title">Product Sales</h1>
        <p className="creator-page__subtitle">
          Track sales from Shopify, Etsy, Gumroad, Stan Store, and more.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Launch & product view</h2>
          <p className="creator-page__card-subtitle">
            This page is reserved for your product sales breakdown and launch
            performance.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            When you&apos;re ready, connect this to your actual storefronts or
            manual inputs for early versions.
          </p>
        </div>
      </div>
    </section>
  );
}
