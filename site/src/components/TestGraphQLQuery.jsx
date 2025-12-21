import React, { useState } from "react";
import { useLazyQuery, gql } from "@apollo/client";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Simple query to test myCloset
const MY_CLOSET_QUERY = gql`
  query myClosetItems {
    myCloset {
      items {
        id
        title
        category
        createdAt
      }
      nextToken
    }
  }
`;

export const TestGraphQLQuery = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [getCloset, { data, loading, error }] = useLazyQuery(MY_CLOSET_QUERY);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success("Logged in successfully!");
      setUsername("");
      setPassword("");
    } catch (err) {
      toast.error(`Login failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
    } catch (err) {
      toast.error(`Logout failed: ${err.message}`);
    }
  };

  const handleQueryCloset = async () => {
    try {
      const result = await getCloset();
      toast.success("Query successful!");
    } catch (err) {
      toast.error(`Query failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 GraphQL + Cognito Test</h1>

      {!isAuthenticated ? (
        <form onSubmit={handleLogin} style={{ marginBottom: "20px" }}>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ display: "block", marginBottom: "10px", padding: "8px" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: "10px", padding: "8px" }}
          />
          <button type="submit" style={{ padding: "8px 16px" }}>
            Login
          </button>
        </form>
      ) : (
        <>
          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Logged in as:</strong> {user?.username}
            </p>
            <button
              onClick={handleLogout}
              style={{ padding: "8px 16px", backgroundColor: "#f44336", color: "white" }}
            >
              Logout
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h2>Test GraphQL Query</h2>
            <button
              onClick={handleQueryCloset}
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#4CAF50",
                color: "white",
              }}
            >
              {loading ? "Loading..." : "Query myCloset"}
            </button>
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: "20px" }}>
              <strong>Error:</strong> {error.message}
            </div>
          )}

          {data && (
            <div style={{ marginBottom: "20px", backgroundColor: "#f5f5f5", padding: "10px" }}>
              <h3>Response:</h3>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};
