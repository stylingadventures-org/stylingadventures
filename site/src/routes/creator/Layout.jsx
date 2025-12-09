// site/src/routes/creator/Layout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const NAV_SECTIONS = [
  {
    groupLabel: "Creator Home",
    groupKey: "home",
    items: [
      {
        to: "/creator",
        label: "Creator Home",
        end: true,
        description: "What to do next, at a glance.",
      },
    ],
  },

  {
    groupLabel: "Create · Director Suite",
    groupKey: "create",
    items: [
      {
        to: "/creator/create/director-suite",
        label: "Director Suite",
        description: "Plan shoots, scenes, and production days.",
      },
      {
        to: "/creator/create/scene-packs",
        label: "Scene Packs",
        description: "Reusable shot recipes & content templates.",
      },
      {
        to: "/creator/create/niche-directors",
        label: "Niche Directors",
        description: "Hair, nails, makeup, fashion, lifestyle.",
      },
      {
        to: "/creator/create/on-set-assistant",
        label: "On-Set Assistant",
        description: "Live checklist and prompts while filming.",
      },
    ],
  },

  {
    groupLabel: "Align · Lala Goal Compass",
    groupKey: "align",
    items: [
      {
        to: "/creator/align/goal-compass",
        label: "Lala Goal Compass",
        description: "Set goals and keep every post on-path.",
      },
    ],
  },

  {
    groupLabel: "Improve · Content & Aesthetic",
    groupKey: "improve",
    items: [
      {
        to: "/creator/improve/business-content-fixer",
        label: "Business Content Fixer",
        description: "Hooks, CTAs, structure, and messaging.",
      },
      {
        to: "/creator/improve/aesthetic-brand-studio",
        label: "Aesthetic & Brand Studio",
        description: "Aesthetic health score and brand identity.",
      },
    ],
  },

  {
    groupLabel: "Grow · Social Pulse & OS",
    groupKey: "grow",
    items: [
      {
        to: "/creator/grow/social-pulse",
        label: "Creator Social Pulse",
        description: "Trend briefings and niche-specific ideas.",
      },
      {
        to: "/creator/grow/social-os",
        label: "Creator Social OS",
        description: "Scheduling, engagement, and analytics.",
      },
    ],
  },

  {
    groupLabel: "Story & Content Studio",
    groupKey: "story",
    items: [
      {
        to: "/creator/story/profile",
        label: "Story Profile",
        description: "Who you are, audience, and transformation.",
      },
      {
        to: "/creator/story/eras-seasons",
        label: "Eras & Seasons",
        description: "Define the current era and goals.",
      },
      {
        to: "/creator/story/shows-series",
        label: "Shows & Series",
        description: "Recurring series and episode structure.",
      },
      {
        to: "/creator/story/planner-calendar",
        label: "Planner & Calendar",
        description: "Full content calendar and posting plan.",
      },
    ],
  },

  {
    groupLabel: "Monetization HQ",
    groupKey: "monetization",
    items: [
      {
        to: "/creator/monetization/overview",
        label: "Revenue Overview",
        description: "Earnings across all channels.",
      },
      {
        to: "/creator/monetization/social",
        label: "Social Monetization",
        description: "TikTok, YouTube, IG payouts & bonuses.",
      },
      {
        to: "/creator/monetization/brand-deals",
        label: "Brand Deals & Sponsorships",
        description: "Pipeline, rates, contracts, deadlines.",
      },
      {
        to: "/creator/monetization/product-sales",
        label: "Product Sales",
        description: "Shopify, Etsy, Gumroad, Stan Store, etc.",
      },
      {
        to: "/creator/monetization/affiliate",
        label: "Lala Affiliate (Future)",
        description: "Lala-based programs & conversions.",
      },
    ],
  },

  {
    groupLabel: "Asset Library",
    groupKey: "assets",
    items: [
      {
        to: "/creator/library",
        label: "Asset Library",
        description: "Cabinets, folders, uploads, and media.",
      },
    ],
  },
];

export default function CreatorLayout() {
  return (
    <div className="creator-shell">
      <style>{styles}</style>

      <div className="creator-layout">
        {/* Sidebar */}
        <aside className="creator-sidebar">
          <div className="creator-sidebar-header">
            <div className="creator-sidebar-pill">Creator HQ</div>
            <div className="creator-sidebar-title">Pro Studio</div>
            <div className="creator-sidebar-sub">
              Plan, film, improve, and monetize — all in one place.
            </div>
          </div>

          <nav className="creator-side-nav" aria-label="Creator navigation">
            {NAV_SECTIONS.map((section) => (
              <div key={section.groupKey} className="creator-side-section">
                <div className="creator-side-section-label">
                  {section.groupLabel}
                </div>
                <div className="creator-side-section-items">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        "creator-side-link" +
                        (isActive ? " creator-side-link--active" : "")
                      }
                    >
                      <div className="creator-side-link-main">
                        <span className="creator-side-link-label">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="creator-side-link-desc">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content column */}
        <main className="creator-main-column">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = `
.creator-shell {
  max-width: 1200px;
  margin: 24px auto 40px;
  padding: 18px 18px 26px;
  border-radius: 24px;
  background: linear-gradient(180deg, #F9FAFB 0%, #E5E7EB 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

/* Layout: sidebar + main column */
.creator-layout {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

/* Sidebar ------------------------------------------------- */

.creator-sidebar {
  width: 260px;
  background: #F7F8FA;
  border-radius: 18px;
  border: 1px solid #E5E7EB;
  padding: 16px 14px;
  box-shadow: 2px 0 12px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.creator-sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.creator-sidebar-pill {
  align-self: flex-start;
  padding: 3px 9px;
  border-radius: 999px;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
}

.creator-sidebar-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.creator-sidebar-sub {
  font-size: 0.8rem;
  color: #6B7280;
}

/* Nav groups */

.creator-side-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.creator-side-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.creator-side-section-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9CA3AF;
  padding: 2px 2px;
}

.creator-side-section-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.creator-side-link {
  border-radius: 12px;
  padding: 7px 8px;
  font-size: 0.86rem;
  color: #4B5563;
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease;
}

.creator-side-link:hover {
  background: #E5E7EB;
  color: #111827;
  transform: translateY(-1px);
}

.creator-side-link--active {
  background: #E0ECFF;
  color: #1D4ED8;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
}

.creator-side-link-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.creator-side-link-label {
  font-size: 0.86rem;
}

.creator-side-link-desc {
  font-size: 0.7rem;
  color: #6B7280;
}

/* Main column --------------------------------------------- */

.creator-main-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Prevent content from being glued to top edge */
.creator-main-column > *:first-child {
  margin-top: 4px;
}

/* Shared page styles for all Creator pages ---------------- */

.creator-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.creator-page__header {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid #E5E7EB;
  background: radial-gradient(circle at top left, #EEF2FF, #F9FAFB);
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.3);
}

.creator-page__kicker {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9CA3AF;
  font-weight: 600;
}

.creator-page__title {
  margin: 4px 0 2px;
  font-size: 1.4rem;
  letter-spacing: -0.02em;
  color: #111827;
}

.creator-page__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #4B5563;
}

.creator-page__header-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.78rem;
  color: #6B7280;
}

.creator-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Generic pill / chip */
.creator-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  color: #4B5563;
}

/* Page body + cards */

.creator-page__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.creator-page__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.creator-page__col {
  flex: 1;
  min-width: 220px;
}

.creator-page__card {
  border-radius: 16px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  padding: 12px 14px;
  box-shadow: 0 8px 20px rgba(148, 163, 184, 0.25);
}

.creator-page__card-title {
  margin: 0 0 4px;
  font-size: 0.98rem;
  font-weight: 600;
}

.creator-page__card-subtitle {
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: #6B7280;
}

.creator-page__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

/* Simple badge */
.creator-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  background: #ECFEFF;
  color: #0369A1;
  border: 1px solid #BAE6FD;
}

/* Simple input styling */
.creator-input,
.creator-textarea,
.creator-select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid #D1D5DB;
  padding: 7px 9px;
  font-size: 0.88rem;
  background: #F9FAFB;
}

.creator-input:focus,
.creator-textarea:focus,
.creator-select:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.2);
}

.creator-textarea {
  min-height: 70px;
  resize: vertical;
}

/* Tiny label */
.creator-field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9CA3AF;
  margin-bottom: 3px;
}

/* Inline button style to reuse inside creator pages */
.creator-btn {
  appearance: none;
  border-radius: 999px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  color: #111827;
  padding: 7px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.05s ease,
    border-color 0.15s ease;
}

.creator-btn:hover {
  background: #F5F3FF;
  border-color: #E0E7FF;
  box-shadow: 0 6px 14px rgba(129, 140, 248, 0.3);
}

.creator-btn:active {
  transform: translateY(1px);
}

.creator-btn--primary {
  background: linear-gradient(135deg, #6366F1, #EC4899);
  border-color: #6366F1;
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.5);
}

.creator-btn--ghost {
  background: #FFFFFF;
  color: #374151;
}

/* Responsive ---------------------------------------------- */

@media (max-width: 900px) {
  .creator-layout {
    flex-direction: column;
  }

  .creator-sidebar {
    width: 100%;
  }

  .creator-page__row {
    flex-direction: column;
  }
}
`;
