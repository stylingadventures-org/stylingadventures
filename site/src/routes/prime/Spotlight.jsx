// site/src/routes/prime/Spotlight.jsx
import React from "react";

export default function PrimeSpotlight() {
  return (
    <div style={styles.page}>
      <h1>Community Spotlight</h1>
      <p>Featured creators and curated community moments coming soon...</p>
      
      <div style={styles.grid}>
        <SpotlightCard title="Creator of the Month" creator="Alex M." image="⭐" />
        <SpotlightCard title="Best Community Moment" creator="The Besties" image="💫" />
        <SpotlightCard title="Trending Look" creator="Fashion Squad" image="✨" />
      </div>
    </div>
  );
}

function SpotlightCard({ title, creator, image }) {
  return (
    <div style={styles.card}>
      <div style={styles.image}>{image}</div>
      <h3>{title}</h3>
      <p style={styles.creator}>{creator}</p>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "900px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  image: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  creator: {
    margin: "8px 0 0 0",
    fontSize: "14px",
    color: "#666",
  },
};
