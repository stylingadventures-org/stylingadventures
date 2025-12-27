import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authenticateUser } from '../api/cognito'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Direct Cognito authentication (bypasses broken hosted UI)
      const result = await authenticateUser(username, password)

      if (result.success) {
        console.log('✓ Login successful')
        
        // Trigger auth context to re-check user
        window.dispatchEvent(new CustomEvent('authChanged'))
        
        // Give browser time to process localStorage updates
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check auth and navigate
        await checkAuth()
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
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
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="email"
              id="username"
              placeholder="your@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Or</span>
        </div>

        {/* Social Buttons (Placeholder) */}
        <div className="auth-socials">
          <button
            className="auth-btn auth-btn-social"
            disabled
            title="Coming soon"
          >
            <span>🔍</span> Google
          </button>
          <button
            className="auth-btn auth-btn-social"
            disabled
            title="Coming soon"
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
