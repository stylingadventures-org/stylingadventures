// site/src/routes/bestie/BestieLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { decodeJWT } from "../../lib/jwtDecoder.js";
import { fetchBestieStatus, isBestieActive } from "../../lib/bestie";
import LalaWidget from "../../components/LalaWidget";

function useIsAdminLike() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { idToken } = useAuth();

  useEffect(() => {
    if (idToken) {
      try {
        const decoded = decodeJWT(idToken);
        const groups = decoded["cognito:groups"] || [];
        const flag = groups.includes("ADMIN") || groups.includes("COLLAB");
        setIsAdmin(flag);
      } catch (e) {
        console.error("[BestieLayout] Error decoding token:", e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, [idToken]);

  return isAdmin;
}

/**
 * Layout + shell for all /bestie routes.
 * - Fetches Bestie membership once
 * - Redirects non-Besties to /fan/bestie
 * - Admins are allowed in even without membership
 * - Provides status to child routes via Outlet context
 * - Uses fan-style chrome (floating sidebar + main panel + mobile drawer)
 */
export default function BestieLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { idToken } = useAuth();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdmin = useIsAdminLike();
  
  // Check if user has BESTIE group in token (new direct auth flow)
  const [isBestieFromToken, setIsBestieFromToken] = useState(false);
  useEffect(() => {
    if (idToken) {
      try {
        const decoded = decodeJWT(idToken);
        const groups = decoded["cognito:groups"] || [];
        const isBestie = groups.includes("BESTIE");
        setIsBestieFromToken(isBestie);
      } catch (e) {
        console.error("[BestieLayout] Error decoding token:", e);
        setIsBestieFromToken(false);
      }
    } else {
      setIsBestieFromToken(false);
    }
  }, [idToken]);

  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  // Fetch membership on mount (but skip if already token-based bestie)
  useEffect(() => {
    let alive = true;

    // If user is already BESTIE from token, no need to fetch status
    if (isBestieFromToken || isAdmin) {
      if (alive) {
        setLoading(false);
      }
      return;
    }

    // Otherwise try to fetch bestie status for OAuth flow users
    (async () => {
      try {
        const s = await fetchBestieStatus();
        if (!alive) return;
        setStatus(s);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isBestieFromToken, isAdmin]);

  const activeBestie = isBestieActive(status);
  const allowed = isAdmin || activeBestie || isBestieFromToken;

  // Gate the /bestie section
  useEffect(() => {
    if (!loading && !allowed) {
      console.log("[BestieLayout] Not allowed, redirecting to /fan/bestie");
      navigate("/fan/bestie", { replace: true, state: { from: location } });
    }
  }, [loading, allowed, navigate, location]);

  const sidebarNav = [
    // CLOSET CENTER (PRIMARY FEATURE)
    {
      groupLabel: "Closet Center",
      groupKey: "closet-center",
      items: [
        {
          to: "/bestie/closet-inventory",
          label: "My Inventory",
          icon: "👕",
          description: "Log & organize your wardrobe",
        },
        {
          to: "/bestie/outfit-builder",
          label: "Outfit Builder",
          icon: "✨",
          description: "Mix & match, save looks",
        },
        {
          to: "/bestie/style-calendar",
          label: "Style Calendar",
          icon: "📅",
          description: "Plan outfits by date",
        },
        {
          to: "/bestie/analytics",
          label: "Analytics",
          icon: "📊",
          description: "Your style insights & stats",
        },
        {
          to: "/bestie/capsule",
          label: "Capsule Wardrobe",
          icon: "🎒",
          description: "Minimal curated collections",
        },
      ],
    },
    // SHOPPING & DISCOVERY
    {
      groupLabel: "Shop & Discover",
      groupKey: "shopping",
      items: [
        {
          to: "/bestie/shopping-cart",
          label: "Shopping Cart",
          icon: "🛍️",
          description: "AI-curated items for you",
        },
      ],
    },
    // LALA STYLING
    {
      groupLabel: "Lala Styling",
      groupKey: "lala",
      items: [
        {
          to: "/bestie/styling-studio",
          label: "Influence Lala",
          icon: "🎨",
          description: "Customize Lala's looks & moods",
        },
      ],
    },
    // COMMUNITY & PLAY
    {
      groupLabel: "Community & Play",
      groupKey: "community",
      items: [
        {
          to: "/bestie/community",
          label: "Bestie Circle",
          icon: "👥",
          description: "Connect & share with Besties",
        },
        {
          to: "/bestie/vote-and-play",
          label: "Vote & Play",
          icon: "🎮",
          description: "Shape Lala's story & earn coins",
        },
        {
          to: "/bestie/closet-upload",
          label: "Closet Upload",
          icon: "📸",
          description: "Share your fit & earn commissions",
        },
        {
          to: "/bestie/news",
          label: "Bestie News",
          icon: "📰",
          description: "Latest updates & community posts",
        },
        {
          to: "/bestie/content",
          label: "Bestie Content",
          icon: "🎬",
          description: "Create & share styling content",
        },
      ],
    },
    // REWARDS & INFO
    {
      groupLabel: "Growth & Info",
      groupKey: "info",
      items: [
        {
          to: "/bestie/rewards",
          label: "Rewards & Badges",
          icon: "🏆",
          description: "Track your achievements",
        },
        {
          to: "/bestie/prime-tea",
          label: "Prime Tea",
          icon: "☕",
          description: "Deep-dive articles & theories",
        },
        {
          to: "/bestie/perks",
          label: "Perks & Benefits",
          icon: "🎁",
          description: "Exclusive Bestie rewards",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="bestie-layout-page">
        <style>{styles}</style>
        <div className="bestie-main-panel">
          <div className="sa-card" style={{ padding: 16 }}>
            <div className="sa-card-title">Loading Bestie Studio…</div>
            <p className="sa-muted">
              Checking your Bestie membership and getting everything ready.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!allowed) {
    // Redirect happens in effect; this is just a tiny placeholder
    return (
      <div className="bestie-layout-page">
        <style>{styles}</style>
        <div className="bestie-main-panel">
          <div className="sa-card" style={{ padding: 16 }}>
            <div className="sa-card-title">Redirecting…</div>
            <p className="sa-muted">
              Bestie Studio is for active Besties. Taking you to the Bestie
              signup page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bestie-layout-page">
      <style>{styles}</style>


      {/* Mobile “Bestie pages” chip, like FanLayout header row */}
      <div className="bestie-header-row">
        <button
          type="button"
          className="bestie-pages-chip"
          onClick={() => setNavOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={navOpen ? "true" : "false"}
        >
          <span className="bestie-pages-label">
            BESTIE PAGES
            <span className="bestie-pages-dot" />
          </span>
        </button>
      </div>

      {/* Desktop shell: floating sidebar + main panel */}
      <div className="bestie-layout-shell">
        {/* Sidebar */}
        <aside className="bestie-sidebar" aria-label="Bestie navigation">
          <div className="bestie-sidebar-head">
            <img
              src="/lala-logo.png"
              alt="Styling Adventures"
              className="bestie-sidebar-logo"
            />
            <div>
              <div className="bestie-sidebar-brand-title">
                Styling Adventures
              </div>
              <div className="bestie-sidebar-brand-sub">Bestie Studio</div>
            </div>
          </div>

          <nav className="bestie-sidebar-nav">
            {sidebarNav.map((group) => (
              <div key={group.groupKey} className="bestie-sidebar-group">
                <div className="bestie-sidebar-group-label">{group.groupLabel}</div>
                <div className="bestie-sidebar-group-items">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        "bestie-sidebar-link" +
                        (isActive ? " bestie-sidebar-link--active" : "")
                      }
                      title={item.description}
                    >
                      <span className="bestie-sidebar-link-main">
                        <span className="bestie-sidebar-icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                      {item.description && (
                        <span className="bestie-sidebar-link-desc">
                          {item.description}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* LALA WIDGET */}
          <LalaWidget visualMode="bust" />
        </aside>

        {/* Main panel – NO global header/tabs; pages own their own chrome */}
        <section className="bestie-main-panel">
          <div className="section-body">
            {err && (
              <div className="sa-notice sa-notice--error">
                <strong>Heads up:</strong> {err}
              </div>
            )}

            <Outlet
              context={{
                bestieStatus: status,
                isBestie: activeBestie,
                isAdmin,
              }}
            />
          </div>
        </section>
      </div>

      {/* Mobile drawer for Bestie navigation */}
      {navOpen && (
        <>
          <button
            type="button"
            className="bestie-drawer-backdrop"
            onClick={closeNav}
            aria-label="Close bestie navigation backdrop"
          />
          <aside
            className="bestie-drawer"
            aria-label="Bestie navigation"
            role="dialog"
          >
            <div className="bestie-drawer__header">
              <div className="bestie-drawer__brand">
                <img
                  src="/lala-logo.png"
                  alt="Styling Adventures"
                  className="bestie-drawer-logo"
                />
                <div>
                  <div className="bestie-drawer__title">
                    Styling Adventures
                  </div>
                  <div className="bestie-drawer__subtitle">Bestie Studio</div>
                </div>
              </div>
              <button
                type="button"
                className="bestie-drawer__close"
                onClick={closeNav}
                aria-label="Close bestie navigation"
              >
                ✕
              </button>
            </div>

            <nav className="bestie-drawer__nav">
              {sidebarNav.map((group) => (
                <div key={group.groupKey} className="bestie-drawer-group">
                  <div className="bestie-drawer-group-label">{group.groupLabel}</div>
                  <div className="bestie-drawer-group-items">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          "bestie-drawer-link" +
                          (isActive ? " bestie-drawer-link--active" : "")
                        }
                        onClick={closeNav}
                        title={item.description}
                      >
                        <span className="bestie-drawer-link-main">
                          <span className="bestie-drawer-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        {item.description && (
                          <span className="bestie-drawer-link-desc">
                            {item.description}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}

const styles = `
.bestie-layout-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px 16px 32px;
  box-sizing: border-box;
}

/* Top row – mobile drawer trigger */
.bestie-header-row {
  display: flex;
  justify-content: flex-start;
  margin: 0 auto 12px;
  max-width: 1100px;
}

.bestie-pages-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(209,213,219,1);
  background: rgba(255,255,255,0.96);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #4b5563;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(15,23,42,0.12);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.04s ease;
}
.bestie-pages-chip:hover {
  background: #fdf2ff;
  border-color: #e5d5ff;
  box-shadow: 0 14px 40px rgba(79,70,229,0.24);
  transform: translateY(-1px);
}
.bestie-pages-chip:active {
  transform: translateY(0);
  box-shadow: 0 8px 22px rgba(148,163,184,0.4);
}

.bestie-pages-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bestie-pages-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 2px #ffffff;
}

/* Desktop shell – floating sidebar + main */
.bestie-layout-shell {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
  align-items: flex-start;
}

/* Sidebar card */
.bestie-sidebar {
  background: rgba(255,255,255,0.97);
  border-radius: 26px;
  padding: 16px 14px 18px;
  box-shadow: 0 20px 50px rgba(15,23,42,0.18);
  border: 1px solid rgba(226,232,240,0.95);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bestie-sidebar-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bestie-sidebar-logo {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.95),
    0 12px 30px rgba(79,70,229,0.35);
}

.bestie-sidebar-brand-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.bestie-sidebar-brand-sub {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9ca3af;
}

.bestie-sidebar-nav {
  margin-top: 4px;
  display: grid;
  gap: 12px;
}

.bestie-sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bestie-sidebar-group-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9ca3af;
  font-weight: 600;
  padding: 0 8px;
  margin-top: 4px;
}

.bestie-sidebar-group-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bestie-sidebar-link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.04s ease;
}
.bestie-sidebar-link-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.bestie-sidebar-icon {
  font-size: 18px;
}
.bestie-sidebar-link-desc {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
  line-height: 1.3;
}

.bestie-sidebar-link:hover {
  background: #ffffff;
  border-color: #d1d5db;
  box-shadow: 0 8px 24px rgba(148,163,184,0.2);
}
.bestie-sidebar-link:active {
  transform: translateY(1px);
}
.bestie-sidebar-link--active {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 12px 32px rgba(79,70,229,0.3);
}
.bestie-sidebar-link--active .bestie-sidebar-link-desc {
  color: rgba(255,255,255,0.7);
}

/* Main card */
.bestie-main-panel {
  background: rgba(255,255,255,0.98);
  border-radius: 28px;
  padding: 18px 18px 24px;
  box-shadow: 0 22px 55px rgba(15,23,42,0.11);
  box-sizing: border-box;
}

.section-body {
  margin-top: 0;
}

/* Notices + cards */
.sa-card {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  box-shadow:0 10px 26px rgba(15,23,42,0.06);
}
.sa-card-title {
  font-weight:600;
  margin-bottom:4px;
}
.sa-muted {
  font-size:0.9rem;
  color:#6b7280;
}

.sa-notice {
  padding:10px 12px;
  border-radius:10px;
  font-size:0.9rem;
  margin-bottom:10px;
}
.sa-notice--error {
  border:1px solid #fecaca;
  background:#fef2f2;
  color:#7f1d1d;
}

/* Mobile drawer */
.bestie-drawer-backdrop {
  position: fixed;
  inset: 72px 0 0 0;
  background: rgba(15,23,42,0.4);
  backdrop-filter: blur(3px);
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  z-index: 39;
}

.bestie-drawer {
  position: fixed;
  top: 72px;
  bottom: 0;
  left: 0;
  width: 320px;
  max-width: calc(100% - 40px);
  background:
    radial-gradient(circle at top left, #fdf2ff, #eef2ff 55%),
    radial-gradient(circle at bottom right, #e0f2fe, #ffffff 60%);
  border-radius: 0 24px 24px 0;
  box-shadow: 0 24px 70px rgba(15,23,42,0.55);
  border: 1px solid rgba(255,255,255,0.9);
  padding: 16px 16px 20px;
  box-sizing: border-box;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bestie-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bestie-drawer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bestie-drawer-logo {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.95),
    0 10px 26px rgba(79,70,229,0.35);
}

.bestie-drawer__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.bestie-drawer__subtitle {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9ca3af;
}

.bestie-drawer__close {
  border: none;
  background: rgba(255,255,255,0.9);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(15,23,42,0.25);
  transition: background 0.12s ease, transform 0.04s ease;
}
.bestie-drawer__close:hover {
  background: #e5e7eb;
}
.bestie-drawer__close:active {
  transform: translateY(1px);
}

.bestie-drawer__nav {
  margin-top: 4px;
  display: grid;
  gap: 12px;
}

.bestie-drawer-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bestie-drawer-group-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9ca3af;
  font-weight: 600;
  padding: 0 8px;
  margin-top: 4px;
}

.bestie-drawer-group-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bestie-drawer-link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: rgba(248,250,252,0.95);
  color: #111827;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.04s ease;
}
.bestie-drawer-link-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.bestie-drawer-icon {
  font-size: 18px;
}
.bestie-drawer-link-desc {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
  line-height: 1.3;
}

.bestie-drawer-link:hover {
  background: #ffffff;
  border-color: #d1d5db;
  box-shadow: 0 8px 24px rgba(148,163,184,0.2);
}
.bestie-drawer-link:active {
  transform: translateY(1px);
}
.bestie-drawer-link--active {
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 12px 32px rgba(79,70,229,0.3);
}
.bestie-drawer-link--active .bestie-drawer-link-desc {
  color: rgba(255,255,255,0.7);
}

/* Responsive tweaks */
@media (min-width: 900px) {
  .bestie-header-row {
    display: none;
  }
}

@media (max-width: 899px) {
  .bestie-layout-shell {
    display: block;
  }
  .bestie-sidebar {
    display: none;
  }
  .bestie-main-panel {
    border-radius: 24px;
    padding: 16px 14px 22px;
  }
}

@media (max-width: 720px) {
  .bestie-layout-page {
    padding-inline: 12px;
  }
  .bestie-drawer {
    width: 100%;
    max-width: 100%;
    border-radius: 0 0 24px 24px;
  }
  .bestie-drawer-backdrop {
    inset: 56px 0 0 0;
  }
}
`;
