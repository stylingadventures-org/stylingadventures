import React, { useState } from "react";

export default function Optimization() {
  const [suggestions] = useState([
    { category: "Content", title: "Your hashtag game is weak", suggestion: "Use 15-25 relevant hashtags per post", impact: "Could increase reach by 35%", priority: "high" },
    { category: "Posting", title: "Post at optimal times", suggestion: "Your audience is most active 6-8 PM EST", impact: "Could increase engagement by 22%", priority: "high" },
    { category: "Strategy", title: "Diversify your content", suggestion: "Mix educational and entertaining content 60/40", impact: "Could reduce churn by 15%", priority: "medium" },
    { category: "Growth", title: "Engage more with followers", suggestion: "Respond to comments within 2 hours", impact: "Could grow followers by 18%", priority: "medium" },
    { category: "Monetization", title: "Launch a digital product", suggestion: "Your audience wants a course/guide", impact: "Could add $5-10K/month", priority: "high" },
    { category: "Branding", title: "Strengthen your voice", suggestion: "Be more authentic and vulnerable", impact: "Could increase community loyalty", priority: "low" },
  ]);

  const [filters, setFilters] = useState({ priority: "all", category: "all" });

  const filteredSuggestions = suggestions.filter(
    (s) =>
      (filters.priority === "all" || s.priority === filters.priority) &&
      (filters.category === "all" || s.category === filters.category)
  );

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <p style={styles.pill}>🚀 OPTIMIZATION</p>
        <h1 style={styles.title}>AI Growth Engine</h1>
        <p style={styles.subtitle}>Personalized recommendations to accelerate growth</p>
      </section>

      {/* FILTERS */}
      <div style={styles.filters}>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} style={styles.select}>
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={styles.select}>
          <option value="all">All Categories</option>
          <option value="Content">Content</option>
          <option value="Posting">Posting</option>
          <option value="Strategy">Strategy</option>
          <option value="Growth">Growth</option>
          <option value="Monetization">Monetization</option>
          <option value="Branding">Branding</option>
        </select>
      </div>

      {/* SUGGESTIONS */}
      <div style={styles.suggestionsList}>
        {filteredSuggestions.map((suggestion, i) => (
          <div
            key={i}
            style={{
              ...styles.suggestionCard,
              borderLeftColor:
                suggestion.priority === "high"
                  ? "#ef4444"
                  : suggestion.priority === "medium"
                    ? "#f59e0b"
                    : "#6b7280",
            }}
          >
            <div style={styles.suggestionHeader}>
              <div>
                <p style={styles.suggestionTitle}>{suggestion.title}</p>
                <span style={styles.categoryTag}>{suggestion.category}</span>
              </div>
              <span
                style={{
                  ...styles.priorityBadge,
                  background:
                    suggestion.priority === "high"
                      ? "#fee2e2"
                      : suggestion.priority === "medium"
                        ? "#fef3c7"
                        : "#f3f4f6",
                  color:
                    suggestion.priority === "high"
                      ? "#991b1b"
                      : suggestion.priority === "medium"
                        ? "#92400e"
                        : "#6b7280",
                }}
              >
                {suggestion.priority}
              </span>
            </div>

            <p style={styles.suggestionText}>{suggestion.suggestion}</p>

            <div style={styles.impactBox}>
              <p style={styles.impactIcon}>📈</p>
              <p style={styles.impactText}>Potential Impact: {suggestion.impact}</p>
            </div>

            <div style={styles.actions}>
              <button style={styles.learnBtn}>Learn More</button>
              <button style={styles.implementBtn}>Implement</button>
              <button style={styles.dismissBtn}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>

      {/* AI INSIGHTS */}
      <section style={styles.insightsSection}>
        <h2 style={styles.insightsTitle}>🧠 AI Insights</h2>
        <div style={styles.insightsGrid}>
          <div style={styles.insightCard}>
            <p style={styles.insightIcon}>⚡</p>
            <p style={styles.insightTitle}>Growth Velocity</p>
            <p style={styles.insightValue}>+8.2% MoM</p>
            <p style={styles.insightMeta}>Trending up from last month</p>
          </div>
          <div style={styles.insightCard}>
            <p style={styles.insightIcon}>🎯</p>
            <p style={styles.insightTitle}>Optimization Score</p>
            <p style={styles.insightValue}>73/100</p>
            <p style={styles.insightMeta}>Room for improvement</p>
          </div>
          <div style={styles.insightCard}>
            <p style={styles.insightIcon}>💡</p>
            <p style={styles.insightTitle}>Quick Win Available</p>
            <p style={styles.insightValue}>Add 15% reach</p>
            <p style={styles.insightMeta}>By optimizing hashtags</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
  hero: { marginBottom: "32px", padding: "32px", background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)", borderRadius: "16px" },
  pill: { fontSize: "11px", fontWeight: "700", color: "#3730a3", margin: "0 0 8px 0", textTransform: "uppercase" },
  title: { fontSize: "32px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  filters: { display: "flex", gap: "12px", marginBottom: "24px" },
  select: { padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", flex: 1 },
  suggestionsList: { display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" },
  suggestionCard: { background: "white", border: "1px solid #e5e7eb", borderLeft: "4px solid", borderRadius: "12px", padding: "20px" },
  suggestionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  suggestionTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" },
  categoryTag: { display: "inline-block", padding: "2px 8px", background: "#f3f4f6", color: "#6b7280", fontSize: "11px", borderRadius: "4px", fontWeight: "600" },
  priorityBadge: { padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", textTransform: "capitalize" },
  suggestionText: { fontSize: "13px", color: "#374151", margin: "0 0 12px 0", lineHeight: "1.5" },
  impactBox: { background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" },
  impactIcon: { fontSize: "18px", margin: 0 },
  impactText: { fontSize: "12px", color: "#166534", margin: 0, fontWeight: "600" },
  actions: { display: "flex", gap: "8px" },
  learnBtn: { flex: 1, padding: "8px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  implementBtn: { flex: 1, padding: "8px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  dismissBtn: { flex: 1, padding: "8px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  insightsSection: { marginTop: "40px" },
  insightsTitle: { fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 20px 0" },
  insightsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  insightCard: { background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)", border: "1px solid #a5b4fc", borderRadius: "12px", padding: "20px", textAlign: "center" },
  insightIcon: { fontSize: "32px", margin: "0 0 12px 0" },
  insightTitle: { fontSize: "13px", fontWeight: "700", color: "#3730a3", margin: "0 0 4px 0" },
  insightValue: { fontSize: "24px", fontWeight: "700", color: "#3730a3", margin: "0 0 4px 0" },
  insightMeta: { fontSize: "12px", color: "#3730a3", margin: 0 },
};
