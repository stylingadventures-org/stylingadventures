import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/pages.css'

export default function SignupBestie() {
  const { startSignup } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async () => {
    try {
      console.log('🎬 SignupBestie: handleSignup called')
      // Store signup intent in sessionStorage so Callback can handle it
      sessionStorage.setItem('signupIntent', 'bestie')
      console.log('🎬 SignupBestie: signupIntent set')
      // Redirect to Cognito Hosted UI for signup as Bestie
      console.log('🎬 SignupBestie: calling startSignup')
      await startSignup('bestie')
      console.log('🎬 SignupBestie: startSignup returned (should have redirected)')
    } catch (err) {
      console.error('🎬 SignupBestie error:', err)
    }
  }

  return (
    <div className="page-container">
      <div className="auth-container">
        <div className="auth-box">
          <h1>Join as a Bestie</h1>
          <p>Unlock exclusive content and perks</p>

          <button 
            onClick={handleSignup}
            className="btn btn-primary btn-block"
          >
            Sign Up with Email
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            onClick={handleSignup}
            className="btn btn-secondary btn-block"
          >
            Continue with Google
          </button>

          <div className="auth-info">
            <h3>Bestie Benefits</h3>
            <ul>
              <li>🎬 Early episode access</li>
              <li>👗 Exclusive closet items</li>
              <li>🎮 Boosted rewards</li>
              <li>✨ Special surprises</li>
              <li>💬 Voting on episodes</li>
              <li>🌟 Bestie badge</li>
            </ul>
          </div>

          <p className="auth-footer">
            Already have an account? <a href="/">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  )
}
