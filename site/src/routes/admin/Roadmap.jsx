// site/src/routes/admin/Roadmap.jsx
import React, { useState } from "react";

export default function Roadmap() {
  const [ideas] = useState([
    { id: 1, title: "Batch Upload for Assets", votes: 12, status: "Planned", quarter: "Q1 2026" },
    { id: 2, title: "Team Collaboration", votes: 8, status: "In Development", quarter: "Q4 2025" },
    { id: 3, title: "Advanced Analytics", votes: 6, status: "Planned", quarter: "Q2 2026" },
    { id: 4, title: "Video Generation AI", votes: 15, status: "Backlog", quarter: "TBD" },
    { id: 5, title: "White Label Platform", votes: 3, status: "Backlog", quarter: "TBD" },
  ]);

  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    ideaCard: { padding: "16px", backgroundColor: "#faf8f5", borderRadius: "8px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #d4a574" },
    badge: (color) => ({ display: "inline-block", padding: "4px 8px", backgroundColor: color + "20", color: color, borderRadius: "4px", fontSize: "11px", fontWeight: "600" }),
    button: { padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  };

  const statusColor = {
    "In Development": "#3b82f6",
    "Planned": "#10b981",
    "Backlog": "#9ca3af",
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🗺️ Roadmap & Experimentation</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Feature ideas, priorities, release planning</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Quarterly Goals</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Q4 2025</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
              <li>✓ Team collaboration MVP</li>
              <li>✓ Creator tier expansion</li>
            </ul>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Q1 2026</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
              <li>Batch upload system</li>
              <li>Advanced filtering</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Feature Ideas (Sorted by Votes)</div>
        {ideas.map((idea) => (
          <div key={idea.id} style={styles.ideaCard}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                {idea.title}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                <span style={styles.badge(statusColor[idea.status])}>{idea.status}</span>
                {idea.quarter !== "TBD" && (
                  <span style={{ marginLeft: "8px", fontSize: "12px", color: "#666" }}>• {idea.quarter}</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#d4a574" }}>
              👍 {idea.votes}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Active Experiments</div>
        <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", marginBottom: "12px", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
            Experiment: New onboarding flow
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Group A (Classic): 48% conversion • Group B (New): 52% conversion
          </div>
        </div>
        <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", borderLeft: "3px solid #f59e0b" }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
            Experiment: AI prompt variations
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Testing 3 different tone styles for caption generation
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>User Feature Requests</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#666" }}>
          <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>
            <strong>Batch Upload:</strong> 12 users requested
          </li>
          <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>
            <strong>Export Analytics:</strong> 8 users requested
          </li>
          <li style={{ padding: "8px 0" }}>
            <strong>API Access:</strong> 5 users requested
          </li>
        </ul>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Release Notes</div>
        <textarea
          style={{ width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", minHeight: "100px", fontFamily: "inherit", marginBottom: "12px" }}
          placeholder="Write release notes for the next version..."
        />
        <button style={styles.button}>Publish Notes</button>
      </div>
    </div>
  );
}
