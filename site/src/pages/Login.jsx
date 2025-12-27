import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authenticateUser, completeNewPasswordChallenge } from '../api/cognito'
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Direct Cognito authentication (bypasses broken hosted UI)
      const result = await authenticateUser(username, password)

      if (result.requiresPasswordChange) {
        console.log('✓ Temporary password detected - showing password change form')
        setRequiresPasswordChange(true)
        setPassword('')
        setLoading(false)
        return
      }

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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const result = await completeNewPasswordChallenge(newPassword)

      if (result.success) {
        console.log('✓ Password changed and login successful')
        setRequiresPasswordChange(false)
        setNewPassword('')
        setConfirmPassword('')
        
        // Trigger auth context to re-check user
        window.dispatchEvent(new CustomEvent('authChanged'))
        
        // Give browser time to process localStorage updates
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check auth and navigate
        await checkAuth()
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error('Password change error:', err)
      setError(err.message || 'Failed to set new password. Please try again.')
      setLoading(false)
    }
  }

  // Password Change Form
  if (requiresPasswordChange) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Set New Password</h1>
            <p className="auth-subtitle">This is your first login. Please set a new password.</p>
          </div>

          {error && (
            <div className="auth-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="auth-form">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              <small>Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Setting password...' : 'Set Password & Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setRequiresPasswordChange(false)
                  setError(null)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                ← Back to login
              </button>
            </p>
          </div>
        </div>
      </div>
    )
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
