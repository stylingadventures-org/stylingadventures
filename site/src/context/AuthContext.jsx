import React, { createContext, useState, useContext, useEffect } from "react";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "../lib/appSyncConfig.js";
import { decodeJWT } from "../lib/jwtDecoder.js";

const AuthContext = createContext(null);

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

/**
 * Log auth events for debugging and analytics
 */
function logAuthEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[Auth ${event}] ${timestamp}:`, details);
  
  // Store in sessionStorage for debugging
  try {
    const logs = JSON.parse(sessionStorage.getItem("authLogs") || "[]");
    logs.push({ timestamp, event, details });
    // Keep only last 50 events
    if (logs.length > 50) logs.shift();
    sessionStorage.setItem("authLogs", JSON.stringify(logs));
  } catch (err) {
    console.warn("Failed to store auth logs", err);
  }
}

/**
 * Parse Cognito error messages for user-friendly display
 */
function parseErrorMessage(err) {
  const message = err?.message || err?.toString() || "An error occurred";
  
  // Map Cognito errors to user-friendly messages
  if (message.includes("UserNotFoundException")) return "User not found. Please check your email.";
  if (message.includes("NotAuthorizedException")) return "Invalid email or password.";
  if (message.includes("UserNotConfirmedException")) return "Email not verified. Check your inbox.";
  if (message.includes("PasswordResetRequiredException")) return "Password reset required. Please use 'Forgot Password'.";
  if (message.includes("LimitExceededException")) return "Too many login attempts. Try again later.";
  if (message.includes("InvalidParameterException")) return "Invalid input. Please try again.";
  if (message.includes("ExpiredCodeException")) return "Reset code expired. Request a new one.";
  if (message.includes("CodeMismatchException")) return "Invalid verification code.";
  if (message.includes("NetworkingError")) return "Network error. Check your connection.";
  if (message.includes("ERR_NAME_NOT_RESOLVED")) return "Network error. Check your internet connection.";
  
  return message.substring(0, 100);
}

/**
 * Get token expiry time from JWT
 */
function getTokenExpiry(token) {
  try {
    const decoded = decodeJWT(token);
    return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Check if token is expiring soon (within 5 minutes)
 */
function isTokenExpiringSoon(token) {
  const expiry = getTokenExpiry(token);
  if (!expiry) return false;
  const timeUntilExpiry = expiry - Date.now();
  return timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
}

/**
 * Determine subscription tier based on Cognito groups
 * Maps Cognito groups to subscription tier and access level
 */
function determineSubscriptionTier(tokenClaims) {
  const groups = tokenClaims?.["cognito:groups"] || [];
  
  // Determine highest tier (hierarchical)
  let tier = "FAN"; // Default
  let subscriptionLevel = "free";
  
  if (groups.includes("ADMIN")) {
    tier = "ADMIN";
    subscriptionLevel = "admin";
  } else if (groups.includes("PRIME")) {
    tier = "PRIME";
    subscriptionLevel = "elite";
  } else if (groups.includes("CREATOR")) {
    tier = "CREATOR";
    subscriptionLevel = "pro";
  } else if (groups.includes("BESTIE")) {
    tier = "BESTIE";
    subscriptionLevel = "pro";
  } else if (groups.includes("COLLAB")) {
    tier = "COLLAB";
    subscriptionLevel = "pro";
  }
  
  return {
    tier,
    groups,
    subscriptionLevel,
    hasAccess: (requiredTier) => {
      const tierHierarchy = ["FAN", "BESTIE", "CREATOR", "PRIME", "ADMIN"];
      return tierHierarchy.indexOf(tier) >= tierHierarchy.indexOf(requiredTier);
    },
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [authAction, setAuthAction] = useState(null); // Current action: "login" | "logout" | "refresh" | null
  const [subscription, setSubscription] = useState(null); // { tier, groups, subscriptionLevel, hasAccess() }
  const [userTier, setUserTier] = useState(null); // User tier: FAN, BESTIE, CREATOR, PRIME, ADMIN, COLLAB

  // Check if user is logged in on mount
  useEffect(() => {
    checkUserSession();
  }, []);

  // Set up token refresh timer
  useEffect(() => {
    if (!idToken) return;

    // Check if token is expiring soon
    if (isTokenExpiringSoon(idToken)) {
      console.log("[AuthContext] Token expiring soon, refreshing...");
      refreshTokenIfNeeded();
      return;
    }

    // Calculate time until token expires
    const expiry = getTokenExpiry(idToken);
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // Refresh 5 min before expiry
    
    if (refreshTime <= 0) {
      refreshTokenIfNeeded();
      return;
    }

    // Set timer to refresh before expiry
    const timer = setTimeout(() => {
      console.log("[AuthContext] Token refresh timer triggered");
      refreshTokenIfNeeded();
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [idToken, refreshToken]);

  const checkUserSession = async () => {
    try {
      setLoading(true);
      setAuthAction("session_check");
      logAuthEvent("SESSION_CHECK", { timestamp: new Date().toISOString() });
      
      // Check if token exists - try sessionStorage first, then localStorage
      let storedToken = sessionStorage.getItem("id_token");
      if (!storedToken) {
        storedToken = localStorage.getItem("idToken");
      }
      if (!storedToken) {
        storedToken = localStorage.getItem("sa_id_token");
      }
      const storedUser = localStorage.getItem("user");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      
      if (storedToken && storedUser) {
        setIdToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
        // Restore subscription info if available
        const storedSubscription = localStorage.getItem("subscription");
        if (storedSubscription) {
          const subData = JSON.parse(storedSubscription);
          setSubscription(subData);
          setUserTier(subData.tier);
        }
        logAuthEvent("SESSION_RESTORED", { username: parsedUser.username });
      } else {
        setUser(null);
        logAuthEvent("NO_SESSION", {});
        setIdToken(null);
        setRefreshToken(null);
      }
    } catch (err) {
      console.error("Error checking session:", err);
      logAuthEvent("SESSION_CHECK_ERROR", { error: err.message });
      setUser(null);
      setIdToken(null);
      setRefreshToken(null);
    } finally {
      setLoading(false);
      setAuthAction(null);
    }
  };

  const refreshTokenIfNeeded = async () => {
    if (!refreshToken) {
      logAuthEvent("REFRESH_SKIPPED", { reason: "no_refresh_token" });
      return;
    }

    try {
      setAuthAction("refresh");
      logAuthEvent("TOKEN_REFRESH_START", {});
      
      const command = new InitiateAuthCommand({
        ClientId: cognitoConfig.userPoolWebClientId,
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const result = await cognitoClient.send(command);

      if (result.AuthenticationResult) {
        const newIdToken = result.AuthenticationResult.IdToken;
        const newAccessToken = result.AuthenticationResult.AccessToken;

        // Store new tokens
        sessionStorage.setItem("id_token", newIdToken);
        sessionStorage.setItem("access_token", newAccessToken);
        localStorage.setItem("idToken", newIdToken);
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("sa_id_token", newIdToken);
        localStorage.setItem("sa_access_token", newAccessToken);

        setIdToken(newIdToken);
        logAuthEvent("TOKEN_REFRESH_SUCCESS", {});
      }
    } catch (err) {
      logAuthEvent("TOKEN_REFRESH_FAILED", { error: err.message });
      console.error("[AuthContext] Token refresh failed:", err);
      // If refresh fails, logout user
      await logout();
    } finally {
      setAuthAction(null);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthAction("login");
      setError(null);
      logAuthEvent("LOGIN_START", { username });

      // Call Cognito InitiateAuth
      const command = new InitiateAuthCommand({
        ClientId: cognitoConfig.userPoolWebClientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const result = await cognitoClient.send(command);

      if (result.AuthenticationResult) {
        const idToken = result.AuthenticationResult.IdToken;
        const accessToken = result.AuthenticationResult.AccessToken;
        const refreshTokenResponse = result.AuthenticationResult.RefreshToken;

        // Decode and log token claims for debugging
        const tokenClaims = decodeJWT(idToken);
        const userInfo = {
          username: username,
          email: tokenClaims?.email || username,
          groups: tokenClaims?.["cognito:groups"] || [],
        };

        // Store tokens in both formats and both storage types for compatibility
        sessionStorage.setItem("id_token", idToken);
        sessionStorage.setItem("access_token", accessToken);
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("sa_id_token", idToken);
        localStorage.setItem("sa_access_token", accessToken);
        
        if (refreshTokenResponse) {
          localStorage.setItem("refreshToken", refreshTokenResponse);
        }
        localStorage.setItem("user", JSON.stringify(userInfo));

        // Determine subscription tier and store it
        const subscriptionData = determineSubscriptionTier(tokenClaims);
        localStorage.setItem("subscription", JSON.stringify(subscriptionData));

        // Update state
        setIdToken(idToken);
        setUser(userInfo);
        setSubscription(subscriptionData);
        setUserTier(subscriptionData.tier);
        if (refreshTokenResponse) {
          setRefreshToken(refreshTokenResponse);
        }

        logAuthEvent("LOGIN_SUCCESS", { 
          username, 
          email: userInfo.email,
          groups: userInfo.groups 
        });
        
        return { success: true, username };
      }
    } catch (err) {
      const friendlyError = parseErrorMessage(err);
      setError(friendlyError);
      logAuthEvent("LOGIN_FAILED", { username, error: err.message });
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
      setAuthAction(null);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setAuthAction("logout");
      setError(null);
      logAuthEvent("LOGOUT_START", { username: user?.username });

      // Clear all storage (sessionStorage + localStorage, both formats)
      sessionStorage.removeItem("id_token");
      sessionStorage.removeItem("access_token");
      localStorage.removeItem("idToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("sa_id_token");
      localStorage.removeItem("sa_access_token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("subscription");

      setUser(null);
      setIdToken(null);
      setRefreshToken(null);
      setSubscription(null);
      setUserTier(null);
      
      logAuthEvent("LOGOUT_SUCCESS", {});
    } catch (err) {
      const friendlyError = parseErrorMessage(err);
      setError(friendlyError);
      logAuthEvent("LOGOUT_ERROR", { error: err.message });
      console.error("Logout error:", err);
      throw err;
    } finally {
      setLoading(false);
      setAuthAction(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        error,
        authAction,
        login,
        logout,
        isAuthenticated: !!user && !!idToken,
        checkUserSession,
        subscription,
        userTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
