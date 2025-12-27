import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/bestie-sidebar.css'

export default function BestieSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userContext, logout } = useAuth()

  // Determine if this is a Bestie exclusive page
  const isBestiePage = (path) => path.startsWith('/bestie')
  const isActive = (path) => location.pathname === path

  // FAN Tier pages (visible to all)
  const fanPages = [
    { id: 'home', label: '🏠 Home', path: '/fan/home' },
    { id: 'episodes', label: '✨ Episodes', path: '/fan/episodes' },
    { id: 'styling', label: '👗 Styling', path: '/fan/styling' },
    { id: 'closet', label: "❤️ Lala's Closet", path: '/fan/closet' },
    { id: 'blog', label: '📝 Blog', path: '/fan/blog' },
    { id: 'magazine', label: '🍵 Tea Magazine', path: '/fan/magazine' },
  ]

  // BESTIE Tier pages (premium exclusive)
  const bestiePages = [
    { id: 'bestie-home', label: '💎 Bestie Hub', path: '/bestie/home' },
    { id: 'bestie-closet', label: '👜 Bestie Closet', path: '/bestie/closet' },
    { id: 'bestie-studio', label: '🎬 Studio', path: '/bestie/studio' },
    { id: 'scene-club', label: '🎭 Scene Club', path: '/bestie/scene-club' },
    { id: 'trends', label: '⭐ Trend Studio', path: '/bestie/trends' },
    { id: 'stories', label: '📱 Stories', path: '/bestie/stories' },
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
        {/* PUBLIC SECTION */}
        <div className="nav-section">
          <h4 className="section-title">PUBLIC</h4>
          {fanPages.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* PREMIUM SECTION */}
        <div className="nav-section">
          <h4 className="section-title">PREMIUM</h4>
          {bestiePages.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item bestie-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        <div className="nav-section">
          <button
            className={`sidebar-nav-item ${isActive('/fan/profile') ? 'active' : ''}`}
            onClick={() => navigate('/fan/profile')}
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
