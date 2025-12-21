// site/src/routes/admin/Integrations.jsx
import React, { useState } from "react";

export default function Integrations() {
  const [integrations, setIntegrations] = useState([
    { id: 1, name: "Instagram", status: "Connected", lastSync: "2h ago", users: 48 },
    { id: 2, name: "TikTok", status: "Connected", lastSync: "1h ago", users: 34 },
    { id: 3, name: "YouTube", status: "Connected", lastSync: "3h ago", users: 22 },
    { id: 4, name: "Stripe", status: "Connected", lastSync: "Real-time", users: "All" },
    { id: 5, name: "ConvertKit", status: "Pending", lastSync: "—", users: 0 },
    { id: 6, name: "Zapier", status: "Disconnected", lastSync: "—", users: 0 },
  ]);

  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#666", borderBottom: "1px solid #e5ddd0", textTransform: "uppercase" },
    td: { padding: "12px 16px", borderBottom: "1px solid #f0e8e0", fontSize: "14px" },
    badge: (color) => ({ display: "inline-block", padding: "4px 12px", backgroundColor: color + "20", color: color, borderRadius: "4px", fontSize: "12px", fontWeight: "600" }),
    button: { padding: "8px 16px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    gridCols2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔗 Integrations Manager</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Control external dependencies and sync health</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Platform Integrations</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Platform</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Last Sync</th>
              <th style={styles.th}>Users</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {integrations.map((int) => (
              <tr key={int.id}>
                <td style={styles.td}>{int.name}</td>
                <td style={styles.td}>
                  <span style={styles.badge(int.status === "Connected" ? "#22c55e" : int.status === "Pending" ? "#f59e0b" : "#ef4444")}>
                    {int.status}
                  </span>
                </td>
                <td style={styles.td}>{int.lastSync}</td>
                <td style={styles.td}>{int.users}</td>
                <td style={styles.td}>
                  <button style={styles.button}>
                    {int.status === "Connected" ? "Manage" : "Connect"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.gridCols2}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Instagram Permissions</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#666" }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Read media</li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Manage media</li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Read insights</li>
            <li style={{ padding: "8px 0" }}>✓ Manage comments</li>
          </ul>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Stripe Permissions</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#666" }}>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Read customers</li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Manage charges</li>
            <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Read transactions</li>
            <li style={{ padding: "8px 0" }}>✓ Manage subscriptions</li>
          </ul>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>API Keys</div>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", color: "#333", marginBottom: "8px", fontWeight: "600" }}>
            OpenAI API Key
          </div>
          <div style={{ fontSize: "12px", color: "#666", padding: "8px", backgroundColor: "#faf8f5", borderRadius: "4px", fontFamily: "monospace" }}>
            sk-••••••••••••••••••••
          </div>
        </div>
        <div>
          <button style={styles.button}>Rotate Key</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Sync Health</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <div style={{ padding: "12px", backgroundColor: "#e8f4e8", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#2d6b2f" }}>98%</div>
            <div style={{ fontSize: "11px", color: "#2d6b2f", marginTop: "4px" }}>API Success Rate</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#e8f4e8", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#2d6b2f" }}>2.3s</div>
            <div style={{ fontSize: "11px", color: "#2d6b2f", marginTop: "4px" }}>Avg Response Time</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#e8f4e8", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#2d6b2f" }}>0</div>
            <div style={{ fontSize: "11px", color: "#2d6b2f", marginTop: "4px" }}>Failed Syncs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
