import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/pages.css'

export default function SignupCreator() {
  const navigate = useNavigate()
  const { startSignup } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Redirect to Cognito hosted UI for signup with CREATOR role hint
      await startSignup('CREATOR')
    } catch (err) {
      setError(err.message || 'Failed to start signup')
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-box">
          <h1>Become a Creator</h1>
          <p>Build your independent business on Styling Adventures</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Redirecting to signup...' : 'Create Creator Account'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Creator Revenue Tiers</h3>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>🎭 Indie: 70% revenue share</li>
              <li>⭐ Independent: 80% revenue share</li>
              <li>💎 Pro: 85% revenue share</li>
            </ul>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
              Grow with Styling Adventures and increase your earnings as you build your audience.
            </p>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>Creator Benefits</h3>
            <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
              <li>Upload unlimited styled looks and fashion episodes</li>
              <li>Access to fashion game integration</li>
              <li>Analytics and performance metrics</li>
              <li>Direct monetization from your content</li>
              <li>Community engagement tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
