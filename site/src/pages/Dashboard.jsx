// site/src/pages/Dashboard.jsx
// Main dashboard dispatcher - routes based on user role

import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import BestieDashboard from './BestieDashboard'
import PlayerDashboard from './PlayerDashboard'
import CreatorDashboard from './CreatorDashboard'

export default function Dashboard() {
  const { userContext, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !userContext) {
      navigate('/signup/bestie')
    }
  }, [userContext, loading, navigate])

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Loading your dashboard...</h2>
        </div>
      </div>
    )
  }

  if (!userContext) {
    return null // Will redirect
  }

  // Route based on role
  switch (userContext.role) {
    case 'BESTIE':
      return <BestieDashboard />
    case 'CREATOR':
      return <CreatorDashboard approved={true} />
    case 'CREATOR_PENDING':
      return <CreatorDashboard approved={false} />
    case 'ADMIN':
      // Admins can see player dashboard for now
      return <PlayerDashboard />
    case 'FAN':
    default:
      return <PlayerDashboard />
  }
}
