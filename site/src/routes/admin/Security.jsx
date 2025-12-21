// site/src/routes/admin/Security.jsx
import React, { useState } from "react";

export default function Security() {
  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    auditItem: { padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", marginBottom: "8px", fontSize: "13px", borderLeft: "3px solid #d4a574" },
    auditMeta: { fontSize: "11px", color: "#999", marginTop: "4px" },
    gridCols2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    button: { padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔒 Security & Compliance</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Audit logs, data access, privacy tools</p>
      </div>

      <div style={styles.gridCols2}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Audit Log (Recent)</div>
          <div style={styles.auditItem}>
            <div style={{ fontWeight: "600" }}>Admin login</div>
            <div style={styles.auditMeta}>Sarah Chen • IP 203.0.113.45 • 2h ago</div>
          </div>
          <div style={styles.auditItem}>
            <div style={{ fontWeight: "600" }}>User suspended</div>
            <div style={styles.auditMeta}>Flagged account • By Admin • 4h ago</div>
          </div>
          <div style={styles.auditItem}>
            <div style={{ fontWeight: "600" }}>API key rotated</div>
            <div style={styles.auditMeta}>OpenAI key • By Admin • 1d ago</div>
          </div>
          <div style={styles.auditItem}>
            <div style={{ fontWeight: "600" }}>Permission changed</div>
            <div style={styles.auditMeta}>User promoted to Moderator • 2d ago</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Privacy & Consent</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #f0e8e0", fontSize: "13px", color: "#666" }}>
              <strong>✓</strong> GDPR compliant
            </li>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #f0e8e0", fontSize: "13px", color: "#666" }}>
              <strong>✓</strong> CCPA opt-out available
            </li>
            <li style={{ padding: "12px 0", borderBottom: "1px solid #f0e8e0", fontSize: "13px", color: "#666" }}>
              <strong>✓</strong> Data deletion on request
            </li>
            <li style={{ padding: "12px 0", fontSize: "13px", color: "#666" }}>
              <strong>✓</strong> Terms of Service updated
            </li>
          </ul>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Data Access Requests</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>3</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>GDPR Requests</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>1</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Deletion Requests</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>0</div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Pending</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Two-Factor Authentication</div>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          All admin accounts must use 2FA for security.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "#666" }}>
          <li style={{ padding: "8px 0", borderBottom: "1px solid #f0e8e0" }}>✓ Sarah Chen - Enabled</li>
          <li style={{ padding: "8px 0" }}>⚠️ Marcus Johnson - Not enabled</li>
        </ul>
        <button style={styles.button}>Enforce 2FA</button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Data Backup</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#333", marginBottom: "8px" }}>Last Backup</div>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: "600" }}>Dec 20, 2025 • 23:45 UTC</div>
          </div>
          <div>
            <div style={{ fontSize: "13px", color: "#333", marginBottom: "8px" }}>Backup Location</div>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: "600" }}>AWS S3 (Encrypted)</div>
          </div>
        </div>
        <button style={{...styles.button, marginTop: "16px"}}>Backup Now</button>
      </div>
    </div>
  );
}
