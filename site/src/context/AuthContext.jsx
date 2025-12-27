import React, { createContext, useContext, useState, useEffect } from 'react'
import { redirectToSignup, redirectToLogin, handleOAuthCallback, getCurrentUser, signOut, parseJwt } from '../api/cognito'

export const AuthContext = createContext(null)

/**
 * Core Identity Model:
 * - One account, many roles
 * - Roles control feature access
 * - User can have multiple roles
 */
function deriveRoles(claims) {
  // Extract Cognito groups from JWT claims
  const groups = claims['cognito:groups'] || []

  return {
    isFan: groups.includes('FAN') || groups.length === 0, // Default to FAN if no groups
    isBestie: groups.includes('BESTIE'),
    isCreator: groups.includes('CREATOR'),
    isCollaborator: groups.includes('COLLAB'),
    isAdmin: groups.includes('ADMIN'),
    isPrimeStudio: groups.includes('PRIME'),
    // All groups for reference
    allGroups: groups,
  }
}

export function AuthProvider({ children }) {
  const [userContext, setUserContext] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkAuth = async () => {
    try {
      const currentUser = getCurrentUser()
      if (currentUser) {
        // Parse JWT to get groups and claims
        const idTokenJwt = localStorage.getItem('id_token') || ''
        const claims = parseJwt(idTokenJwt) || {}
        const accessTokenJwt = localStorage.getItem('access_token') || ''
        const accessClaims = parseJwt(accessTokenJwt) || {}
        
        const groups = claims['cognito:groups'] || accessClaims['cognito:groups'] || []
        const roles = deriveRoles(claims)

        const context = {
          // User identity
          sub: currentUser.sub,
          email: currentUser.email,
          name: currentUser.name || claims.name || 'User',
          
          // Role flags (replaces old single role system)
          ...roles,
          
          // For backwards compatibility
          tier: roles.isBestie ? 'bestie' : (roles.isCreator ? 'creator' : 'fan'),
          
          // Legacy properties
          isAdmin: roles.isAdmin,
          isCreator: roles.isCreator,
          isPrime: roles.isPrimeStudio,
          isBestie: roles.isBestie,
        }

        setUserContext(context)
      } else {
        setUserContext(null)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setError(err.message)
      setUserContext(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is already logged in on mount
    checkAuth()

    // Listen for custom auth change event (fired by Callback after OAuth)
    const handleAuthChange = () => {
      console.log('Auth change event detected, rechecking auth...')
      checkAuth()
    }

    window.addEventListener('authChanged', handleAuthChange)
    return () => window.removeEventListener('authChanged', handleAuthChange)
  }, [])

  const startSignup = async (userType = 'FAN') => {
    // userType is just a hint for the signup flow
    await redirectToSignup(userType)
  }

  const startLogin = async (selectedUserType = null) => {
    // Store the selected user type in sessionStorage before redirecting to Cognito
    if (selectedUserType) {
      sessionStorage.setItem('selectedUserType', selectedUserType.toUpperCase())
    }
    await redirectToLogin()
  }

  const logout = () => {
    signOut()
    setUserContext(null)
    sessionStorage.removeItem('selectedUserType')
  }

  return (
    <AuthContext.Provider value={{
      userContext,
      loading,
      error,
      checkAuth,
      startSignup,
      startLogin,
      logout,
      // For convenience, expose top-level properties too
      user: userContext,
      isAuthenticated: !!userContext,
      role: userContext?.role,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
