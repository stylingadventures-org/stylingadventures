import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Signup() {
  const navigate = useNavigate()
  const { startSignup, startLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Mark this as a new signup (for Callback.jsx)
      sessionStorage.setItem('isNewSignup', 'true')
      
      // Redirect to Cognito hosted UI for signup
      await startSignup('fan')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSocialSignup = async (provider) => {
    setError(null)
    setLoading(true)

    try {
      sessionStorage.setItem('isNewSignup', 'true')
      
      // For social login, still use regular signup flow
      // Cognito will handle Google/Apple auth
      await startSignup('fan')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo / Welcome */}
        <div className="auth-header">
          <h1 className="auth-title">Join LaLaVerse</h1>
          <p className="auth-subtitle">Create your account to start playing</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailSignup} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              type="email"
              id="email"
              className="auth-input"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : 'Continue with Email'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Or</span>
        </div>

        {/* Social Buttons */}
        <div className="auth-socials">
          <button
            className="auth-btn auth-btn-social"
            onClick={() => handleSocialSignup('google')}
            disabled={loading}
          >
            <span>🔍</span> Google
          </button>
          <button
            className="auth-btn auth-btn-social"
            onClick={() => handleSocialSignup('apple')}
            disabled={loading}
          >
            <span>🍎</span> Apple
          </button>
        </div>

        {/* Sign In Link */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="auth-info">
          <p className="auth-info-title">🔒 Secure & Fast</p>
          <p className="auth-info-text">
            We use Cognito for secure authentication. Your password is never stored on our servers.
          </p>
        </div>

        {/* Age Gate */}
        <div className="auth-age-gate">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              required
              disabled={loading}
            />
            I confirm that I am 18 years or older
          </label>
          <label className="auth-checkbox">
            <input
              type="checkbox"
              required
              disabled={loading}
            />
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>
      </div>
    </div>
  )
}
