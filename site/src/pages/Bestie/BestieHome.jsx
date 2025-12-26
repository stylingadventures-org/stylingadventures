import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import '../../styles/bestie.css'

export default function BestieHome() {
  const navigate = useNavigate()
  const authContext = useContext(AuthContext)
  const isAuthenticated = !!authContext?.sub

  return (
    <div className="bestie-wrapper">
      {/* WELCOME HEADER */}
      <section className="bestie-welcome">
        <div className="welcome-card">
          <div className="welcome-badge">💜 Bestie Hub</div>
          <h1 className="welcome-title">Welcome back, Bestie!</h1>
          <p className="welcome-subtitle">You're front row in the LaLaVerse adventure</p>
        </div>
      </section>

      {/* REWARDS & STATUS */}
      <section className="bestie-status">
        <div className="status-grid">
          <div className="status-card">
            <div className="status-icon">⭐</div>
            <div className="status-content">
              <div className="status-label">XP Progress</div>
              <div className="status-value">2,450 / 5,000</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: '49%'}}></div>
              </div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">💰</div>
            <div className="status-content">
              <div className="status-label">LaLa Coins</div>
              <div className="status-value">1,280</div>
              <div className="status-hint">+150 this week</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">🔥</div>
            <div className="status-content">
              <div className="status-label">Streak</div>
              <div className="status-value">12 Days</div>
              <div className="status-hint">Keep it up!</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">🏆</div>
            <div className="status-content">
              <div className="status-label">Badges</div>
              <div className="status-value">8</div>
              <div className="status-hint">1 new unlocked</div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="bestie-actions">
        <h2 className="section-title">What Would You Like to Do?</h2>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/bestie/studio')}>
            <div className="action-icon">🎨</div>
            <h3>Create a Look</h3>
            <p>Build and upload your latest styling</p>
            <span className="action-arrow">→</span>
          </div>

          <div className="action-card" onClick={() => navigate('/bestie/challenges')}>
            <div className="action-icon">🎯</div>
            <h3>Take a Challenge</h3>
            <p>Style prompts with rewards waiting</p>
            <span className="action-arrow">→</span>
          </div>

          <div className="action-card" onClick={() => navigate('/bestie/vote')}>
            <div className="action-icon">✅</div>
            <h3>Vote & Influence</h3>
            <p>Shape the next featured looks</p>
            <span className="action-arrow">→</span>
          </div>

          <div className="action-card" onClick={() => navigate('/bestie/closet')}>
            <div className="action-icon">👗</div>
            <h3>Manage Closet</h3>
            <p>Collections, drafts, and seasonal looks</p>
            <span className="action-arrow">→</span>
          </div>
        </div>
      </section>

      {/* THIS WEEK'S HIGHLIGHTS */}
      <section className="bestie-highlights">
        <h2 className="section-title">This Week's Highlights</h2>
        <div className="highlights-grid">
          <div className="highlight-card">
            <div className="highlight-badge">🔥 Trending</div>
            <h3>Pink Fantasy Week</h3>
            <p>Besties are obsessed with hot pink looks right now</p>
            <div className="highlight-stat">2,340 votes</div>
            <button className="btn btn-secondary">See Looks</button>
          </div>

          <div className="highlight-card">
            <div className="highlight-badge">⭐ Featured</div>
            <h3>Episode 8: The Ball</h3>
            <p>New episode drops tomorrow — style picks needed!</p>
            <div className="highlight-stat">48h to vote</div>
            <button className="btn btn-primary">Vote Now</button>
          </div>

          <div className="highlight-card">
            <div className="highlight-badge">🏆 Leaderboard</div>
            <h3>You're #4!</h3>
            <p>Just 3 Besties ahead — earn 200 more coins to rank up</p>
            <div className="highlight-stat">Top 5</div>
            <button className="btn btn-secondary">View Rankings</button>
          </div>
        </div>
      </section>

      {/* PERKS & UNLOCKS */}
      <section className="bestie-perks">
        <h2 className="section-title">Your Bestie Perks</h2>
        <div className="perks-grid">
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Early Access</h3>
            <p>See new episodes 24h before Fans</p>
          </div>
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Private Collections</h3>
            <p>Save draft looks only visible to you</p>
          </div>
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Voting Power</h3>
            <p>Your votes help decide featured looks</p>
          </div>
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Exclusive Reactions</h3>
            <p>React with limited-edition emojis</p>
          </div>
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Challenge Rewards</h3>
            <p>Earn coins and badges from style prompts</p>
          </div>
          <div className="perk-card">
            <div className="perk-check">✓</div>
            <h3>Bestie Badge</h3>
            <p>Show your status on your profile</p>
          </div>
        </div>
      </section>

      {/* LEADERBOARD PREVIEW */}
      <section className="bestie-leaderboard">
        <h2 className="section-title">Top Besties This Week</h2>
        <div className="leaderboard-list">
          <div className="leaderboard-item">
            <div className="leaderboard-rank">1</div>
            <div className="leaderboard-user">
              <div className="leaderboard-avatar">🌟</div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">Maya</div>
                <div className="leaderboard-score">3,850 pts</div>
              </div>
            </div>
            <div className="leaderboard-medal">🥇</div>
          </div>

          <div className="leaderboard-item">
            <div className="leaderboard-rank">2</div>
            <div className="leaderboard-user">
              <div className="leaderboard-avatar">✨</div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">Zara</div>
                <div className="leaderboard-score">3,620 pts</div>
              </div>
            </div>
            <div className="leaderboard-medal">🥈</div>
          </div>

          <div className="leaderboard-item">
            <div className="leaderboard-rank">3</div>
            <div className="leaderboard-user">
              <div className="leaderboard-avatar">💎</div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">Sofia</div>
                <div className="leaderboard-score">3,410 pts</div>
              </div>
            </div>
            <div className="leaderboard-medal">🥉</div>
          </div>

          <div className="leaderboard-item highlight">
            <div className="leaderboard-rank">4</div>
            <div className="leaderboard-user">
              <div className="leaderboard-avatar">👑</div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">You</div>
                <div className="leaderboard-score">3,280 pts</div>
              </div>
            </div>
            <div className="leaderboard-medal">+3</div>
          </div>
        </div>
      </section>
    </div>
  )
}
