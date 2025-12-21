import React, { useState } from "react";

const SAMPLE_STRATEGY = {
  pillars: ["Sustainability", "Styling Tips", "Personal Stories"],
  themes: [
    { month: "January", theme: "New Year, New Mindset", focus: "Goal setting" },
    { month: "February", theme: "Love Yourself", focus: "Self-care styling" },
    { month: "March", theme: "Spring Refresh", focus: "Wardrobe updates" },
  ],
  campaigns: [
    {
      name: "Capsule Wardrobe Challenge",
      start: "Jan 15",
      end: "Jan 31",
      goal: "Launch digital course",
      status: "Planning",
    },
  ],
};

export default function ContentStrategy() {
  const [strategy, setStrategy] = useState(SAMPLE_STRATEGY);
  const [editMode, setEditMode] = useState(false);

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>🎯 STRATEGY</p>
          <h1 style={styles.title}>Content Strategy</h1>
          <p style={styles.subtitle}>
            Direction over ideas. What to create and why.
          </p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            style={styles.editBtn}
          >
            ✏️ Edit Strategy
          </button>
        )}
      </section>

      {/* CONTENT PILLARS */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>🏛️ Your Content Pillars</h2>
        <p style={styles.description}>
          These are your 3-5 core topics. Everything you create should ladder up to one of these.
        </p>
        <div style={styles.pillarsList}>
          {strategy.pillars.map((pillar, idx) => (
            <div key={idx} style={styles.pillarCard}>
              <span style={styles.pillarNumber}>{idx + 1}</span>
              <p style={styles.pillarText}>{pillar}</p>
              <p style={styles.pillarHelper}>AI suggests content on this topic</p>
            </div>
          ))}
        </div>
      </section>

      {/* MONTHLY THEMES */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>📅 Monthly Themes</h2>
        <p style={styles.description}>
          The "why" behind your content each month. Your AI follows these themes.
        </p>
        <div style={styles.themesList}>
          {strategy.themes.map((month, idx) => (
            <div key={idx} style={styles.themeRow}>
              <div>
                <p style={styles.monthName}>{month.month}</p>
                <p style={styles.themeName}>{month.theme}</p>
              </div>
              <div style={styles.themeFocus}>
                <p style={styles.focusLabel}>Focus Area</p>
                <p style={styles.focusValue}>{month.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAMPAIGNS */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>🚀 Active Campaigns</h2>
        <p style={styles.description}>
          Launch plans for your offers. Content supports these campaigns.
        </p>
        <div style={styles.campaignsList}>
          {strategy.campaigns.map((campaign, idx) => (
            <div key={idx} style={styles.campaignCard}>
              <div style={styles.campaignHeader}>
                <p style={styles.campaignName}>{campaign.name}</p>
                <span style={styles.statusBadge}>{campaign.status}</span>
              </div>
              <div style={styles.campaignMeta}>
                <div>
                  <p style={styles.metaLabel}>Timeline</p>
                  <p style={styles.metaValue}>{campaign.start} → {campaign.end}</p>
                </div>
                <div>
                  <p style={styles.metaLabel}>Goal</p>
                  <p style={styles.metaValue}>{campaign.goal}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.infoBox}>
        <h2 style={styles.infoTitle}>🧠 How It Works</h2>
        <div style={styles.flowSteps}>
          <div style={styles.step}>
            <p style={styles.stepNumber}>1</p>
            <p style={styles.stepText}>You define your pillars & themes</p>
          </div>
          <p style={styles.arrow}>→</p>
          <div style={styles.step}>
            <p style={styles.stepNumber}>2</p>
            <p style={styles.stepText}>AI suggests content ideas aligned with them</p>
          </div>
          <p style={styles.arrow}>→</p>
          <div style={styles.step}>
            <p style={styles.stepNumber}>3</p>
            <p style={styles.stepText}>Your calendar fills with direction, not random ideas</p>
          </div>
        </div>
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
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#1e40af",
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
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  description: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  pillarsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  pillarCard: {
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: "8px",
    padding: "16px",
  },
  pillarNumber: {
    display: "inline-block",
    width: "32px",
    height: "32px",
    background: "white",
    borderRadius: "50%",
    textAlign: "center",
    lineHeight: "32px",
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: "8px",
  },
  pillarText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e3a8a",
    margin: "0 0 6px 0",
  },
  pillarHelper: {
    fontSize: "11px",
    color: "#1e40af",
    margin: 0,
  },
  themesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  themeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  monthName: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 4px 0",
  },
  themeName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  themeFocus: {
    textAlign: "right",
  },
  focusLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  focusValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  campaignsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  campaignCard: {
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#f9fafb",
  },
  campaignHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  campaignName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
  campaignMeta: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  metaLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  infoBox: {
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: "12px",
    padding: "24px",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 16px 0",
  },
  flowSteps: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  step: {
    flex: "1 1 auto",
    textAlign: "center",
    minWidth: "120px",
  },
  stepNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    background: "#1e40af",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    margin: "0 auto 8px",
    lineHeight: "40px",
  },
  stepText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1e3a8a",
    margin: 0,
  },
  arrow: {
    fontSize: "20px",
    color: "white",
  },
};
