import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { decodeJWT } from "../lib/jwtDecoder";

export const ProtectedRoute = ({ children, requiredGroups = [] }) => {
  const { isAuthenticated, idToken } = useAuth();

  // Not authenticated - redirect to home
  if (!isAuthenticated || !idToken) {
    return <Navigate to="/" replace />;
  }

  // If no specific groups required, allow access
  if (requiredGroups.length === 0) {
    return children;
  }

  // Check if user has required group
  try {
    const decoded = decodeJWT(idToken);
    const userGroups = decoded["cognito:groups"] || [];
    const hasRequiredGroup = requiredGroups.some(group => userGroups.includes(group));

    if (!hasRequiredGroup) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (e) {
    console.error("[ProtectedRoute] Error decoding token:", e);
    return <Navigate to="/" replace />;
  }
};
