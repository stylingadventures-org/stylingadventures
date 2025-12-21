import React, { useState } from "react";

export default function FunnelAutomation() {
  const [activeTab, setActiveTab] = useState("funnels");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [funnels, setFunnels] = useState([
    {
      id: 1,
      name: "Email Launch Funnel",
      type: "email",
      stage: "active",
      leads: 234,
      conversions: 18,
      revenue: 1340,
    },
    {
      id: 2,
      name: "Lead Magnet Sequence",
      type: "automation",
      stage: "active",
      leads: 567,
      conversions: 34,
      revenue: 0,
    },
    {
      id: 3,
      name: "DM Automation",
      type: "dm",
      stage: "draft",
      leads: 0,
      conversions: 0,
      revenue: 0,
    },
  ]);

  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: "Welcome Email",
      trigger: "New subscriber",
      action: "Send 3-email sequence",
      status: "active",
    },
    {
      id: 2,
      name: "Abandoned Cart",
      trigger: "Add to cart, no purchase",
      action: "Send email after 24h, 48h",
      status: "active",
    },
    {
      id: 3,
      name: "Post Engagement to DM",
      trigger: "Comment on post",
      action: "Send personalized DM",
      status: "draft",
    },
  ]);

  const totalLeads = funnels.reduce((sum, f) => sum + f.leads, 0);
  const totalConversions = funnels.reduce((sum, f) => sum + f.conversions, 0);
  const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0;
  const totalRevenue = funnels.reduce((sum, f) => sum + f.revenue, 0);

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>⚙️ AUTOMATIONS</p>
          <h1 style={styles.title}>Funnel & Automation Builder</h1>
          <p style={styles.subtitle}>
            Create systems that make money while you sleep
          </p>
        </div>
      </section>

      {/* KPIs */}
      <div style={styles.kpis}>
        <div style={styles.kpi}>
          <p style={styles.kpiValue}>{totalLeads}</p>
          <p style={styles.kpiLabel}>Total Leads</p>
        </div>
        <div style={styles.kpi}>
          <p style={styles.kpiValue}>{conversionRate}%</p>
          <p style={styles.kpiLabel}>Conversion Rate</p>
        </div>
        <div style={styles.kpi}>
          <p style={styles.kpiValue}>${totalRevenue}</p>
          <p style={styles.kpiLabel}>Revenue Generated</p>
        </div>
        <div style={styles.kpi}>
          <p style={styles.kpiValue}>{funnels.filter((f) => f.stage === "active").length}</p>
          <p style={styles.kpiLabel}>Active Funnels</p>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("funnels")}
          style={{
            ...styles.tab,
            ...(activeTab === "funnels" ? styles.tabActive : {}),
          }}
        >
          🎯 Funnels
        </button>
        <button
          onClick={() => setActiveTab("automations")}
          style={{
            ...styles.tab,
            ...(activeTab === "automations" ? styles.tabActive : {}),
          }}
        >
          ⚡ Automations
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          style={{
            ...styles.tab,
            ...(activeTab === "templates" ? styles.tabActive : {}),
          }}
        >
          📋 Templates
        </button>
      </div>

      {/* FUNNELS */}
      {activeTab === "funnels" && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Sales Funnels</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              style={styles.createBtn}
            >
              + New Funnel
            </button>
          </div>

          <div style={styles.grid}>
            {funnels.map((funnel) => (
              <div key={funnel.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.funnelName}>{funnel.name}</p>
                    <p style={styles.funnelType}>
                      {funnel.type === "email" && "📧 Email"}
                      {funnel.type === "automation" && "⚡ Automation"}
                      {funnel.type === "dm" && "💬 DM"}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      ...(funnel.stage === "active"
                        ? styles.badgeActive
                        : styles.badgeDraft),
                    }}
                  >
                    {funnel.stage}
                  </span>
                </div>

                <div style={styles.cardStats}>
                  <div style={styles.stat}>
                    <p style={styles.statValue}>{funnel.leads}</p>
                    <p style={styles.statLabel}>Leads</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statValue}>
                      {funnel.leads > 0
                        ? ((funnel.conversions / funnel.leads) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                    <p style={styles.statLabel}>Conversion</p>
                  </div>
                  <div style={styles.stat}>
                    <p style={styles.statValue}>${funnel.revenue}</p>
                    <p style={styles.statLabel}>Revenue</p>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button style={styles.actionBtn}>View</button>
                  <button style={styles.actionBtn}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AUTOMATIONS */}
      {activeTab === "automations" && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Smart Automations</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              style={styles.createBtn}
            >
              + New Automation
            </button>
          </div>

          <div style={styles.automationsList}>
            {automations.map((auto) => (
              <div key={auto.id} style={styles.automationCard}>
                <div style={styles.autoHeader}>
                  <div>
                    <p style={styles.autoName}>{auto.name}</p>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      ...(auto.status === "active"
                        ? styles.badgeActive
                        : styles.badgeDraft),
                    }}
                  >
                    {auto.status}
                  </span>
                </div>

                <div style={styles.autoFlow}>
                  <div style={styles.flowStep}>
                    <p style={styles.flowLabel}>Trigger</p>
                    <p style={styles.flowValue}>{auto.trigger}</p>
                  </div>
                  <p style={styles.arrow}>→</p>
                  <div style={styles.flowStep}>
                    <p style={styles.flowLabel}>Action</p>
                    <p style={styles.flowValue}>{auto.action}</p>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button style={styles.actionBtn}>View</button>
                  <button style={styles.actionBtn}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TEMPLATES */}
      {activeTab === "templates" && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Pre-Built Templates</h2>

          <div style={styles.grid}>
            {[
              {
                name: "Lead Magnet Funnel",
                desc: "Free resource → Email list → Offer",
                icon: "🧲",
              },
              {
                name: "Waitlist Automation",
                desc: "Pre-launch hype → Email sequence",
                icon: "⏳",
              },
              {
                name: "Post Engagement Flow",
                desc: "Engagement → DM → Offer",
                icon: "💬",
              },
              {
                name: "Email Launch Sequence",
                desc: "5-email sequence to new subscribers",
                icon: "🚀",
              },
              {
                name: "Abandoned Cart Recovery",
                desc: "Automated reminder emails",
                icon: "🛒",
              },
              {
                name: "VIP Nurture Sequence",
                desc: "Premium onboarding for high-value",
                icon: "👑",
              },
            ].map((template, i) => (
              <div key={i} style={styles.templateCard}>
                <p style={styles.templateIcon}>{template.icon}</p>
                <p style={styles.templateName}>{template.name}</p>
                <p style={styles.templateDesc}>{template.desc}</p>
                <button style={styles.useBtn}>Use Template</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Create New {activeTab}</h2>
            <p style={styles.modalDesc}>Choose what you want to build</p>

            <div style={styles.modalOptions}>
              <button style={styles.modalOption}>
                <p style={styles.optionIcon}>🧲</p>
                <p style={styles.optionName}>Lead Magnet</p>
              </button>
              <button style={styles.modalOption}>
                <p style={styles.optionIcon}>📧</p>
                <p style={styles.optionName}>Email Sequence</p>
              </button>
              <button style={styles.modalOption}>
                <p style={styles.optionIcon}>💬</p>
                <p style={styles.optionName}>DM Automation</p>
              </button>
              <button style={styles.modalOption}>
                <p style={styles.optionIcon}>🎯</p>
                <p style={styles.optionName}>Sales Funnel</p>
              </button>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  css: `button:hover { opacity: 0.85; }`,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#4338ca",
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
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  kpi: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  kpiValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  kpiLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    borderBottom: "1px solid #e5e7eb",
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
    color: "#4338ca",
    borderBottomColor: "#4338ca",
  },
  section: {
    marginBottom: "32px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  createBtn: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  funnelName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  funnelType: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "4px",
    textTransform: "capitalize",
  },
  badgeActive: {
    background: "#d1fae5",
    color: "#065f46",
  },
  badgeDraft: {
    background: "#fee2e2",
    color: "#7f1d1d",
  },
  cardStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  stat: {
    textAlign: "center",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    flex: 1,
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  automationsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  automationCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  autoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  autoName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  autoFlow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  flowStep: {
    flex: 1,
    padding: "12px",
    background: "#f3f4f6",
    borderRadius: "6px",
  },
  flowLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 4px 0",
  },
  flowValue: {
    fontSize: "13px",
    color: "#111827",
    margin: 0,
  },
  arrow: {
    fontSize: "20px",
    color: "#9ca3af",
    margin: "0 4px",
  },
  templateCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  templateIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  templateName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  templateDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 12px 0",
  },
  useBtn: {
    width: "100%",
    padding: "8px",
    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  modalDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 20px 0",
  },
  modalOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  modalOption: {
    padding: "16px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
  },
  optionIcon: {
    fontSize: "24px",
    margin: "0 0 8px 0",
  },
  optionName: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  modalActions: {
    display: "flex",
    gap: "8px",
  },
  cancelBtn: {
    flex: 1,
    padding: "10px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
