// site/src/routes/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../lib/sa";

export default function Home() {
  const nav = useNavigate();

  const handleSignIn = () => {
    // Use Auth.login so Cognito Hosted UI handles auth
    Auth.login();
  };

  const handleGuest = () => {
    // Light-weight way to explore the app
    nav("/fan");
  };

  const goToFan = () => {
    nav("/fan");
  };

  const goToBestie = () => {
    // For now, just sign in – once roles are wired,
    // you can route directly to /bestie if they’re a Bestie.
    handleSignIn();
  };

  const goToCreator = () => {
    // Creators will need an account too
    handleSignIn();
  };

  return (
    <main>
      <style>{`
        .hero {
          display:grid;
          gap:14px;
          padding:40px 20px 8px;
          text-align:center;
        }
        .hero h1 {
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 auto;
          max-width: 820px;
        }
        .hero p {
          color:#6b7280;
          font-size: clamp(16px, 2vw, 18px);
          margin: 0 auto;
          max-width: 760px;
        }
        .cta-row {
          display:flex;
          gap:10px;
          justify-content:center;
          flex-wrap:wrap;
          margin-top: 6px;
        }
        .btn {
          height:40px;
          padding:0 16px;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#fff;
          font-weight:700;
          cursor:pointer;
          font-size:14px;
        }
        .btn.primary { background:#111827; color:#fff; border-color:#111827; }
        .btn.ghost { background:#fff; color:#111827; }
        .btn.subtle {
          height:34px;
          padding:0 14px;
          font-weight:600;
          border-radius:999px;
          border:1px solid #e5e7eb;
          background:#f9fafb;
          font-size:13px;
        }
        .btn:hover { filter:brightness(0.98); }

        .section {
          padding: 24px 20px 40px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .section-header {
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          gap:16px;
          margin-bottom:16px;
        }
        .section-title {
          font-size:20px;
          font-weight:700;
        }
        .section-sub {
          color:#6b7280;
          font-size:14px;
        }

        .plans {
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap:16px;
        }
        .plan-card {
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:16px;
          padding:16px 16px 18px;
          display:flex;
          flex-direction:column;
          gap:8px;
        }
        .plan-label {
          display:inline-flex;
          align-items:center;
          gap:6px;
          padding:4px 10px;
          border-radius:999px;
          background:#f3f4ff;
          color:#111827;
          font-size:12px;
          font-weight:600;
          width:fit-content;
        }
        .plan-name {
          font-size:18px;
          font-weight:700;
        }
        .plan-tagline {
          font-size:14px;
          color:#4b5563;
        }
        .plan-list {
          margin:4px 0 8px;
          padding-left:18px;
          color:#374151;
          font-size:14px;
        }
        .plan-list li { margin:3px 0; }

        .plan-footer {
          margin-top:auto;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:8px;
          font-size:12px;
          color:#6b7280;
        }

        @media (max-width: 880px) {
          .plans {
            grid-template-columns: minmax(0, 1fr);
          }
          .section-header {
            flex-direction:column;
            align-items:flex-start;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="hero">
        <h1>Welcome to Styling Adventures</h1>
        <p>
          Play the fashion game, join the community, and unlock Bestie-only perks
          with Lala&apos;s closet.
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn primary"
            onClick={handleSignIn}
          >
            Sign in to start styling
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={handleGuest}
          >
            Browse as guest
          </button>
        </div>
      </section>

      {/* CHOOSE YOUR ADVENTURE */}
      <section className="section">
        <div className="section-header">
          <div>
            <div className="section-title">Choose your adventure</div>
            <div className="section-sub">
              Start as a fan, level up to Bestie, or share your own looks as a creator.
            </div>
          </div>
        </div>

        <div className="plans">
          {/* FAN */}
          <article className="plan-card">
            <span className="plan-label">Step 1 • Join as a Fan</span>
            <div className="plan-name">Fan</div>
            <p className="plan-tagline">
              Follow the vibes, save favorite looks, and explore Lala&apos;s world.
            </p>
            <ul className="plan-list">
              <li>Browse episodes and closet drops</li>
              <li>Save outfits you love</li>
              <li>Lightweight, no-pressure experience</li>
            </ul>
            <div className="plan-footer">
              <span>Perfect if you&apos;re just getting started.</span>
              <button
                type="button"
                className="btn subtle"
                onClick={goToFan}
              >
                Start as Fan
              </button>
            </div>
          </article>

          {/* BESTIE */}
          <article className="plan-card">
            <span className="plan-label">Level up • Inner circle</span>
            <div className="plan-name">Bestie</div>
            <p className="plan-tagline">
              Unlock the inner circle with early drops, polls, and VIP moments.
            </p>
            <ul className="plan-list">
              <li>Access Bestie-only content & stories</li>
              <li>Vote on future looks and collabs</li>
              <li>Surprises, shout-outs, and more</li>
            </ul>
            <div className="plan-footer">
              <span>Requires sign-in and Bestie status.</span>
              <button
                type="button"
                className="btn subtle"
                onClick={goToBestie}
              >
                Become a Bestie
              </button>
            </div>
          </article>

          {/* CREATOR */}
          <article className="plan-card">
            <span className="plan-label">Create • Share your style</span>
            <div className="plan-name">Creator</div>
            <p className="plan-tagline">
              Host your own closet, share looks, and connect with fans of your style.
            </p>
            <ul className="plan-list">
              <li>Upload outfits & style breakdowns</li>
              <li>Build a community around your looks</li>
              <li>Future collab & monetization tools</li>
            </ul>
            <div className="plan-footer">
              <span>Creator tools coming online in phases.</span>
              <button
                type="button"
                className="btn subtle"
                onClick={goToCreator}
              >
                Apply as Creator
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
