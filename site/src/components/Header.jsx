// site/src/components/Header.jsx
import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import CoinCounter from "./CoinCounter";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const nav = useNavigate();

  const handleSignIn = () => {
    window.dispatchEvent(new CustomEvent('openLoginModal'));
  };

  const handleSignOut = async () => {
    await logout();
    nav("/", { replace: true });
  };

  return (
    <nav className="topbar relative">
      <style>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
        }
        .auth-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-email {
          font-size: 13px;
          color: #4b5563;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-logout {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-logout:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .btn-signin {
          padding: 6px 14px;
          border-radius: 6px;
          border: none;
          background: #ec4899;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-signin:hover {
          background: #db2777;
        }
      `}</style>
      
      {isAuthenticated && user?.email ? (
        <div className="auth-status">
          <span className="user-email">✓ Signed in as {user.email}</span>
          <button className="btn-logout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <button className="btn-signin" onClick={handleSignIn}>
          Sign in
        </button>
      )}
    </nav>
  );
}

