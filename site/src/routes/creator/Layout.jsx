// site/src/routes/creator/Layout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { decodeJWT } from "../../lib/jwtDecoder.js";
import LalaWidget from "../../components/LalaWidget";

// Creator sidebar modeled after FanLayout:
// - desktop: sidebar + main panel
// - mobile: "CREATOR PAGES" chip opens a drawer

const NAV_SECTIONS = [
  // CREATOR HQ
  {
    groupLabel: "Creator HQ",
    groupKey: "hq",
    items: [
      {
        to: "/creator",
        label: "Creator Home",
        icon: "🏠",
        end: true,
        description: "What to do next, at a glance.",
      },
    ],
  },

  // CREATE
  {
    groupLabel: "Create",
    groupKey: "create",
    items: [
      {
        to: "/creator/create/director-suite",
        label: "Director Suite",
        icon: "🎬",
        description: "Plan shoots, scenes, and production days.",
      },
      {
        to: "/creator/create/scene-packs",
        label: "Scene Packs",
        icon: "📦",
        description: "Reusable shot recipes & content templates.",
      },
      // Optional: keep if/when routes exist
      {
        to: "/creator/create/niche-directors",
        label: "Niche Directors",
        icon: "💅",
        description: "Hair, nails, makeup, fashion, lifestyle.",
      },
      {
        to: "/creator/create/on-set-assistant",
        label: "On-Set Assistant",
        icon: "🎙️",
        description: "Live checklist and filming prompts.",
      },

      // If you want to keep these here for now:
      {
        to: "/creator/ai-content-studio",
        label: "AI Content Studio",
        icon: "✨",
        description: "Generate posts, emails, scripts, ideas.",
      },
    ],
  },

  // BRAND & IP (replaces "Story")
  {
    groupLabel: "Brand & IP",
    groupKey: "brand",
    items: [
      {
        to: "/creator/brand-profile",
        label: "Brand Profile",
        icon: "🧠",
        description: "Your voice, pillars, audience, offers.",
      },
      // These are new labels that match business-owner language.
      // Swap routes if you already have different ones.
      {
        to: "/creator/brand/eras-seasons",
        label: "Eras & Seasons",
        icon: "🌿",
        description: "Define your current era and goals.",
      },
      {
        to: "/creator/brand/shows-series",
        label: "Shows & Series",
        icon: "📺",
        description: "Recurring series and episode structure.",
      },
      {
        to: "/creator/content-strategy",
        label: "Content Strategy",
        icon: "🧭",
        description: "Themes, campaigns, and annual roadmap.",
      },
    ],
  },

  // ALIGN (brand direction + goals)
  {
    groupLabel: "Align",
    groupKey: "align",
    items: [
      {
        to: "/creator/align/goal-compass",
        label: "Goal Compass",
        icon: "🎯",
        description: "Set goals and keep every post on-path.",
      },
      {
        to: "/creator/align/aesthetic-studio",
        label: "Aesthetic & Brand Studio",
        icon: "🎨",
        description: "Aesthetic health score and brand identity.",
      },
    ],
  },

  // IMPROVE
  {
    groupLabel: "Improve",
    groupKey: "improve",
    items: [
      {
        to: "/creator/optimization",
        label: "Business Content Fixer",
        icon: "🛠️",
        description: "Hooks, CTAs, structure, and messaging.",
      },
      {
        to: "/creator/grow/social-pulse",
        label: "Social Pulse",
        icon: "📈",
        description: "Trend briefings and niche insights.",
      },
      // Keep analytics/growth here if you want “Improve” to include measurement
      {
        to: "/creator/analytics",
        label: "Analytics",
        icon: "📊",
        description: "Real-time performance metrics.",
      },
    ],
  },

  // PLAN
  {
    groupLabel: "Plan",
    groupKey: "plan",
    items: [
      {
        to: "/creator/scheduling",
        label: "Planner & Calendar",
        icon: "🗓️",
        description: "Full content calendar and posting plan.",
      },
    ],
  },

  // MONETIZE
  {
    groupLabel: "Monetize",
    groupKey: "monetize",
    items: [
      {
        to: "/creator/monetization/overview",
        label: "Revenue Overview",
        icon: "💰",
        description: "Earnings across all channels.",
      },
      {
        to: "/creator/monetization/brand-deals",
        label: "Brand Deals",
        icon: "🤝",
        description: "Pipeline, rates, contracts.",
      },
      {
        to: "/creator/monetization/product-sales",
        label: "Product Sales",
        icon: "🛍️",
        description: "Shopify, Etsy, Stan Store.",
      },
      {
        to: "/creator/funnel-automation",
        label: "Automations",
        icon: "⚡",
        description: "Lead magnets, sequences, flows.",
      },
      {
        to: "/creator/upgrade",
        label: "Upgrade Plans",
        icon: "⬆️",
        description: "Creator tiers and pricing.",
      },
    ],
  },

  // LIBRARY + SETTINGS (keep it light)
  {
    groupLabel: "Library & Settings",
    groupKey: "manage",
    items: [
      {
        to: "/creator/library",
        label: "Asset Library",
        icon: "🗂️",
        description: "Cabinets, folders, uploads, media.",
      },
      {
        to: "/creator/settings",
        label: "Account Settings",
        icon: "⚙️",
        description: "Profile, privacy, integrations.",
      },
    ],
  },
];

export default function CreatorLayout() {
  const navigate = useNavigate();
  const { idToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

  // Check if user has CREATOR group in token
  useEffect(() => {
    if (idToken) {
      try {
        const decoded = decodeJWT(idToken);
        const groups = decoded["cognito:groups"] || [];
        const hasCreatorAccess = groups.includes("CREATOR") || groups.includes("ADMIN");
        setIsCreator(hasCreatorAccess);
        setLoading(false);
      } catch (e) {
        console.error("[CreatorLayout] Error decoding token:", e);
        setIsCreator(false);
        setLoading(false);
      }
    } else {
      setIsCreator(false);
      setLoading(false);
    }
  }, [idToken]);

  // Gate the /creator section - redirect non-creators to /fan
  useEffect(() => {
    if (!loading && !isCreator) {
      console.log("[CreatorLayout] Not authorized, redirecting to /fan");
      navigate("/fan", { replace: true });
    }
  }, [loading, isCreator, navigate]);

  // Optional: keep drawer from staying open after route changes (simple)
  useEffect(() => {
    if (!isCreator) setNavOpen(false);
  }, [isCreator]);

  const sidebarNav = useMemo(() => {
    return (
      <nav className="creator-sidebar-nav" aria-label="Creator navigation">
        {NAV_SECTIONS.map((group) => (
          <div key={group.groupKey} className="creator-sidebar-group">
            <div className="creator-sidebar-group-label">{group.groupLabel}</div>
            <div className="creator-sidebar-group-items">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    "creator-sidebar-link" + (isActive ? " creator-sidebar-link--active" : "")
                  }
                  title={item.description}
                  onClick={closeNav}
                >
                  <span className="creator-sidebar-link-main">
                    <span className="creator-sidebar-icon" aria-hidden="true">
                      {item.icon || "•"}
                    </span>
                    <span>{item.label}</span>
                  </span>

                  {item.description && (
                    <span className="creator-sidebar-link-desc">{item.description}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  }, []);

  if (loading) {
    return (
      <div className="creator-layout-page">
        <style>{styles}</style>
        <div className="creator-layout-shell">
          <section className="creator-main-panel">
            <div className="sa-card-title">Loading Creator Studio…</div>
            <p className="sa-muted">Getting everything ready for you.</p>
          </section>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="creator-layout-page">
        <style>{styles}</style>
        <div className="creator-layout-shell">
          <section className="creator-main-panel">
            <div className="sa-card-title">Creator Access Required</div>
            <p className="sa-muted">This section is for creators only. Taking you back…</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-layout-page">
      <style>{styles}</style>

      {/* Mobile-only “Creator Pages” chip to open the drawer */}
      <div className="creator-header-row">
        <button
          type="button"
          className="creator-pages-chip"
          onClick={() => setNavOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={navOpen ? "true" : "false"}
        >
          <span className="creator-pages-label">CREATOR PAGES</span>
        </button>
      </div>

      {/* Desktop shell: sidebar + main */}
      <div className="creator-layout-shell">
        <aside className="creator-sidebar" aria-label="Creator navigation">
          <div className="creator-sidebar-head">
            <img
              src="/lala-logo.png"
              alt="Lala logo"
              className="creator-sidebar-logo"
            />
            <div>
              <div className="creator-sidebar-brand-title">Styling Adventures</div>
              <div className="creator-sidebar-brand-sub">Creator Studio</div>
            </div>
          </div>

          {sidebarNav}

          {/* LALA WIDGET - Creator/business mode */}
          <LalaWidget visualMode="portrait" />
        </aside>

        <section className="creator-main-panel">
          <Outlet />
        </section>
      </div>

      {/* Mobile drawer overlay */}
      {navOpen && (
        <>
          <button
            type="button"
            className="creator-drawer-backdrop"
            onClick={closeNav}
            aria-label="Close creator navigation backdrop"
          />
          <aside className="creator-drawer" aria-label="Creator navigation" role="dialog">
            <div className="creator-drawer__header">
              <div className="creator-drawer__brand">
                <img
                  src="/lala-logo.png"
                  alt="Lala logo"
                  className="creator-drawer-logo"
                />
                <div>
                  <div className="creator-drawer__title">Styling Adventures</div>
                  <div className="creator-drawer__subtitle">Creator Studio</div>
                </div>
              </div>
              <button
                type="button"
                className="creator-drawer__close"
                onClick={closeNav}
                aria-label="Close creator navigation"
              >
                ✕
              </button>
            </div>

            <div className="creator-drawer__nav">{sidebarNav}</div>
          </aside>
        </>
      )}
    </div>
  );
}

const styles = `
  :root {
    /* Keep it close to Fan look but slightly more “studio” neutral */
    --creator-primary-soft: #eef2ff;
    --creator-bg: #f1f5ff;
    --creator-accent: #7f9bff;
    --creator-secondary: #a855f7;
    --creator-primary: #4f46e5;
  }

  .creator-layout-page {
    min-height: calc(100vh - 64px);
    background:
      radial-gradient(circle at top left, var(--creator-primary-soft), var(--creator-bg)),
      linear-gradient(120deg, #eef2ff 0%, #f3e8ff 40%, #e2e7ff 100%);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 24px 16px 32px;
  }

  /* Mobile row – drawer trigger */
  .creator-header-row {
    display: flex;
    justify-content: flex-start;
    margin: 0 auto 12px;
    width: 100%;
    max-width: 1100px;
  }

  .creator-pages-chip {
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
  .creator-pages-chip:hover {
    background: #f5f3ff;
    border-color: #e0e7ff;
    box-shadow: 0 14px 40px rgba(79,70,229,0.18);
    transform: translateY(-1px);
  }
  .creator-pages-chip:active {
    transform: translateY(0);
    box-shadow: 0 8px 22px rgba(148,163,184,0.4);
  }

  .creator-layout-shell {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 20px;
    align-items: flex-start;
  }

  /* Sidebar */
  .creator-sidebar {
    background: rgba(255,255,255,0.97);
    border-radius: 26px;
    padding: 16px 14px 18px;
    box-shadow: 0 20px 50px rgba(15,23,42,0.18);
    border: 1px solid rgba(226,232,240,0.95);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .creator-sidebar-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .creator-sidebar-logo {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    object-fit: cover;
    box-shadow:
      0 0 0 2px rgba(255,255,255,0.95),
      0 12px 30px rgba(79,70,229,0.25);
  }

  .creator-sidebar-brand-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }
  .creator-sidebar-brand-sub {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #9ca3af;
  }

  .creator-sidebar-nav {
    margin-top: 4px;
    display: grid;
    gap: 12px;
  }

  .creator-sidebar-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .creator-sidebar-group-label {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #9ca3af;
    font-weight: 600;
    padding: 0 8px;
    margin-top: 4px;
  }

  .creator-sidebar-group-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .creator-sidebar-link {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #e5e7ff;
    background: #f8fafc;
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

  .creator-sidebar-link-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .creator-sidebar-icon {
    font-size: 18px;
  }

  .creator-sidebar-link-desc {
    font-size: 11px;
    color: #9ca3af;
    font-weight: 400;
    line-height: 1.3;
  }

  .creator-sidebar-link:hover {
    background: #ffffff;
    border-color: #c7d2fe;
    box-shadow: 0 8px 24px rgba(148,163,184,0.2);
  }

  .creator-sidebar-link:active {
    transform: translateY(1px);
  }

  .creator-sidebar-link--active {
    background: linear-gradient(135deg, var(--creator-primary), var(--creator-secondary));
    color: #f9fafb;
    border-color: transparent;
    box-shadow: 0 12px 32px rgba(79,70,229,0.22);
  }
  .creator-sidebar-link--active .creator-sidebar-link-desc {
    color: rgba(255,255,255,0.72);
  }

  /* Main */
  .creator-main-panel {
    background: rgba(255,255,255,0.98);
    border-radius: 28px;
    padding: 28px 28px 30px;
    box-shadow: 0 22px 55px rgba(15,23,42,0.11);
    box-sizing: border-box;
  }

  /* ===== Drawer (mobile) ===== */
  .creator-drawer-backdrop {
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

  .creator-drawer {
    position: fixed;
    top: 72px;
    bottom: 0;
    left: 0;
    width: 320px;
    max-width: calc(100% - 40px);
    background:
      radial-gradient(circle at top left, var(--creator-primary-soft), #ffffff 55%),
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

  .creator-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .creator-drawer__brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .creator-drawer-logo {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    object-fit: cover;
    box-shadow:
      0 0 0 2px rgba(255,255,255,0.95),
      0 10px 26px rgba(79,70,229,0.25);
  }

  .creator-drawer__title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }
  .creator-drawer__subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #9ca3af;
  }

  .creator-drawer__close {
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
  .creator-drawer__close:hover {
    background: #e5e7eb;
  }
  .creator-drawer__close:active {
    transform: translateY(1px);
  }

  .creator-drawer__nav {
    margin-top: 4px;
  }

  /* ===== Responsive ===== */
  @media (min-width: 900px) {
    .creator-header-row {
      display: none;
    }
  }

  @media (max-width: 899px) {
    .creator-layout-shell {
      display: block;
    }
    .creator-sidebar {
      display: none;
    }
    .creator-main-panel {
      border-radius: 24px;
      padding: 20px 16px 22px;
    }
  }

  @media (max-width: 720px) {
    .creator-layout-page {
      padding-inline: 12px;
    }
    .creator-drawer {
      width: 100%;
      max-width: 100%;
      border-radius: 0 0 24px 24px;
      left: 0;
      right: 0;
    }
    .creator-drawer-backdrop {
      inset: 56px 0 0 0;
    }
  }
`;
