import React, { useState } from "react";

export default function Analytics() {
  const [timeframe, setTimeframe] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("engagement");

  const metrics = {
    followers: { total: 47200, growth: "+8.2%", trend: "up" },
    engagement: { total: "12.4%", growth: "+2.1%", trend: "up" },
    reach: { total: "234K", growth: "+15.3%", trend: "up" },
    revenue: { total: "$4,320", growth: "+28.5%", trend: "up" },
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <p style={styles.pill}>📊 ANALYTICS</p>
        <h1 style={styles.title}>Performance Dashboard</h1>
        <p style={styles.subtitle}>
          Real-time insights across all platforms
        </p>
      </section>

      {/* TIMEFRAME SELECTOR */}
      <div style={styles.controls}>
        {["week", "month", "quarter", "year"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            style={{
              ...styles.timeBtn,
              ...(timeframe === t ? styles.timeBtnActive : {}),
            }}
          >
            {t === "week" && "📅 This Week"}
            {t === "month" && "📅 This Month"}
            {t === "quarter" && "📅 This Quarter"}
            {t === "year" && "📅 This Year"}
          </button>
        ))}
      </div>

      {/* KEY METRICS */}
      <div style={styles.metricsGrid}>
        {[
          { key: "followers", label: "Total Followers", icon: "👥" },
          { key: "engagement", label: "Engagement Rate", icon: "💬" },
          { key: "reach", label: "Average Reach", icon: "📢" },
          { key: "revenue", label: "Revenue", icon: "💰" },
        ].map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedMetric(m.key)}
            style={{
              ...styles.metricCard,
              ...(selectedMetric === m.key ? styles.metricCardActive : {}),
            }}
          >
            <p style={styles.metricIcon}>{m.icon}</p>
            <p style={styles.metricLabel}>{m.label}</p>
            <p style={styles.metricValue}>{metrics[m.key].total}</p>
            <p
              style={{
                ...styles.metricGrowth,
                color: metrics[m.key].trend === "up" ? "#10b981" : "#ef4444",
              }}
            >
              {metrics[m.key].trend === "up" ? "📈" : "📉"}{" "}
              {metrics[m.key].growth}
            </p>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <p style={styles.chartTitle}>Engagement Over Time</p>
          <div style={styles.sparkline}>
            <div style={{ ...styles.bar, height: "40%" }} />
            <div style={{ ...styles.bar, height: "55%" }} />
            <div style={{ ...styles.bar, height: "62%" }} />
            <div style={{ ...styles.bar, height: "58%" }} />
            <div style={{ ...styles.bar, height: "71%" }} />
            <div style={{ ...styles.bar, height: "85%" }} />
            <div style={{ ...styles.bar, height: "92%" }} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <p style={styles.chartTitle}>Platform Breakdown</p>
          <div style={styles.platformBreakdown}>
            <div style={styles.platformRow}>
              <p>Instagram</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progress, width: "38%" }} />
              </div>
              <p>38%</p>
            </div>
            <div style={styles.platformRow}>
              <p>TikTok</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progress, width: "35%" }} />
              </div>
              <p>35%</p>
            </div>
            <div style={styles.platformRow}>
              <p>YouTube</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progress, width: "18%" }} />
              </div>
              <p>18%</p>
            </div>
            <div style={styles.platformRow}>
              <p>Email</p>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progress, width: "9%" }} />
              </div>
              <p>9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP PERFORMING CONTENT */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔥 Top Performing Content</h2>
        <div style={styles.contentList}>
          {[
            {
              title: "Why I Ditched My Niche (and you should too)",
              platform: "Instagram Reel",
              engagement: "47.2K",
              saves: "3.2K",
            },
            {
              title: "My Morning Routine for 6-Figure Creators",
              platform: "TikTok",
              engagement: "234.5K",
              saves: "12.4K",
            },
            {
              title: "The Content Framework That Tripled My Sales",
              platform: "Email",
              engagement: "21.3%",
              saves: "Click-thru",
            },
          ].map((content, i) => (
            <div key={i} style={styles.contentItem}>
              <div>
                <p style={styles.contentTitle}>{content.title}</p>
                <p style={styles.contentMeta}>{content.platform}</p>
              </div>
              <div style={styles.contentStats}>
                <div>
                  <p style={styles.statLabel}>Engagement</p>
                  <p style={styles.statValue}>{content.engagement}</p>
                </div>
                <div>
                  <p style={styles.statLabel}>Saves/CTR</p>
                  <p style={styles.statValue}>{content.saves}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
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
    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#166534",
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
  controls: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    flexWrap: "wrap",
  },
  timeBtn: {
    padding: "10px 16px",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  timeBtnActive: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    borderColor: "transparent",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  metricCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  metricCardActive: {
    background: "#f0fdf4",
    borderColor: "#10b981",
    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
  },
  metricIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  metricLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  metricGrowth: {
    fontSize: "13px",
    fontWeight: "600",
    margin: 0,
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  chartCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  chartTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  sparkline: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "80px",
    gap: "4px",
  },
  bar: {
    flex: 1,
    background: "linear-gradient(180deg, #10b981, #059669)",
    borderRadius: "4px 4px 0 0",
  },
  platformBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  platformRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    background: "linear-gradient(90deg, #10b981, #059669)",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  contentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  contentItem: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contentTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  contentMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  contentStats: {
    display: "flex",
    gap: "24px",
    textAlign: "right",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: 0,
  },
  statValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "4px 0 0 0",
  },
};
