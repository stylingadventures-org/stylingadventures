import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LoginModal } from './LoginModal'
import '../styles/header.css'

export default function Header() {
  const { userContext, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-logo" onClick={() => navigate('/')}>
            <h1>Styling Adventures</h1>
          </div>
          
          <nav className="header-nav">
            <button className="nav-link" onClick={() => navigate('/discover')}>
              Discover
            </button>
            {/* Always show FAN Tier Navigation */}
            <button className="nav-link" onClick={() => navigate('/fan/home')}>
              Episodes
            </button>
            <button className="nav-link" onClick={() => navigate('/fan/styling')}>
              Styling
            </button>
            <button className="nav-link" onClick={() => navigate('/fan/closet')}>
              Closet
            </button>
            <button className="nav-link" onClick={() => navigate('/fan/blog')}>
              Blog
            </button>
            
            {/* BESTIE Tier Navigation - only if authenticated as BESTIE */}
            {isAuthenticated && (userContext?.isBestie || userContext?.isPrime) && (
              <>
                <button className="nav-link" onClick={() => navigate('/bestie/home')}>
                  Bestie Hub
                </button>
                <button className="nav-link" onClick={() => navigate('/bestie/studio')}>
                  Studio
                </button>
              </>
            )}
            
            {/* Dashboard */}
            {isAuthenticated && (
              <button className="nav-link" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
            )}
          </nav>

          <div className="header-auth">
            {isAuthenticated && userContext ? (
              <div className="user-menu">
                <span className="user-email">{userContext.profile?.displayName || userContext.email}</span>
                <button className="btn btn-logout" onClick={logout}>
                  Logout
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
