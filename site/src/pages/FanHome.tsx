import { useAuth } from '../context/AuthContext'
import '../styles/fan-home.css'

export default function FanHome() {
  const { userContext } = useAuth()

  return (
    <div className="fan-home">
      {/* Hero Section */}
      <section className="fh-hero">
        <div className="fh-hero-content">
          <h1 className="fh-hero-title">Welcome to LaLaVerse, {userContext?.name || 'Fan'}!</h1>
          <p className="fh-hero-subtitle">Your home for creativity, challenges, and community</p>
          <div className="fh-hero-buttons">
            <button className="fh-btn-primary">Start Challenge</button>
            <button className="fh-btn-secondary">View Episodes</button>
            <button className="fh-btn-tertiary">Explore Closet</button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="fh-section">
        <h2 className="fh-section-title">Your Progress</h2>
        <div className="fh-stats-grid">
          <div className="fh-stat-card">
            <div className="fh-stat-icon">🎯</div>
            <div className="fh-stat-content">
              <div className="fh-stat-number">12</div>
              <div className="fh-stat-label">Challenges Won</div>
            </div>
          </div>

          <div className="fh-stat-card">
            <div className="fh-stat-icon">⭐</div>
            <div className="fh-stat-content">
              <div className="fh-stat-number">2,850</div>
              <div className="fh-stat-label">Total Points</div>
            </div>
          </div>

          <div className="fh-stat-card">
            <div className="fh-stat-icon">🔥</div>
            <div className="fh-stat-content">
              <div className="fh-stat-number">8</div>
              <div className="fh-stat-label">Day Streak</div>
            </div>
          </div>

          <div className="fh-stat-card">
            <div className="fh-stat-icon">👑</div>
            <div className="fh-stat-content">
              <div className="fh-stat-number">#14</div>
              <div className="fh-stat-label">Leaderboard Rank</div>
            </div>
          </div>
        </div>
      </section>

      {/* Today in LaLaVerse */}
      <section className="fh-section">
        <h2 className="fh-section-title">Today in LaLaVerse</h2>
        <div className="fh-content-grid">
          {/* Watch Card */}
          <div className="fh-content-card">
            <div className="fh-card-icon">📺</div>
            <h3 className="fh-card-title">Watch Episodes</h3>
            <ul className="fh-card-list">
              <li>New "Fashion Rebels" episode</li>
              <li>Styling masterclass series</li>
              <li>Community highlights</li>
            </ul>
            <button className="fh-card-button">Watch Now →</button>
          </div>

          {/* Play Card */}
          <div className="fh-content-card">
            <div className="fh-card-icon">🎮</div>
            <h3 className="fh-card-title">Play Challenges</h3>
            <ul className="fh-card-list">
              <li>Daily styling challenge</li>
              <li>Beat top creators</li>
              <li>Earn exclusive rewards</li>
            </ul>
            <button className="fh-card-button">Play Now →</button>
          </div>

          {/* Explore Card */}
          <div className="fh-content-card">
            <div className="fh-card-icon">🌟</div>
            <h3 className="fh-card-title">Explore Community</h3>
            <ul className="fh-card-list">
              <li>Discover new creators</li>
              <li>Join trending styles</li>
              <li>Share your looks</li>
            </ul>
            <button className="fh-card-button">Explore →</button>
          </div>
        </div>
      </section>

      {/* Lala Says */}
      <section className="fh-section">
        <div className="fh-lala-card">
          <div className="fh-lala-quote-icon">"</div>
          <p className="fh-lala-quote">
            Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, fashion has to do with ideas, the way we live, what is happening. Every day is a chance to show your unique style and inspire others!
          </p>
          <div className="fh-lala-badges">
            <span className="fh-badge-primary">✨ Inspiration</span>
            <span className="fh-badge-secondary">💫 Motivation</span>
            <span className="fh-badge-tertiary">🎨 Creativity</span>
          </div>
        </div>
      </section>
    </div>
  )
}
