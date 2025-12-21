// site/src/routes/collab/Home.jsx
import React from "react";

export default function CollabHome() {
  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <h1>Collaborator Hub</h1>
        <p>Manage brand partnerships, creator collaborations, and co-branded campaigns</p>
      </section>

      {/* QUICK STATS */}
      <section style={styles.stats}>
        <StatCard title="Active Campaigns" value="3" />
        <StatCard title="Creator Partners" value="12" />
        <StatCard title="Content Assets" value="47" />
        <StatCard title="Engagement Rate" value="8.2%" />
      </section>

      {/* FEATURES GRID */}
      <section style={styles.features}>
        <FeatureCard
          title="Creator Tools"
          description="AI-powered tools for collaborative content creation"
          icon="🎬"
          link="/collab/tools"
        />
        <FeatureCard
          title="Campaigns"
          description="Manage co-branded campaigns and partnerships"
          icon="📊"
          link="/collab/campaigns"
        />
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{title}</div>
    </div>
  );
}

function FeatureCard({ title, description, icon, link }) {
  return (
    <a href={link} style={styles.featureCard}>
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{description}</p>
    </a>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: "48px",
    padding: "32px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderRadius: "16px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "48px",
  },
  statCard: {
    background: "#f5f5f5",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#667eea",
    marginBottom: "8px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#666",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  featureCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  featureIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },
  featureTitle: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
  },
  featureDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
};

const css = `
a[href] {
  text-decoration: none;
  color: inherit;
}

a[href]:hover {
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}
`;
