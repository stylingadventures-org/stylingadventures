// site/src/routes/admin/Automations.jsx
import React, { useState } from "react";

export default function Automations() {
  const [automations, setAutomations] = useState([
    { id: 1, name: "Onboarding Email Series", trigger: "New signup", actions: 3, enabled: true },
    { id: 2, name: "Trial Expiry Reminder", trigger: "Trial ends in 3 days", actions: 2, enabled: true },
    { id: 3, name: "Upgrade Nudge", trigger: "Free user exceeded limits", actions: 1, enabled: true },
    { id: 4, name: "Re-engagement", trigger: "Inactive 30+ days", actions: 4, enabled: false },
  ]);

  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    automationCard: { padding: "16px", backgroundColor: "#faf8f5", borderRadius: "8px", marginBottom: "12px", borderLeft: "3px solid #d4a574" },
    automationTitle: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" },
    automationMeta: { fontSize: "12px", color: "#666" },
    button: { padding: "12px 24px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginRight: "12px" },
    gridCols2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Automations & Workflows</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Reduce ops work with automated flows</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Active Automations</div>
        {automations.map((auto) => (
          <div key={auto.id} style={styles.automationCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={styles.automationTitle}>{auto.name}</div>
                <div style={styles.automationMeta}>
                  Trigger: {auto.trigger} • {auto.actions} action(s)
                </div>
              </div>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "600" }}>
                {auto.enabled ? "🟢 Active" : "⚪ Paused"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.gridCols2}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Onboarding Flow</div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Send welcome email</div>
            <div style={styles.automationMeta}>Immediate</div>
          </div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Invite to tutorials</div>
            <div style={styles.automationMeta}>Day 1</div>
          </div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Premium feature upsell</div>
            <div style={styles.automationMeta}>Day 7</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Trial Expiration</div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Day 10: 3-day warning</div>
            <div style={styles.automationMeta}>Highlight benefits</div>
          </div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Day 12: 1-day reminder</div>
            <div style={styles.automationMeta}>Special offer</div>
          </div>
          <div style={styles.automationCard}>
            <div style={styles.automationTitle}>✓ Day 13: Last chance</div>
            <div style={styles.automationMeta}>Final push</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Create New Automation</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <input style={{ padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px" }} placeholder="Automation name" />
          <select style={{ padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px" }}>
            <option>New signup</option>
            <option>Trial expiring</option>
            <option>Inactive user</option>
            <option>Feature limit reached</option>
          </select>
        </div>
        <button style={styles.button}>Create Automation</button>
      </div>
    </div>
  );
}
