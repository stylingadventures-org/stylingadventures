/**
 * Centralized CORS/Origin Configuration
 * Single source of truth for allowed origins across all environments
 * Used by: Frontend, CDK stacks, Lambda functions, API routes
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

export const ALLOWED_ORIGINS = {
  development: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ],
  staging: [
    'https://staging.stylingadventures.com',
    'https://www.staging.stylingadventures.com',
  ],
  production: [
    'https://stylingadventures.com',
    'https://www.stylingadventures.com',
  ],
};

/**
 * Get allowed origins for current environment
 * Falls back to development origins if env is unknown
 */
export function getAllowedOrigins() {
  return ALLOWED_ORIGINS[NODE_ENV] || ALLOWED_ORIGINS.development;
}

/**
 * Check if an origin is allowed
 * @param origin - The origin to check (e.g., 'https://stylingadventures.com')
 * @returns true if origin is in allowed list
 */
export function isOriginAllowed(origin) {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

/**
 * Get CORS headers for a given origin
 * @param origin - The origin to check
 * @returns CORS header object or null if not allowed
 */
export function getCORSHeaders(origin) {
  if (!isOriginAllowed(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Amz-Date, X-Amz-Security-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export default {
  ALLOWED_ORIGINS,
  getAllowedOrigins,
  isOriginAllowed,
  getCORSHeaders,
};
