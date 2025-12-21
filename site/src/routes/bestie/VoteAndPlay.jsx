import React, { useState } from "react";
import { Link } from "react-router-dom";

const CURRENT_POLLS = [
  {
    id: 1,
    episode: "Episode 5: Coffee Date Vibes",
    question: "What should Lala wear to the coffee shop?",
    options: [
      { label: "Cozy Oversized Sweater + Jeans", votes: 1243, percentage: 45 },
      { label: "Chic Blazer + Mini Skirt", votes: 892, percentage: 32 },
      { label: "Athleisure Fit", votes: 645, percentage: 23 },
    ],
    status: "voting",
    timeLeft: "2h 34m",
    icon: "☕",
  },
  {
    id: 2,
    episode: "Episode 6: Night Out Energy",
    question: "Which hair style should Lala rock?",
    options: [
      { label: "Braids Down (Classic)", votes: 2145, percentage: 56 },
      { label: "Half-Up Bun", votes: 1032, percentage: 27 },
      { label: "Sleek Ponytail", votes: 675, percentage: 17 },
    ],
    status: "voting",
    timeLeft: "5h 12m",
    icon: "✨",
  },
  {
    id: 3,
    episode: "Episode 4: Makeover Magic",
    question: "Best makeup moment?",
    options: [
      { label: "Bold Winged Liner", votes: 3456, percentage: 62 },
      { label: "Soft Glam", votes: 1567, percentage: 28 },
      { label: "Bold Lips Only", votes: 561, percentage: 10 },
    ],
    status: "closed",
    timeLeft: "Closed",
    icon: "💄",
  },
];

const GAMEPLAY_OPTIONS = [
  {
    id: 1,
    title: "Outfit Matching Game",
    description: "Match Lala's mood to the perfect outfit. Get it right to earn 50 coins!",
    icon: "🎮",
    coins: "50 coins",
    difficulty: "Easy",
  },
  {
    id: 2,
    title: "Scene Remix Challenge",
    description: "Remix Lala's looks from different episodes. Creative freedom = bigger rewards!",
    icon: "🎨",
    coins: "100 coins",
    difficulty: "Medium",
  },
  {
    id: 3,
    title: "Fashion Trivia",
    description: "Test your knowledge about the show's fashion moments and lore.",
    icon: "🧠",
    coins: "75 coins",
    difficulty: "Hard",
  },
  {
    id: 4,
    title: "Color Theory Quiz",
    description: "Learn why Lala's colors work together. Educational + rewarding!",
    icon: "🌈",
    coins: "60 coins",
    difficulty: "Easy",
  },
];

export default function VoteAndPlay() {
  const [votedPoll, setVotedPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleVote = (pollId, optionIndex) => {
    setSelectedOptions({ ...selectedOptions, [pollId]: optionIndex });
    setVotedPoll(pollId);
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>🎮 VOTE & PLAY</p>
          <h1 style={styles.title}>Shape Lala's Story</h1>
          <p style={styles.subtitle}>
            Vote on outfit choices, play mini-games, and earn coins. Your decisions matter!
          </p>
        </div>
        <div style={styles.heroStats}>
          <div style={styles.statBlock}>
            <p style={styles.statValue}>847</p>
            <p style={styles.statLabel}>Total Votes Cast</p>
          </div>
          <div style={styles.statBlock}>
            <p style={styles.statValue}>2,450</p>
            <p style={styles.statLabel}>Coins Earned Playing</p>
          </div>
        </div>
      </section>

      {/* VOTING SECTION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🗳️ Active Polls</h2>
        <div style={styles.pollsContainer}>
          {CURRENT_POLLS.map((poll) => (
            <div key={poll.id} style={styles.pollCard}>
              <div style={styles.pollHeader}>
                <div>
                  <p style={styles.pollEpisode}>{poll.icon} {poll.episode}</p>
                  <h3 style={styles.pollQuestion}>{poll.question}</h3>
                </div>
                <span style={{ ...styles.pollStatus, ...(poll.status === "closed" ? styles.statusClosed : styles.statusActive) }}>
                  {poll.timeLeft}
                </span>
              </div>

              <div style={styles.optionsContainer}>
                {poll.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleVote(poll.id, idx)}
                    style={{
                      ...styles.optionButton,
                      ...(selectedOptions[poll.id] === idx ? styles.optionSelected : {}),
                      ...(poll.status === "closed" ? styles.optionDisabled : {}),
                    }}
                  >
                    <div style={styles.optionLabel}>
                      <span>{option.label}</span>
                      <span style={styles.votes}>{option.votes.toLocaleString()} votes</span>
                    </div>
                    <div style={{ ...styles.progressBar, width: `${option.percentage}%` }} />
                    <span style={styles.percentage}>{option.percentage}%</span>
                  </button>
                ))}
              </div>

              {selectedOptions[poll.id] !== undefined && poll.status !== "closed" && (
                <p style={styles.votedMsg}>✅ Your vote counts! Thanks for participating!</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* GAMEPLAY SECTION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🎯 Mini Games (Earn Coins!)</h2>
        <div style={styles.gamesGrid}>
          {GAMEPLAY_OPTIONS.map((game) => (
            <div key={game.id} style={styles.gameCard}>
              <div style={styles.gameIcon}>{game.icon}</div>
              <h3 style={styles.gameTitle}>{game.title}</h3>
              <p style={styles.gameDesc}>{game.description}</p>
              <div style={styles.gameFooter}>
                <span style={styles.gameDifficulty}>{game.difficulty}</span>
                <span style={styles.gameCoins}>🪙 {game.coins}</span>
              </div>
              <button style={styles.playBtn}>Play Now</button>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD TEASER */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 Weekly Leaderboard (Top 5)</h2>
        <div style={styles.leaderboardPreview}>
          <div style={styles.leaderRow}>
            <span style={styles.rank}>1st</span>
            <span style={styles.name}>StyleKing_2023</span>
            <span style={styles.leaderCoins}>3,450 coins</span>
          </div>
          <div style={styles.leaderRow}>
            <span style={styles.rank}>2nd</span>
            <span style={styles.name}>FashionGal_</span>
            <span style={styles.leaderCoins}>3,120 coins</span>
          </div>
          <div style={styles.leaderRow}>
            <span style={styles.rank}>3rd</span>
            <span style={styles.name}>LalasSuperfan</span>
            <span style={styles.leaderCoins}>2,890 coins</span>
          </div>
          <div style={styles.leaderRow}>
            <span style={styles.rank}>4th</span>
            <span style={styles.name}>VoteEveryDay</span>
            <span style={styles.leaderCoins}>2,560 coins</span>
          </div>
          <div style={styles.leaderRow}>
            <span style={styles.rank}>5th</span>
            <span style={styles.name}>ColorTheoryNerd</span>
            <span style={styles.leaderCoins}>2,340 coins</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...styles.section, textAlign: "center" }}>
        <h2 style={styles.sectionTitle}>💝 Earn More, Unlock More</h2>
        <p style={styles.ctaText}>Every vote and game plays towards exclusive rewards. Check out Rewards & Badges to see what you can unlock!</p>
        <Link to="/bestie/rewards" style={styles.ctaBtn}>View Rewards Path</Link>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "32px",
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
  heroStats: {
    display: "flex",
    gap: "16px",
  },
  statBlock: {
    background: "white",
    padding: "16px 20px",
    borderRadius: "12px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ff4fa3",
    margin: "0 0 4px 0",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  section: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  pollsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pollCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  pollHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  pollEpisode: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  pollQuestion: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  pollStatus: {
    fontSize: "12px",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "6px",
    background: "#dbeafe",
    color: "#1e40af",
  },
  statusActive: {
    background: "#dbeafe",
    color: "#1e40af",
  },
  statusClosed: {
    background: "#f3e8ff",
    color: "#7c3aed",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "12px",
  },
  optionButton: {
    position: "relative",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px 16px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s",
    overflow: "hidden",
  },
  optionSelected: {
    borderColor: "#ff4fa3",
    background: "#fff5fa",
  },
  optionDisabled: {
    cursor: "not-allowed",
    opacity: 0.7,
  },
  optionLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    position: "relative",
    zIndex: 2,
  },
  votes: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "400",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    background: "rgba(255, 79, 163, 0.1)",
    borderRadius: "8px",
    transition: "width 0.3s",
  },
  percentage: {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "12px",
    fontWeight: "700",
    color: "#ff4fa3",
  },
  votedMsg: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
    margin: 0,
  },
  gamesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "16px",
  },
  gameCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    transition: "all 0.2s",
  },
  gameIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  gameTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  gameDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 12px 0",
    lineHeight: "1.4",
  },
  gameFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  gameDifficulty: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  gameCoins: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ff4fa3",
  },
  playBtn: {
    width: "100%",
    padding: "8px 12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  leaderboardPreview: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },
  leaderRow: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "13px",
  },
  rank: {
    fontWeight: "700",
    color: "#ff4fa3",
    minWidth: "40px",
  },
  name: {
    flex: 1,
    color: "#111827",
    fontWeight: "600",
    marginLeft: "12px",
  },
  leaderCoins: {
    color: "#6b7280",
    fontWeight: "700",
  },
  ctaText: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  ctaBtn: {
    display: "inline-block",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
  },
};
