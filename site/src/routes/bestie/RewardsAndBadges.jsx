import React, { useState } from "react";

const REWARD_TIERS = [
  {
    id: 1,
    tier: "Explorer",
    icon: "🗺️",
    threshold: "0-500 pts",
    color: "#6b7280",
    perks: [
      "Basic profile customization",
      "1 free exclusive outfit per month",
      "Early access to voting",
    ],
  },
  {
    id: 2,
    tier: "Trendsetter",
    icon: "✨",
    threshold: "501-1500 pts",
    color: "#ff4fa3",
    perks: [
      "Everything in Explorer +",
      "2 exclusive outfits per month",
      "Priority in voting",
      "Monthly trend report",
    ],
  },
  {
    id: 3,
    tier: "Style Icon",
    icon: "👑",
    threshold: "1501-3000 pts",
    color: "#a855f7",
    perks: [
      "Everything in Trendsetter +",
      "4 exclusive outfits per month",
      "Co-creator opportunities",
      "Premium Prime Tea access",
      "Private styling consultations",
    ],
  },
];

const BADGES = [
  { id: 1, name: "First Vote", icon: "🗳️", earned: true, date: "Dec 15, 2025" },
  {
    id: 2,
    name: "Poll Master",
    icon: "🎯",
    earned: true,
    date: "Dec 18, 2025",
    desc: "Voted in 50 polls",
  },
  {
    id: 3,
    name: "Creative Genius",
    icon: "🎨",
    earned: true,
    date: "Dec 20, 2025",
    desc: "Created a trending remix",
  },
  {
    id: 4,
    name: "Community Champion",
    icon: "🏆",
    earned: false,
    desc: "Get 10 awards from community",
  },
  {
    id: 5,
    name: "Fashion Historian",
    icon: "📚",
    earned: false,
    desc: "Read all Prime Tea articles",
  },
  {
    id: 6,
    name: "Lala's BFF",
    icon: "💕",
    earned: false,
    desc: "Reach 5000 total points",
  },
];

export default function RewardsAndBadges() {
  const [expandedTier, setExpandedTier] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const currentPoints = 1250;
  const nextMilestone = 1500;
  const progressPercent = (currentPoints / nextMilestone) * 100;

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>🎁 REWARDS & BADGES</p>
          <h1 style={styles.title}>Your Achievements</h1>
          <p style={styles.subtitle}>
            Unlock exclusive rewards, earn badges, and climb the Bestie tiers
          </p>
        </div>
      </section>

      {/* PROGRESS TRACKER */}
      <section style={styles.progressSection}>
        <h2 style={styles.sectionTitle}>Your Progress</h2>

        <div style={styles.progressCard}>
          <div style={styles.progressInfo}>
            <div>
              <h3 style={styles.currentTier}>Trendsetter</h3>
              <p style={styles.pointsText}>
                {currentPoints} / {nextMilestone} points to Style Icon
              </p>
            </div>
            <div style={styles.pointsDisplay}>
              <span style={styles.pointsValue}>{currentPoints}</span>
              <span style={styles.pointsLabel}>points</span>
            </div>
          </div>

          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${progressPercent}%`,
              }}
            />
          </div>

          <p style={styles.progressHint}>
            {nextMilestone - currentPoints} points to unlock Style Icon tier!
          </p>
        </div>
      </section>

      {/* TIER SYSTEM */}
      <section style={styles.tiersSection}>
        <h2 style={styles.sectionTitle}>Creator Tiers</h2>
        <div style={styles.tiersContainer}>
          {REWARD_TIERS.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setExpandedTier(tier.id)}
              style={{
                ...styles.tierCard,
                ...(expandedTier === tier.id ? styles.tierCardExpanded : {}),
              }}
            >
              <div style={styles.tierHeader}>
                <div>
                  <p style={styles.tierIcon}>{tier.icon}</p>
                  <h3 style={styles.tierName}>{tier.tier}</h3>
                  <p style={styles.tierThreshold}>{tier.threshold} earned</p>
                </div>
                <span style={{ ...styles.expandIcon, color: tier.color }}>
                  {expandedTier === tier.id ? "−" : "+"}
                </span>
              </div>

              {expandedTier === tier.id && (
                <div style={styles.tierContent}>
                  <h4 style={styles.perksTitle}>Perks:</h4>
                  <ul style={styles.perksList}>
                    {tier.perks.map((perk, idx) => (
                      <li key={idx} style={styles.perkItem}>
                        ✓ {perk}
                      </li>
                    ))}
                  </ul>
                  <button
                    style={{ ...styles.unlockBtn, background: tier.color }}
                  >
                    {tier.id === 2 ? "You're Here!" : "Unlock This Tier"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* BADGES */}
      <section style={styles.badgesSection}>
        <h2 style={styles.sectionTitle}>Badges You've Earned</h2>

        <div style={styles.badgesGrid}>
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(selectedBadge === badge.id ? null : badge.id)}
              style={{
                ...styles.badgeCard,
                ...(badge.earned ? styles.badgeEarned : styles.badgeLocked),
                ...(selectedBadge === badge.id ? styles.badgeSelected : {}),
              }}
            >
              <div style={styles.badgeIconWrapper}>
                <span style={styles.badgeIcon}>{badge.icon}</span>
                {!badge.earned && <span style={styles.lockIcon}>🔒</span>}
              </div>
              <h3 style={styles.badgeName}>{badge.name}</h3>
              {badge.date && (
                <p style={styles.badgeDate}>Earned {badge.date}</p>
              )}
              {badge.desc && !badge.earned && (
                <p style={styles.badgeDesc}>{badge.desc}</p>
              )}

              {selectedBadge === badge.id && (
                <div style={styles.badgeExpanded}>
                  <p style={styles.badgeFullDesc}>
                    {badge.id === 1 &&
                      "You cast your first vote! Every vote helps shape Lala's story."}
                    {badge.id === 2 &&
                      "You've participated in 50 polls! You're an essential part of our community."}
                    {badge.id === 3 &&
                      "Your creative remix went viral! This is what community is about."}
                    {badge.id === 4 &&
                      "Share your creations and get awards from the community to unlock this."}
                    {badge.id === 5 &&
                      "Read every article in Prime Tea to become a fashion historian."}
                    {badge.id === 6 &&
                      "Earn 5000 total points across all activities. You're almost there!"}
                  </p>
                  <button style={styles.claimBtn}>
                    {badge.earned ? "✓ Claimed" : "Work Towards This"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO EARN */}
      <section style={styles.howToSection}>
        <h2 style={styles.sectionTitle}>How to Earn Points</h2>

        <div style={styles.earningsList}>
          {[
            { activity: "Vote in a poll", points: "+25 pts" },
            { activity: "Play a mini-game", points: "+50-100 pts" },
            { activity: "Share a creative remix", points: "+150 pts" },
            { activity: "Get a community award", points: "+50 pts" },
            { activity: "Read a Prime Tea article", points: "+25 pts" },
            { activity: "Refer a friend", points: "+200 pts" },
          ].map((item, idx) => (
            <div key={idx} style={styles.earningItem}>
              <span>{item.activity}</span>
              <strong style={{ color: "#ff4fa3" }}>{item.points}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to Earn More?</h2>
        <p style={styles.ctaDesc}>
          Keep voting, playing games, and creating content to unlock exclusive rewards!
        </p>
        <button style={styles.ctaBtn}>Explore Activities</button>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
    }
  `,
  hero: {
    marginBottom: "40px",
    padding: "32px",
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#a855f7",
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
  progressSection: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  progressCard: {
    background: "white",
    border: "2px solid #a855f7",
    borderRadius: "12px",
    padding: "24px",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  currentTier: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  pointsText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  pointsDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  pointsValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#ff4fa3",
  },
  pointsLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },
  progressBar: {
    width: "100%",
    height: "12px",
    background: "#f3f4f6",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff4fa3, #a855f7)",
    transition: "width 0.3s",
  },
  progressHint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0",
    textAlign: "center",
  },
  tiersSection: {
    marginBottom: "40px",
  },
  tiersContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  tierCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tierCardExpanded: {
    borderColor: "#a855f7",
    borderWidth: "2px",
  },
  tierHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tierIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  tierName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  tierThreshold: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  expandIcon: {
    fontSize: "24px",
    fontWeight: "700",
  },
  tierContent: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  perksTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  perksList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 16px 0",
  },
  perkItem: {
    fontSize: "12px",
    color: "#4b5563",
    marginBottom: "6px",
  },
  unlockBtn: {
    width: "100%",
    padding: "10px 16px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },
  badgesSection: {
    marginBottom: "40px",
  },
  badgesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "16px",
  },
  badgeCard: {
    textAlign: "center",
    padding: "20px 16px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  badgeEarned: {
    background: "#f9f5ff",
    borderColor: "#a855f7",
  },
  badgeLocked: {
    background: "#f9fafb",
    borderColor: "#d1d5db",
    opacity: 0.7,
  },
  badgeSelected: {
    borderColor: "#ff4fa3",
    boxShadow: "0 0 12px rgba(255, 79, 163, 0.2)",
  },
  badgeIconWrapper: {
    position: "relative",
    marginBottom: "8px",
  },
  badgeIcon: {
    fontSize: "40px",
    display: "inline-block",
  },
  lockIcon: {
    position: "absolute",
    bottom: "-4px",
    right: "-4px",
    fontSize: "16px",
    background: "white",
    borderRadius: "50%",
    padding: "2px",
  },
  badgeName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  badgeDate: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  badgeDesc: {
    fontSize: "10px",
    color: "#9ca3af",
    margin: "4px 0 0 0",
    fontStyle: "italic",
  },
  badgeExpanded: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
  },
  badgeFullDesc: {
    fontSize: "11px",
    color: "#4b5563",
    margin: "0 0 8px 0",
    lineHeight: "1.4",
  },
  claimBtn: {
    padding: "6px 12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  howToSection: {
    marginBottom: "40px",
  },
  earningsList: {
    display: "grid",
    gap: "12px",
  },
  earningItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    fontSize: "13px",
  },
  ctaSection: {
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  ctaDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  ctaBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
};
