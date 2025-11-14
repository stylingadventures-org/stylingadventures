// site/src/routes/bestie/Perks.jsx
import React from "react";
import TierTabs from "../../components/TierTabs";

export default function BestiePerks() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
      <TierTabs activeTier="Bestie" />

      <style>{`
        .perks-grid {
          margin-top:20px;
          display:grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap:16px;
        }
        .perk-card {
          background:#fff;
          border-radius:16px;
          border:1px solid #e5e7eb;
          padding:16px 18px;
        }
        .perk-card h3 {
          margin:0 0 6px;
          font-size:16px;
        }
        .perk-card p {
          margin:0;
          font-size:14px;
          color:#6b7280;
        }
      `}</style>

      <h1 style={{ marginTop: 16, marginBottom: 8 }}>Bestie perks</h1>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
        Besties unlock extra access around the game, the closet, and the community.
        Here’s what’s included right now.
      </p>

      <div className="perks-grid">
        <article className="perk-card">
          <h3>Early-access episodes</h3>
          <p>Watch new episodes before they drop for free fans.</p>
        </article>
        <article className="perk-card">
          <h3>Bestie-only closet uploads</h3>
          <p>Submit looks to your Bestie closet and share them with the community.</p>
        </article>
        <article className="perk-card">
          <h3>Bestie community polls</h3>
          <p>Vote on outfits, challenges, and upcoming drops.</p>
        </article>
        <article className="perk-card">
          <h3>Priority in the queue</h3>
          <p>Creator uploads from Besties get reviewed before free-tier submissions.</p>
        </article>
      </div>
    </div>
  );
}
