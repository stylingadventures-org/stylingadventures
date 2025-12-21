/**
 * Simple JWT decoder to inspect token claims (does NOT verify signature)
 */
export function decodeJWT(token) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Invalid JWT format");
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to decode JWT:", err);
    return null;
  }
}
