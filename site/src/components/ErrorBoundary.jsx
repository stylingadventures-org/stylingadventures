import React from "react";

/**
 * ErrorBoundary - Gracefully handles errors in auth, token decoding, GraphQL, etc.
 * Displays user-friendly error message instead of white screen of death
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #fde7f4, #e0f2fe)",
        }}>
          <div style={{
            maxWidth: "500px",
            padding: "40px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          }}>
            <h1 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>
              Oops! Something went wrong
            </h1>
            <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: "14px" }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && (
              <details style={{ 
                textAlign: "left", 
                margin: "20px 0", 
                padding: "12px",
                background: "#f3f4f6",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#6b7280",
              }}>
                <summary style={{ cursor: "pointer", fontWeight: "600" }}>
                  Error details (dev only)
                </summary>
                <pre style={{
                  margin: "8px 0 0 0",
                  overflow: "auto",
                  maxHeight: "200px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                background: "#ec4899",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
