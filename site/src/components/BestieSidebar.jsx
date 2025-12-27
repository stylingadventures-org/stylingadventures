import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/bestie-sidebar.css'

export default function BestieSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userContext, logout } = useAuth()

  // New features (show "NEW" badge)
  const newFeatures = ['inbox', 'achievements']

  // Determine if this is a Bestie exclusive page
  const isBestiePage = (path) => path.startsWith('/bestie')
  const isActive = (path) => location.pathname === path
  const isNewFeature = (id) => newFeatures.includes(id)

  // BESTIE Tier pages (premium exclusive)
  const bestiePages = [
    { id: 'bestie-home', label: '💎 Bestie Hub', path: '/bestie/home' },
    { id: 'bestie-closet', label: '👜 Bestie Closet', path: '/bestie/closet' },
    { id: 'bestie-studio', label: '🎬 Studio', path: '/bestie/studio' },
    { id: 'scene-club', label: '🎭 Scene Club', path: '/bestie/scene-club' },
    { id: 'trends', label: '⭐ Trend Studio', path: '/bestie/trends' },
    { id: 'stories', label: '📱 Stories', path: '/bestie/stories' },
    { id: 'socialbee', label: '🐝 SocialBee', path: '/bestie/socialbee', isNew: true },
    { id: 'master-profile', label: '👑 Master Profile', path: '/bestie/master-profile', isNew: true },
    { id: 'inbox', label: '💬 Inbox', path: '/bestie/inbox' },
    { id: 'primebank', label: '🏦 Prime Bank', path: '/bestie/primebank' },
  ]

  return (
    <aside className="bestie-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="creator-avatar bestie-avatar">
          <span>💎</span>
        </div>
        <div className="creator-info">
          <h3>{userContext?.name || 'Bestie'}</h3>
          <p className="tier-badge bestie-badge">BESTIE</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* PREMIUM SECTION */}
        <div className="nav-section">
          <h4 className="section-title">✨ PREMIUM</h4>
          {bestiePages.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item bestie-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.isNew ? 'Just added!' : 'Bestie exclusive feature'}
            >
              <span className="nav-item-label">{item.label}</span>
              {item.isNew && <span className="badge-new">NEW</span>}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        <div className="nav-section">
          <button
            className={`sidebar-nav-item ${isActive('/bestie/profile') ? 'active' : ''}`}
            onClick={() => navigate('/bestie/profile')}
          >
            👤 Profile
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <p className="user-email">{userContext?.email || 'bestie@example.com'}</p>
        <button
          onClick={logout}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
