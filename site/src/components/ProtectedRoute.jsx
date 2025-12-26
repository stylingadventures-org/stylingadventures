import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protected route wrapper for role-based access control
 * Supports one account with multiple roles
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} roles - Single role or array of allowed roles
 * @param {boolean} redirectTo - Path to redirect to if unauthorized (default: /login)
 */
export function ProtectedRoute({ children, roles, redirectTo = '/login' }) {
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

  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    
    // Check if user has one of the required roles
    const hasRole = allowedRoles.some(role => {
      switch(role.toUpperCase()) {
        case 'FAN': return true // All authenticated users
        case 'BESTIE': return userContext.isBestie
        case 'CREATOR': return userContext.isCreator
        case 'ADMIN': return userContext.isAdmin
        case 'COLLAB': return userContext.isCollaborator
        case 'PRIME': return userContext.isPrimeStudio
        default: return false
      }
    })
    
    if (!hasRole) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>⛔ Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: {allowedRoles.join(', ')}</p>
          <p style={{ marginTop: '20px' }}>
            Your roles: {userContext.allGroups?.join(', ') || 'Fan'}
          </p>
          <a href="/" style={{ marginTop: '20px', display: 'inline-block' }}>← Back to Home</a>
        </div>
      )
    }
  }

  return children
}
