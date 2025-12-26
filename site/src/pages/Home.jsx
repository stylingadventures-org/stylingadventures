import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import '../styles/pages.css'

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

  const handleDiscoverClick = () => requireAuthOrLogin(() => navigate('/discover'))
  const handleGameClick = () => requireAuthOrLogin(() => navigate('/game'))
  const handleClosetClick = () => requireAuthOrLogin(() => navigate('/closet'))
  const handleCommunityClick = () => requireAuthOrLogin(() => navigate('/community'))

  // Placeholder until you wire real episode data
  const latestEpisode = {
    title: 'Episode 1: The Closet Portal',
    description: 'Watch the latest episode and unlock today’s style challenge.',
    cta: 'Watch the Latest Episode',
    route: '/episodes',
  }

  return (
    <div className="page-container">
      {/* HERO */}
      <header className="hero hero--adventure">
        <div className="hero-content hero-content--two-col">
          <div className="hero-left">
            <div className="hero-kicker">✨ Where Style Becomes an Adventure</div>

            <h1 className="hero-title">
              Step into <span className="hero-emphasis">Styling Adventures</span> with Lala
            </h1>

            <p className="hero-subtitle">
              Watch the story, play the looks, and build your place in <strong>LaLaVerse</strong>.
            </p>

            <div className="hero-buttons">
              {/* Primary: Episode / Watch */}
              <button className="btn btn-primary" onClick={() => navigate(latestEpisode.route)}>
                {latestEpisode.cta}
              </button>

              {/* Secondary: Play (gated) */}
              <button className="btn btn-secondary" onClick={handleGameClick}>
                {isAuthenticated ? 'Play Style Lab' : 'Login to Play'}
              </button>

              {/* Tertiary: Discover (gated) */}
              <button className="btn btn-tertiary" onClick={handleDiscoverClick}>
                {isAuthenticated ? 'Explore Creators' : 'Login to Explore'}
              </button>
            </div>

            {/* Quick links: keep it lightweight */}
            <div className="hero-quicklinks">
              <button className="chip" onClick={() => navigate('/episodes')}>Episodes</button>
              <button className="chip" onClick={handleClosetClick}>Lala’s Closet</button>
              <button className="chip" onClick={handleCommunityClick}>Community</button>
            </div>

            {!isAuthenticated && (
              <div className="hero-note">
                One account unlocks your closet, your rewards, and your LaLaVerse identity.
              </div>
            )}
          </div>

          {/* Right side visual placeholder (you can swap to an image later) */}
          <div className="hero-right" aria-hidden="true">
            <div className="hero-portrait">
              <div className="hero-portrait-sparkle">✦</div>
              <div className="hero-portrait-sparkle hero-portrait-sparkle--2">✦</div>
              <div className="hero-portrait-sparkle hero-portrait-sparkle--3">✦</div>
              <div className="hero-portrait-bubble">
                <div className="hero-portrait-title">Hi bestie 💜</div>
                <div className="hero-portrait-subtitle">Ready for your next adventure?</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* EPISODE SPOTLIGHT */}
      <section className="section">
        <div className="section-card spotlight">
          <div className="spotlight-text">
            <div className="spotlight-label">🔥 Latest Drop</div>
            <h2 className="spotlight-title">{latestEpisode.title}</h2>
            <p className="spotlight-subtitle">{latestEpisode.description}</p>
            <div className="spotlight-actions">
              <button className="btn btn-primary" onClick={() => navigate(latestEpisode.route)}>
                Watch Now
              </button>
              <button className="btn btn-secondary" onClick={handleGameClick}>
                {isAuthenticated ? 'Play Today’s Challenge' : 'Login to Play'}
              </button>
            </div>
          </div>

          <div className="spotlight-media" aria-hidden="true">
            <div className="media-placeholder">
              <div className="media-badge">Trailer</div>
              <div className="media-play">▶</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU CAN DO (keep your grid but make it “rooms in a world”) */}
      <section className="features">
        <h2>Your Adventure Map</h2>
        <p className="section-subtitle">Pick a path — everything connects inside LaLaVerse.</p>

        <div className="feature-grid">
          <div className="feature-card clickable" onClick={handleClosetClick} role="button" tabIndex={0}>
            <div className="feature-icon">👗</div>
            <h3>Build Your Closet</h3>
            <p>Save looks, collect favorites, and shape future drops.</p>
          </div>

          <div className="feature-card clickable" onClick={handleGameClick} role="button" tabIndex={0}>
            <div className="feature-icon">🎮</div>
            <h3>Play Style Lab</h3>
            <p>Style combos, mini-games, and rewards that stack.</p>
          </div>

          <div className="feature-card clickable" onClick={handleDiscoverClick} role="button" tabIndex={0}>
            <div className="feature-icon">🌟</div>
            <h3>Explore Creators</h3>
            <p>Follow creators shaping the sound, style, and stories.</p>
          </div>

          <div className="feature-card clickable" onClick={() => navigate('/bestie')} role="button" tabIndex={0}>
            <div className="feature-icon">💖</div>
            <h3>Unlock Bestie Perks</h3>
            <p>Early access, exclusive looks, and deeper world areas.</p>
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="section">
        <h2>Choose Your Role in LaLaVerse</h2>
        <p className="section-subtitle">
          One world — different ways to play, create, and grow.
        </p>

        <div className="tier-grid">
          <div className="tier-card">
            <div className="tier-top">
              <div className="tier-badge">Fans</div>
              <h3>Watch & Explore</h3>
            </div>
            <ul className="tier-list">
              <li>Watch episodes + public drops</li>
              <li>Explore closets & community highlights</li>
              <li>Vote in style polls</li>
            </ul>
            <button className="btn btn-secondary" onClick={() => navigate('/episodes')}>
              Start Watching
            </button>
          </div>

          <div className="tier-card tier-card--featured">
            <div className="tier-top">
              <div className="tier-badge tier-badge--featured">Besties</div>
              <h3>Unlock & Influence</h3>
            </div>
            <ul className="tier-list">
              <li>Early access to episodes & drops</li>
              <li>Exclusive looks + bonus rewards</li>
              <li>Private community spaces</li>
            </ul>
            <button className="btn btn-primary" onClick={() => navigate('/become-bestie')}>
              Become a Bestie
            </button>
          </div>

          <div className="tier-card">
            <div className="tier-top">
              <div className="tier-badge">Creators</div>
              <h3>Build & Earn</h3>
            </div>
            <ul className="tier-list">
              <li>Create looks, drops, and shop experiences</li>
              <li>Grow an audience inside LaLaVerse</li>
              <li>Monetize through creator tools</li>
            </ul>
            <button className="btn btn-secondary" onClick={() => navigate('/signup/creator')}>
              Start Creating
            </button>
          </div>

          <div className="tier-card">
            <div className="tier-top">
              <div className="tier-badge">Collaborators</div>
              <h3>Co-Create Worlds</h3>
            </div>
            <ul className="tier-list">
              <li>Branded story arcs & worlds</li>
              <li>Co-created product drops</li>
              <li>Community-first activations</li>
            </ul>
            <button className="btn btn-tertiary" onClick={() => navigate('/collaborate')}>
              Partner With Us
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <h2>Ready to Start Your Adventure?</h2>
        <p>Join as a fan, or unlock Bestie perks for the full LaLaVerse experience.</p>

        <div className="cta-buttons">
          <button className="btn btn-lg btn-primary" onClick={() => navigate('/become-bestie')}>
            Become a Bestie
          </button>
          <button className="btn btn-lg btn-secondary" onClick={() => navigate('/episodes')}>
            Watch Episodes
          </button>
        </div>
      </section>
    </div>
  )
}
