// site/src/routes/prime/ErasSeasons.jsx
import React, { useState } from "react";

export default function ErasSeasons() {
  const [selectedEra, setSelectedEra] = useState("2025-spring");
  const [eras, setEras] = useState([
    {
      id: "2025-spring",
      name: "Spring Refresh",
      season: "Spring 2025",
      theme: "Capsule Wardrobe Basics",
      goals: ["Build foundational pieces", "Teach color theory", "Sustainable shopping"],
      focusAreas: ["Neutrals", "Layering", "Investment pieces"],
      duration: "Jan - Mar 2025",
      episodeCount: 12,
      status: "Active",
    },
    {
      id: "2025-summer",
      name: "Summer Transformation",
      season: "Summer 2025",
      theme: "Styling the Body You Have",
      goals: ["Body confidence", "Trend interpretation", "Seasonal versatility"],
      focusAreas: ["Patterns", "Colors", "Silhouettes"],
      duration: "Apr - Jun 2025",
      episodeCount: 0,
      status: "Planned",
    },
  ]);

  const currentEra = eras.find((e) => e.id === selectedEra);

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9f5f0",
      minHeight: "100vh",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: {
      marginBottom: "32px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "24px",
    },
    erasList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "32px",
    },
    eraButton: (isSelected) => ({
      padding: "16px",
      backgroundColor: isSelected ? "#d4a574" : "#fff",
      border: `2px solid ${isSelected ? "#d4a574" : "#e5ddd0"}`,
      borderRadius: "8px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.2s ease",
    }),
    eraButtonLabel: (isSelected) => ({
      fontSize: "14px",
      fontWeight: "600",
      color: isSelected ? "#fff" : "#333",
    }),
    eraButtonMeta: (isSelected) => ({
      fontSize: "12px",
      color: isSelected ? "rgba(255,255,255,0.8)" : "#999",
      marginTop: "4px",
    }),
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #e5ddd0",
      marginBottom: "20px",
    },
    sectionLabel: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "16px",
      letterSpacing: "0.5px",
    },
    metaGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      marginBottom: "24px",
    },
    metaItem: {
      paddingBottom: "16px",
      borderBottom: "1px solid #f0e8e0",
    },
    metaLabel: {
      fontSize: "12px",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "4px",
      fontWeight: "600",
    },
    metaValue: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
    },
    tagList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "16px",
    },
    tag: {
      padding: "8px 12px",
      backgroundColor: "#fff9f5",
      border: "1px solid #d4a574",
      borderRadius: "20px",
      fontSize: "13px",
      color: "#666",
    },
    statusBadge: (status) => ({
      display: "inline-block",
      padding: "6px 12px",
      backgroundColor: status === "Active" ? "#e8f4e8" : "#f5f5f5",
      color: status === "Active" ? "#2d6b2f" : "#666",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
    }),
    button: {
      padding: "12px 24px",
      backgroundColor: "#d4a574",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginRight: "12px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Eras & Seasons</h1>
        <p style={styles.subtitle}>Define your content themes and goals for each period</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Current & Upcoming Eras</div>
        <div style={styles.erasList}>
          {eras.map((era) => (
            <button
              key={era.id}
              style={styles.eraButton(selectedEra === era.id)}
              onClick={() => setSelectedEra(era.id)}
            >
              <div style={styles.eraButtonLabel(selectedEra === era.id)}>{era.name}</div>
              <div style={styles.eraButtonMeta(selectedEra === era.id)}>{era.duration}</div>
            </button>
          ))}
        </div>
      </div>

      {currentEra && (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>{currentEra.name}</div>
            <div style={styles.metaGrid}>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Season</div>
                <div style={styles.metaValue}>{currentEra.season}</div>
              </div>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Status</div>
                <div style={styles.metaValue}>
                  <span style={styles.statusBadge(currentEra.status)}>{currentEra.status}</span>
                </div>
              </div>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Duration</div>
                <div style={styles.metaValue}>{currentEra.duration}</div>
              </div>
              <div style={styles.metaItem}>
                <div style={styles.metaLabel}>Episodes Planned</div>
                <div style={styles.metaValue}>{currentEra.episodeCount}</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>Central Theme</div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#333", marginBottom: "20px" }}>
              {currentEra.theme}
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <div style={styles.sectionLabel}>Goals for This Era</div>
              <div style={styles.tagList}>
                {currentEra.goals.map((goal) => (
                  <span key={goal} style={styles.tag}>
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={styles.sectionLabel}>Focus Areas</div>
              <div style={styles.tagList}>
                {currentEra.focusAreas.map((area) => (
                  <span key={area} style={styles.tag}>
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {currentEra.status === "Active" && (
            <div style={styles.card}>
              <button style={styles.button}>View Episodes in This Era</button>
              <button style={styles.button}>Add New Episode</button>
              <button style={styles.button}>View Content Calendar</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
