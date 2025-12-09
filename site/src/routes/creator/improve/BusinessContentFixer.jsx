// site/src/routes/creator/improve/BusinessContentFixer.jsx
import React from "react";

export default function BusinessContentFixer() {
  return (
    <section className="creator-page">
      <header className="creator-page__header">
        <span className="creator-page__kicker">Improve · Content</span>
        <h1 className="creator-page__title">Business Content Fixer</h1>
        <p className="creator-page__subtitle">
          Fix hooks, CTAs, structure, and messaging so your content doesn&apos;t
          just look good — it converts.
        </p>
      </header>

      <div className="creator-page__body">
        <div className="creator-page__card">
          <h2 className="creator-page__card-title">Draft sandbox</h2>
          <p className="creator-page__card-subtitle">
            This will become your “fix my script” lab. Paste hooks or captions,
            and the system will suggest stronger business outcomes.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            For now, this stub just gives your team a dedicated place in the
            IA. They can later wire this up to your AI backend.
          </p>
        </div>
      </div>
    </section>
  );
}
