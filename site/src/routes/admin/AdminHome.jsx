// site/src/routes/admin/AdminHome.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <div className="admin-home">
      <style>{styles}</style>

      {/* Hero / command center */}
      <section className="admin-hero">
        <div className="admin-hero__content">
          <div>
            <p className="admin-hero__eyebrow">Admin cockpit</p>
            <h1 className="admin-hero__title">Welcome to Lala&apos;s control room</h1>
            <p className="admin-hero__subtitle">
              Upload new closet stories, review the fan queue, and tune Bestie perks.
              Everything you do here shapes what fans experience on the other side.
            </p>

            <div className="admin-hero__actions">
              <Link to="/admin/closet-upload" className="btn btn-primary">
                + Upload closet item
              </Link>
              <Link to="/admin/closet" className="btn btn-ghost">
                Review closet queue
              </Link>
            </div>
          </div>

          <div className="admin-hero__snapshot">
            <div className="admin-chip">Today&apos;s snapshot</div>
            <div className="admin-kpi-row">
              <div className="admin-kpi">
                <span className="admin-kpi__label">Closet items (pending)</span>
                <span className="admin-kpi__value">—</span>
                <span className="admin-kpi__hint">Hook to queue stats later</span>
              </div>
              <div className="admin-kpi">
                <span className="admin-kpi__label">New Besties</span>
                <span className="admin-kpi__value">—</span>
                <span className="admin-kpi__hint">Connect to billing / auth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main tiles */}
      <section className="admin-grid">
        {/* Closet management */}
        <article className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Lala&apos;s Closet</h2>
            <span className="admin-tag admin-tag--primary">Core flow</span>
          </div>
          <p className="admin-card__body">
            Upload new closet items, curate which looks are fan-facing, and keep the
            feed feeling fresh and on-theme.
          </p>

          <div className="admin-card__actions">
            <Link to="/admin/closet-upload" className="btn btn-primary btn-sm">
              Upload closet item
            </Link>
            <Link to="/admin/closet" className="btn btn-ghost btn-sm">
              Open review queue
            </Link>
          </div>
        </article>

        {/* Bestie tools */}
        <article className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Bestie tools</h2>
            <span className="admin-tag">Inner circle</span>
          </div>
          <p className="admin-card__body">
            Configure Bestie-only perks, special episodes, and closet uploads so your
            most loyal fans feel seen and spoiled.
          </p>

          <div className="admin-card__actions">
            <Link to="/admin/bestie" className="btn btn-ghost btn-sm">
              Open Bestie tools
            </Link>
          </div>
        </article>

        {/* Users */}
        <article className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Users & roles</h2>
            <span className="admin-tag admin-tag--soft">Safety net</span>
          </div>
          <p className="admin-card__body">
            View accounts, check Bestie status, and keep an eye on who has creator or
            admin-level access.
          </p>

          <div className="admin-card__actions">
            <Link to="/admin/users" className="btn btn-ghost btn-sm">
              Manage users
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

const styles = `
.admin-home {
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* HERO */
.admin-hero {
  border-radius:24px;
  padding:18px 18px 20px;
  background:
    radial-gradient(circle at top left, rgba(236,252,203,0.9), rgba(255,255,255,0.95)),
    radial-gradient(circle at bottom right, rgba(191,219,254,0.9), rgba(255,255,255,0.95));
  border:1px solid rgba(226,232,240,0.9);
  box-shadow:0 18px 40px rgba(148,163,184,0.4);
}

.admin-hero__content {
  display:grid;
  grid-template-columns:minmax(0, 2.5fr) minmax(0, 2fr);
  gap:18px;
  align-items:flex-start;
}
@media (max-width: 900px) {
  .admin-hero__content {
    grid-template-columns:minmax(0,1fr);
  }
}

.admin-hero__eyebrow {
  margin:0;
  font-size:0.78rem;
  text-transform:uppercase;
  letter-spacing:0.16em;
  color:#6b21a8;
}

.admin-hero__title {
  margin:6px 0 4px;
  font-size:1.7rem;
  letter-spacing:-0.03em;
  color:#111827;
}

.admin-hero__subtitle {
  margin:0;
  font-size:0.95rem;
  color:#374151;
  max-width:520px;
}

.admin-hero__actions {
  margin-top:12px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

/* snapshot card */
.admin-hero__snapshot {
  background:rgba(255,255,255,0.96);
  border-radius:20px;
  padding:12px 14px 14px;
  border:1px solid rgba(209,213,219,0.9);
  box-shadow:0 12px 30px rgba(148,163,184,0.45);
}

.admin-chip {
  display:inline-flex;
  align-items:center;
  padding:4px 10px;
  border-radius:999px;
  background:#eff6ff;
  color:#1d4ed8;
  font-size:0.7rem;
  text-transform:uppercase;
  letter-spacing:0.14em;
}

.admin-kpi-row {
  margin-top:8px;
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
  gap:10px;
}

.admin-kpi {
  padding:6px 8px;
  border-radius:12px;
  background:#f9fafb;
  border:1px dashed #e5e7eb;
}
.admin-kpi__label {
  display:block;
  font-size:0.75rem;
  color:#6b7280;
}
.admin-kpi__value {
  display:block;
  font-size:1.1rem;
  font-weight:700;
  color:#111827;
}
.admin-kpi__hint {
  display:block;
  font-size:0.7rem;
  color:#9ca3af;
}

/* GRID OF CARDS */
.admin-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
  gap:16px;
}

.admin-card {
  background:#ffffff;
  border-radius:18px;
  border:1px solid #e5e7eb;
  padding:16px 18px 16px;
  box-shadow:0 10px 26px rgba(148,163,184,0.25);
  display:flex;
  flex-direction:column;
  gap:8px;
}

.admin-card__header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

.admin-card__title {
  margin:0;
  font-size:1rem;
  font-weight:600;
}

.admin-tag {
  font-size:0.7rem;
  border-radius:999px;
  padding:4px 8px;
  background:#f3f4f6;
  color:#4b5563;
  white-space:nowrap;
}
.admin-tag--primary {
  background:#eef2ff;
  color:#4338ca;
}
.admin-tag--soft {
  background:#fef9c3;
  color:#92400e;
}

.admin-card__body {
  margin:0;
  font-size:0.9rem;
  color:#4b5563;
}

.admin-card__actions {
  margin-top:6px;
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

/* BUTTONS – match your global vibe */
.btn {
  appearance:none;
  border:1px solid #e5e7eb;
  background:#ffffff;
  color:#111827;
  border-radius:999px;
  padding:9px 16px;
  cursor:pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight:500;
}
.btn-sm {
  padding:8px 14px;
  font-size:0.85rem;
}
.btn:hover {
  background:#f5f3ff;
  border-color:#e0e7ff;
  box-shadow:0 6px 16px rgba(129,140,248,0.35);
}
.btn:active {
  transform:translateY(1px);
}

.btn-primary {
  background:linear-gradient(135deg,#6366f1,#ec4899);
  border-color:#6366f1;
  color:#ffffff;
  box-shadow:0 8px 18px rgba(236,72,153,0.45);
}
.btn-primary:hover {
  background:linear-gradient(135deg,#4f46e5,#db2777);
  border-color:#4f46e5;
}
.btn-ghost {
  background:#ffffff;
  color:#374151;
}
`;
