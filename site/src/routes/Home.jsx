// site/src/routes/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const nav = useNavigate();
  const { isAuthenticated, userTier } = useAuth();

  const handleSignIn = () => {
    window.dispatchEvent(new CustomEvent("openLoginModal"));
  };

  const goToSection = () => {
    // Navigate to user's primary section based on tier
    const sectionMap = {
      ADMIN: "/admin",
      PRIME: "/prime",
      CREATOR: "/creator",
      BESTIE: "/bestie",
      COLLAB: "/creator", // Collaborators go to creator section
      FAN: "/fan",
    };
    const targetSection = sectionMap[userTier] || "/fan";
    nav(targetSection);
  };

  const goToFan = () => {
    nav("/signup/fan");
  };

  const goToBestie = () => {
    nav("/signup/bestie");
  };

  const goToCreator = () => {
    nav("/signup/creator");
  };

  const goToCollab = () => {
    nav("/signup/collab");
  };

  return (
    <div className="home-shell">
      <style>{`
        .home-shell {
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        /* -------- HERO -------- */
        .home-hero {
          position: relative;
          margin: 0 0 4px;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.9);
          background: linear-gradient(135deg, #fde7f4, #e0f2fe);
          box-shadow: 0 18px 40px rgba(15,23,42,0.08);
          overflow: hidden;
        }
        .home-hero::before {
          content: "";
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(circle at 0 0, rgba(255,255,255,0.65), transparent 60%),
            radial-gradient(circle at 100% 0, rgba(255,255,255,0.45), transparent 60%);
          opacity: 0.9;
          pointer-events: none;
        }
        .home-hero-inner {
          position: relative;
          padding: 30px 22px 26px;
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
          display: grid;
          gap: 14px;
        }

        .home-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(148,163,184,0.4);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .14em;
          color: #6b21a8;
          margin: 0 auto;
        }
        .home-hero-tag-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(135deg,#6366f1,#ec4899);
          box-shadow: 0 0 0 2px #fefce8;
        }

        .home-hero-title {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #0f172a;
        }
        .home-hero-sub {
          margin: 0;
          font-size: clamp(15px, 2vw, 18px);
          color: #4b5563;
        }

        .home-hero-chips {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-top: 2px;
        }
        .home-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(226,232,240,0.9);
          font-size: 12px;
          color: #4b5563;
        }

        .home-hero-cta {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
        }
        .home-btn {
          min-height: 40px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition:
            background .15s ease,
            border-color .15s ease,
            transform .04s ease,
            box-shadow .15s ease;
        }
        .home-btn:hover {
          background: #f9fafb;
          box-shadow: 0 8px 22px rgba(148,163,184,0.35);
          transform: translateY(-1px);
        }
        .home-btn:active {
          transform: translateY(0);
          box-shadow: none;
        }
        .home-btn-primary {
          background: #111827;
          border-color: #111827;
          color: #ffffff;
        }
        .home-btn-ghost {
          background: rgba(255,255,255,0.9);
          color: #111827;
        }

        /* -------- CHOOSE YOUR ADVENTURE -------- */
        .home-section {
          margin-bottom: 8px;
        }
        .home-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 16px;
        }
        .home-section-title {
          font-size: 20px;
          font-weight: 700;
        }
        .home-section-sub {
          font-size: 14px;
          color: #6b7280;
          max-width: 460px;
        }

        .home-plans {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .home-plan {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          padding: 16px 16px 18px;
          box-shadow: 0 14px 35px rgba(15,23,42,0.06);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .home-plan-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: #f5f3ff;
          color: #4338ca;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .12em;
          width: fit-content;
        }
        .home-plan-icon {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: #111827;
          color: #f9fafb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 8px 20px rgba(15,23,42,0.45);
        }
        .home-plan-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .home-plan-name {
          font-size: 18px;
          font-weight: 700;
        }
        .home-plan-tagline {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
        }
        .home-plan-list {
          margin: 6px 0 10px;
          padding-left: 18px;
          font-size: 14px;
          color: #374151;
        }
        .home-plan-list li {
          margin: 3px 0;
        }

        .home-plan-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .home-plan-cta {
          min-height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background .15s ease, box-shadow .15s ease, transform .04s ease;
        }
        .home-plan-cta:hover {
          background: #f3f4ff;
          box-shadow: 0 6px 18px rgba(148,163,184,0.3);
          transform: translateY(-1px);
        }
        .home-plan-cta:active {
          transform: translateY(0);
          box-shadow: none;
        }

        @media (max-width: 880px) {
          .home-hero-inner {
            padding: 24px 18px 22px;
          }
          .home-section-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .home-plans {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          .home-shell {
            gap: 22px;
          }
          .home-hero-inner {
            padding: 20px 16px 18px;
          }
          .home-plan {
            padding: 14px 14px 16px;
          }
        }
      `}</style>

      {/* HERO */}
      <section className="home-hero" aria-label="Styling Adventures intro">
        <div className="home-hero-inner">
          <div className="home-hero-tag">
            <span className="home-hero-tag-dot" />
            <span>Welcome to Styling Adventures</span>
          </div>
          <h1 className="home-hero-title">
            Play the fashion game with Lala&apos;s closet & community.
          </h1>
          <p className="home-hero-sub">
            Watch episodes, style looks, and unlock Bestie-only perks as you earn
            petals (XP) along the way.
          </p>

          <div className="home-hero-chips">
            <span className="home-chip">🎮 Style games</span>
            <span className="home-chip">🎬 Early episode drops</span>
            <span className="home-chip">💌 Bestie perks & polls</span>
          </div>

          <div className="home-hero-cta">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="home-btn home-btn-primary"
                  onClick={goToSection}
                >
                  Go to my section ({userTier || "FAN"})
                </button>
                <button
                  type="button"
                  className="home-btn home-btn-ghost"
                  onClick={() => nav("/profile")}
                >
                  View my profile
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="home-btn home-btn-primary"
                  onClick={handleSignIn}
                >
                  Sign in to start styling
                </button>
                <button
                  type="button"
              className="home-btn home-btn-ghost"
              onClick={goToFan}
            >
              Browse as guest
            </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CHOOSE YOUR ADVENTURE */}
      <section className="home-section" aria-label="Choose your adventure">
        <div className="home-section-header">
          <div>
            <div className="home-section-title">Choose your adventure</div>
            <div className="home-section-sub">
              Start as a fan, level up to Bestie, or grow into a creator as new tools
              roll out.
            </div>
          </div>
        </div>

        <div className="home-plans">
          {/* FAN */}
          <article className="home-plan">
            <span className="home-plan-chip">Step 1 • Join as a Fan</span>
            <div className="home-plan-head">
              <div className="home-plan-name">Fan</div>
              <span className="home-plan-icon">🌈</span>
            </div>
            <p className="home-plan-tagline">
              Follow the vibes, save favorite looks, and explore Lala&apos;s world.
            </p>
            <ul className="home-plan-list">
              <li>Browse episodes and closet drops</li>
              <li>Save outfits you love</li>
              <li>Lightweight, no-pressure experience</li>
            </ul>
            <div className="home-plan-footer">
              <span>Perfect if you&apos;re just getting started.</span>
              <button
                type="button"
                className="home-plan-cta"
                onClick={goToFan}
              >
                Start as Fan
              </button>
            </div>
          </article>

          {/* BESTIE */}
          <article className="home-plan">
            <span className="home-plan-chip">Level up • Inner circle</span>
            <div className="home-plan-head">
              <div className="home-plan-name">Bestie</div>
              <span className="home-plan-icon">💖</span>
            </div>
            <p className="home-plan-tagline">
              Unlock the inner circle with early drops, polls, and VIP moments.
            </p>
            <ul className="home-plan-list">
              <li>Access Bestie-only content & stories</li>
              <li>Vote on future looks and collabs</li>
              <li>Surprises, shout-outs, and more</li>
            </ul>
            <div className="home-plan-footer">
              <span>Requires sign-in and Bestie status.</span>
              <button
                type="button"
                className="home-plan-cta"
                onClick={goToBestie}
              >
                Become a Bestie
              </button>
            </div>
          </article>

          {/* CREATOR */}
          <article className="home-plan">
            <span className="home-plan-chip">Create • Share your style</span>
            <div className="home-plan-head">
              <div className="home-plan-name">Creator</div>
              <span className="home-plan-icon">✨</span>
            </div>
            <p className="home-plan-tagline">
              Host your own closet, share looks, and connect with fans of your style.
            </p>
            <ul className="home-plan-list">
              <li>Upload outfits & style breakdowns</li>
              <li>Build a community around your looks</li>
              <li>Future collab & monetization tools</li>
            </ul>
            <div className="home-plan-footer">
              <span>Creator tools coming online in phases.</span>
              <button
                type="button"
                className="home-plan-cta"
                onClick={goToCreator}
              >
                Apply as Creator
              </button>
            </div>
          </article>

          {/* COLLABORATOR */}
          <article className="home-plan">
            <span className="home-plan-chip">Partner • Brand collabs</span>
            <div className="home-plan-head">
              <div className="home-plan-name">Collaborator</div>
              <span className="home-plan-icon">🤝</span>
            </div>
            <p className="home-plan-tagline">
              Manage brand partnerships and co-branded campaigns with creators.
            </p>
            <ul className="home-plan-list">
              <li>Creator collaboration tools</li>
              <li>Campaign management suite</li>
              <li>Brand partnership analytics</li>
            </ul>
            <div className="home-plan-footer">
              <span>For brand partners & collaborators.</span>
              <button
                type="button"
                className="home-plan-cta"
                onClick={goToCollab}
              >
                Enter Collaborator Hub
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Admin & Prime Studio Links (subtle, at bottom) */}
      <footer style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ margin: "0 0 12px", color: "#999", fontSize: "0.9rem" }}>
          Company admin? <a href="#" onClick={(e) => { e.preventDefault(); nav("/signup/admin"); }} style={{ color: "#667eea", textDecoration: "none", fontWeight: "600" }}>Access admin panel</a>
        </p>
        <p style={{ margin: "0", color: "#999", fontSize: "0.9rem" }}>
          Production team? <a href="#" onClick={(e) => { e.preventDefault(); nav("/prime-studio"); }} style={{ color: "#d4af37", textDecoration: "none", fontWeight: "600" }}>Enter Prime Studio</a>
        </p>
      </footer>
    </div>
  );
}
