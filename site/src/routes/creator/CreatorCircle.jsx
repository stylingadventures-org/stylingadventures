import React, { useState } from "react";

export default function CreatorCircle() {
  const [selectedTab, setSelectedTab] = useState("members");

  const members = [
    { name: "Sarah Chen", followers: "245K", niche: "Productivity", icon: "👩" },
    { name: "Marcus Johnson", followers: "189K", niche: "Fitness", icon: "👨" },
    { name: "Alex Rivera", followers: "312K", niche: "Personal Dev", icon: "👩" },
    { name: "Jordan Lee", followers: "156K", niche: "Tech", icon: "👨" },
    { name: "Emma Wilson", followers: "428K", niche: "Beauty", icon: "👩" },
    { name: "David Park", followers: "178K", niche: "Finance", icon: "👨" },
  ];

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <p style={styles.pill}>👥 CREATOR CIRCLE</p>
        <h1 style={styles.title}>Creator Network</h1>
        <p style={styles.subtitle}>
          Connect, collaborate, and grow with 1,000+ creators
        </p>
      </section>

      {/* TABS */}
      <div style={styles.tabs}>
        {["members", "collaborations", "events", "resources"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            style={{
              ...styles.tab,
              ...(selectedTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === "members" && "👥 Members"}
            {tab === "collaborations" && "🤝 Collaborations"}
            {tab === "events" && "📅 Events"}
            {tab === "resources" && "📚 Resources"}
          </button>
        ))}
      </div>

      {/* MEMBERS */}
      {selectedTab === "members" && (
        <div style={styles.grid}>
          {members.map((member, i) => (
            <div key={i} style={styles.memberCard}>
              <p style={styles.memberIcon}>{member.icon}</p>
              <p style={styles.memberName}>{member.name}</p>
              <p style={styles.memberNiche}>{member.niche}</p>
              <p style={styles.memberFollowers}>{member.followers} followers</p>
              <div style={styles.memberActions}>
                <button style={styles.followBtn}>Follow</button>
                <button style={styles.messageBtn}>Message</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COLLABORATIONS */}
      {selectedTab === "collaborations" && (
        <div style={styles.list}>
          {[
            {
              title: "Joint Webinar: Growing Your Email List",
              with: "Sarah Chen + Marcus Johnson",
              date: "Jan 15, 2026",
              status: "confirmed",
            },
            {
              title: "Podcast Guest Swap Series",
              with: "Alex Rivera",
              date: "Jan 20, 2026",
              status: "pending",
            },
            {
              title: "Co-Created Course: Digital Products 101",
              with: "Emma Wilson + David Park",
              date: "Feb 1, 2026",
              status: "planning",
            },
          ].map((collab, i) => (
            <div key={i} style={styles.collabItem}>
              <div>
                <p style={styles.collabTitle}>{collab.title}</p>
                <p style={styles.collabMeta}>With: {collab.with}</p>
                <p style={styles.collabDate}>{collab.date}</p>
              </div>
              <span
                style={{
                  ...styles.collabStatus,
                  background:
                    collab.status === "confirmed"
                      ? "#dcfce7"
                      : collab.status === "pending"
                        ? "#fef3c7"
                        : "#e0e7ff",
                  color:
                    collab.status === "confirmed"
                      ? "#166534"
                      : collab.status === "pending"
                        ? "#92400e"
                        : "#3730a3",
                }}
              >
                {collab.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* EVENTS */}
      {selectedTab === "events" && (
        <div style={styles.eventsList}>
          {[
            {
              name: "Monthly Creator Meetup",
              date: "Jan 10, 2026 @ 2 PM EST",
              type: "virtual",
              attendees: 324,
              icon: "🎤",
            },
            {
              name: "Q&A: Monetization Strategies",
              date: "Jan 17, 2026 @ 3 PM EST",
              type: "virtual",
              attendees: 512,
              icon: "💰",
            },
            {
              name: "Creator Summit (In-Person)",
              date: "March 15-17, 2026 @ Miami",
              type: "in-person",
              attendees: 200,
              icon: "🌴",
            },
          ].map((event, i) => (
            <div key={i} style={styles.eventCard}>
              <p style={styles.eventIcon}>{event.icon}</p>
              <div style={styles.eventContent}>
                <p style={styles.eventName}>{event.name}</p>
                <p style={styles.eventDate}>{event.date}</p>
                <p style={styles.eventType}>
                  {event.type === "virtual" ? "🌐 Virtual" : "📍 In-Person"} •{" "}
                  {event.attendees} attending
                </p>
              </div>
              <button style={styles.registerBtn}>Register</button>
            </div>
          ))}
        </div>
      )}

      {/* RESOURCES */}
      {selectedTab === "resources" && (
        <div style={styles.resourcesGrid}>
          {[
            {
              name: "Collaboration Playbook",
              desc: "How to run successful creator collabs",
              icon: "📖",
            },
            {
              name: "Contract Templates",
              desc: "Ready-to-use agreements for deals",
              icon: "📋",
            },
            {
              name: "Media Kit Template",
              desc: "Professional press kit for sponsors",
              icon: "📸",
            },
            {
              name: "Rate Card Guide",
              desc: "Industry benchmarks for pricing",
              icon: "💵",
            },
          ].map((resource, i) => (
            <div key={i} style={styles.resourceCard}>
              <p style={styles.resourceIcon}>{resource.icon}</p>
              <p style={styles.resourceName}>{resource.name}</p>
              <p style={styles.resourceDesc}>{resource.desc}</p>
              <button style={styles.downloadBtn}>Download</button>
            </div>
          ))}
        </div>
      )}

      {/* STATS */}
      <section style={styles.statsSection}>
        <h2 style={styles.statsTitle}>Circle Stats</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <p style={styles.statValue}>1,247</p>
            <p style={styles.statLabel}>Active Members</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statValue}>342</p>
            <p style={styles.statLabel}>Collaborations</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statValue}>$2.3M</p>
            <p style={styles.statLabel}>Revenue Shared</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statValue}>94%</p>
            <p style={styles.statLabel}>Satisfaction Rate</p>
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
  css: `button:hover { opacity: 0.85; }`,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b21a8",
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
    color: "#7c3aed",
    borderBottomColor: "#7c3aed",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  memberCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  memberIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
  },
  memberName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  memberNiche: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  memberFollowers: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#7c3aed",
    margin: "0 0 12px 0",
  },
  memberActions: {
    display: "flex",
    gap: "8px",
  },
  followBtn: {
    flex: 1,
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  messageBtn: {
    flex: 1,
    padding: "8px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "32px",
  },
  collabItem: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collabTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  collabMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  collabDate: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "2px 0 0 0",
  },
  collabStatus: {
    padding: "4px 12px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "32px",
  },
  eventCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  eventIcon: {
    fontSize: "32px",
    margin: 0,
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  eventDate: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  eventType: {
    fontSize: "12px",
    color: "#7c3aed",
    fontWeight: "600",
    margin: "4px 0 0 0",
  },
  registerBtn: {
    padding: "8px 16px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  resourcesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  resourceCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  resourceIcon: {
    fontSize: "40px",
    margin: "0 0 12px 0",
  },
  resourceName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  resourceDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 12px 0",
  },
  downloadBtn: {
    width: "100%",
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  statsSection: {
    marginTop: "40px",
    paddingTop: "40px",
    borderTop: "1px solid #e5e7eb",
  },
  statsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
  },
  statBox: {
    background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
    border: "1px solid #e9d5ff",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#6b21a8",
    margin: 0,
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b21a8",
    margin: "8px 0 0 0",
  },
};
