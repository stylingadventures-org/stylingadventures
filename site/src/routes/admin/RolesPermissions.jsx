// site/src/routes/admin/RolesPermissions.jsx
import React, { useState } from "react";

export default function RolesPermissions() {
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", color: "#dc2626", permissions: 24 },
    { id: 2, name: "Creator", color: "#2563eb", permissions: 16 },
    { id: 3, name: "Moderator", color: "#7c3aed", permissions: 8 },
    { id: 4, name: "Editor", color: "#059669", permissions: 6 },
  ]);

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9f5f0",
      minHeight: "100vh",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    subtitle: { fontSize: "14px", color: "#666" },
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "20px",
      border: "1px solid #e5ddd0",
    },
    sectionLabel: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "16px",
      letterSpacing: "0.5px",
    },
    roleTable: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#666",
      borderBottom: "1px solid #e5ddd0",
      textTransform: "uppercase",
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #f0e8e0",
      fontSize: "14px",
    },
    roleBadge: (color) => ({
      display: "inline-block",
      padding: "6px 12px",
      backgroundColor: color + "20",
      color: color,
      borderRadius: "6px",
      fontWeight: "600",
      fontSize: "13px",
    }),
    permissionGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "12px",
      marginTop: "16px",
    },
    permissionItem: {
      padding: "12px",
      backgroundColor: "#faf8f5",
      borderRadius: "6px",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    checkbox: {
      cursor: "pointer",
    },
    button: {
      padding: "12px 24px",
      backgroundColor: "#d4a574",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      marginRight: "12px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 Roles & Permissions</h1>
        <p style={styles.subtitle}>Manage admin roles and feature access</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Admin Roles</div>
        <table style={styles.roleTable}>
          <thead>
            <tr>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Permissions</th>
              <th style={styles.th}>Users</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td style={styles.td}>
                  <span style={styles.roleBadge(role.color)}>{role.name}</span>
                </td>
                <td style={styles.td}>{role.permissions} permissions</td>
                <td style={styles.td}>{role.name === "Admin" ? "3" : role.name === "Creator" ? "24" : "2"}</td>
                <td style={styles.td}>
                  <button style={{...styles.button, backgroundColor: role.color, padding: "8px 12px", fontSize: "12px"}}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Admin Permissions</div>
        <div style={styles.permissionGrid}>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            View Analytics
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Manage Users
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Edit Content
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Access Billing
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Manage Roles
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            AI Management
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Moderation
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Create Backups
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Creator Role Permissions</div>
        <div style={styles.permissionGrid}>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Access AI Studio
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            View Analytics
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Schedule Content
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Upload Assets
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} />
            Manage Users
          </label>
          <label style={styles.permissionItem}>
            <input type="checkbox" style={styles.checkbox} />
            Access Billing
          </label>
        </div>
      </div>

      <div style={styles.card}>
        <button style={styles.button}>Save Changes</button>
        <button style={{...styles.button, backgroundColor: "#999"}}>Cancel</button>
      </div>
    </div>
  );
}
