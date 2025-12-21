// site/src/routes/prime/Content.jsx
import React from "react";

export default function PrimeContent() {
  return (
    <div style={styles.page}>
      <h1>Exclusive Content</h1>
      <p>Behind-the-scenes footage and creator-only stories coming soon...</p>
      
      <div style={styles.grid}>
        <ContentCard title="Behind the Scenes: Episode 5" date="1 week ago" />
        <ContentCard title="Creator Interview: Lala's Vision" date="2 weeks ago" />
        <ContentCard title="Fashion Design Process" date="3 weeks ago" />
      </div>
    </div>
  );
}

function ContentCard({ title, date }) {
  return (
    <div style={styles.card}>
      <div style={styles.thumbnail}>🎬</div>
      <h3>{title}</h3>
      <p style={styles.date}>{date}</p>
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
    cursor: "pointer",
    transition: "all 0.3s",
  },
  thumbnail: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  date: {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "#999",
  },
};
