// site/src/routes/prime/ShowsSeries.jsx
import React, { useState } from "react";

export default function ShowsSeries() {
  const [selectedShow, setSelectedShow] = useState("capsule");
  const [shows, setShows] = useState([
    {
      id: "capsule",
      name: "Capsule Wardrobe Masterclass",
      description: "12-episode series on building a minimal, versatile wardrobe",
      episodeCount: 12,
      frequency: "Weekly on Mondays",
      format: "20-30 min episodes",
      platforms: ["YouTube", "Blog"],
      status: "Active",
      episodes: [
        { number: 1, title: "The Philosophy of Less", aired: "Jan 6" },
        { number: 2, title: "Finding Your Neutrals", aired: "Jan 13" },
        { number: 3, title: "Building Blocks: Essentials", aired: "Jan 20" },
      ],
    },
    {
      id: "styling",
      name: "Quick Style Fixes",
      description: "5-10 min styling hacks and outfit ideas",
      episodeCount: 24,
      frequency: "3x per week",
      format: "5-10 min videos",
      platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
      status: "Active",
      episodes: [
        { number: 1, title: "How to Tuck Without Bulk", aired: "Jan 8" },
        { number: 2, title: "The Hidden Seam Trick", aired: "Jan 9" },
      ],
    },
    {
      id: "transformations",
      name: "30-Day Transformation Stories",
      description: "Follower wardrobe transformations in real-time",
      episodeCount: 4,
      frequency: "Monthly",
      format: "Documentary series",
      platforms: ["YouTube"],
      status: "Coming Soon",
      episodes: [],
    },
  ]);

  const currentShow = shows.find((s) => s.id === selectedShow);

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
    showsList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "12px",
      marginBottom: "32px",
    },
    showButton: (isSelected) => ({
      padding: "16px",
      backgroundColor: isSelected ? "#d4a574" : "#fff",
      border: `2px solid ${isSelected ? "#d4a574" : "#e5ddd0"}`,
      borderRadius: "8px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.2s ease",
    }),
    showButtonLabel: (isSelected) => ({
      fontSize: "14px",
      fontWeight: "600",
      color: isSelected ? "#fff" : "#333",
    }),
    showButtonMeta: (isSelected) => ({
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
    showTitle: {
      fontSize: "22px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px",
    },
    showDesc: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "20px",
      lineHeight: "1.5",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "20px",
    },
    statBox: {
      padding: "12px",
      backgroundColor: "#faf8f5",
      borderRadius: "8px",
      borderLeft: "3px solid #d4a574",
    },
    statLabel: {
      fontSize: "11px",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "4px",
    },
    statValue: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
    },
    platformTags: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "20px",
    },
    tag: {
      padding: "6px 12px",
      backgroundColor: "#fff9f5",
      border: "1px solid #d4a574",
      borderRadius: "20px",
      fontSize: "12px",
      color: "#666",
      fontWeight: "500",
    },
    episodeList: {
      marginTop: "20px",
    },
    episodeItem: {
      padding: "12px",
      backgroundColor: "#faf8f5",
      borderRadius: "6px",
      marginBottom: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    episodeNumber: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#d4a574",
      marginRight: "12px",
    },
    episodeTitle: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#333",
    },
    episodeDate: {
      fontSize: "12px",
      color: "#999",
    },
    statusBadge: (status) => ({
      display: "inline-block",
      padding: "6px 12px",
      backgroundColor:
        status === "Active" ? "#e8f4e8" : status === "Coming Soon" ? "#fff4e8" : "#f0e8e0",
      color:
        status === "Active" ? "#2d6b2f" : status === "Coming Soon" ? "#8b6f47" : "#666",
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
      marginTop: "16px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Shows & Series</h1>
        <p style={styles.subtitle}>Structure your recurring content and episode arcs</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Your Content Series</div>
        <div style={styles.showsList}>
          {shows.map((show) => (
            <button
              key={show.id}
              style={styles.showButton(selectedShow === show.id)}
              onClick={() => setSelectedShow(show.id)}
            >
              <div style={styles.showButtonLabel(selectedShow === show.id)}>{show.name}</div>
              <div style={styles.showButtonMeta(selectedShow === show.id)}>
                {show.episodeCount} episodes
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentShow && (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>{currentShow.name}</div>
            <h2 style={styles.showTitle}>{currentShow.name}</h2>
            <p style={styles.showDesc}>{currentShow.description}</p>

            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Total Episodes</div>
                <div style={styles.statValue}>{currentShow.episodeCount}</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Frequency</div>
                <div style={{ ...styles.statValue, fontSize: "13px" }}>
                  {currentShow.frequency}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Format</div>
                <div style={{ ...styles.statValue, fontSize: "13px" }}>
                  {currentShow.format}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Status</div>
                <div style={styles.statValue}>
                  <span style={styles.statusBadge(currentShow.status)}>{currentShow.status}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={styles.sectionLabel}>Platforms</div>
              <div style={styles.platformTags}>
                {currentShow.platforms.map((platform) => (
                  <span key={platform} style={styles.tag}>
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {currentShow.episodes.length > 0 && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Recent Episodes</div>
              <div style={styles.episodeList}>
                {currentShow.episodes.map((ep) => (
                  <div key={ep.number} style={styles.episodeItem}>
                    <span style={styles.episodeNumber}>Ep. {ep.number}</span>
                    <span style={styles.episodeTitle}>{ep.title}</span>
                    <span style={styles.episodeDate}>{ep.aired}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.card}>
            {currentShow.status === "Active" && (
              <>
                <button style={styles.button}>View All Episodes</button>
                <button style={styles.button}>Create New Episode</button>
              </>
            )}
            {currentShow.status === "Coming Soon" && (
              <button style={styles.button}>Launch This Series</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
