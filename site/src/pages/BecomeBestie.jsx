import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/pages.css'

export default function BecomeBestie() {
  const { userContext, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate('/signup/bestie')
    return null
  }

  // If already a bestie, redirect to dashboard
  if (userContext?.isBestie) {
    navigate('/dashboard')
    return null
  }

  const handleStartSubscription = async () => {
    try {
      const token = localStorage.getItem('id_token')
      
      // Create Stripe checkout session
      const response = await fetch(`${window.location.origin}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'bestie-monthly',
          returnUrl: window.location.origin + '/dashboard',
        }),
      })

      if (!response.ok) throw new Error('Failed to create checkout')
      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1>Upgrade to Bestie</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
          Get exclusive access to premium content, early episodes, and special perks
        </p>

        {/* Pricing Card */}
        <div style={{
          border: '2px solid #a855f7',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          backgroundColor: '#f9f3ff',
        }}>
          <h2 style={{ color: '#a855f7', marginBottom: '1rem' }}>Bestie Membership</h2>
          
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>$9.99</span>
            <span style={{ fontSize: '1rem', color: '#666' }}>/month</span>
          </div>

          <ul style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
            <li>✨ Early episode access (24 hours before public)</li>
            <li>👗 Exclusive closet items</li>
            <li>🎮 Boosted rewards (2x coins)</li>
            <li>💬 Priority voting on episodes</li>
            <li>🌟 Bestie badge on profile</li>
            <li>🎁 Special surprises & promotions</li>
            <li>📱 Ad-free experience</li>
          </ul>

          <button
            className="btn btn-primary btn-block"
            onClick={handleStartSubscription}
            style={{ fontSize: '1.1rem', padding: '1rem' }}
          >
            Subscribe Now
          </button>

          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem', textAlign: 'center' }}>
            Cancel anytime. Billing renews monthly.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: '3rem' }}>
          <h3>Questions?</h3>
          <div style={{ marginTop: '1rem' }}>
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Can I cancel anytime?</summary>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>Yes! Cancel your subscription anytime from your account settings.</p>
            </details>
            
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Is my payment secure?</summary>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>We use Stripe for payments, which is PCI-DSS compliant. Your card info is encrypted.</p>
            </details>

            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>What happens after I subscribe?</summary>
              <p style={{ marginTop: '0.5rem', color: '#666' }}>Your account will be upgraded instantly. Return to your dashboard to access Bestie features!</p>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
