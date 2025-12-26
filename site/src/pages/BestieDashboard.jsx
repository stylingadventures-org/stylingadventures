// site/src/pages/BestieDashboard.jsx
// Bestie subscriber dashboard - perks, subscription, closet, early access

import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'

export default function BestieDashboard() {
  const { userContext } = useAuth()
  const navigate = useNavigate()

  if (!userContext) return null

  const bestieStatus = userContext.bestieStatus || {}
  const profile = userContext.profile || {}

  // Extract avatar initials
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
            <p>Bestie Member • {bestieStatus.tier || 'Standard'} Tier</p>
            <div style={{ marginTop: '8px' }}>
              <span className="subscription-badge">✨ Active Subscription</span>
              {bestieStatus.trialStatus && (
                <span className="subscription-badge" style={{ background: '#f59e0b' }}>
                  🎯 {bestieStatus.trialStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📋 Subscription Details</h3>
        <div className="section-grid">
          <div className="stat-card">
            <div className="stat-label">Tier</div>
            <div className="stat-value" style={{ color: '#a855f7' }}>
              {bestieStatus.tier || 'Standard'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Renews</div>
            <div className="stat-value" style={{ color: '#a855f7', fontSize: '1rem' }}>
              {bestieStatus.renewsAt ? new Date(bestieStatus.renewsAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ color: '#10b981', fontSize: '0.9rem' }}>
              Active ✓
            </div>
          </div>
        </div>
        <button className="btn-secondary" style={{ marginTop: '16px' }}>
          Manage Billing
        </button>
      </div>

      {/* Bestie Perks */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🎁 Your Bestie Perks</h3>
        <div className="perk-item">
          <div className="perk-icon">⏰</div>
          <div className="perk-text">
            <p className="perk-title">Early Access</p>
            <p className="perk-description">Get new episodes, drops, and content 24 hours early</p>
          </div>
        </div>
        <div className="perk-item">
          <div className="perk-icon">🗺️</div>
          <div className="perk-text">
            <p className="perk-title">Exclusive Quests</p>
            <p className="perk-description">Unlock special challenges and limited-time events</p>
          </div>
        </div>
        <div className="perk-item">
          <div className="perk-icon">🏆</div>
          <div className="perk-text">
            <p className="perk-title">Bestie Badge</p>
            <p className="perk-description">Visible on your profile and in community</p>
          </div>
        </div>
        <div className="perk-item">
          <div className="perk-icon">💬</div>
          <div className="perk-text">
            <p className="perk-title">Priority Support</p>
            <p className="perk-description">Get faster responses from our community team</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🔗 Quick Access</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <button className="btn-primary">👜 My Closet</button>
          <button className="btn-primary">❤️ My Wishlist</button>
          <button className="btn-primary">⭐ Pinned Highlights</button>
          <button className="btn-primary">📺 Early Episodes</button>
        </div>
      </div>

      {/* Feed Preview */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">✨ Recommended for You</h3>
        <div className="list-item">
          <div>
            <div className="list-item-title">New Drop: Winter Collection</div>
            <div className="list-item-meta">Available 24h early for Besties</div>
          </div>
          <button className="btn-secondary">View</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Episode 5: Styling Secrets Revealed</div>
            <div className="list-item-meta">Drops in 2 days (1 day for you!)</div>
          </div>
          <button className="btn-secondary">Preview</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Quest: Pink Outfit Challenge</div>
            <div className="list-item-meta">Exclusive for Besties • Ends in 3 days</div>
          </div>
          <button className="btn-secondary">Join</button>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📊 Your Progress</h3>
        <div className="section-grid">
          <div className="stat-card">
            <div className="stat-label">Coins</div>
            <div className="stat-value">2,450</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">XP</div>
            <div className="stat-value">1,280</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Streak</div>
            <div className="stat-value">12 days</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Badges</div>
            <div className="stat-value">8</div>
          </div>
        </div>
      </div>
    </div>
  )
}
