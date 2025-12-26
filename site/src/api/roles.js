/**
 * Role Management Service
 * Handles role assignment, upgrades, etc.
 */

/**
 * Store selected tier for later processing
 * This gets picked up by Lambda pre-token-generation
 */
export async function storeSelectedTier(tier) {
  try {
    const tierMap = {
      'fan': 'FAN',
      'bestie': 'BESTIE',
      'creator': 'CREATOR'
    }

    const cognitoTier = tierMap[tier.toLowerCase()]
    if (!cognitoTier) {
      throw new Error(`Invalid tier: ${tier}`)
    }

    // Store in localStorage for Lambda to pick up (via custom attributes)
    localStorage.setItem('selected_tier', cognitoTier)
    sessionStorage.setItem('selectedTier', cognitoTier)

    console.log(`✅ Tier stored: ${cognitoTier}`)
  } catch (error) {
    console.error('Error storing tier:', error)
    throw error
  }
}

/**
 * Upgrade user to a new tier
 * This will call the backend to add role to Cognito groups
 */
export async function upgradeUserTier(newTier) {
  try {
    const tierMap = {
      'fan': 'FAN',
      'bestie': 'BESTIE',
      'creator': 'CREATOR'
    }

    const cognitoTier = tierMap[newTier.toLowerCase()]
    if (!cognitoTier) {
      throw new Error(`Invalid tier: ${newTier}`)
    }

    // In production, this would call your backend API:
    // POST /api/user/upgrade with { newRole: cognitoTier }
    
    // For now, we'll just store it and let the next token refresh pick it up
    localStorage.setItem('pending_role_upgrade', cognitoTier)

    console.log(`✅ Upgrade queued: ${cognitoTier}`)
    
    return { success: true, newTier: cognitoTier }
  } catch (error) {
    console.error('Error upgrading tier:', error)
    throw error
  }
}

/**
 * Get user's current tier
 */
export function getUserTier(userContext) {
  if (!userContext) return 'fan'
  
  if (userContext.isCreator) return 'creator'
  if (userContext.isBestie) return 'bestie'
  return 'fan'
}

/**
 * Check if user can access a tier
 */
export function canAccessTier(userContext, requiredTier) {
  if (!userContext) return requiredTier === 'fan'
  
  const tierHierarchy = {
    'fan': 0,
    'bestie': 1,
    'creator': 2
  }

  const userTierValue = tierHierarchy[getUserTier(userContext)]
  const requiredTierValue = tierHierarchy[requiredTier.toLowerCase()]

  return userTierValue >= requiredTierValue
}
