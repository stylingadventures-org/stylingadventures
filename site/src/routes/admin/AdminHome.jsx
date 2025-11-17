// site/src/routes/admin/AdminHome.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <div className="sa-card">
      <h2 style={{ marginTop: 0 }}>Admin overview</h2>
      <p className="sa-muted" style={{ marginTop: 4 }}>
        Use these tools to manage Lala&apos;s world — upload closet items,
        review the queue, and manage Bestie perks.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <section className="sa-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Lala&apos;s Closet</h3>
          <p className="sa-muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Upload new closet items and curate what fans can see, vote on, and
            style into looks.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/admin/closet-upload" className="sa-btn">
              Upload closet item
            </Link>
            <Link
              to="/admin/closet"
              className="sa-btn sa-btn--ghost"
            >
              Review closet queue
            </Link>
          </div>
        </section>

        <section className="sa-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Bestie tools</h3>
          <p className="sa-muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Configure Bestie content, perks, and drops for the inner circle.
          </p>
          <Link to="/admin/bestie" className="sa-btn sa-btn--ghost">
            Open Bestie tools
          </Link>
        </section>

        <section className="sa-card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Users</h3>
          <p className="sa-muted" style={{ marginTop: 0, marginBottom: 12 }}>
            View and manage users, roles, and Bestie upgrades.
          </p>
          <Link to="/admin/users" className="sa-btn sa-btn--ghost">
            Manage users
          </Link>
        </section>
      </div>
    </div>
  );
}
