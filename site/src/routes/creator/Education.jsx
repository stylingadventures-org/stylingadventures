import React, { useState } from "react";

export default function Education() {
  const [selectedTab, setSelectedTab] = useState("courses");

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <p style={styles.pill}>🎓 EDUCATION</p>
        <h1 style={styles.title}>Creator Education Hub</h1>
        <p style={styles.subtitle}>Level up your skills, grow your empire</p>
      </section>

      {/* TABS */}
      <div style={styles.tabs}>
        {["courses", "guides", "templates", "community"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              ...styles.tab,
              ...(selectedTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === "courses" && "📚 Courses"}
            {tab === "guides" && "📖 Guides"}
            {tab === "templates" && "📋 Templates"}
            {tab === "community" && "👥 Community"}
          </button>
        ))}
      </div>

      {/* COURSES */}
      {selectedTab === "courses" && (
        <div style={styles.grid}>
          {[
            {
              title: "From 0 to $10K/Month",
              desc: "12-week monetization bootcamp",
              progress: 45,
              level: "Intermediate",
              icon: "🚀",
            },
            {
              title: "Content That Sells",
              desc: "Master the psychology of persuasion",
              progress: 100,
              level: "Beginner",
              icon: "💰",
            },
            {
              title: "Building Your Brand",
              desc: "Create a recognizable, scalable brand",
              progress: 0,
              level: "Advanced",
              icon: "🎨",
            },
            {
              title: "Audience Psychology 101",
              desc: "Understand and serve your community",
              progress: 78,
              level: "Intermediate",
              icon: "🧠",
            },
          ].map((course, i) => (
            <div key={i} style={styles.card}>
              <p style={styles.courseIcon}>{course.icon}</p>
              <p style={styles.courseTitle}>{course.title}</p>
              <p style={styles.courseDesc}>{course.desc}</p>
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{ ...styles.progressFill, width: `${course.progress}%` }}
                  />
                </div>
                <p style={styles.progressText}>{course.progress}%</p>
              </div>
              <p style={styles.courseLevel}>{course.level}</p>
              <button style={styles.enrollBtn}>
                {course.progress > 0 ? "Continue" : "Enroll"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GUIDES */}
      {selectedTab === "guides" && (
        <div style={styles.list}>
          {[
            "Your First 100 Followers: The Authentic Path",
            "Platform Strategy: Where Should You Post?",
            "The 80/20 Content Rule That Actually Works",
            "Building Email Lists That Convert",
            "Creator Tax Essentials (Don't Get Audited)",
          ].map((guide, i) => (
            <div key={i} style={styles.listItem}>
              <p style={styles.listIcon}>📖</p>
              <div style={styles.listContent}>
                <p style={styles.listTitle}>{guide}</p>
                <p style={styles.listMeta}>
                  ~15 min read • Last updated 2 weeks ago
                </p>
              </div>
              <button style={styles.readBtn}>Read</button>
            </div>
          ))}
        </div>
      )}

      {/* TEMPLATES */}
      {selectedTab === "templates" && (
        <div style={styles.grid}>
          {[
            { name: "Caption Templates", desc: "15 proven captions", icon: "✍️" },
            { name: "Email Sequences", desc: "5 complete funnels", icon: "📧" },
            { name: "Script Templates", desc: "Video/Reel scripts", icon: "🎬" },
            { name: "Content Calendars", desc: "3-month planners", icon: "📅" },
          ].map((template, i) => (
            <div key={i} style={styles.templateCard}>
              <p style={styles.templateIcon}>{template.icon}</p>
              <p style={styles.templateName}>{template.name}</p>
              <p style={styles.templateDesc}>{template.desc}</p>
              <button style={styles.downloadBtn}>Download</button>
            </div>
          ))}
        </div>
      )}

      {/* COMMUNITY */}
      {selectedTab === "community" && (
        <div style={styles.communitySection}>
          <div style={styles.communityCard}>
            <p style={styles.communityIcon}>👥</p>
            <p style={styles.communityTitle}>Creator Circle</p>
            <p style={styles.communityDesc}>
              Direct access to the Lala creator community
            </p>
            <button style={styles.joinBtn}>Join Community</button>
          </div>
          <div style={styles.communityCard}>
            <p style={styles.communityIcon}>🎤</p>
            <p style={styles.communityTitle}>Monthly Masterclasses</p>
            <p style={styles.communityDesc}>
              Live training with top creators ($100K+ earners)
            </p>
            <button style={styles.joinBtn}>Register</button>
          </div>
          <div style={styles.communityCard}>
            <p style={styles.communityIcon}>💬</p>
            <p style={styles.communityTitle}>Creator Support</p>
            <p style={styles.communityDesc}>
              Get help from Lala team and experienced creators
            </p>
            <button style={styles.joinBtn}>Get Help</button>
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
    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
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
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
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
    color: "#1e40af",
    borderBottomColor: "#1e40af",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  courseIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
  },
  courseTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  courseDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 12px 0",
  },
  progressContainer: {
    marginBottom: "12px",
  },
  progressBar: {
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "4px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #1e40af)",
  },
  progressText: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  courseLevel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    margin: "0 0 8px 0",
  },
  enrollBtn: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #3b82f6, #1e40af)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  listItem: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  listIcon: {
    fontSize: "32px",
    margin: 0,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  listMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  readBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  templateCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  templateIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
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
  downloadBtn: {
    width: "100%",
    padding: "10px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  communitySection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  communityCard: {
    background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
    border: "1px solid #93c5fd",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
  },
  communityIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
  },
  communityTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e40af",
    margin: "0 0 8px 0",
  },
  communityDesc: {
    fontSize: "13px",
    color: "#1e40af",
    margin: "0 0 16px 0",
  },
  joinBtn: {
    width: "100%",
    padding: "10px",
    background: "#1e40af",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
