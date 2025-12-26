import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { startLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Existing user (not new signup)
      sessionStorage.setItem('isNewSignup', 'false')
      
      // Redirect to Cognito hosted UI for login
      await startLogin()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    setError(null)
    setLoading(true)

    try {
      sessionStorage.setItem('isNewSignup', 'false')
      await startLogin()
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your LaLaVerse account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="auth-form">
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Click below to sign in with Cognito
          </p>

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Loading...' : 'Sign In'}
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
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
          >
            <span>🔍</span> Google
          </button>
          <button
            className="auth-btn auth-btn-social"
            onClick={() => handleSocialLogin('apple')}
            disabled={loading}
          >
            <span>🍎</span> Apple
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </button>
          </p>
          <p>
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="auth-info">
          <p className="auth-info-title">🔒 Secure Login</p>
          <p className="auth-info-text">
            We use industry-standard encryption to protect your account.
          </p>
        </div>
      </div>

      {/* Back to Home */}
      <button
        className="auth-back-btn"
        onClick={() => navigate('/')}
      >
        ← Back to Home
      </button>
    </div>
  )
}
