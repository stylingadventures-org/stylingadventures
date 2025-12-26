import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LoginModal } from './LoginModal'
import '../styles/header.css'

export default function Header() {
  const { userContext, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  const isBestie = !!(isAuthenticated && (userContext?.isBestie || userContext?.isPrime))
  const isCreator = !!(isAuthenticated && (userContext?.isCreator || userContext?.role === 'CREATOR'))

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openLogin = () => setShowLoginModal(true)

  const requireAuthOrLogin = (to) => {
    if (!isAuthenticated) {
      openLogin()
      return
    }
    navigate(to)
  }

  const isActive = (path) => {
    // Active for exact or nested routes
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = useMemo(() => {
    const items = [
      { label: 'Discover', to: '/discover', gated: true }, // gated feels better than silent nav
      { label: 'Episodes', to: '/fan/home', gated: false },
      { label: 'Styling', to: '/fan/styling', gated: true },
      { label: 'Closet', to: '/fan/closet', gated: true },
      { label: 'Blog', to: '/fan/blog', gated: false },
    ]

    if (isBestie) {
      items.push(
        { label: 'Bestie Hub', to: '/bestie/home', gated: true },
        { label: 'Studio', to: '/bestie/studio', gated: true }
      )
    }

    if (isAuthenticated) {
      items.push({ label: 'Dashboard', to: '/dashboard', gated: true })
    }

    return items
  }, [isAuthenticated, isBestie])

  const onNavClick = (item) => {
    if (item.gated) requireAuthOrLogin(item.to)
    else navigate(item.to)
  }

  const displayName =
    userContext?.profile?.displayName ||
    userContext?.profile?.name ||
    userContext?.email ||
    'Account'

  const tierLabel = isBestie ? 'BESTIE' : 'FAN'

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          {/* Logo */}
          <button
            type="button"
            className="header-logo"
            onClick={() => navigate('/')}
            aria-label="Go to homepage"
          >
            <div className="logo-mark" aria-hidden="true">✨</div>
            <div className="logo-text">
              <div className="logo-title">Styling Adventures</div>
              <div className="logo-subtitle">Where Style Becomes an Adventure</div>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="header-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.to}
                type="button"
                className={`nav-link ${isActive(item.to) ? 'active' : ''}`}
                onClick={() => onNavClick(item)}
              >
                {item.label}
                {!isAuthenticated && item.gated && <span className="nav-lock" title="Login required">🔒</span>}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="header-auth">
            {/* Mobile menu button */}
            <button
              type="button"
              className="icon-btn mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>

            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-chip"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Open account menu"
                  aria-expanded={userMenuOpen}
                >
                  <span className={`tier-pill ${tierLabel.toLowerCase()}`}>{tierLabel}</span>
                  <span className="user-name">{displayName}</span>
                  <span className="caret" aria-hidden="true">▾</span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown" role="menu">
                    <button type="button" className="dropdown-item" onClick={() => navigate('/profile')}>
                      👤 Profile
                    </button>
                    {isCreator && (
                      <button type="button" className="dropdown-item" onClick={() => navigate('/creator-settings')}>
                        ⚙️ Creator Settings
                      </button>
                    )}
                    <button type="button" className="dropdown-item" onClick={() => navigate('/settings')}>
                      ⚙️ Account Settings
                    </button>
                    <div className="dropdown-sep" />
                    <button type="button" className="dropdown-item danger" onClick={logout}>
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="btn btn-primary" onClick={openLogin} data-login-button>
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="mobile-nav" role="dialog" aria-label="Mobile menu">
            <div className="mobile-nav-inner">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  className={`mobile-link ${isActive(item.to) ? 'active' : ''}`}
                  onClick={() => onNavClick(item)}
                >
                  <span>{item.label}</span>
                  {!isAuthenticated && item.gated && <span className="nav-lock">🔒</span>}
                </button>
              ))}

              {!isAuthenticated && (
                <button type="button" className="btn btn-primary mobile-login" onClick={openLogin}>
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}

