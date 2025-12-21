import React, { useState } from "react";

export default function BrandProfile() {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    brandName: "Sarah's Style Co.",
    tagline: "Bold, sustainable fashion for modern women",
    voiceTone: ["Approachable", "Authentic", "Educational"],
    audienceType: "Women 25-45, career-focused, eco-conscious",
    contentPillars: ["Sustainability", "Styling Tips", "Personal Stories"],
    platforms: ["Instagram", "TikTok", "Email", "Blog"],
    offerings: ["1:1 styling", "Digital courses", "Monthly box"],
    boundaries: { postingFrequency: "5/week", restDays: "Sat-Sun", energyLevel: "high" },
  });

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <p style={styles.pill}>🧠 BRAND DNA</p>
          <h1 style={styles.title}>Your Creator Profile</h1>
          <p style={styles.subtitle}>
            The foundation for all AI recommendations and strategy
          </p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            style={styles.editBtn}
          >
            ✏️ Edit Profile
          </button>
        )}
      </section>

      <div style={styles.grid}>
        {/* BRAND IDENTITY */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎭 Brand Identity</h2>
          <div style={styles.field}>
            <label style={styles.label}>Brand Name</label>
            <p style={styles.value}>{profile.brandName}</p>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Tagline</label>
            <p style={styles.value}>{profile.tagline}</p>
          </div>
        </div>

        {/* VOICE & TONE */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🗣️ Voice & Tone</h2>
          <div style={styles.tags}>
            {profile.voiceTone.map((tone, i) => (
              <span key={i} style={styles.tag}>{tone}</span>
            ))}
          </div>
          <p style={styles.help}>Used in all AI-generated content</p>
        </div>

        {/* AUDIENCE */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>👥 Your Audience</h2>
          <p style={styles.value}>{profile.audienceType}</p>
          <p style={styles.help}>AI learns what resonates with them</p>
        </div>

        {/* CONTENT PILLARS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏛️ Content Pillars</h2>
          <div style={styles.list}>
            {profile.contentPillars.map((pillar, i) => (
              <p key={i} style={styles.listItem}>• {pillar}</p>
            ))}
          </div>
          <p style={styles.help}>Guides content recommendations</p>
        </div>

        {/* PLATFORMS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📱 Active Platforms</h2>
          <div style={styles.platforms}>
            {profile.platforms.map((platform, i) => (
              <span key={i} style={styles.platform}>{platform}</span>
            ))}
          </div>
        </div>

        {/* OFFERINGS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💰 What You Sell</h2>
          <div style={styles.list}>
            {profile.offerings.map((offer, i) => (
              <p key={i} style={styles.listItem}>• {offer}</p>
            ))}
          </div>
        </div>

        {/* BOUNDARIES */}
        <div style={{ ...styles.card, gridColumn: "1 / -1" }}>
          <h2 style={styles.cardTitle}>🚦 Sustainability & Boundaries</h2>
          <div style={styles.boundariesGrid}>
            <div>
              <p style={styles.boundaryLabel}>Posting Frequency</p>
              <p style={styles.boundaryValue}>{profile.boundaries.postingFrequency}</p>
            </div>
            <div>
              <p style={styles.boundaryLabel}>Rest Days</p>
              <p style={styles.boundaryValue}>{profile.boundaries.restDays}</p>
            </div>
            <div>
              <p style={styles.boundaryLabel}>Energy Level</p>
              <p style={styles.boundaryValue}>{profile.boundaries.energyLevel}</p>
            </div>
          </div>
          <p style={styles.help}>Prevents burnout. AI respects your boundaries.</p>
        </div>
      </div>

      {/* WHY THIS MATTERS */}
      <section style={styles.infoBox}>
        <h2 style={styles.infoTitle}>🧠 Why This Matters</h2>
        <p style={styles.infoText}>
          Everything in your Creator Hub learns from this profile. Your AI Content Studio uses it to match your voice. Your analytics filter by these pillars. Your strategy aligns with your boundaries. Keep this updated for the most personalized experience.
        </p>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  css: `button:hover { opacity: 0.85; }`,
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #fce7f3, #e9d5ff)",
    borderRadius: "16px",
  },
  heroContent: {},
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#a855f7",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  editBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  field: {
    marginBottom: "12px",
  },
  label: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 4px 0",
    display: "block",
  },
  value: {
    fontSize: "14px",
    color: "#111827",
    margin: 0,
    fontWeight: "600",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "8px",
  },
  tag: {
    display: "inline-block",
    padding: "6px 12px",
    background: "#f3f4f6",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
  },
  list: {
    margin: 0,
    paddingLeft: "0",
  },
  listItem: {
    fontSize: "13px",
    color: "#374151",
    margin: "6px 0",
  },
  platforms: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  platform: {
    display: "inline-block",
    padding: "8px 12px",
    background: "linear-gradient(135deg, #fce7f3, #e9d5ff)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#a855f7",
  },
  boundariesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  boundaryLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 6px 0",
  },
  boundaryValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  help: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: "8px 0 0 0",
    fontStyle: "italic",
  },
  infoBox: {
    background: "linear-gradient(135deg, #f3e3ff, #ede9fe)",
    borderRadius: "12px",
    padding: "20px",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#7c3aed",
    margin: "0 0 8px 0",
  },
  infoText: {
    fontSize: "13px",
    color: "#5b21b6",
    margin: 0,
    lineHeight: "1.6",
  },
};
