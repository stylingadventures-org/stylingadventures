// site/src/routes/admin/BrandSettings.jsx
import React, { useState } from "react";

export default function BrandSettings() {
  const [settings, setSettings] = useState({
    appName: "Styling Adventures",
    tagline: "Your creative command center",
    primaryColor: "#d4a574",
    accentColor: "#f59e0b",
    defaultTone: "Warm, supportive, fashion-forward",
  });

  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    field: { marginBottom: "20px" },
    label: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" },
    input: { width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit" },
    textarea: { width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", minHeight: "80px", resize: "vertical" },
    button: { padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginRight: "12px" },
    colorBox: (color) => ({ display: "inline-block", width: "40px", height: "40px", backgroundColor: color, borderRadius: "8px", border: "2px solid #e5ddd0" }),
    gridCols2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎨 Brand & Platform Settings</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Visual themes, voice, email branding</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>App Identity</div>
        <div style={styles.field}>
          <label style={styles.label}>App Name</label>
          <input
            style={styles.input}
            value={settings.appName}
            onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Tagline</label>
          <input
            style={styles.input}
            value={settings.tagline}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
          />
        </div>
      </div>

      <div style={styles.gridCols2}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Colors</div>
          <div style={styles.field}>
            <label style={styles.label}>Primary Color</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={styles.colorBox(settings.primaryColor)} />
              <input
                style={{ ...styles.input, flex: 1 }}
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Accent Color</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={styles.colorBox(settings.accentColor)} />
              <input
                style={{ ...styles.input, flex: 1 }}
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Voice & Tone</div>
          <div style={styles.field}>
            <label style={styles.label}>Default Voice</label>
            <textarea
              style={styles.textarea}
              value={settings.defaultTone}
              onChange={(e) => setSettings({ ...settings, defaultTone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Email Branding</div>
        <div style={styles.field}>
          <label style={styles.label}>Email Header Logo</label>
          <input style={styles.input} placeholder="https://..." />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Email Signature</label>
          <textarea style={styles.textarea} placeholder="Regards, The Styling Adventures Team" />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Social Links</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input style={styles.input} placeholder="Instagram" />
          <input style={styles.input} placeholder="TikTok" />
          <input style={styles.input} placeholder="YouTube" />
          <input style={styles.input} placeholder="Email" />
        </div>
      </div>

      <div style={styles.card}>
        <button style={styles.button}>Save Settings</button>
        <button style={{ ...styles.button, backgroundColor: "#999" }}>Reset to Default</button>
      </div>
    </div>
  );
}
