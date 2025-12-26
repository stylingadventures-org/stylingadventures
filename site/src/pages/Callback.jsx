import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOAuthCallback } from '../api/cognito'

export default function Callback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorParam = params.get('error')

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Exchange code for tokens
        const result = await handleOAuthCallback(code)

        if (result.success) {
          console.log('OAuth callback successful, tokens stored')
          
          // Dispatch custom event to trigger AuthContext re-check
          window.dispatchEvent(new CustomEvent('authChanged'))
          
          // Check if user signed up intending to be Bestie
          const signupIntent = sessionStorage.getItem('signupIntent')
          sessionStorage.removeItem('signupIntent')
          
          if (signupIntent === 'bestie') {
            // Redirect to payment page instead of dashboard
            await new Promise(resolve => setTimeout(resolve, 100))
            navigate('/become-bestie', { replace: true })
          } else {
            // Give browser time to process localStorage updates before navigation
            await new Promise(resolve => setTimeout(resolve, 100))
            // Redirect to dashboard - AuthContext will handle role detection from JWT
            navigate('/dashboard', { replace: true })
          }
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError(err.message || 'Authentication failed')
        setLoading(false)
      }
    }

    processCallback()
  }, [navigate])

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Signing you in...</h2>
          <p>Please wait while we process your authentication.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', paddingTop: '100px', color: 'red' }}>
          <h2>Authentication Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return null
}
