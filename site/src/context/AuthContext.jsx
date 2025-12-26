import React, { createContext, useContext, useState, useEffect } from 'react'
import { redirectToSignup, redirectToLogin, handleOAuthCallback, getCurrentUser, signOut, parseJwt } from '../api/cognito'

export const AuthContext = createContext(null)

function deriveRole(claims) {
  // Extract Cognito groups from JWT claims
  const groups = claims['cognito:groups'] || []

  // Map groups to roles
  if (groups.includes('ADMIN')) return 'ADMIN'
  if (groups.includes('CREATOR')) return 'CREATOR'
  if (groups.includes('BESTIE')) return 'BESTIE'
  if (groups.includes('PRIME')) return 'PRIME'
  // Default to FAN for any authenticated user
  return 'FAN'
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
        const role = deriveRole(claims)

        const context = {
          sub: currentUser.sub,
          email: currentUser.email,
          isAdmin: groups.includes('ADMIN'),
          isCreator: groups.includes('CREATOR'),
          isPrime: groups.includes('PRIME'),
          isBestie: groups.includes('BESTIE'),
          role,
          loading: false,
          error: null,
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
