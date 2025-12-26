import { useNavigate } from 'react-router-dom'
import { storeSelectedTier } from '../api/roles'
import '../styles/choose-path.css'

/**
 * Role Selection Screen
 * Post-signup: "How do you want to use Lalaverse today?"
 * 
 * Three tiers:
 * - Fan (free, default)
 * - Bestie (paid subscription)
 * - Creator (paid business tier)
 */
export default function ChooseYourPath() {
  const navigate = useNavigate()

  const handleChoice = async (tier) => {
    try {
      // Store selected tier (Lambda will pick this up for group assignment)
      await storeSelectedTier(tier)
      
      // Give a moment for storage to settle
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (tier === 'fan') {
        // Fan tier goes directly to home
        navigate('/fan/home')
      } else if (tier === 'bestie') {
        // Show Bestie paywall
        navigate('/upgrade/bestie')
      } else if (tier === 'creator') {
        // Show Creator paywall
        navigate('/upgrade/creator')
      }
    } catch (error) {
      console.error('Error selecting tier:', error)
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="choose-path">
      {/* Hero */}
      <section className="cp-hero">
        <h1 className="cp-title">Welcome to LaLaVerse! 🎉</h1>
        <p className="cp-subtitle">How do you want to use Lalaverse today?</p>
      </section>

      {/* Three Options */}
      <section className="cp-options">
        {/* FAN Tier */}
        <div className="cp-card cp-card-fan">
          <div className="cp-card-icon">👑</div>
          <h2 className="cp-card-title">Fan Tier</h2>
          <p className="cp-card-badge">Free</p>
          <ul className="cp-features">
            <li>✓ Watch Episodes</li>
            <li>✓ Play Styling Challenges</li>
            <li>✓ Earn Prime Coins</li>
            <li>✓ Join Community</li>
            <li>✓ Browse Closet</li>
          </ul>
          <p className="cp-description">
            Play challenges, earn coins, and explore the fashion community.
          </p>
          <button 
            className="cp-btn cp-btn-primary"
            onClick={() => handleChoice('fan')}
          >
            Continue as Fan
          </button>
        </div>

        {/* BESTIE Tier */}
        <div className="cp-card cp-card-bestie">
          <div className="cp-card-icon">💎</div>
          <h2 className="cp-card-title">Bestie Tier</h2>
          <p className="cp-card-badge cp-badge-premium">Premium</p>
          <ul className="cp-features">
            <li>✓ Everything in Fan</li>
            <li>✓ Exclusive Challenges</li>
            <li>✓ Bestie Hub</li>
            <li>✓ Closet Collections</li>
            <li>✓ Studio Access</li>
            <li>✓ 2x Prime Coins</li>
          </ul>
          <p className="cp-description">
            Unlock premium features and earn rewards faster.
          </p>
          <button 
            className="cp-btn cp-btn-bestie"
            onClick={() => handleChoice('bestie')}
          >
            Upgrade to Bestie
          </button>
          <p className="cp-price">Starting at $9.99/month</p>
        </div>

        {/* CREATOR Tier */}
        <div className="cp-card cp-card-creator">
          <div className="cp-card-icon">🎬</div>
          <h2 className="cp-card-title">Creator Tier</h2>
          <p className="cp-card-badge cp-badge-pro">Pro</p>
          <ul className="cp-features">
            <li>✓ Everything in Bestie</li>
            <li>✓ Creator Studio</li>
            <li>✓ Upload Assets</li>
            <li>✓ Monetize Content</li>
            <li>✓ Creator Analytics</li>
            <li>✓ Collaboration Tools</li>
          </ul>
          <p className="cp-description">
            Build your brand and earn revenue from your creations.
          </p>
          <button 
            className="cp-btn cp-btn-creator"
            onClick={() => handleChoice('creator')}
          >
            Become a Creator
          </button>
          <p className="cp-price">Starting at $24.99/month</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="cp-faq">
        <h2>Questions?</h2>
        <div className="cp-faq-items">
          <div className="cp-faq-item">
            <h3>Can I upgrade later?</h3>
            <p>Yes! You can upgrade from Fan → Bestie → Creator at any time. Keep your profile and earnings.</p>
          </div>
          <div className="cp-faq-item">
            <h3>Is Creator Portal separate?</h3>
            <p>No! It's the same login. Click "Creator Studio" to access business tools while staying in your account.</p>
          </div>
          <div className="cp-faq-item">
            <h3>Do I need different accounts?</h3>
            <p>Never! One account. Multiple roles. Switch between them anytime.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
