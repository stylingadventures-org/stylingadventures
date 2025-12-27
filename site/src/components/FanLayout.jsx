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
    { id: 'closet', label: "❤️ Lala's Closet", path: '/fan/closet' },
    { id: 'blog', label: '📝 Blog', path: '/fan/blog' },
    { id: 'magazine', label: '🍵 Tea Magazine', path: '/fan/magazine' },
  ]

  // Show FAN pages always. Bestie users use BestieLayout instead.
  const navItems = [
    ...fanPages,
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
            <span>👑</span>
          </div>
          <div className="creator-info">
            <h3>{userContext?.name || 'Fan Tier'}</h3>
            <p className="tier-badge">
              {isLoggedIn ? 'FAN' : 'PUBLIC'}
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
              onClick={() => navigate('/login')}
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
