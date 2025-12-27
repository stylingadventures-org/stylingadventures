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
 */
export async function authenticateUser(username, password) {
  try {
    const cfg = await getConfig()
    const region = cfg.region || 'us-east-1'
    const clientId = cfg.clientId
    const userPoolId = cfg.userPoolId

    console.log('🔐 Direct auth starting...')

    // Call InitiateAuth API
    const response = await fetch(
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

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.__type || 'Authentication failed')
    }

    const data = await response.json()

    // Extract tokens
    const idToken = data.AuthenticationResult.IdToken
    const accessToken = data.AuthenticationResult.AccessToken
    const refreshToken = data.AuthenticationResult.RefreshToken || ''

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

