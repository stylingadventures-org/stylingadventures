// site/src/routes/collab/CollabNav.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CollabNav() {
  const navItems = [
    { label: "Dashboard", path: "/collab" },
    { label: "Creator Tools", path: "/collab/tools" },
    { label: "Campaigns", path: "/collab/campaigns" },
  ];

  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>Collaborator</h2>
      <ul style={styles.list}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link to={item.path} style={styles.link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const styles = {
  nav: {
    width: "240px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    margin: "0 0 24px 0",
    fontSize: "20px",
    fontWeight: "600",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    display: "block",
    transition: "background-color 0.2s",
  },
};
