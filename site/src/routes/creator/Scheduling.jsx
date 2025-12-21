import React, { useState } from "react";

export default function Scheduling() {
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [posts] = useState([
    { date: "Jan 20, 2026", platform: "Instagram", title: "Morning motivation post", status: "scheduled" },
    { date: "Jan 20, 2026", platform: "TikTok", title: "Behind the scenes vlog", status: "scheduled" },
    { date: "Jan 21, 2026", platform: "Instagram", title: "Product launch announcement", status: "scheduled" },
    { date: "Jan 22, 2026", platform: "Email", title: "Weekly tips newsletter", status: "draft" },
  ]);

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <p style={styles.pill}>📅 SCHEDULING</p>
        <h1 style={styles.title}>Content Scheduler</h1>
        <p style={styles.subtitle}>Plan and publish across all platforms</p>
      </section>

      <div style={styles.controls}>
        {["instagram", "tiktok", "youtube", "email"].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPlatform(p)}
            style={{ ...styles.platformBtn, ...(selectedPlatform === p ? styles.platformBtnActive : {}) }}
          >
            {p === "instagram" && "📱 Instagram"}
            {p === "tiktok" && "🎵 TikTok"}
            {p === "youtube" && "▶️ YouTube"}
            {p === "email" && "📧 Email"}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Scheduled Posts</h2>
        {posts
          .filter((p) => p.platform.toLowerCase().includes(selectedPlatform))
          .map((post, i) => (
            <div key={i} style={styles.postItem}>
              <div>
                <p style={styles.postTitle}>{post.title}</p>
                <p style={styles.postMeta}>{post.date}</p>
              </div>
              <span style={{ ...styles.badge, background: post.status === "scheduled" ? "#dcfce7" : "#f3f4f6", color: post.status === "scheduled" ? "#166534" : "#6b7280" }}>
                {post.status}
              </span>
            </div>
          ))}
      </div>

      <button style={styles.scheduleBtn}>+ Schedule New Post</button>
    </div>
  );
}

const styles = {
  container: { padding: "24px", maxWidth: "1200px", margin: "0 auto" },
  hero: { marginBottom: "32px", padding: "32px", background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: "16px" },
  pill: { fontSize: "11px", fontWeight: "700", color: "#92400e", margin: "0 0 8px 0", textTransform: "uppercase" },
  title: { fontSize: "32px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  controls: { display: "flex", gap: "8px", marginBottom: "32px", flexWrap: "wrap" },
  platformBtn: { padding: "10px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
  platformBtnActive: { background: "#f59e0b", color: "white", borderColor: "transparent" },
  section: { background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", marginBottom: "24px" },
  sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 16px 0" },
  postItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e5e7eb" },
  postTitle: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: 0 },
  postMeta: { fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" },
  badge: { padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" },
  scheduleBtn: { width: "100%", padding: "12px", background: "#f59e0b", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
};
