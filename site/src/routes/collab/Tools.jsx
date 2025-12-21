// site/src/routes/collab/Tools.jsx
import React from "react";

export default function CollabTools() {
  return (
    <div style={styles.page}>
      <h1>Creator Tools</h1>
      <p>AI-powered collaboration tools coming soon...</p>
      
      <div style={styles.grid}>
        <ToolCard
          title="Script Generator"
          description="Generate collaboration scripts based on brand guidelines"
        />
        <ToolCard
          title="Content Optimizer"
          description="Optimize co-branded content for maximum reach"
        />
        <ToolCard
          title="Asset Manager"
          description="Organize and share brand assets with creators"
        />
      </div>
    </div>
  );
}

function ToolCard({ title, description }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      <p>{description}</p>
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
  },
};
