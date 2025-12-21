// site/src/routes/admin/UserManagement.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

// Sample user data
const SAMPLE_USERS = [
  {
    id: "user-001",
    name: "Sarah Chen",
    email: "sarah@email.com",
    role: "CREATOR",
    status: "active",
    joinDate: "2025-01-15",
    followers: 12400,
    revenue: "$3,240",
    flags: 0,
    actions: ["creator-approval-pending"]
  },
  {
    id: "user-002",
    name: "Marcus Williams",
    email: "marcus@email.com",
    role: "BESTIE",
    status: "active",
    joinDate: "2025-02-03",
    followers: 0,
    revenue: "—",
    flags: 0,
    actions: []
  },
  {
    id: "user-003",
    name: "Emma Rosetti",
    email: "emma@email.com",
    role: "CREATOR",
    status: "active",
    joinDate: "2024-12-10",
    followers: 8900,
    revenue: "$2,105",
    flags: 1,
    actions: ["content-warning"]
  },
  {
    id: "user-004",
    name: "James Park",
    email: "james@email.com",
    role: "FAN",
    status: "active",
    joinDate: "2025-01-20",
    followers: 0,
    revenue: "—",
    flags: 0,
    actions: []
  },
  {
    id: "user-005",
    name: "Zara Ahmed",
    email: "zara@email.com",
    role: "COLLAB",
    status: "pending-approval",
    joinDate: "2025-03-18",
    followers: 0,
    revenue: "—",
    flags: 0,
    actions: ["partnership-approval-pending"]
  },
  {
    id: "user-006",
    name: "David Lim",
    email: "david@email.com",
    role: "BESTIE",
    status: "suspended",
    joinDate: "2025-01-05",
    followers: 0,
    revenue: "—",
    flags: 3,
    actions: ["banned"]
  },
  {
    id: "user-007",
    name: "Nina Kovacs",
    email: "nina@email.com",
    role: "CREATOR",
    status: "active",
    joinDate: "2025-02-14",
    followers: 5600,
    revenue: "$890",
    flags: 0,
    actions: ["creator-onboarding"]
  },
  {
    id: "user-008",
    name: "Alex Torres",
    email: "alex@email.com",
    role: "FAN",
    status: "active",
    joinDate: "2025-03-01",
    followers: 0,
    revenue: "—",
    flags: 0,
    actions: []
  },
];

const ROLE_CONFIG = {
  FAN: { label: "Fan", color: "#ec4899", emoji: "🌈" },
  BESTIE: { label: "Bestie", color: "#ec4899", emoji: "💖" },
  CREATOR: { label: "Creator", color: "#f59e0b", emoji: "✨" },
  COLLAB: { label: "Collaborator", color: "#8b5cf6", emoji: "🤝" },
  ADMIN: { label: "Admin", color: "#3b82f6", emoji: "⚙️" },
  PRIME: { label: "Prime", color: "#fbbf24", emoji: "👑" }
};

export default function AdminUserManagement() {
  const [view, setView] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [expandedUser, setExpandedUser] = useState(null);

  // Filter users
  let filteredUsers = SAMPLE_USERS;
  
  if (selectedRole !== "all") {
    filteredUsers = filteredUsers.filter(u => u.role === selectedRole);
  }
  
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get stats
  const totalUsers = SAMPLE_USERS.length;
  const creatorCount = SAMPLE_USERS.filter(u => u.role === "CREATOR").length;
  const activeCreators = SAMPLE_USERS.filter(u => u.role === "CREATOR" && u.status === "active").length;
  const besties = SAMPLE_USERS.filter(u => u.role === "BESTIE").length;
  const flagged = SAMPLE_USERS.filter(u => u.flags > 0).length;
  const pendingApprovals = SAMPLE_USERS.filter(u => u.status === "pending-approval").length;

  return (
    <div className="admin-user-mgmt">
      <style>{styles}</style>

      {/* HERO */}
      <section className="aum-hero card">
        <div className="aum-hero-main">
          <div>
            <p className="aum-pill">👥 USER MANAGEMENT</p>
            <h1 className="aum-title">User Directory & Admin Controls</h1>
            <p className="aum-sub">
              Manage all platform users, assign roles, approve creator applications, handle flags and bans, 
              and track user activity. One place to control the community.
            </p>
          </div>
          <div className="aum-hero-right">
            <div className="aum-hero-card">
              <p className="aum-hero-label">Total Users</p>
              <p className="aum-hero-value">{totalUsers}</p>
              <div className="aum-hero-breakdown">
                <div className="aum-breakdown-item">
                  <span className="aum-breakdown-icon">✨</span>
                  <span>{creatorCount} Creators</span>
                </div>
                <div className="aum-breakdown-item">
                  <span className="aum-breakdown-icon">💖</span>
                  <span>{besties} Besties</span>
                </div>
                <div className="aum-breakdown-item">
                  <span className="aum-breakdown-icon">⚠️</span>
                  <span>{flagged} Flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="aum-stats-grid">
          <div className="aum-stat-card">
            <p className="aum-stat-label">Pending Approvals</p>
            <p className="aum-stat-value">{pendingApprovals}</p>
            <p className="aum-stat-action">Review</p>
          </div>
          <div className="aum-stat-card">
            <p className="aum-stat-label">Active Creators</p>
            <p className="aum-stat-value">{activeCreators}/{creatorCount}</p>
            <p className="aum-stat-action">Onboard</p>
          </div>
          <div className="aum-stat-card">
            <p className="aum-stat-label">Flagged Users</p>
            <p className="aum-stat-value">{flagged}</p>
            <p className="aum-stat-action">Review</p>
          </div>
        </div>
      </section>

      {/* CONTROLS */}
      <div className="aum-controls">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="aum-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="aum-role-filter">
          <button
            className={`aum-filter-btn ${selectedRole === "all" ? "active" : ""}`}
            onClick={() => setSelectedRole("all")}
          >
            All Roles
          </button>
          {Object.entries(ROLE_CONFIG).map(([roleId, config]) => (
            <button
              key={roleId}
              className={`aum-filter-btn ${selectedRole === roleId ? "active" : ""}`}
              onClick={() => setSelectedRole(roleId)}
              style={{ borderColor: config.color }}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* USER LIST */}
      <div className="aum-users-container">
        {filteredUsers.map(user => {
          const isExpanded = expandedUser === user.id;
          const roleConfig = ROLE_CONFIG[user.role];
          
          return (
            <div
              key={user.id}
              className={`aum-user-card card ${user.status} ${isExpanded ? "expanded" : ""}`}
              onClick={() => setExpandedUser(isExpanded ? null : user.id)}
            >
              <div className="aum-user-header">
                <div className="aum-user-avatar">
                  <div className="aum-avatar-initial">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="aum-user-info">
                  <h3 className="aum-user-name">{user.name}</h3>
                  <p className="aum-user-email">{user.email}</p>
                </div>
                <div className="aum-user-role">
                  <span 
                    className="aum-role-badge"
                    style={{ background: roleConfig.color + "20", color: roleConfig.color }}
                  >
                    {roleConfig.emoji} {roleConfig.label}
                  </span>
                </div>
                <div className="aum-user-status">
                  <span className={`aum-status-badge ${user.status}`}>
                    {user.status === "pending-approval" && "⏳ Pending"}
                    {user.status === "active" && "✓ Active"}
                    {user.status === "suspended" && "🚫 Suspended"}
                  </span>
                  {user.flags > 0 && (
                    <span className="aum-flags-badge">🚩 {user.flags}</span>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="aum-user-details">
                  <div className="aum-details-grid">
                    <div className="aum-detail-row">
                      <span className="aum-detail-label">Joined</span>
                      <span className="aum-detail-value">{user.joinDate}</span>
                    </div>
                    <div className="aum-detail-row">
                      <span className="aum-detail-label">Followers</span>
                      <span className="aum-detail-value">{user.followers.toLocaleString()}</span>
                    </div>
                    <div className="aum-detail-row">
                      <span className="aum-detail-label">Revenue</span>
                      <span className="aum-detail-value">{user.revenue}</span>
                    </div>
                    <div className="aum-detail-row">
                      <span className="aum-detail-label">User ID</span>
                      <span className="aum-detail-value">{user.id}</span>
                    </div>
                  </div>

                  {user.actions.length > 0 && (
                    <div className="aum-pending-actions">
                      <p className="aum-actions-label">Pending Actions:</p>
                      {user.actions.map((action, i) => (
                        <div key={i} className="aum-action-item">
                          {action === "creator-approval-pending" && "📋 Creator Application Pending"}
                          {action === "content-warning" && "⚠️ Content Warning Active"}
                          {action === "partnership-approval-pending" && "🤝 Partnership Approval Pending"}
                          {action === "creator-onboarding" && "🎯 In Creator Onboarding"}
                          {action === "banned" && "🚫 Permanently Banned"}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="aum-actions">
                    <button className="btn btn-secondary">Edit Role</button>
                    <button className="btn btn-secondary">View Activity</button>
                    {user.status !== "suspended" && user.flags > 0 && (
                      <button className="btn btn-danger">Review Flags</button>
                    )}
                    {user.status === "pending-approval" && (
                      <>
                        <button className="btn btn-primary">Approve</button>
                        <button className="btn btn-ghost">Deny</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BATCH ACTIONS */}
      <section className="aum-batch-actions card">
        <h2 className="aum-card-title">Admin Actions</h2>
        <div className="aum-action-grid">
          <div className="aum-action-box">
            <h3 className="aum-action-box-title">📋 Creator Applications</h3>
            <p className="aum-action-box-sub">Review and approve pending creator applications</p>
            <button className="btn btn-primary">Review ({pendingApprovals})</button>
          </div>
          <div className="aum-action-box">
            <h3 className="aum-action-box-title">🚩 Flagged Content</h3>
            <p className="aum-action-box-sub">Review user flags and content violations</p>
            <button className="btn btn-primary">Moderate ({flagged})</button>
          </div>
          <div className="aum-action-box">
            <h3 className="aum-action-box-title">📊 User Analytics</h3>
            <p className="aum-action-box-sub">View user growth, retention, and engagement metrics</p>
            <button className="btn btn-secondary">View Analytics</button>
          </div>
          <div className="aum-action-box">
            <h3 className="aum-action-box-title">🔔 Send Announcements</h3>
            <p className="aum-action-box-sub">Broadcast messages to user cohorts</p>
            <button className="btn btn-secondary">Compose</button>
          </div>
        </div>
      </section>

      {/* Affirm */}
      <section className="aum-affirm card">
        <div className="aum-affirm-text">
          <p className="aum-affirm-label">Platform Control Center</p>
          <p className="aum-affirm-main">You're the guardian of this community.</p>
          <p className="aum-affirm-sub">
            {totalUsers} users, {creatorCount} creators, {flagged} needing attention. 
            Keep the platform safe, fair, and thriving for everyone. 💚
          </p>
        </div>
        <div className="aum-affirm-actions">
          <Link to="/admin" className="btn btn-primary">
            Back to Admin Hub
          </Link>
        </div>
      </section>
    </div>
  );
}

const styles = `
.admin-user-mgmt {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Shared card shell */
.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.aum-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(191, 219, 254, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(196, 181, 253, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.aum-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .aum-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.aum-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #1e40af;
  border: 1px solid rgba(191, 219, 254, 0.9);
}

.aum-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.aum-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

/* Hero right card */
.aum-hero-right {
  display: flex;
  justify-content: flex-end;
}

.aum-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
  max-width: 320px;
}

.aum-hero-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.aum-hero-value {
  margin: 4px 0 8px;
  font-weight: 700;
  font-size: 1.8rem;
  color: #111827;
}

.aum-hero-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.aum-breakdown-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.8rem;
  color: #374151;
}

.aum-breakdown-icon {
  font-size: 0.9rem;
}

/* Stats grid */
.aum-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.aum-stat-card {
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(229, 231, 235, 0.6);
}

.aum-stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
  margin-bottom: 4px;
}

.aum-stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.aum-stat-action {
  font-size: 0.7rem;
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  margin: 0;
}

/* CONTROLS */
.aum-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aum-search {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  font-size: 0.95rem;
  color: #111827;
  width: 100%;
}

.aum-search::placeholder {
  color: #9ca3af;
}

.aum-role-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.aum-filter-btn {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.aum-filter-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.aum-filter-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

/* USER LIST */
.aum-users-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aum-user-card {
  padding: 14px 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.aum-user-card:hover {
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.aum-user-card.suspended {
  opacity: 0.6;
}

.aum-user-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.aum-user-avatar {
  flex-shrink: 0;
}

.aum-avatar-initial {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.aum-user-info {
  flex: 1;
  min-width: 0;
}

.aum-user-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.aum-user-email {
  margin: 2px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.aum-user-role {
  flex-shrink: 0;
}

.aum-role-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.aum-user-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.aum-status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.aum-status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.aum-status-badge.pending-approval {
  background: #fef3c7;
  color: #b45309;
}

.aum-status-badge.suspended {
  background: #fee2e2;
  color: #991b1b;
}

.aum-flags-badge {
  padding: 2px 6px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* User details */
.aum-user-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.aum-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.aum-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.9rem;
}

.aum-detail-label {
  color: #6b7280;
  font-weight: 500;
}

.aum-detail-value {
  color: #111827;
  font-weight: 600;
}

.aum-pending-actions {
  margin-bottom: 12px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
}

.aum-actions-label {
  margin: 0 0 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.aum-action-item {
  margin: 4px 0;
  font-size: 0.85rem;
  color: #1e40af;
}

.aum-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* BATCH ACTIONS */
.aum-batch-actions {
  padding: 16px;
}

.aum-card-title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.aum-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.aum-action-box {
  padding: 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
}

.aum-action-box-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.aum-action-box-sub {
  margin: 0 0 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* AFFIRM */
.aum-affirm {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top left, rgba(254, 242, 242, 0.9), #ffffff);
}

.aum-affirm-text {
  flex: 1 1 260px;
  min-width: 0;
}

.aum-affirm-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.aum-affirm-main {
  margin: 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.aum-affirm-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  max-width: 520px;
}

.aum-affirm-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 768px) {
  .aum-affirm-actions {
    align-items: flex-end;
    justify-content: center;
  }
}

/* BUTTONS */
.btn {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
  transition:
    transform 40ms ease,
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #f5f3ff;
  border-color: #e0e7ff;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-color: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-danger {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.btn-danger:hover {
  background: #fecaca;
  border-color: #f87171;
}

.btn-ghost {
  background: #ffffff;
  color: #374151;
}
`;
