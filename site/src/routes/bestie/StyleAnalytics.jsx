import React, { useState } from "react";

const SAMPLE_DATA = {
  mostWorn: [
    { name: "Black Trousers", wears: 24, category: "Bottoms", image: "👖" },
    { name: "White Sneakers", wears: 18, category: "Shoes", image: "👟" },
    { name: "Pink Top", wears: 16, category: "Tops", image: "👕" },
  ],
  colors: [
    { color: "Black", count: 18, percentage: 28 },
    { color: "White", count: 12, percentage: 19 },
    { color: "Pink", count: 10, percentage: 15 },
    { color: "Navy", count: 8, percentage: 12 },
    { color: "Gold", count: 7, percentage: 11 },
  ],
  categories: [
    { name: "Tops", items: 12, wears: 45, cpw: "$2.89" },
    { name: "Bottoms", items: 8, wears: 38, cpw: "$3.12" },
    { name: "Shoes", items: 5, wears: 28, cpw: "$9.21" },
    { name: "Accessories", items: 6, wears: 22, cpw: "$1.82" },
  ],
};

export default function StyleAnalytics() {
  const [timeRange, setTimeRange] = useState("3months");

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>📊 ANALYTICS</p>
          <h1 style={styles.title}>Your Style Profile</h1>
          <p style={styles.subtitle}>
            Discover your fashion patterns and optimize your wardrobe
          </p>
        </div>
      </section>

      {/* TIME FILTER */}
      <div style={styles.filterBar}>
        {["1month", "3months", "6months", "all"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              ...styles.filterBtn,
              ...(timeRange === range ? styles.filterBtnActive : {}),
            }}
          >
            {range === "1month" && "1 Month"}
            {range === "3months" && "3 Months"}
            {range === "6months" && "6 Months"}
            {range === "all" && "All Time"}
          </button>
        ))}
      </div>

      {/* KEY STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Items</p>
          <p style={styles.statValue}>37</p>
          <p style={styles.statMeta}>Across 4 categories</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Wardrobe Value</p>
          <p style={styles.statValue}>$1,254</p>
          <p style={styles.statMeta}>Average CPW: $4.23</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Wears</p>
          <p style={styles.statValue}>133</p>
          <p style={styles.statMeta}>In last 3 months</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Avg Wears/Item</p>
          <p style={styles.statValue}>3.6×</p>
          <p style={styles.statMeta}>60% higher than avg</p>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* MOST WORN */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>🔥 Most Worn Items</h2>
          <div style={styles.itemsList}>
            {SAMPLE_DATA.mostWorn.map((item, idx) => (
              <div key={idx} style={styles.wornItem}>
                <div style={styles.wornRank}>{idx + 1}</div>
                <div style={styles.wornImage}>{item.image}</div>
                <div style={styles.wornInfo}>
                  <p style={styles.wornName}>{item.name}</p>
                  <p style={styles.wornCategory}>{item.category}</p>
                </div>
                <div style={styles.wornMeta}>
                  <p style={styles.wornCount}>{item.wears} wears</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLOR BREAKDOWN */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>🎨 Color Palette</h2>
          <div style={styles.colorsList}>
            {SAMPLE_DATA.colors.map((color, idx) => (
              <div key={idx} style={styles.colorRow}>
                <div style={styles.colorBar}>
                  <div
                    style={{
                      ...styles.colorBarFill,
                      width: `${color.percentage * 2}%`,
                      background:
                        color.color === "Black"
                          ? "#000"
                          : color.color === "White"
                          ? "#f3f4f6"
                          : color.color === "Pink"
                          ? "#ff4fa3"
                          : color.color === "Navy"
                          ? "#1e3a8a"
                          : "#fbbf24",
                    }}
                  />
                </div>
                <span style={styles.colorLabel}>{color.color}</span>
                <span style={styles.colorPercent}>{color.percentage}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CATEGORIES */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>📂 Category Breakdown</h2>
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.tableCell}>Category</div>
            <div style={styles.tableCell}>Items</div>
            <div style={styles.tableCell}>Total Wears</div>
            <div style={styles.tableCell}>Cost/Wear</div>
            <div style={styles.tableCell}>Recommendation</div>
          </div>
          {SAMPLE_DATA.categories.map((cat, idx) => (
            <div key={idx} style={styles.tableRow}>
              <div style={styles.tableCell}>{cat.name}</div>
              <div style={styles.tableCell}>{cat.items}</div>
              <div style={styles.tableCell}>{cat.wears}</div>
              <div style={styles.tableCell}>{cat.cpw}</div>
              <div style={styles.tableCell}>
                {cat.name === "Tops" && "Well-stocked ✅"}
                {cat.name === "Bottoms" && "Add neutral pair 💡"}
                {cat.name === "Shoes" && "Invest in 1-2 more 💡"}
                {cat.name === "Accessories" && "Plenty of options ✅"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INSIGHTS */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>💡 Personalized Insights</h2>
        <div style={styles.insightsList}>
          <div style={styles.insightCard}>
            <p style={styles.insightTitle}>Your Style Personality</p>
            <p style={styles.insightText}>
              Minimalist + Trendy: You prefer clean silhouettes with pops of color.
              Focus on quality basics and statement accessories.
            </p>
          </div>
          <div style={styles.insightCard}>
            <p style={styles.insightTitle}>Wardrobe Health</p>
            <p style={styles.insightText}>
              ⭐ Excellent: Your average item is worn 3.6× (vs. 2× industry avg).
              Your wardrobe is highly optimized!
            </p>
          </div>
          <div style={styles.insightCard}>
            <p style={styles.insightTitle}>Shopping Suggestion</p>
            <p style={styles.insightText}>
              Add 1-2 neutral bottoms to pair with your 12 tops. This would unlock
              8+ new outfit combinations and increase overall wear.
            </p>
          </div>
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
  css: `
    button:hover {
      opacity: 0.85;
    }
  `,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#1e40af",
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
  filterBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
  },
  filterBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  filterBtnActive: {
    background: "#1e40af",
    color: "white",
    borderColor: "#1e40af",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 4px 0",
  },
  statMeta: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  wornItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  wornRank: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ff4fa3",
    minWidth: "24px",
  },
  wornImage: {
    fontSize: "32px",
  },
  wornInfo: {
    flex: 1,
  },
  wornName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  wornCategory: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  wornMeta: {
    textAlign: "right",
  },
  wornCount: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1e40af",
    margin: 0,
  },
  colorsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  colorBar: {
    flex: 1,
    height: "24px",
    background: "#f3f4f6",
    borderRadius: "4px",
    overflow: "hidden",
  },
  colorBarFill: {
    height: "100%",
    borderRadius: "4px",
    minWidth: "20px",
  },
  colorLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    minWidth: "60px",
  },
  colorPercent: {
    fontSize: "12px",
    color: "#6b7280",
    minWidth: "40px",
    textAlign: "right",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #e5e7eb",
    fontSize: "13px",
  },
  tableCell: {
    color: "#111827",
  },
  insightsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  insightCard: {
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: "8px",
    padding: "16px",
  },
  insightTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 6px 0",
  },
  insightText: {
    fontSize: "12px",
    color: "#1e3a8a",
    margin: 0,
    lineHeight: "1.5",
  },
};
