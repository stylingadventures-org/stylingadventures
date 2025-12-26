import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import FanLayout from '../components/FanLayout'
import '../styles/pages.css'
import '../styles/home.css'

export default function Home() {
  const navigate = useNavigate()
  const authContext = useContext(AuthContext)
  const isAuthenticated = !!authContext?.sub

  const requireAuthOrLogin = (onAuthedNavigate) => {
    if (!isAuthenticated) {
      document.querySelector('[data-login-button]')?.click()
      return
    }
    onAuthedNavigate()
  }

  const handleDiscoverClick = () => requireAuthOrLogin(() => navigate('/fan/discover'))
  const handleGameClick = () => requireAuthOrLogin(() => navigate('/game'))
  const handleClosetClick = () => requireAuthOrLogin(() => navigate('/fan/closet'))

  const homeContent = (
    <div className="home-wrapper">
      {/* HERO SECTION */}
      <section className="home-hero">
        <div className="hero-card">
          <div className="hero-top">
            <div className="hero-kicker">✨ Where Style Becomes an Adventure</div>
            <h1 className="hero-title">
              Step into <span className="gradient-text">Styling Adventures</span> with Lala
            </h1>
            <p className="hero-subtitle">
              Watch episodes, play style challenges, and build your place in LaLaVerse.
            </p>
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/fan/episodes')}>
              👀 Watch Episodes
            </button>
            <button className="btn btn-secondary" onClick={handleGameClick}>
              🎮 Play Style Lab
            </button>
            <button className="btn btn-tertiary" onClick={handleDiscoverClick}>
              🌟 Explore Creators
            </button>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="home-stats">
        <div className="stat-card">
          <div className="stat-number">100+</div>
          <div className="stat-label">Looks to Discover</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">12</div>
          <div className="stat-label">Episodes Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">50+</div>
          <div className="stat-label">Creators & Designers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">∞</div>
          <div className="stat-label">Adventures Await</div>
        </div>
      </section>

      {/* FEATURED CONTENT */}
      <section className="home-featured">
        <h2 className="section-title">Featured Content</h2>
        <div className="featured-grid">
          <div className="featured-card" onClick={() => navigate('/fan/episodes')}>
            <div className="featured-image">📺</div>
            <h3>Latest Episode</h3>
            <p>Watch the newest episode and unlock today's style challenge</p>
            <span className="card-arrow">→</span>
          </div>
          <div className="featured-card" onClick={handleDiscoverClick}>
            <div className="featured-image">🌟</div>
            <h3>Top Creators</h3>
            <p>Explore trending creators and discover fresh style inspiration</p>
            <span className="card-arrow">→</span>
          </div>
          <div className="featured-card" onClick={handleClosetClick}>
            <div className="featured-image">👗</div>
            <h3>Lala's Closet</h3>
            <p>Save looks, collect favorites, and build your dream wardrobe</p>
            <span className="card-arrow">→</span>
          </div>
        </div>
      </section>

      {/* ADVENTURE MAP */}
      <section className="home-adventures">
        <h2 className="section-title">Your Adventure Map</h2>
        <p className="section-subtitle">Pick a path — everything connects inside LaLaVerse</p>
        <div className="adventure-grid">
          <div className="adventure-card" onClick={() => navigate('/fan/episodes')}>
            <div className="adventure-icon">📺</div>
            <h3>Watch Episodes</h3>
            <p>Follow the story with Lala and unlock exclusive content</p>
          </div>
          <div className="adventure-card" onClick={handleGameClick}>
            <div className="adventure-icon">🎮</div>
            <h3>Play Style Lab</h3>
            <p>Style combos, mini-games, and rewards that stack</p>
          </div>
          <div className="adventure-card" onClick={handleDiscoverClick}>
            <div className="adventure-icon">🌟</div>
            <h3>Explore Creators</h3>
            <p>Find creators shaping style and stories in the LaLaVerse</p>
          </div>
          <div className="adventure-card" onClick={() => navigate('/become-bestie')}>
            <div className="adventure-icon">💜</div>
            <h3>Unlock Bestie Perks</h3>
            <p>Early access, exclusive looks, and deeper world areas</p>
          </div>
          <div className="adventure-card" onClick={handleClosetClick}>
            <div className="adventure-icon">👗</div>
            <h3>Build Your Closet</h3>
            <p>Save looks, collect favorites, shape future drops</p>
          </div>
          <div className="adventure-card" onClick={() => navigate('/fan/blog')}>
            <div className="adventure-icon">📝</div>
            <h3>Read the Blog</h3>
            <p>Behind-the-scenes, tips, and community highlights</p>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="home-tiers">
        <h2 className="section-title">Choose Your Role</h2>
        <p className="section-subtitle">One world — different ways to play, create, and grow</p>
        <div className="tier-grid">
          <div className="tier-card">
            <div className="tier-badge">👤 Fan</div>
            <h3>Watch & Explore</h3>
            <ul className="tier-features">
              <li>Watch all episodes</li>
              <li>Explore public closets</li>
              <li>Vote in style polls</li>
            </ul>
            <button className="btn btn-secondary" onClick={() => navigate('/fan/episodes')}>
              Start Watching
            </button>
          </div>
          <div className="tier-card tier-card--featured">
            <div className="tier-badge">💜 Bestie</div>
            <h3>Unlock & Influence</h3>
            <ul className="tier-features">
              <li>Early access to episodes</li>
              <li>Exclusive looks + rewards</li>
              <li>Private community</li>
            </ul>
            <button className="btn btn-primary" onClick={() => navigate('/become-bestie')}>
              Become a Bestie
            </button>
          </div>
          <div className="tier-card">
            <div className="tier-badge">✨ Creator</div>
            <h3>Build & Earn</h3>
            <ul className="tier-features">
              <li>Create looks & drops</li>
              <li>Build your audience</li>
              <li>Monetize your work</li>
            </ul>
            <button className="btn btn-secondary" onClick={() => navigate('/signup/creator')}>
              Start Creating
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-cta">
        <div className="cta-card">
          <h2>Ready for Your Next Adventure?</h2>
          <p>Join LaLaVerse and connect with creators, style, and community.</p>
          <div className="cta-actions">
            <button className="btn btn-lg btn-primary" onClick={() => navigate('/become-bestie')}>
              Become a Bestie
            </button>
            <button className="btn btn-lg btn-secondary" onClick={() => navigate('/fan/episodes')}>
              Watch Episodes
            </button>
          </div>
        </div>
      </section>
    </div>
  )

  // Wrap with FanLayout to show sidebar
  return <FanLayout>{homeContent}</FanLayout>
}
