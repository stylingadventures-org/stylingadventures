import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/pages.css'

export default function Home() {
  const navigate = useNavigate()
  const authContext = useContext(AuthContext)
  const isAuthenticated = !!authContext?.sub

  const handleDiscoverClick = () => {
    if (!isAuthenticated) {
      document.querySelector('[data-login-button]')?.click()
      return
    }
    navigate('/discover')
  }

  const handleGameClick = () => {
    if (!isAuthenticated) {
      document.querySelector('[data-login-button]')?.click()
      return
    }
    navigate('/game')
  }

  return (
    <div className="page-container">
      <header className="hero">
        <div className="hero-content">
          <h1>Styling Adventures with Lala</h1>
          <p>Build your digital closet, style like a pro, and create content that turns heads</p>
          
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={handleDiscoverClick}
            >
              {isAuthenticated ? 'Discover Creators' : 'Login to Discover'}
            </button>
            {!isAuthenticated && (
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/signup/bestie')}
              >
                Join as Bestie
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="features">
        <h2>What You Can Do</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👗</div>
            <h3>Build Your Closet</h3>
            <p>Create your digital closet and save your favorite looks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>Play Style Lab</h3>
            <p>Experiment with outfits in our interactive styling game</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Follow Creators</h3>
            <p>Discover and follow amazing creators in our community</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Unlock Content</h3>
            <p>Get exclusive access as a Bestie member</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Start?</h2>
        <p>Choose how you want to join</p>
        <div className="cta-buttons">
          <button 
            className="btn btn-lg btn-primary"
            onClick={() => navigate('/become-bestie')}
          >
            Become a Bestie
          </button>
          <button 
            className="btn btn-lg btn-secondary"
            onClick={() => navigate('/signup/creator')}
          >
            Become a Creator
          </button>
        </div>
      </section>
    </div>
  )
}
