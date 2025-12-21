import React, { useState } from "react";

const SAMPLE_CAPSULES = [
  {
    id: 1,
    name: "Work Essentials",
    description: "Professional looks for 5 business days",
    items: 14,
    image: "💼",
    outfits: 12,
    saved: true,
  },
  {
    id: 2,
    name: "Weekend Casual",
    description: "Relaxed styles for everyday activities",
    items: 8,
    image: "😊",
    outfits: 8,
    saved: true,
  },
  {
    id: 3,
    name: "Summer Travel",
    description: "Minimal packing for 7-day trips",
    items: 12,
    image: "✈️",
    outfits: 15,
    saved: false,
  },
];

export default function CapsuleWardrobe() {
  const [capsules, setCapsules] = useState(SAMPLE_CAPSULES);
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleSave = (id) => {
    setCapsules(
      capsules.map((c) =>
        c.id === id ? { ...c, saved: !c.saved } : c
      )
    );
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>🎒 CAPSULE WARDROBE</p>
          <h1 style={styles.title}>Build Your Capsules</h1>
          <p style={styles.subtitle}>
            Create minimal, versatile wardrobes for different lifestyles & trips
          </p>
        </div>
      </section>

      {/* CAPSULES GRID */}
      <div style={styles.grid}>
        {capsules.map((capsule) => (
          <div key={capsule.id} style={styles.capsuleCard}>
            <div style={styles.capsuleHeader}>
              <span style={styles.capsuleIcon}>{capsule.image}</span>
              <button
                onClick={() => handleSave(capsule.id)}
                style={{
                  ...styles.saveBtn,
                  ...(capsule.saved ? styles.saveBtnActive : {}),
                }}
              >
                {capsule.saved ? "💾" : "☆"}
              </button>
            </div>
            <h3 style={styles.capsuleName}>{capsule.name}</h3>
            <p style={styles.capsuleDesc}>{capsule.description}</p>
            <div style={styles.capsuleStats}>
              <div>
                <p style={styles.statLabel}>Items</p>
                <p style={styles.statValue}>{capsule.items}</p>
              </div>
              <div>
                <p style={styles.statLabel}>Outfits</p>
                <p style={styles.statValue}>{capsule.outfits}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCapsule(capsule)}
              style={styles.viewBtn}
            >
              View Details
            </button>
          </div>
        ))}

        {/* CREATE NEW */}
        <div style={styles.createCard}>
          <p style={styles.createIcon}>+</p>
          <p style={styles.createText}>Create New Capsule</p>
          <button
            onClick={() => setShowBuilder(true)}
            style={styles.createBtn}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* TIPS */}
      <section style={styles.tipsSection}>
        <h2 style={styles.tipsTitle}>💡 Capsule Wardrobe Tips</h2>
        <div style={styles.tipsGrid}>
          <div style={styles.tipCard}>
            <p style={styles.tipNumber}>1</p>
            <p style={styles.tipHeading}>Color Coordinate</p>
            <p style={styles.tipText}>
              Stick to 2-3 neutral base colors + 1-2 accent colors for maximum
              outfit combos
            </p>
          </div>
          <div style={styles.tipCard}>
            <p style={styles.tipNumber}>2</p>
            <p style={styles.tipHeading}>Versatility Matters</p>
            <p style={styles.tipText}>
              Choose pieces that work across multiple occasions. A blazer can go
              from office to dinner
            </p>
          </div>
          <div style={styles.tipCard}>
            <p style={styles.tipNumber}>3</p>
            <p style={styles.tipHeading}>Quality Over Quantity</p>
            <p style={styles.tipText}>
              Invest in fewer, better pieces. A $100 item worn 50× costs $2/wear
            </p>
          </div>
          <div style={styles.tipCard}>
            <p style={styles.tipNumber}>4</p>
            <p style={styles.tipHeading}>Plan Logistics</p>
            <p style={styles.tipText}>
              For travel, ensure every item mixes with every other item. Pack
              bottoms + 2-3 tops
            </p>
          </div>
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selectedCapsule && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setSelectedCapsule(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
            <h2 style={styles.modalTitle}>{selectedCapsule.name}</h2>
            <p style={styles.modalDesc}>{selectedCapsule.description}</p>

            <div style={styles.modalStats}>
              <div style={styles.modalStat}>
                <p style={styles.modalStatLabel}>Items</p>
                <p style={styles.modalStatValue}>{selectedCapsule.items}</p>
              </div>
              <div style={styles.modalStat}>
                <p style={styles.modalStatLabel}>Outfit Combos</p>
                <p style={styles.modalStatValue}>{selectedCapsule.outfits}</p>
              </div>
              <div style={styles.modalStat}>
                <p style={styles.modalStatLabel}>Coverage</p>
                <p style={styles.modalStatValue}>100%</p>
              </div>
            </div>

            <h3 style={styles.itemsHeading}>Recommended Items</h3>
            <div style={styles.itemsGrid}>
              {selectedCapsule.id === 1 && (
                <>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👔</p>
                    <p style={styles.itemName}>Navy Blazer</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👖</p>
                    <p style={styles.itemName}>Black Trousers</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>⚪</p>
                    <p style={styles.itemName}>White Blouse</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👠</p>
                    <p style={styles.itemName}>Black Heels</p>
                  </div>
                </>
              )}
              {selectedCapsule.id === 2 && (
                <>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👕</p>
                    <p style={styles.itemName}>T-shirt (2×)</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👖</p>
                    <p style={styles.itemName}>Jeans</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>👟</p>
                    <p style={styles.itemName}>Sneakers</p>
                  </div>
                  <div style={styles.itemBox}>
                    <p style={styles.itemEmoji}>🧥</p>
                    <p style={styles.itemName}>Denim Jacket</p>
                  </div>
                </>
              )}
            </div>

            <button style={styles.editBtn}>Edit Capsule</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
    }
  `,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #e9d5ff, #d8b4fe)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#7c3aed",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "48px",
  },
  capsuleCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
  },
  capsuleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  capsuleIcon: {
    fontSize: "32px",
  },
  saveBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  saveBtnActive: {
    filter: "drop-shadow(0 0 4px rgba(124, 58, 237, 0.3))",
  },
  capsuleName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  capsuleDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  capsuleStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#7c3aed",
    margin: 0,
  },
  viewBtn: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  createCard: {
    background: "#f9fafb",
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
  },
  createIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  createText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  createBtn: {
    padding: "8px 16px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  tipsSection: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  tipsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  tipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  tipCard: {
    background: "linear-gradient(135deg, #e9d5ff, #d8b4fe)",
    borderRadius: "8px",
    padding: "16px",
  },
  tipNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#7c3aed",
    margin: "0 0 6px 0",
  },
  tipHeading: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#5b21b6",
    margin: "0 0 6px 0",
  },
  tipText: {
    fontSize: "12px",
    color: "#5b21b6",
    margin: 0,
    lineHeight: "1.5",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "500px",
    width: "90%",
    position: "relative",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  modalDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 24px 0",
  },
  modalStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "24px",
  },
  modalStat: {
    background: "#f9fafb",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
  },
  modalStatLabel: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "0 0 4px 0",
  },
  modalStatValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#7c3aed",
    margin: 0,
  },
  itemsHeading: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  itemBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "center",
  },
  itemEmoji: {
    fontSize: "24px",
    margin: "0 0 6px 0",
  },
  itemName: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  editBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
