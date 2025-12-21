// site/src/routes/prime/Home.jsx
import React from "react";

export default function PrimeHome() {
  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1>✨ Prime Studios</h1>
          <p>Exclusive content, curated experiences, and premium community access</p>
        </div>
      </section>

      {/* PREMIUM FEATURES */}
      <section style={styles.features}>
        <FeatureCard
          title="Prime Magazine"
          description="Quarterly digital magazine with exclusive editorial features"
          icon="📖"
          link="/prime/magazine"
        />
        <FeatureCard
          title="Exclusive Content"
          description="Behind-the-scenes footage and creator-only stories"
          icon="🎬"
          link="/prime/content"
        />
        <FeatureCard
          title="Community Spotlight"
          description="Featured creators and curated community moments"
          icon="⭐"
          link="/prime/spotlight"
        />
      </section>

      {/* MEMBER BENEFITS */}
      <section style={styles.benefits}>
        <h2>Premium Member Benefits</h2>
        <ul style={styles.benefitsList}>
          <li>✓ Early access to new episodes</li>
          <li>✓ Exclusive behind-the-scenes content</li>
          <li>✓ Direct creator messaging</li>
          <li>✓ Ad-free experience</li>
          <li>✓ Exclusive merchandise</li>
          <li>✓ VIP community events</li>
        </ul>
      </section>
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
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    borderRadius: "16px",
    padding: "48px 32px",
    marginBottom: "48px",
    textAlign: "center",
  },
  heroContent: {},
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "48px",
  },
  featureCard: {
    background: "#fff",
    border: "2px solid #f59e0b",
    borderRadius: "12px",
    padding: "24px",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.3s",
    cursor: "pointer",
  },
  featureIcon: {
    fontSize: "40px",
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
  benefits: {
    background: "#fef3c7",
    borderRadius: "12px",
    padding: "32px",
  },
  benefitsList: {
    listStyle: "none",
    padding: 0,
    margin: "16px 0 0 0",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    fontSize: "15px",
  },
};

const css = `
a[href] {
  text-decoration: none;
  color: inherit;
}

a[href]:hover {
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
}
`;
