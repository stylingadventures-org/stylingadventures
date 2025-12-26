import { useState } from 'react'
import '../../styles/bestie.css'

export default function BestieChallenges() {
  const [activeFilter, setActiveFilter] = useState('active')

  const challenges = [
    {
      id: 1,
      emoji: '🎨',
      name: 'Pink Fantasy Week',
      description: 'Style a complete look in hot pink tones',
      timeLeft: '2 days',
      reward: 400,
      badge: '✨ Trendsetter',
      entries: 342,
      status: 'active',
    },
    {
      id: 2,
      emoji: '🌃',
      name: 'Night Out Glam',
      description: 'Your best evening outfit for a night out',
      timeLeft: '5 days',
      reward: 350,
      badge: '💫 Glamorous',
      entries: 218,
      status: 'active',
    },
    {
      id: 3,
      emoji: '🛍️',
      name: 'Thrift Score',
      description: 'Create a look featuring a secondhand piece',
      timeLeft: '1 week',
      reward: 300,
      badge: '🌱 Sustainable',
      entries: 156,
      status: 'active',
    },
    {
      id: 4,
      emoji: '👑',
      name: 'Royal Elegance',
      description: 'Channel your inner royalty with regal styling',
      timeLeft: '3 days',
      reward: 450,
      badge: '👑 Royal',
      entries: 89,
      status: 'active',
    },
    {
      id: 5,
      emoji: '📺',
      name: 'Episode 7: The Ball',
      description: 'Vote on which look Lala should wear to the ball',
      timeLeft: 'Ended',
      reward: 0,
      badge: '🎬 Featured',
      entries: 1203,
      status: 'completed',
    },
  ]

  const leaderboard = [
    { rank: 1, name: 'Maya', score: 2840, badge: '🥇' },
    { rank: 2, name: 'Zara', score: 2610, badge: '🥈' },
    { rank: 3, name: 'Sofia', score: 2390, badge: '🥉' },
    { rank: 4, name: 'You', score: 2150, badge: '⭐' },
  ]

  const filteredChallenges = challenges.filter(
    (c) => activeFilter === 'active' ? c.status === 'active' : c.status === 'completed'
  )

  return (
    <div className="bestie-wrapper">
      {/* HEADER */}
      <section className="bestie-header">
        <div className="header-card">
          <div className="header-kicker">🎯 Style Challenges</div>
          <h1 className="header-title">Accept the Challenge</h1>
          <p className="header-subtitle">Complete prompts to earn coins and badges</p>
        </div>
      </section>

      {/* FILTER TABS */}
      <section className="challenge-tabs">
        <button
          className={`challenge-tab ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          🔥 Active Challenges
        </button>
        <button
          className={`challenge-tab ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          ✅ Completed
        </button>
      </section>

      {/* CHALLENGES GRID */}
      <section className="challenges-section">
        <div className="challenge-cards">
          {filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header">
                <div className="challenge-emoji">{challenge.emoji}</div>
                <div className="challenge-meta">
                  <div className="challenge-time">{challenge.timeLeft}</div>
                </div>
              </div>

              <div className="challenge-body">
                <h3 className="challenge-name">{challenge.name}</h3>
                <p className="challenge-description">{challenge.description}</p>

                <div className="challenge-details">
                  <div className="challenge-stat">
                    <span className="stat-label">Entries</span>
                    <span className="stat-value">{challenge.entries}</span>
                  </div>
                  <div className="challenge-stat">
                    <span className="stat-label">Reward</span>
                    <span className="stat-value">💰 {challenge.reward}</span>
                  </div>
                </div>

                <div className="challenge-badge">
                  {challenge.badge}
                </div>
              </div>

              <button className={`btn ${challenge.status === 'active' ? 'btn-primary' : 'btn-secondary'} btn-full`}>
                {challenge.status === 'active' ? 'Enter Challenge' : 'View Results'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="challenge-leaderboard">
        <h2 className="section-title">Challenge Leaderboard</h2>
        <div className="leaderboard-table">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className={`leaderboard-row ${entry.rank === 4 ? 'highlight' : ''}`}>
              <div className="leaderboard-rank">{entry.badge}</div>
              <div className="leaderboard-name">{entry.name}</div>
              <div className="leaderboard-score">{entry.score} pts</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="challenge-info">
        <h2 className="section-title">How Challenges Work</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-number">1</div>
            <h3>Pick a Challenge</h3>
            <p>Choose a style prompt that inspires you</p>
          </div>
          <div className="info-card">
            <div className="info-number">2</div>
            <h3>Create Your Look</h3>
            <p>Upload your style in the Studio</p>
          </div>
          <div className="info-card">
            <div className="info-number">3</div>
            <h3>Get Votes</h3>
            <p>Besties vote on the best entries</p>
          </div>
          <div className="info-card">
            <div className="info-number">4</div>
            <h3>Earn Rewards</h3>
            <p>Coins, badges, and bragging rights!</p>
          </div>
        </div>
      </section>
    </div>
  )
}
