import React, { useState } from "react";

export default function ResourceLibrary() {
  const [selectedCategory, setSelectedCategory] = useState("templates");

  const categories = {
    templates: [
      { name: "Caption Templates (50+)", desc: "Proven captions for every occasion", icon: "✍️", downloads: 3421 },
      { name: "Email Swipe Files", desc: "High-converting email templates", icon: "📧", downloads: 2134 },
      { name: "Script Templates", desc: "Video, Reel, and TikTok scripts", icon: "🎬", downloads: 4012 },
      { name: "Social Graphics", desc: "Canva templates (editable)", icon: "🎨", downloads: 1892 },
    ],
    guides: [
      { name: "The Creator Bible", desc: "Everything you need to know", icon: "📖", downloads: 5241 },
      { name: "100-Day Growth Plan", desc: "Step-by-step growth roadmap", icon: "📊", downloads: 2456 },
      { name: "Email List Monetization", desc: "Turn subscribers into revenue", icon: "💰", downloads: 1834 },
      { name: "Platform Algorithm Guide", desc: "Master every platform's algorithm", icon: "🔍", downloads: 3128 },
    ],
    tools: [
      { name: "Content Calendar (Spreadsheet)", desc: "Google Sheets template", icon: "📅", downloads: 6234 },
      { name: "Analytics Dashboard", desc: "Track all your metrics", icon: "📈", downloads: 2891 },
      { name: "Collaboration Contract", desc: "Legal protection for deals", icon: "⚖️", downloads: 1456 },
      { name: "Tax Spreadsheet", desc: "Track income and expenses", icon: "💼", downloads: 3421 },
    ],
  };

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <p style={styles.pill}>📚 RESOURCES</p>
        <h1 style={styles.title}>Creator Resource Library</h1>
        <p style={styles.subtitle}>Templates, guides, and tools built by creators</p>
      </section>

      <div style={styles.categoryButtons}>
        {Object.keys(categories).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.categoryBtn,
              ...(selectedCategory === cat ? styles.categoryBtnActive : {}),
            }}
          >
            {cat === "templates" && "✍️ Templates"}
            {cat === "guides" && "📖 Guides"}
            {cat === "tools" && "🛠️ Tools"}
          </button>
        ))}
      </div>

      <div style={styles.resourcesGrid}>
        {categories[selectedCategory].map((resource, i) => (
          <div key={i} style={styles.resourceCard}>
            <p style={styles.resourceIcon}>{resource.icon}</p>
            <p style={styles.resourceName}>{resource.name}</p>
            <p style={styles.resourceDesc}>{resource.desc}</p>
            <p style={styles.downloadCount}>📥 {resource.downloads} downloads</p>
            <button style={styles.downloadBtn}>Download Free</button>
          </div>
        ))}
      </div>

      <section style={styles.contributorSection}>
        <h2 style={styles.contributorTitle}>💡 Contribute Your Resource</h2>
        <p style={styles.contributorDesc}>
          Have a template or guide you've created? Share it with the community and earn rewards.
        </p>
        <button style={styles.submitBtn}>Submit Your Resource</button>
      </section>
    </div>
  );
}

const styles = {
  container: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  hero: { marginBottom: "32px", padding: "32px", background: "linear-gradient(135deg, #fecaca, #fca5a5)", borderRadius: "16px" },
  pill: { fontSize: "11px", fontWeight: "700", color: "#991b1b", margin: "0 0 8px 0", textTransform: "uppercase" },
  title: { fontSize: "32px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  categoryButtons: { display: "flex", gap: "8px", marginBottom: "32px" },
  categoryBtn: { padding: "10px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  categoryBtnActive: { background: "#dc2626", color: "white", borderColor: "transparent" },
  resourcesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" },
  resourceCard: { background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px", textAlign: "center" },
  resourceIcon: { fontSize: "40px", margin: "0 0 12px 0" },
  resourceName: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" },
  resourceDesc: { fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" },
  downloadCount: { fontSize: "11px", color: "#9ca3af", margin: "0 0 12px 0" },
  downloadBtn: { width: "100%", padding: "10px", background: "#dc2626", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
  contributorSection: { background: "linear-gradient(135deg, #fecaca, #fca5a5)", borderRadius: "12px", padding: "32px", textAlign: "center" },
  contributorTitle: { fontSize: "20px", fontWeight: "700", color: "#991b1b", margin: "0 0 8px 0" },
  contributorDesc: { fontSize: "13px", color: "#991b1b", margin: "0 0 16px 0" },
  submitBtn: { padding: "12px 32px", background: "#991b1b", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
};
