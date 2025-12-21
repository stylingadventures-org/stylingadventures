import React, { useState } from "react";

export default function GrowthTracker() {
  const [selectedGoal, setSelectedGoal] = useState(0);
  const [goals] = useState([
    {
      name: "Hit 100K Followers",
      progress: 72,
      current: 72000,
      target: 100000,
      deadline: "March 2026",
      icon: "👥",
      status: "on-track",
    },
    {
      name: "Launch Digital Course",
      progress: 45,
      current: 45,
      target: 100,
      deadline: "February 2026",
      icon: "📚",
      status: "on-track",
    },
    {
      name: "Generate $50K Revenue",
      progress: 68,
      current: 34000,
      target: 50000,
      deadline: "April 2026",
      icon: "💰",
      status: "ahead",
    },
    {
      name: "Build Email List to 25K",
      progress: 58,
      current: 14500,
      target: 25000,
      deadline: "May 2026",
      icon: "📧",
      status: "on-track",
    },
  ]);

  const milestones = [
    { name: "First 10K followers", completed: true, date: "June 2024" },
    { name: "First product sale", completed: true, date: "September 2024" },
    { name: "50K email subscribers", completed: true, date: "November 2024" },
    { name: "First $10K month", completed: true, date: "December 2024" },
    { name: "100K followers", completed: false, date: "Est. March 2026" },
  ];

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <p style={styles.pill}>🎯 GROWTH TRACKER</p>
        <h1 style={styles.title}>Your Growth Dashboard</h1>
        <p style={styles.subtitle}>Track progress toward your biggest goals</p>
      </section>

      {/* GOALS */}
      <div style={styles.goalsGrid}>
        {goals.map((goal, i) => (
          <div
            key={i}
            onClick={() => setSelectedGoal(i)}
            style={{
              ...styles.goalCard,
              ...(selectedGoal === i ? styles.goalCardActive : {}),
            }}
          >
            <div style={styles.goalHeader}>
              <p style={styles.goalIcon}>{goal.icon}</p>
              <span
                style={{
                  ...styles.statusBadge,
                  background:
                    goal.status === "ahead" ? "#dcfce7" : "#fef3c7",
                  color: goal.status === "ahead" ? "#166534" : "#92400e",
                }}
              >
                {goal.status === "ahead" ? "🚀 Ahead" : "✓ On Track"}
              </span>
            </div>
            <p style={styles.goalName}>{goal.name}</p>
            <div style={styles.goalStats}>
              <p>
                <strong>{goal.current.toLocaleString()}</strong> /{" "}
                {goal.target.toLocaleString()}
              </p>
              <p style={styles.goalDeadline}>{goal.deadline}</p>
            </div>
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${goal.progress}%` }} />
            </div>
            <p style={styles.progressText}>{goal.progress}% Complete</p>
          </div>
        ))}
      </div>

      {/* DETAILED VIEW */}
      {selectedGoal !== null && (
        <div style={styles.detailCard}>
          <h2 style={styles.detailTitle}>{goals[selectedGoal].name}</h2>

          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <p style={styles.detailLabel}>Current</p>
              <p style={styles.detailValue}>
                {goals[selectedGoal].current.toLocaleString()}
              </p>
            </div>
            <div style={styles.detailItem}>
              <p style={styles.detailLabel}>Target</p>
              <p style={styles.detailValue}>
                {goals[selectedGoal].target.toLocaleString()}
              </p>
            </div>
            <div style={styles.detailItem}>
              <p style={styles.detailLabel}>Progress</p>
              <p style={styles.detailValue}>{goals[selectedGoal].progress}%</p>
            </div>
            <div style={styles.detailItem}>
              <p style={styles.detailLabel}>Deadline</p>
              <p style={styles.detailValue}>{goals[selectedGoal].deadline}</p>
            </div>
          </div>

          <div style={styles.largeProgressBar}>
            <div
              style={{
                ...styles.largeProgressFill,
                width: `${goals[selectedGoal].progress}%`,
              }}
            />
          </div>

          <div style={styles.actionButtons}>
            <button style={styles.actionBtn}>Edit Goal</button>
            <button style={styles.actionBtn}>View Strategy</button>
            <button style={styles.actionBtn}>Get Tips</button>
          </div>
        </div>
      )}

      {/* MILESTONES */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 Milestones</h2>
        <div style={styles.timeline}>
          {milestones.map((milestone, i) => (
            <div key={i} style={styles.timelineItem}>
              <div
                style={{
                  ...styles.timelineMarker,
                  background: milestone.completed
                    ? "#10b981"
                    : "#9ca3af",
                }}
              >
                {milestone.completed ? "✓" : "◯"}
              </div>
              <div style={styles.timelineContent}>
                <p style={styles.timelineName}>{milestone.name}</p>
                <p style={styles.timelineDate}>{milestone.date}</p>
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
    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#92400e",
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
  goalsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  goalCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  goalCardActive: {
    background: "#fffbeb",
    borderColor: "#fbbf24",
    boxShadow: "0 0 0 3px rgba(251, 191, 36, 0.1)",
  },
  goalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  goalIcon: {
    fontSize: "24px",
    margin: 0,
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
  goalName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  goalStats: {
    marginBottom: "8px",
  },
  goalDeadline: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "4px 0 0 0",
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
    background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
  },
  progressText: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  detailCard: {
    background: "white",
    border: "2px solid #fbbf24",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
  },
  detailTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  detailItem: {
    textAlign: "center",
    padding: "12px",
    background: "#fffbeb",
    borderRadius: "8px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 4px 0",
  },
  detailValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  largeProgressBar: {
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "20px",
  },
  largeProgressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    flex: 1,
    padding: "10px",
    background: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  timelineItem: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  timelineMarker: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "700",
    flexShrink: 0,
  },
  timelineContent: {
    padding: "8px 0",
  },
  timelineName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  timelineDate: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
};
