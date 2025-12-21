import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { decodeJWT } from "../lib/jwtDecoder";

export const SignupPage = ({ children }) => {
  const { isAuthenticated, idToken } = useAuth();

  // If already authenticated, redirect to their portal based on group
  if (isAuthenticated && idToken) {
    try {
      const decoded = decodeJWT(idToken);
      const groups = decoded["cognito:groups"] || [];

      // Redirect to appropriate portal based on group priority
      if (groups.includes("ADMIN")) {
        return <Navigate to="/admin" replace />;
      }
      if (groups.includes("CREATOR")) {
        return <Navigate to="/creator" replace />;
      }
      if (groups.includes("BESTIE")) {
        return <Navigate to="/bestie" replace />;
      }
      if (groups.includes("PRIME")) {
        return <Navigate to="/prime" replace />;
      }
      if (groups.includes("COLLAB")) {
        return <Navigate to="/collab" replace />;
      }
      if (groups.includes("FAN")) {
        return <Navigate to="/fan" replace />;
      }
    } catch (e) {
      console.error("[SignupPage] Error decoding token:", e);
    }
  }

  // Not authenticated - show signup page
  return children;
};
