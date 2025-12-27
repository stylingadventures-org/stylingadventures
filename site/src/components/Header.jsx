import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import logo from "../assets/logo.png";
import "../styles/header.css";

export default function Header() {
  const { userContext, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const isBestie = !!(
    isAuthenticated &&
    (userContext?.isBestie || userContext?.isPrime || userContext?.tier === "BESTIE")
  );

  const isAdmin = !!(
    isAuthenticated &&
    (userContext?.isAdmin || userContext?.role === "ADMIN")
  );

  const isCreator = !!(
    isAuthenticated &&
    (userContext?.isCreator || userContext?.role === "CREATOR")
  );

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openLogin = () => navigate('/login');

  const requireAuthOrLogin = (to) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    navigate(to);
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Top navigation items with proper routing
  const navItems = useMemo(() => {
    return [
      { label: "Home", to: "/", gated: false },
      { label: "Socialbee", to: "/discover", gated: false },
      { label: "Fan", to: "/fan/home", gated: false },
      // Bestie is gated (login) — also optionally "premium"
      { label: "Bestie", to: "/bestie/home", gated: true, premium: true },
      // Admin is gated (login) — may be role-restricted
      { label: "Admin", to: "/admin", gated: true, adminOnly: true },
    ];
  }, []);

  const onNavClick = (item) => {
    // If Admin-only, allow click if authenticated; if you want hard-block, do it here:
    if (item.adminOnly && isAuthenticated && !isAdmin) {
      // Soft behavior: take them to /admin anyway if your router handles it,
      // or redirect to /fan with a toast elsewhere.
      navigate("/fan");
      return;
    }

    if (item.gated) requireAuthOrLogin(item.to);
    else navigate(item.to);
  };

  const displayName =
    userContext?.profile?.displayName ||
    userContext?.profile?.name ||
    userContext?.email ||
    "Account";

  const tierLabel = isBestie ? "BESTIE" : "FAN";

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          {/* Logo */}
          <button
            type="button"
            className="header-logo"
            onClick={() => navigate("/")}
            aria-label="Go to homepage"
          >
            <img src={logo} alt="Styling Adventures" className="logo-image" />
            <div className="logo-text">
              <div className="logo-title">Styling Adventures</div>
              <div className="logo-subtitle">Where Style Becomes an Adventure</div>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="header-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const locked =
                (!isAuthenticated && item.gated) ||
                (item.premium && isAuthenticated && !isBestie) ||
                (item.adminOnly && isAuthenticated && !isAdmin);

              return (
                <button
                  key={item.to}
                  type="button"
                  className={`nav-link ${isActive(item.to) ? "active" : ""}`}
                  onClick={() => onNavClick(item)}
                >
                  <span className="nav-link__label">{item.label}</span>
                  {locked && (
                    <span className="nav-lock" title="Restricted">
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="header-auth">
            {/* Mobile menu button */}
            <button
              type="button"
              className="icon-btn mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>

            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-chip"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Open account menu"
                  aria-expanded={userMenuOpen}
                >
                  <span className={`tier-pill ${tierLabel.toLowerCase()}`}>
                    {tierLabel}
                  </span>
                  <span className="user-name">{displayName}</span>
                  <span className="caret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown" role="menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => navigate("/profile")}
                    >
                      👤 Profile
                    </button>

                    {isCreator && (
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => navigate("/creator-settings")}
                      >
                        ⚙️ Creator Settings
                      </button>
                    )}

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => navigate("/settings")}
                    >
                      ⚙️ Account Settings
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => navigate("/admin")}
                      >
                        🛠 Admin
                      </button>
                    )}

                    <div className="dropdown-sep" />

                    <button
                      type="button"
                      className="dropdown-item danger"
                      onClick={logout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn-login"
                onClick={openLogin}
                data-login-button
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="mobile-nav" role="dialog" aria-label="Mobile menu">
            <div className="mobile-nav-inner">
              {navItems.map((item) => {
                const locked =
                  (!isAuthenticated && item.gated) ||
                  (item.premium && isAuthenticated && !isBestie) ||
                  (item.adminOnly && isAuthenticated && !isAdmin);

                return (
                  <button
                    key={item.to}
                    type="button"
                    className={`mobile-link ${isActive(item.to) ? "active" : ""}`}
                    onClick={() => onNavClick(item)}
                  >
                    <span>{item.label}</span>
                    {locked && <span className="nav-lock">🔒</span>}
                  </button>
                );
              })}

              {!isAuthenticated && (
                <button
                  type="button"
                  className="btn-login mobile-login"
                  onClick={openLogin}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
