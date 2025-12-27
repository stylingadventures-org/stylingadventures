import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOAuthCallback, parseJwt, getCurrentUser } from '../api/cognito'

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
          
          // Check if this is a NEW signup or existing login
          const isNewSignup = sessionStorage.getItem('isNewSignup')
          sessionStorage.removeItem('isNewSignup')
          sessionStorage.removeItem('signupIntent')
          
          // Give browser time to process localStorage updates before navigation
          await new Promise(resolve => setTimeout(resolve, 100))
          
          if (isNewSignup === 'true') {
            // New signup → show role selection
            navigate('/choose-your-path', { replace: true })
          } else {
            // Existing user login → check user tier and route accordingly
            const user = getCurrentUser()
            if (user) {
              // Parse JWT to get user tier/groups
              const idTokenJwt = localStorage.getItem('id_token') || ''
              const claims = parseJwt(idTokenJwt) || {}
              const groups = claims['cognito:groups'] || []
              
              // Route based on user tier
              if (groups.includes('BESTIE') || groups.includes('PRIME')) {
                // Bestie user → go to bestie home
                navigate('/bestie/home', { replace: true })
              } else if (groups.includes('CREATOR')) {
                // Creator user → go to creator cabinet
                navigate('/creator/cabinet', { replace: true })
              } else if (groups.includes('ADMIN')) {
                // Admin user → go to admin dashboard
                navigate('/admin', { replace: true })
              } else {
                // Fan or default user → go to fan home
                navigate('/fan/home', { replace: true })
              }
            } else {
              // Fallback
              navigate('/dashboard', { replace: true })
            }
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
