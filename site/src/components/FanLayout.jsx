import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/fan-layout.css'
import '../styles/fan-components.css'

export default function FanLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { userContext } = useAuth()

  // Determine user tier
  const userTier = userContext?.tier || 'guest'
  const isLoggedIn = !!userContext?.email

  // FAN Tier pages (visible to all, public)
  const fanPages = [
    { id: 'home', label: '🏠 Home', path: '/fan/home' },
    { id: 'episodes', label: '✨ Episodes', path: '/fan/episodes' },
    { id: 'styling', label: '👗 Styling', path: '/fan/styling' },
    { id: 'closet', label: '❤️ Closet', path: '/fan/closet' },
    { id: 'blog', label: '📝 Blog', path: '/fan/blog' },
    { id: 'magazine', label: '📖 Magazine', path: '/fan/magazine' },
  ]

  // BESTIE Tier pages (only visible when logged in as Bestie)
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

  // Show FAN pages always, plus BESTIE pages if logged in as Bestie
  const navItems = [
    ...fanPages,
    ...(isLoggedIn && userTier === 'bestie' ? bestiePages : []),
    ...(isLoggedIn ? [{ id: 'profile', label: '👤 Profile', path: '/fan/profile' }] : []),
  ]

  // Determine active nav item based on current route
  const isActive = (path) => location.pathname === path

  return (
    <div className="fan-layout">
      {/* Sidebar - Hidden < 900px */}
      <aside className="fan-sidebar">
        <div className="sidebar-header">
          <div className="creator-avatar">
            <span>{isLoggedIn && userTier === 'bestie' ? '💎' : '👑'}</span>
          </div>
          <div className="creator-info">
            <h3>{userContext?.name || 'Fan Tier'}</h3>
            <p className="tier-badge">
              {isLoggedIn ? (userTier === 'bestie' ? 'BESTIE' : 'FAN') : 'PUBLIC'}
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="user-email">
            {isLoggedIn ? userContext?.email : 'Fan Community'}
          </p>
          {!isLoggedIn && (
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginTop: '10px',
                background: 'linear-gradient(135deg, var(--brand-hot-pink), var(--brand-purple))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area - Renders fan page via <Outlet /> */}
      <main className="fan-main">
        <Outlet />
      </main>
    </div>
  )
}
