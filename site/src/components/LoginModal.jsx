import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "../lib/appSyncConfig";
import { decodeJWT } from "../lib/jwtDecoder";
import { isEmailConfirmationError } from "../lib/emailVerification";
import { EmailVerificationModal } from "./EmailVerificationModal";
import toast from "react-hot-toast";

const cognitoClient = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

// Spinner component
const LoadingSpinner = ({ size = "20px" }) => (
  <div style={{
    display: "inline-block",
    width: size,
    height: size,
    border: "2px solid #f0f0f0",
    borderTop: "2px solid #4CAF50",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  }} />
);

export const LoginModal = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const { login, error: authError, authAction, idToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      const loginResult = await login(email, password);
      console.log("[LoginModal] Login successful, result:", loginResult);
      toast.success("✓ Logged in successfully!");
      
      // Close modal - user stays on current page (Home or wherever they are)
      // They can now click "Go to my section" button if they want
      console.log("[LoginModal] Login successful, closing modal");
      onClose?.();
    } catch (err) {
      console.error("[LoginModal] Login error:", err);
      // Check if user needs to verify email
      if (isEmailConfirmationError(err)) {
        setShowEmailVerification(true);
        toast.info("Please verify your email to complete sign up");
      } else {
        const errorMsg = err?.message || "Login failed. Please try again.";
        setLocalError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setResetLoading(true);
    try {
      const command = new ForgotPasswordCommand({
        ClientId: cognitoConfig.userPoolWebClientId,
        Username: email,
      });
      await cognitoClient.send(command);
      toast.success("✓ Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
    } catch (err) {
      const errorMsg = err?.message || "Failed to send reset email.";
      setLocalError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      {showEmailVerification && (
        <EmailVerificationModal 
          email={email}
          onVerified={() => {
            setShowEmailVerification(false);
            toast.success("✓ Email verified! Please log in again.");
            setEmail("");
            setPassword("");
          }}
          onCancel={() => setShowEmailVerification(false)}
        />
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "24px", textAlign: "center" }}>
          {showForgotPassword ? "Reset Password" : "Sign In"}
        </h2>
        
        {/* Error message */}
        {(localError || authError) && (
          <div style={{
            backgroundColor: "#fee",
            border: "1px solid #f99",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px",
            color: "#c33",
            fontSize: "13px",
            lineHeight: "1.4",
          }}>
            ⚠ {localError || authError}
          </div>
        )}
        
        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="test@example.com"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "auto",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                placeholder="TestPass123!"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "auto",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px",
                backgroundColor: loading ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading && <LoadingSpinner size="16px" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={loading}
              style={{
                padding: "12px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: loading ? "#ccc" : "#ec4899",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#666", margin: "0 0 12px 0" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetLoading}
                required
                placeholder="test@example.com"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  opacity: resetLoading ? 0.6 : 1,
                  cursor: resetLoading ? "not-allowed" : "auto",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              style={{
                padding: "12px",
                backgroundColor: resetLoading ? "#ccc" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: resetLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {resetLoading && <LoadingSpinner size="16px" />}
              {resetLoading ? "Sending..." : "Send Reset Email"}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              disabled={resetLoading}
              style={{
                padding: "12px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: resetLoading ? "not-allowed" : "pointer",
                opacity: resetLoading ? 0.6 : 1,
              }}
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
