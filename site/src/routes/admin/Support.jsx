// site/src/routes/admin/Support.jsx
import React, { useState } from "react";

export default function Support() {
  const [tickets, setTickets] = useState([
    { id: 1, user: "Sarah Chen", subject: "Caption generator not working", status: "Open", priority: "High", created: "2h ago" },
    { id: 2, user: "Marcus Johnson", subject: "Can't schedule content", status: "In Progress", priority: "High", created: "4h ago" },
    { id: 3, user: "Emma Rodriguez", subject: "Billing inquiry", status: "Resolved", priority: "Medium", created: "1d ago" },
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
    button: { padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginRight: "12px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💬 Support & Communication</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Tickets, feedback, in-app announcements</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Support Tickets (3 Open)</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Issue</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td style={styles.td}>{t.user}</td>
                <td style={styles.td}>{t.subject}</td>
                <td style={styles.td}><span style={styles.badge(t.priority === "High" ? "#ef4444" : "#f59e0b")}>{t.priority}</span></td>
                <td style={styles.td}><span style={styles.badge(t.status === "Open" ? "#ef4444" : t.status === "In Progress" ? "#f59e0b" : "#22c55e")}>{t.status}</span></td>
                <td style={styles.td}>{t.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>In-App Announcement</div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>Message</label>
          <textarea style={{ width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", minHeight: "80px", fontFamily: "inherit" }} placeholder="Type announcement..." />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" }}>Target Users</label>
          <select style={{ width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontFamily: "inherit" }}>
            <option>All Users</option>
            <option>Creators Only</option>
            <option>Free Tier</option>
            <option>Pro Tier</option>
          </select>
        </div>
        <button style={styles.button}>Send Announcement</button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Recent Feedback</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Feature Request: Batch Upload</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>12 votes • High priority</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Bug Report: Caption length</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>8 votes • Medium priority</div>
          </div>
        </div>
      </div>
    </div>
  );
}
