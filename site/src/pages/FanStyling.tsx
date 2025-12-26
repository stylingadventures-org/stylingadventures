import React, { useState } from 'react'
import '../styles/fan-styling.css'

const CHALLENGES = [
  { id: 1, emoji: '👗', title: 'Monochrome Magic', difficulty: 'easy', points: 100, description: 'Create an outfit in one color' },
  { id: 2, emoji: '🎀', title: 'Bow-tie Bliss', difficulty: 'easy', points: 75, description: 'Style an outfit with bows' },
  { id: 3, emoji: '👠', title: 'Shoe Story', difficulty: 'medium', points: 150, description: 'Match 3 different shoe styles' },
  { id: 4, emoji: '🌈', title: 'Rainbow Remix', difficulty: 'medium', points: 200, description: 'Mix 5+ colors harmoniously' },
  { id: 5, emoji: '✨', title: 'Shimmer & Shine', difficulty: 'medium', points: 150, description: 'Add sparkle to your look' },
]

export default function FanStyling() {
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  const toggleComplete = (id: number) => {
    const newCompleted = new Set(completed)
    if (newCompleted.has(id)) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
    }
    setCompleted(newCompleted)
  }

  const totalPoints = Array.from(completed).reduce((sum, id) => {
    const challenge = CHALLENGES.find(c => c.id === id)
    return sum + (challenge?.points || 0)
  }, 0)

  const stats = [
    { label: 'Completed', value: completed.size, emoji: '✨' },
    { label: 'Points Earned', value: totalPoints, emoji: '🎯' },
    { label: 'Win Streak', value: '7 days', emoji: '🔥' },
  ]

  return (
    <div className="fan-styling">
      {/* Hero Section */}
      <section className="fs-hero">
        <div className="fs-hero-content">
          <h1 className="fs-hero-title">Styling Adventures 👗</h1>
          <p className="fs-hero-subtitle">Challenge yourself with fun styling quests and earn points</p>
          <button className="fs-btn-primary">View Leaderboard →</button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="fs-section">
        <h2 className="fs-section-title">Your Progress</h2>
        <div className="fs-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="fs-stat-card">
              <div className="fs-stat-icon">{stat.emoji}</div>
              <div className="fs-stat-content">
                <div className="fs-stat-number">{stat.value}</div>
                <div className="fs-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges Grid */}
      <section className="fs-section">
        <h2 className="fs-section-title">Available Challenges</h2>
        <div className="fs-challenge-grid">
          {CHALLENGES.map((challenge) => (
            <div key={challenge.id} className="fs-challenge-card">
              <div className="fs-challenge-header">
                <div className="fs-challenge-emoji">{challenge.emoji}</div>
                <span className={`fs-difficulty fs-difficulty-${challenge.difficulty}`}>
                  {challenge.difficulty}
                </span>
              </div>
              <h3 className="fs-challenge-title">{challenge.title}</h3>
              <p className="fs-challenge-desc">{challenge.description}</p>
              <div className="fs-challenge-footer">
                <span className="fs-challenge-points">🎯 {challenge.points} pts</span>
                <button
                  className={`fs-complete-btn ${completed.has(challenge.id) ? 'completed' : ''}`}
                  onClick={() => toggleComplete(challenge.id)}
                >
                  {completed.has(challenge.id) ? '✅ Done' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
