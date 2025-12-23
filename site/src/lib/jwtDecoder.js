/**
 * Decode a JWT token without verification
 * This is safe for reading claims from tokens but should not be used for security validation
 */
export function decodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    // Decode the payload (second part)
    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return decoded;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, convert to milliseconds
  const expirationTime = decoded.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Get the expiration time of a token
 */
export function getTokenExpiration(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}
