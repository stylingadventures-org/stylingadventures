import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const DashboardRouter = () => {
  const navigate = useNavigate()
  const { userContext, loading, isAdmin, isCreator, isPrime, isBestie } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!userContext) {
      // Not authenticated, go home
      navigate('/', { replace: true })
      return
    }

    // Route to correct dashboard based on user role
    if (isAdmin) {
      navigate('/admin', { replace: true })
    } else if (isCreator) {
      navigate('/creator/cabinet', { replace: true })
    } else if (isPrime || isBestie) {
      navigate('/become-bestie', { replace: true })
    } else {
      // Default to discover if no recognized role
      navigate('/discover', { replace: true })
    }
  }, [userContext, loading, isAdmin, isCreator, isPrime, isBestie, navigate])

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div className="loading-spinner">
        <p>🔄 Redirecting to your dashboard...</p>
        <p style={{ fontSize: '12px', color: '#999' }}>This may take a moment</p>
      </div>
    </div>
  )
}
