import React, { useState } from "react";

export default function CreatorSettings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <p style={styles.pill}>⚙️ SETTINGS</p>
        <h1 style={styles.title}>Account Settings</h1>
        <p style={styles.subtitle}>Manage your profile and preferences</p>
      </section>

      {/* TABS */}
      <div style={styles.tabs}>
        {["profile", "privacy", "notifications", "billing", "integrations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === "profile" && "👤 Profile"}
            {tab === "privacy" && "🔒 Privacy"}
            {tab === "notifications" && "🔔 Notifications"}
            {tab === "billing" && "💳 Billing"}
            {tab === "integrations" && "🔗 Integrations"}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile Settings</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              style={styles.input}
              defaultValue="Sarah Creator"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              placeholder="Tell us about yourself"
              style={styles.textarea}
              defaultValue="Building a 6-figure creator business, one post at a time."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Primary Niche</label>
            <select style={styles.select}>
              <option>Personal Development</option>
              <option>Business</option>
              <option>Lifestyle</option>
              <option>Beauty</option>
              <option>Fitness</option>
            </select>
          </div>
          <button style={styles.saveBtn}>Save Changes</button>
        </div>
      )}

      {/* PRIVACY */}
      {activeTab === "privacy" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Privacy Settings</h2>
          <div style={styles.settingItem}>
            <div>
              <p style={styles.settingName}>Profile Visibility</p>
              <p style={styles.settingDesc}>Make your profile visible to other creators</p>
            </div>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
          </div>
          <div style={styles.settingItem}>
            <div>
              <p style={styles.settingName}>Data Collection</p>
              <p style={styles.settingDesc}>Allow analytics on your activity</p>
            </div>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
          </div>
          <div style={styles.settingItem}>
            <div>
              <p style={styles.settingName}>Marketing Emails</p>
              <p style={styles.settingDesc}>Receive emails about new features</p>
            </div>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
          </div>
          <div style={styles.settingItem}>
            <div>
              <p style={styles.settingName}>Allow Direct Messages</p>
              <p style={styles.settingDesc}>Other creators can message you</p>
            </div>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Notification Preferences</h2>
          <div style={styles.notificationGroup}>
            <p style={styles.groupTitle}>📧 Email Notifications</p>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>New Collaboration Requests</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>Goal Milestone Alerts</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>Weekly Performance Report</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
          </div>
          <div style={styles.notificationGroup}>
            <p style={styles.groupTitle}>🔔 In-App Notifications</p>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>Messages from Creators</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>Course Updates</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
            <div style={styles.settingItem}>
              <p style={styles.settingName}>Event Reminders</p>
              <input type="checkbox" style={styles.checkbox} defaultChecked />
            </div>
          </div>
        </div>
      )}

      {/* BILLING */}
      {activeTab === "billing" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Billing & Subscription</h2>
          <div style={styles.billingCard}>
            <p style={styles.billingPlan}>Current Plan: Creator Pro</p>
            <p style={styles.billingPrice}>$99/month</p>
            <p style={styles.billingDesc}>Unlimited posts, analytics, and support</p>
            <button style={styles.upgradeBtn}>Manage Subscription</button>
          </div>
          <div style={styles.billingHistory}>
            <h3 style={styles.billingHistoryTitle}>Billing History</h3>
            {[
              { date: "Dec 20, 2024", amount: "$99.00", status: "Paid" },
              { date: "Nov 20, 2024", amount: "$99.00", status: "Paid" },
              { date: "Oct 20, 2024", amount: "$99.00", status: "Paid" },
            ].map((invoice, i) => (
              <div key={i} style={styles.invoiceItem}>
                <div>
                  <p style={styles.invoiceDate}>{invoice.date}</p>
                </div>
                <div>
                  <p style={styles.invoiceAmount}>{invoice.amount}</p>
                  <p style={styles.invoiceStatus}>{invoice.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTEGRATIONS */}
      {activeTab === "integrations" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Connected Platforms</h2>
          <div style={styles.integrationsList}>
            {[
              { name: "Instagram", connected: true, icon: "📱" },
              { name: "TikTok", connected: true, icon: "🎵" },
              { name: "YouTube", connected: false, icon: "▶️" },
              { name: "LinkedIn", connected: false, icon: "💼" },
              { name: "Stripe", connected: true, icon: "💳" },
              { name: "ConvertKit", connected: false, icon: "📧" },
            ].map((integration, i) => (
              <div key={i} style={styles.integrationCard}>
                <p style={styles.integrationIcon}>{integration.icon}</p>
                <div style={styles.integrationInfo}>
                  <p style={styles.integrationName}>{integration.name}</p>
                  <p
                    style={{
                      ...styles.integrationStatus,
                      color: integration.connected ? "#10b981" : "#6b7280",
                    }}
                  >
                    {integration.connected ? "✓ Connected" : "Not connected"}
                  </p>
                </div>
                <button
                  style={{
                    ...styles.integrationBtn,
                    background: integration.connected ? "#f3f4f6" : "#3b82f6",
                    color: integration.connected ? "#111827" : "white",
                  }}
                >
                  {integration.connected ? "Manage" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  css: `button:hover { opacity: 0.85; }`,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#0369a1",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
  },
  tab: {
    padding: "12px 16px",
    background: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
  },
  tabActive: {
    color: "#0369a1",
    borderBottomColor: "#0369a1",
  },
  section: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    minHeight: "100px",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
  },
  saveBtn: {
    padding: "10px 24px",
    background: "#0369a1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  settingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  settingName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  settingDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  checkbox: {
    width: "24px",
    height: "24px",
    cursor: "pointer",
  },
  notificationGroup: {
    marginBottom: "24px",
    paddingBottom: "24px",
    borderBottom: "1px solid #e5e7eb",
  },
  groupTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  billingCard: {
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    border: "1px solid #93c5fd",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  billingPlan: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0369a1",
    margin: "0 0 8px 0",
  },
  billingPrice: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0369a1",
    margin: "0 0 4px 0",
  },
  billingDesc: {
    fontSize: "12px",
    color: "#0369a1",
    margin: "0 0 12px 0",
  },
  upgradeBtn: {
    padding: "10px 20px",
    background: "#0369a1",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  billingHistory: {
    marginTop: "24px",
  },
  billingHistoryTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  invoiceItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  invoiceDate: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  invoiceAmount: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
    textAlign: "right",
  },
  invoiceStatus: {
    fontSize: "11px",
    color: "#10b981",
    margin: "4px 0 0 0",
    textAlign: "right",
  },
  integrationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  integrationCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  integrationIcon: {
    fontSize: "32px",
    margin: 0,
    flexShrink: 0,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  integrationStatus: {
    fontSize: "12px",
    margin: "4px 0 0 0",
  },
  integrationBtn: {
    padding: "8px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
