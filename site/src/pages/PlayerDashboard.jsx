// site/src/pages/PlayerDashboard.jsx
// Player (Fan) dashboard - progress, saved items, activity, upgrade CTA

import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'

export default function PlayerDashboard() {
  const { userContext } = useAuth()
  const navigate = useNavigate()

  if (!userContext) return null

  const profile = userContext.profile || {}
  const displayName = profile.displayName || userContext.email
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="dashboard-container">
      {/* Profile Section */}
      <div className="dashboard-section">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h3>{displayName}</h3>
            <p>Fan • Level 7</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📈 Your Progress</h3>
        <div className="section-grid">
          <div className="stat-card">
            <div className="stat-label">Coins</div>
            <div className="stat-value">1,850</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">XP</div>
            <div className="stat-value">3,420</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Streak</div>
            <div className="stat-value">8 days</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Badges</div>
            <div className="stat-value">5</div>
          </div>
        </div>
      </div>

      {/* Continue Watching / Playing */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">▶️ Continue</h3>
        <div className="list-item">
          <div>
            <div className="list-item-title">Episode 3: Denim Diaries</div>
            <div className="list-item-meta">Watch from 24:15</div>
          </div>
          <button className="btn-secondary">Resume</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Quiz: Seasonal Trends</div>
            <div className="list-item-meta">3 questions left</div>
          </div>
          <button className="btn-secondary">Continue</button>
        </div>
      </div>

      {/* Saved & Favorites */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">❤️ Saved Items</h3>
        <p className="dashboard-section-subtitle">Items and content you've added to your personal collection</p>
        <div className="list-item">
          <div>
            <div className="list-item-title">Purple Blazer - Zara</div>
            <div className="list-item-meta">Added 2 days ago</div>
          </div>
          <button className="btn-secondary">View</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Styling Tips: Accessory Game</div>
            <div className="list-item-meta">Saved article</div>
          </div>
          <button className="btn-secondary">Read</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Summer Outfit Inspo - Lala</div>
            <div className="list-item-meta">Creator content</div>
          </div>
          <button className="btn-secondary">View</button>
        </div>
        <button className="btn-primary" style={{ marginTop: '12px', width: '100%' }}>
          View All Saved (24)
        </button>
      </div>

      {/* Community Activity */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">💬 Your Activity</h3>
        <p className="dashboard-section-subtitle">Comments, votes, and polls you've participated in</p>
        <div className="list-item">
          <div>
            <div className="list-item-title">You commented on "Lala's New Drop"</div>
            <div className="list-item-meta">2 hours ago • 3 likes</div>
          </div>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">You voted in "Favorite Color Combo"</div>
            <div className="list-item-meta">1 day ago • 847 total votes</div>
          </div>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">You shared "Seasonal Trends" quiz</div>
            <div className="list-item-meta">3 days ago</div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="cta-box">
        <h4>✨ Unlock Bestie Perks</h4>
        <p>
          Get early access to new episodes, exclusive quests, and premium features. Join thousands of Besties today!
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>24h</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Early Access</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>∞</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Exclusive Quests</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '6px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a855f7' }}>🏆</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Bestie Badge</div>
          </div>
        </div>
        <button className="btn-primary" style={{ width: '100%' }}>
          Upgrade to Bestie
        </button>
      </div>
    </div>
  )
}
