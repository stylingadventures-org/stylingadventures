// site/src/routes/bestie/Home.jsx
import React from "react";
import TierTabs from "../../components/TierTabs";

export default function BestieHome() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
      <TierTabs activeTier="Bestie" />

      <style>{`
        .bestie-hero {
          margin-top: 16px;
          padding: 24px 20px;
          border-radius: 18px;
          background: linear-gradient(135deg,#fee2f8,#e0f2fe);
          display:grid;
          gap:12px;
        }
        .bestie-hero h1 {
          margin:0;
          font-size: clamp(26px, 4vw, 32px);
          letter-spacing:-0.02em;
        }
        .bestie-hero p {
          margin:0;
          color:#4b5563;
        }
        .bestie-cta-row {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:6px;
        }
        .bestie-btn {
          height:40px;
          padding:0 16px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-weight:600;
          cursor:pointer;
        }
        .bestie-btn.primary {
          background:#111827;
          color:#fff;
          border-color:#111827;
        }
        .bestie-grid {
          margin-top:24px;
          display:grid;
          gap:16px;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
        }
        .bestie-card {
          background:#fff;
          border-radius:16px;
          border:1px solid #e5e7eb;
          padding:16px 18px;
        }
        .bestie-card h3 {
          margin:0 0 6px;
          font-size:16px;
        }
        .bestie-card p {
          margin:0;
          color:#6b7280;
          font-size:14px;
        }
      `}</style>

      <section className="bestie-hero">
        <div>
          <h1>Welcome to your Bestie studio 👑</h1>
          <p>
            This is where you’ll curate your own closet, share looks with the community,
            and unlock early-access perks.
          </p>
        </div>
        <div className="bestie-cta-row">
          <button
            className="bestie-btn primary"
            onClick={() => (window.location.href = "/bestie/closet")}
          >
            Open my closet
          </button>
          <button
            className="bestie-btn"
            onClick={() => (window.location.href = "/bestie/perks")}
          >
            View Bestie perks
          </button>
        </div>
      </section>

      <section className="bestie-grid">
        <article className="bestie-card">
          <h3>Create your closet</h3>
          <p>Upload pieces, organize looks, and get them ready for approval.</p>
        </article>
        <article className="bestie-card">
          <h3>Share with fans</h3>
          <p>Approved looks show up in Lala’s Closet for the community to browse.</p>
        </article>
        <article className="bestie-card">
          <h3>Earn XP & coins</h3>
          <p>Engagement with your closet helps you climb the leaderboard.</p>
        </article>
      </section>
    </div>
  );
}

