import React, { useState } from "react";

const SAMPLE_ITEMS = [
  {
    id: 1,
    name: "Pink Wrap Top",
    category: "Tops",
    brand: "Zara",
    color: "Pink",
    price: 49.99,
    timesWorn: 12,
    dateAdded: "2025-10-15",
    image: "👗",
  },
  {
    id: 2,
    name: "Black Wide-Leg Trousers",
    category: "Bottoms",
    brand: "H&M",
    color: "Black",
    price: 35.99,
    timesWorn: 8,
    dateAdded: "2025-09-20",
    image: "👖",
  },
  {
    id: 3,
    name: "White Sneakers",
    category: "Shoes",
    brand: "Nike",
    color: "White",
    price: 89.99,
    timesWorn: 24,
    dateAdded: "2025-08-10",
    image: "👟",
  },
  {
    id: 4,
    name: "Gold Hoop Earrings",
    category: "Accessories",
    brand: "Etsy",
    color: "Gold",
    price: 25.00,
    timesWorn: 18,
    dateAdded: "2025-07-05",
    image: "✨",
  },
  {
    id: 5,
    name: "Oversized Denim Jacket",
    category: "Outerwear",
    brand: "Vintage",
    color: "Blue",
    price: 55.00,
    timesWorn: 6,
    dateAdded: "2025-11-01",
    image: "🧥",
  },
];

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Accessories", "Outerwear"];

export default function MyClosetInventory() {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);
  const totalTimesWorn = items.reduce((sum, item) => sum + item.timesWorn, 0);

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>👗 MY CLOSET</p>
          <h1 style={styles.title}>Your Wardrobe Inventory</h1>
          <p style={styles.subtitle}>Log, organize, and track all your pieces</p>
        </div>
      </section>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Items</p>
          <p style={styles.statValue}>{items.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Closet Value</p>
          <p style={styles.statValue}>${totalValue.toFixed(0)}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Times Worn</p>
          <p style={styles.statValue}>{totalTimesWorn}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Avg Cost/Wear</p>
          <p style={styles.statValue}>${(totalValue / Math.max(totalTimesWorn, 1)).toFixed(2)}</p>
        </div>
      </div>

      {/* CONTROLS */}
      <section style={styles.controls}>
        <div style={styles.controlLeft}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={styles.uploadBtn}
        >
          + Add Item
        </button>
      </section>

      {/* CATEGORIES */}
      <div style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.categoryBtn,
              ...(selectedCategory === cat ? styles.categoryBtnActive : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ITEMS GRID */}
      <div style={styles.itemsGrid}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
            style={{
              ...styles.itemCard,
              ...(selectedItem?.id === item.id ? styles.itemCardSelected : {}),
            }}
          >
            <div style={styles.itemImage}>{item.image}</div>
            <h3 style={styles.itemName}>{item.name}</h3>
            <p style={styles.itemMeta}>{item.brand}</p>
            <p style={styles.itemColor}>{item.color}</p>
            <div style={styles.itemFooter}>
              <span style={styles.price}>${item.price}</span>
              <span style={styles.wornCount}>{item.timesWorn}x worn</span>
            </div>

            {selectedItem?.id === item.id && (
              <div style={styles.itemDetails}>
                <p style={styles.detailRow}>
                  <strong>Category:</strong> {item.category}
                </p>
                <p style={styles.detailRow}>
                  <strong>Added:</strong> {new Date(item.dateAdded).toLocaleDateString()}
                </p>
                <p style={styles.detailRow}>
                  <strong>Cost per wear:</strong> ${(item.price / Math.max(item.timesWorn, 1)).toFixed(2)}
                </p>
                <div style={styles.itemActions}>
                  <button style={styles.actionBtn}>Log Wear</button>
                  <button style={styles.actionBtn}>Edit</button>
                  <button style={{ ...styles.actionBtn, ...styles.deleteBtn }}>Remove</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>👗</p>
          <p style={styles.emptyText}>No items in this category</p>
          <button onClick={() => setShowUploadModal(true)} style={styles.emptyBtn}>
            Add Your First Item
          </button>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowUploadModal(false)}
              style={styles.closeBtn}
            >
              ✕
            </button>
            <h2 style={styles.modalTitle}>Add Item to Closet</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Item Name</label>
              <input type="text" placeholder="e.g., Pink Wrap Top" style={styles.input} />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select style={styles.input}>
                  <option>Tops</option>
                  <option>Bottoms</option>
                  <option>Shoes</option>
                  <option>Accessories</option>
                  <option>Outerwear</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Brand</label>
                <input type="text" placeholder="e.g., Zara" style={styles.input} />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Color</label>
                <input type="text" placeholder="e.g., Pink" style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price</label>
                <input type="number" placeholder="49.99" style={styles.input} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Photo (optional)</label>
              <div style={styles.uploadArea}>
                <p>📸 Click to upload</p>
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(false)}
              style={styles.saveBtn}
            >
              Save Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
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
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#a855f7",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ff4fa3",
    margin: 0,
  },
  controls: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  },
  controlLeft: {
    flex: 1,
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
  },
  uploadBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  categories: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    overflowX: "auto",
    paddingBottom: "8px",
  },
  categoryBtn: {
    padding: "8px 16px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  categoryBtnActive: {
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    borderColor: "transparent",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  itemCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  itemCardSelected: {
    borderColor: "#ff4fa3",
    borderWidth: "2px",
    boxShadow: "0 0 12px rgba(255, 79, 163, 0.2)",
  },
  itemImage: {
    fontSize: "48px",
    textAlign: "center",
    marginBottom: "12px",
  },
  itemName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  itemMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 2px 0",
  },
  itemColor: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: "0 0 8px 0",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
  },
  price: {
    fontWeight: "700",
    color: "#ff4fa3",
  },
  wornCount: {
    color: "#6b7280",
  },
  itemDetails: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
  },
  detailRow: {
    fontSize: "11px",
    color: "#4b5563",
    margin: "6px 0",
  },
  itemActions: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
  actionBtn: {
    flex: 1,
    padding: "6px 8px",
    background: "#f3e3ff",
    color: "#a855f7",
    border: "none",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    background: "#f9fafb",
    borderRadius: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
    margin: "0 0 16px 0",
    display: "block",
  },
  emptyText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  emptyBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
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
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 24px 0",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  uploadArea: {
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    cursor: "pointer",
    background: "#f9fafb",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "16px",
  },
};
