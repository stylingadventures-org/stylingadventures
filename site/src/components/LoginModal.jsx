import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/login-modal.css'

export const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleLogin = (userType) => {
    // Store selected user type and navigate to login form
    sessionStorage.setItem('selectedUserType', userType.toUpperCase())
    navigate('/login')
    onClose()
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>✨ How are you joining us?</h2>
          <p>Choose your path to Styling Adventures</p>
        </div>

        <div className="login-options">
          {/* Creator Option */}
          <button 
            className="login-option creator-option"
            onClick={() => handleLogin('creator')}
          >
            <div className="option-icon">🎬</div>
            <div className="option-details">
              <div className="option-title">Creator</div>
              <div className="option-desc">Build your brand & shop</div>
            </div>
            <div className="option-arrow">→</div>
          </button>

          {/* Bestie Option */}
          <button 
            className="login-option bestie-option"
            onClick={() => handleLogin('bestie')}
          >
            <div className="option-icon">👑</div>
            <div className="option-details">
              <div className="option-title">Bestie (Prime)</div>
              <div className="option-desc">Premium member access</div>
            </div>
            <div className="option-arrow">→</div>
          </button>

          {/* Admin Option */}
          <button 
            className="login-option admin-option"
            onClick={() => handleLogin('admin')}
          >
            <div className="option-icon">⚙️</div>
            <div className="option-details">
              <div className="option-title">Admin</div>
              <div className="option-desc">Platform management</div>
            </div>
            <div className="option-arrow">→</div>
          </button>
        </div>

        <div className="modal-footer">
          <p className="login-note">You'll be redirected to secure login after selecting your account type.</p>
        </div>
      </div>
    </div>
  )
}
