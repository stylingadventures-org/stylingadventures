// site/src/routes/admin/FeatureFlags.jsx
import React, { useState } from "react";

export default function FeatureFlags() {
  const [flags, setFlags] = useState([
    { id: 1, name: "AI Caption Generator", enabled: true, tier: "All", beta: false },
    { id: 2, name: "Content Scheduler", enabled: true, tier: "All", beta: false },
    { id: 3, name: "Creator Circle", enabled: true, tier: "Creator Pro+", beta: false },
    { id: 4, name: "Analytics Dashboard", enabled: true, tier: "All", beta: false },
    { id: 5, name: "Bestie AI Stories", enabled: true, tier: "All", beta: false },
    { id: 6, name: "Multi-Creator Teams", enabled: false, tier: "Creator Elite", beta: true },
    { id: 7, name: "Advanced Automations", enabled: false, tier: "Elite", beta: true },
  ]);

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9f5f0",
      minHeight: "100vh",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    subtitle: { fontSize: "14px", color: "#666" },
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "20px",
      border: "1px solid #e5ddd0",
    },
    sectionLabel: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "16px",
      letterSpacing: "0.5px",
    },
    flagTable: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#666",
      borderBottom: "1px solid #e5ddd0",
      textTransform: "uppercase",
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #f0e8e0",
      fontSize: "14px",
    },
    toggle: {
      display: "inline-block",
      width: "50px",
      height: "24px",
      backgroundColor: "#e5ddd0",
      borderRadius: "12px",
      cursor: "pointer",
      position: "relative",
      transition: "background-color 0.2s ease",
    },
    badge: (color) => ({
      display: "inline-block",
      padding: "4px 12px",
      backgroundColor: color + "20",
      color: color,
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "600",
    }),
    gridCols2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚩 Feature Flags & Access Control</h1>
        <p style={styles.subtitle}>Soft-launch features, manage beta access, A/B testing</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Active Features</div>
        <table style={styles.flagTable}>
          <thead>
            <tr>
              <th style={styles.th}>Feature</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Available to</th>
              <th style={styles.th}>Beta</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.id}>
                <td style={styles.td}>{flag.name}</td>
                <td style={styles.td}>
                  <span style={styles.badge(flag.enabled ? "#22c55e" : "#ef4444")}>
                    {flag.enabled ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={styles.td}>{flag.tier}</td>
                <td style={styles.td}>
                  {flag.beta ? (
                    <span style={styles.badge("#f59e0b")}>Beta</span>
                  ) : (
                    <span style={styles.badge("#9ca3af")}>Released</span>
                  )}
                </td>
                <td style={styles.td}>
                  <button style={{ padding: "6px 12px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.gridCols2}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Beta Access Groups</div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", color: "#333", marginBottom: "8px" }}>
              <strong>Early Adopters (15 users)</strong>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#666" }}>
              <li>✓ Multi-Creator Teams</li>
              <li>✓ Advanced Automations</li>
              <li>✓ Premium Analytics</li>
            </ul>
          </div>
          <button style={{ padding: "8px 16px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", marginTop: "12px" }}>
            Manage Beta Users
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>A/B Testing</div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", color: "#333", marginBottom: "8px" }}>
              <strong>Variant A: Classic UI (50%)</strong>
            </div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>
              Current design, familiar layout
            </div>
            <div style={{ fontSize: "13px", color: "#333" }}>
              <strong>Variant B: Redesign (50%)</strong>
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              New cards, improved navigation
            </div>
          </div>
          <button style={{ padding: "8px 16px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", marginTop: "12px" }}>
            View Results
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Create New Flag</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <input style={{ padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px" }} placeholder="Feature name" />
          <select style={{ padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px" }}>
            <option>Available to All</option>
            <option>Creator Pro+</option>
            <option>Elite Only</option>
            <option>Beta Group</option>
          </select>
        </div>
        <button style={{ padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          Create Flag
        </button>
      </div>
    </div>
  );
}
