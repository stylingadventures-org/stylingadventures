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
  // Wait for config promise if it exists
  if (window.__CONFIG_LOADED__) {
    await window.__CONFIG_LOADED__
  }
  
  if (window.__CONFIG__) {
    return window.__CONFIG__
  }
  
  // If not loaded yet, fetch it fresh (no caching)
  const configUrl = '/config.json?v=' + Math.random() + '&t=' + Date.now()
  const response = await fetch(configUrl, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
  const configData = await response.json()
  window.__CONFIG__ = configData
  return configData
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
    console.log('🔐 redirectToSignup: Config loaded', cfg)
    
    // Use current origin in development, production URI from config for deployed
    const isDev = isDevelopment()
    console.log('🔐 redirectToSignup: isDevelopment =', isDev)
    
    const redirectUri = isDev
      ? (window.location.origin + '/callback')
      : (cfg.redirectUri || (window.location.origin + '/callback'))
    const clientId = cfg.userPoolWebClientId
    const domain = cfg.cognitoDomain
    
    console.log('=== Cognito Signup Debug ===')
    console.log('Hostname:', window.location.hostname)
    console.log('Origin:', window.location.origin)
    console.log('Redirect URI:', redirectUri)
    console.log('Client ID:', clientId)
    console.log('Domain:', domain)
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7)
    
    // Store state for later use
    sessionStorage.setItem('oauth_state', state)
    
    console.log('State:', state)
    
    // Try WITHOUT PKCE first to see if that's the issue
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      state: state
    })

    const authUrl = `${domain}/oauth2/authorize?${params.toString()}`
    console.log('Full auth URL:', authUrl)
    console.log('🔐 redirectToSignup: About to redirect to Cognito')
    
    // Redirect after a short delay to ensure logs are captured
    await new Promise(resolve => setTimeout(resolve, 100))
    window.location.href = authUrl
  } catch (err) {
    console.error('🔐 redirectToSignup ERROR:', err)
    throw err
  }
}

/**
 * Redirect to Cognito Hosted UI for login
 */
export async function redirectToLogin() {
  try {
    console.log('🔐 redirectToLogin: Starting')
    const cfg = await getConfig()
    console.log('🔐 redirectToLogin: Config loaded', cfg)
    
    // Use current origin in development, production URI from config for deployed
    const isDev = isDevelopment()
    console.log('🔐 redirectToLogin: isDevelopment =', isDev)
    
    const redirectUri = isDev
      ? (window.location.origin + '/callback')
      : (cfg.redirectUri || (window.location.origin + '/callback'))
    const clientId = cfg.userPoolWebClientId
    const domain = cfg.cognitoDomain

    console.log('=== Cognito Login Debug ===')
    console.log('Hostname:', window.location.hostname)
    console.log('Origin:', window.location.origin)
    console.log('Redirect URI:', redirectUri)
    console.log('Client ID:', clientId)
    console.log('Domain:', domain)

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7)
    
    // Store state for later use
    sessionStorage.setItem('oauth_state', state)

    console.log('State:', state)

    // Try WITHOUT PKCE first to see if that's the issue
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      state: state
    })

    const authUrl = `${domain}/oauth2/authorize?${params.toString()}`
    console.log('Full auth URL:', authUrl)
    console.log('🔐 redirectToLogin: About to redirect to Cognito')
    
    // Redirect after a short delay to ensure logs are captured
    await new Promise(resolve => setTimeout(resolve, 100))
    window.location.href = authUrl
  } catch (err) {
    console.error('🔐 redirectToLogin ERROR:', err)
    throw err
  }
  window.location.href = authUrl
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

