// site/src/routes/prime/PrimeNav.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function PrimeNav() {
  const navSections = [
    {
      groupLabel: "Studio Home",
      items: [
        { label: "Studio Hub", path: "/prime" },
      ],
    },
    {
      groupLabel: "Story & Content",
      items: [
        { label: "Story & Content Studio", path: "/prime/story-studio" },
        { label: "Story Profile", path: "/prime/story-profile" },
        { label: "Eras & Seasons", path: "/prime/eras-seasons" },
        { label: "Shows & Series", path: "/prime/shows-series" },
        { label: "Planner & Calendar", path: "/prime/planner" },
      ],
    },
    {
      groupLabel: "Manage & Publish",
      items: [
        { label: "Episodes", path: "/prime/episodes" },
        { label: "Production", path: "/prime/production" },
        { label: "Schedule", path: "/prime/schedule" },
      ],
    },
    {
      groupLabel: "Community",
      items: [
        { label: "Magazine", path: "/prime/magazine" },
        { label: "Exclusive Content", path: "/prime/content" },
        { label: "Community Spotlight", path: "/prime/spotlight" },
        { label: "Creator Hub", path: "/prime/creators" },
      ],
    },
    {
      groupLabel: "About",
      items: [
        { label: "About Prime Studios", path: "/prime/about" },
      ],
    },
  ];

  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>✨ Prime Studios</h2>
      <div style={styles.sections}>
        {navSections.map((section) => (
          <div key={section.groupLabel} style={styles.section}>
            <div style={styles.sectionLabel}>{section.groupLabel}</div>
            <ul style={styles.list}>
              {section.items.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} style={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    width: "280px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "#fff",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    overflowY: "auto",
    maxHeight: "100vh",
  },
  title: {
    margin: "0 0 24px 0",
    fontSize: "20px",
    fontWeight: "600",
  },
  sections: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    opacity: 0.8,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    display: "block",
    transition: "background-color 0.2s",
    fontSize: "14px",
  },
};
