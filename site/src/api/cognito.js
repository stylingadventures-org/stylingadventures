// PKCE Helper: Generate code verifier (43-128 characters)
function generateCodeVerifier() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let codeVerifier = ''
  for (let i = 0; i < 128; i++) {
    codeVerifier += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return codeVerifier
}

// PKCE Helper: Generate code challenge from verifier
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const hashString = hashArray.map(b => String.fromCharCode(b)).join('')
  return btoa(hashString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Get config from window or fetch it fresh
async function getConfig() {
  console.log('🔐 getConfig: Starting')
  
  // Wait for config promise if it exists
  if (window.__CONFIG_LOADED__) {
    console.log('🔐 getConfig: Waiting for CONFIG_LOADED promise')
    await window.__CONFIG_LOADED__
  }
  
  if (window.__CONFIG__) {
    console.log('🔐 getConfig: Using cached config', window.__CONFIG__)
    return window.__CONFIG__
  }
  
  console.log('🔐 getConfig: Fetching fresh config')
  // If not loaded yet, fetch it fresh (no caching)
  const configUrl = '/config.json?v=' + Math.random() + '&t=' + Date.now()
  console.log('🔐 getConfig: Fetching from:', configUrl)
  
  try {
    const response = await fetch(configUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    console.log('🔐 getConfig: Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status} ${response.statusText}`)
    }
    
    const configData = await response.json()
    console.log('🔐 getConfig: Config loaded successfully', configData)
    window.__CONFIG__ = configData
    return configData
  } catch (err) {
    console.error('🔐 getConfig: ERROR fetching config', err)
    throw err
  }
}

// Helper to determine if running in development
function isDevelopment() {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

/**
 * Redirect to Cognito Hosted UI for signup
 * Uses PKCE for secure code exchange without backend secret
 */
export async function redirectToSignup(userType = 'player') {
  try {
    console.log('🔐 redirectToSignup: Starting')
    const cfg = await getConfig()
    
    const redirectUri = isDevelopment()
      ? 'http://localhost:5173/callback'
      : (cfg.redirectUri || 'https://stylingadventures.com/callback')
    
    const clientId = cfg.clientId
    const domain = cfg.cognitoDomain
    
    console.log('=== OAuth Parameters ===')
    console.log('Client ID:', clientId)
    console.log('Domain:', domain)
    console.log('Redirect URI:', redirectUri)
    
    // Build URL manually to ensure it's correct
    const params = [
      'client_id=' + encodeURIComponent(clientId),
      'response_type=code',
      'scope=' + encodeURIComponent('openid email profile'),
      'redirect_uri=' + encodeURIComponent(redirectUri)
    ].join('&')
    
    const authUrl = domain + '/oauth2/authorize?' + params
    console.log('Auth URL:', authUrl)
    console.log('🔐 About to redirect...')
    
    window.location.href = authUrl
  } catch (err) {
    console.error('🔐 ERROR:', err)
    alert('OAuth Error: ' + err.message)
  }
}

/**
 * Redirect to Cognito Hosted UI for login
 */
export async function redirectToLogin() {
  try {
    console.log('🔐 redirectToLogin: Starting')
    const cfg = await getConfig()
    
    const redirectUri = isDevelopment()
      ? 'http://localhost:5173/callback'
      : (cfg.redirectUri || 'https://stylingadventures.com/callback')
    
    const clientId = cfg.clientId
    const domain = cfg.cognitoDomain
    
    console.log('=== OAuth Parameters ===')
    console.log('Client ID:', clientId)
    console.log('Domain:', domain)
    console.log('Redirect URI:', redirectUri)
    
    // Build URL manually to ensure it's correct
    const params = [
      'client_id=' + encodeURIComponent(clientId),
      'response_type=code',
      'scope=' + encodeURIComponent('openid email profile'),
      'redirect_uri=' + encodeURIComponent(redirectUri)
    ].join('&')
    
    const authUrl = domain + '/oauth2/authorize?' + params
    console.log('Auth URL:', authUrl)
    console.log('🔐 About to redirect...')
    
    window.location.href = authUrl
  } catch (err) {
    console.error('🔐 ERROR:', err)
    alert('OAuth Error: ' + err.message)
  }
}

/**
 * Direct Cognito authentication using InitiateAuth (USER_PASSWORD_AUTH)
 * Bypasses the broken hosted UI login page
 * Handles NEW_PASSWORD_REQUIRED challenge for temporary passwords
 */
export async function authenticateUser(username, password) {
  try {
    const cfg = await getConfig()
    const region = cfg.region || 'us-east-1'
    const clientId = cfg.clientId
    const userPoolId = cfg.userPoolId

    console.log('🔐 Direct auth starting...')
    console.log('🔐 Using config:', { region, clientId: clientId?.substring(0, 10) + '...', userPoolId })
    console.log('🔐 Username input:', username)

    // Try InitiateAuth (standard auth flow)
    let response = await fetch(
      `https://cognito-idp.${region}.amazonaws.com/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          ClientId: clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password
          }
        })
      }
    )

    console.log('🔐 InitiateAuth Response status:', response.status)
    let data = await response.json()
    console.log('🔐 InitiateAuth Response:', { status: response.status, keys: Object.keys(data) })

    // If InitiateAuth fails, it might be because email is not registered as an alias
    // In that case, we need to look up the user first and get their username
    if (!response.ok && (data.__type === 'NotAuthorizedException' || data.__type === 'UserNotFoundException')) {
      console.log('🔐 InitiateAuth failed, trying AdminInitiateAuth...')
      
      // Use AdminInitiateAuth which works with email as well
      response = await fetch(
        `https://cognito-idp.${region}.amazonaws.com/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.AdminInitiateAuth'
          },
          body: JSON.stringify({
            UserPoolId: userPoolId,
            ClientId: clientId,
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            AuthParameters: {
              USERNAME: username,
              PASSWORD: password
            }
          })
        }
      )

      console.log('🔐 AdminInitiateAuth Response status:', response.status)
      data = await response.json()
      console.log('🔐 AdminInitiateAuth Response:', { status: response.status, keys: Object.keys(data) })
    }

    if (!response.ok) {
      const errorData = data
      console.error('🔐 Error response:', errorData)
      
      // Provide more helpful error messages
      const errorType = errorData.__type
      let errorMessage = 'Authentication failed'
      
      if (errorType === 'NotAuthorizedException') {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (errorType === 'UserNotFoundException') {
        errorMessage = 'No account found with this email address.'
      } else if (errorType === 'UserNotConfirmedException') {
        errorMessage = 'Email not verified. Please check your email to confirm your account.'
      } else if (errorType === 'PasswordResetRequiredException') {
        errorMessage = 'Password reset is required. Please use the forgot password option.'
      } else if (errorType === 'TooManyRequestsException') {
        errorMessage = 'Too many login attempts. Please try again later.'
      } else if (errorType === 'InvalidParameterException') {
        errorMessage = 'Authentication configuration error. Please contact support.'
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
      
      throw new Error(errorMessage)
    }

    console.log('🔐 Authentication response data:', { keys: Object.keys(data) })

    // Check if temporary password challenge is required
    if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log('🔐 NEW_PASSWORD_REQUIRED challenge detected - storing session for password change')
      
      // Store the session and username for password change flow
      sessionStorage.setItem('cognito_username', username)
      sessionStorage.setItem('cognito_session', data.Session)
      sessionStorage.setItem('cognito_challenge', 'NEW_PASSWORD_REQUIRED')
      
      return {
        success: false,
        challengeName: 'NEW_PASSWORD_REQUIRED',
        requiresPasswordChange: true,
        message: 'This is your first login. Please set a new password.'
      }
    }

    // Extract tokens
    const idToken = data.AuthenticationResult?.IdToken
    const accessToken = data.AuthenticationResult?.AccessToken
    const refreshToken = data.AuthenticationResult?.RefreshToken || ''

    if (!idToken || !accessToken) {
      console.error('🔐 Missing tokens in response:', { idToken: !!idToken, accessToken: !!accessToken })
      throw new Error('Authentication succeeded but tokens are missing. Please try again.')
    }

    // Parse JWT to get user info
    const userData = parseJwt(idToken)

    // Store tokens
    localStorage.setItem('id_token', idToken)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)

    const tokens = {
      idToken,
      accessToken,
      refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (data.AuthenticationResult.ExpiresIn || 3600),
      sub: userData.sub,
      email: userData.email
    }

    localStorage.setItem('cognito_tokens', JSON.stringify(tokens))

    console.log('🔐 Direct auth successful!')
    return {
      success: true,
      tokens,
      userData
    }
  } catch (error) {
    console.error('🔐 Direct auth error:', error)
    throw error
  }
}

/**
 * Complete the NEW_PASSWORD_REQUIRED challenge by setting a new password
 */
export async function completeNewPasswordChallenge(newPassword) {
  try {
    const cfg = await getConfig()
    const region = cfg.region || 'us-east-1'
    const clientId = cfg.clientId
    const userPoolId = cfg.userPoolId
    
    const username = sessionStorage.getItem('cognito_username')
    const session = sessionStorage.getItem('cognito_session')
    
    if (!username || !session) {
      throw new Error('No password change session found. Please login again.')
    }

    console.log('🔐 Completing NEW_PASSWORD_REQUIRED challenge...')

    // Try RespondToAuthChallenge first
    let response = await fetch(
      `https://cognito-idp.${region}.amazonaws.com/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
        },
        body: JSON.stringify({
          ClientId: clientId,
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          Session: session,
          ChallengeResponses: {
            USERNAME: username,
            NEW_PASSWORD: newPassword,
            userAttributes: {
              email_verified: 'true'
            }
          }
        })
      }
    )

    console.log('🔐 RespondToAuthChallenge status:', response.status)
    let data = await response.json()

    // If that fails, try AdminRespondToAuthChallenge
    if (!response.ok) {
      console.log('🔐 RespondToAuthChallenge failed, trying AdminRespondToAuthChallenge...')
      
      response = await fetch(
        `https://cognito-idp.${region}.amazonaws.com/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.AdminRespondToAuthChallenge'
          },
          body: JSON.stringify({
            UserPoolId: userPoolId,
            ClientId: clientId,
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            Session: session,
            ChallengeResponses: {
              USERNAME: username,
              NEW_PASSWORD: newPassword,
              userAttributes: {
                email_verified: 'true'
              }
            }
          })
        }
      )

      console.log('🔐 AdminRespondToAuthChallenge status:', response.status)
      data = await response.json()
    }

    if (!response.ok) {
      const errorData = data
      console.error('🔐 Challenge response error:', errorData)
      throw new Error(errorData.__type || errorData.message || 'Failed to set new password')
    }

    // Extract tokens
    const idToken = data.AuthenticationResult?.IdToken
    const accessToken = data.AuthenticationResult?.AccessToken
    const refreshToken = data.AuthenticationResult?.RefreshToken || ''

    if (!idToken || !accessToken) {
      console.error('🔐 Missing tokens in response:', { idToken: !!idToken, accessToken: !!accessToken })
      throw new Error('Password changed but tokens are missing. Please try login again.')
    }

    // Parse JWT to get user info
    const userData = parseJwt(idToken)

    // Store tokens
    localStorage.setItem('id_token', idToken)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)

    const tokens = {
      idToken,
      accessToken,
      refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (data.AuthenticationResult.ExpiresIn || 3600),
      sub: userData.sub,
      email: userData.email
    }

    localStorage.setItem('cognito_tokens', JSON.stringify(tokens))

    // Clear session data
    sessionStorage.removeItem('cognito_username')
    sessionStorage.removeItem('cognito_session')
    sessionStorage.removeItem('cognito_challenge')

    console.log('🔐 Password changed and login successful!')
    return {
      success: true,
      tokens,
      userData
    }
  } catch (error) {
    console.error('🔐 Password change error:', error)
    throw error
  }
}

/**
 * Handle OAuth callback and exchange code for tokens
 * Uses PKCE to securely exchange authorization code for tokens without backend secret
 */
export async function handleOAuthCallback(code) {
  try {
    const cfg = await getConfig()
    // Use current origin in development, production URI from config for deployed
    const redirectUri = isDevelopment()
      ? (window.location.origin + '/callback')
      : (cfg.redirectUri || (window.location.origin + '/callback'))
    const clientId = cfg.userPoolWebClientId
    const domain = cfg.cognitoDomain
    
    // Get the code verifier that was stored during login (optional with PKCE)
    const codeVerifier = sessionStorage.getItem('code_verifier')
    
    console.log('=== Token Exchange Debug ===')
    console.log('Code:', code.substring(0, 20) + '...')
    console.log('Client ID:', clientId)
    console.log('Redirect URI:', redirectUri)
    console.log('Has code verifier:', !!codeVerifier)

    // Build token exchange body
    const tokenBody = {
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
    }
    
    // Add code_verifier if available (PKCE)
    if (codeVerifier) {
      tokenBody.code_verifier = codeVerifier
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenBody).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Token exchange error:', errorData)
      throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for tokens')
    }

    const data = await tokenResponse.json()

    // Parse the ID token to get user info
    const idToken = data.id_token
    const userData = parseJwt(idToken)

    // Store tokens - keep both individual items and combined object for compatibility
    localStorage.setItem('id_token', data.id_token)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token || '')

    const tokens = {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      sub: userData.sub,
      email: userData.email,
    }

    localStorage.setItem('cognito_tokens', JSON.stringify(tokens))
    
    // Clean up PKCE verifier from session storage
    sessionStorage.removeItem('code_verifier')
    sessionStorage.removeItem('oauth_state')

    return {
      success: true,
      tokens,
      userData,
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    throw error
  }
}

/**
 * Parse JWT to extract claims
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error parsing JWT:', error)
    return {}
  }
}

/**
 * Sign out user and redirect to Cognito logout
 */
export async function signOut() {
  localStorage.removeItem('cognito_tokens')
  localStorage.removeItem('id_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  const cfg = await getConfig()
  const clientId = cfg.userPoolWebClientId
  const domain = cfg.cognitoDomain
  const logoutUri = encodeURIComponent(window.location.origin + '/')

  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`
}

/**
 * Get current user from stored tokens
 */
export function getCurrentUser() {
  const tokensStr = localStorage.getItem('cognito_tokens')
  if (!tokensStr) return null

  try {
    const tokens = JSON.parse(tokensStr)
    const now = Math.floor(Date.now() / 1000)

    // Check if token is expired
    if (tokens.expiresAt <= now) {
      localStorage.removeItem('cognito_tokens')
      return null
    }

    return tokens
  } catch (error) {
    console.error('Error parsing tokens:', error)
    localStorage.removeItem('cognito_tokens')
    return null
  }
}

/**
 * Get ID token for API calls
 */
export function getIdToken() {
  const user = getCurrentUser()
  return user?.idToken || null
}

