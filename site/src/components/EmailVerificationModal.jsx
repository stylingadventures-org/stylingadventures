import React, { useState } from "react";
import { confirmSignUp, resendConfirmationCode } from "../lib/emailVerification";
import toast from "react-hot-toast";

export const EmailVerificationModal = ({ email, onVerified, onCancel }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await confirmSignUp(email, code);
      if (result.success) {
        toast.success(result.message);
        onVerified?.();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendLoading(true);
    
    try {
      const result = await resendConfirmationCode(email);
      if (result.success) {
        toast.success(result.message);
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
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
      zIndex: 10000,
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px", textAlign: "center" }}>
          Verify Your Email
        </h2>
        
        <p style={{ marginBottom: "20px", color: "#666", fontSize: "14px", textAlign: "center" }}>
          We sent a verification code to <strong>{email}</strong>. 
          Enter it below to complete your sign up.
        </p>

        {error && (
          <div style={{
            backgroundColor: "#fee",
            border: "1px solid #f99",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "16px",
            color: "#c33",
            fontSize: "13px",
          }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
              placeholder="e.g., 123456"
              maxLength="6"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "4px",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "auto",
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              padding: "12px",
              backgroundColor: loading || code.length !== 6 ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: loading || code.length !== 6 ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <span style={{ fontSize: "13px", color: "#666" }}>
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{
                  background: "none",
                  border: "none",
                  color: resendLoading ? "#ccc" : "#ec4899",
                  fontSize: "13px",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                {resendLoading ? "Sending..." : "Resend"}
              </button>
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
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
        </form>
      </div>
    </div>
  );
};
