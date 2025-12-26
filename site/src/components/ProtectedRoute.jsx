import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protected route wrapper for role-based access control
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} requiredRole - Single role or array of allowed roles
 * @param {boolean} redirectTo - Path to redirect to if unauthorized (default: /signin)
 */
export function ProtectedRoute({ children, requiredRole, redirectTo = '/' }) {
  const { userContext, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>🔄 Loading...</div>
      </div>
    )
  }

  if (!userContext) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    // Check if user has one of the required roles
    const hasRole = allowedRoles.some(role => {
      switch(role) {
        case 'ADMIN': return userContext.isAdmin
        case 'CREATOR': return userContext.isCreator
        case 'PRIME': return userContext.isPrime
        case 'BESTIE': return userContext.isBestie
        default: return false
      }
    })
    
    if (!hasRole) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>⛔ Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: {allowedRoles.join(', ')}</p>
          <a href="/">← Back to Home</a>
        </div>
      )
    }
  }

  return children
}
