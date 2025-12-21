import React, { useState } from "react";

const WARDROBE = [
  { id: 1, name: "Pink Wrap Top", category: "Tops", image: "👗" },
  { id: 2, name: "Black Trousers", category: "Bottoms", image: "👖" },
  { id: 3, name: "White Sneakers", category: "Shoes", image: "👟" },
  { id: 4, name: "Gold Earrings", category: "Accessories", image: "✨" },
  { id: 5, name: "Denim Jacket", category: "Outerwear", image: "🧥" },
  { id: 6, name: "Red Silk Blouse", category: "Tops", image: "👔" },
  { id: 7, name: "Blue Jeans", category: "Bottoms", image: "👖" },
  { id: 8, name: "Gold Watch", category: "Accessories", image: "⌚" },
];

const OCCASIONS = ["Work", "Casual", "Date Night", "Weekend Brunch", "Gym", "Party"];

export default function OutfitBuilder() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentOutfit, setCurrentOutfit] = useState(null);
  const [outfits, setOutfits] = useState([
    {
      id: 1,
      name: "Office Ready",
      items: [1, 2, 3],
      occasion: "Work",
      rating: 5,
    },
  ]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("Casual");
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleAddItem = (item) => {
    if (!selectedItems.find((i) => i.id === item.id)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter((i) => i.id !== itemId));
  };

  const handleSaveOutfit = () => {
    if (outfitName.trim() && selectedItems.length > 0) {
      const newOutfit = {
        id: outfits.length + 1,
        name: outfitName,
        items: selectedItems.map((i) => i.id),
        occasion: selectedOccasion,
        rating: 0,
      };
      setOutfits([...outfits, newOutfit]);
      setSelectedItems([]);
      setOutfitName("");
      setShowSaveModal(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>✂️ OUTFIT BUILDER</p>
          <h1 style={styles.title}>Create & Mix Looks</h1>
          <p style={styles.subtitle}>Drag & drop items to build outfits. Save for later.</p>
        </div>
      </section>

      <div style={styles.mainGrid}>
        {/* LEFT: PREVIEW & BUILDER */}
        <section style={styles.previewSection}>
          <h2 style={styles.sectionTitle}>Your Outfit</h2>

          <div style={styles.previewBox}>
            {selectedItems.length === 0 ? (
              <div style={styles.previewEmpty}>
                <p style={styles.previewEmptyIcon}>✨</p>
                <p>Drag items here to build an outfit</p>
              </div>
            ) : (
              <div style={styles.previewItems}>
                {selectedItems.map((item) => (
                  <div key={item.id} style={styles.previewItem}>
                    <span style={styles.previewItemImage}>{item.image}</span>
                    <p style={styles.previewItemName}>{item.name}</p>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={styles.removeItemBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div style={styles.outfitActions}>
              <button onClick={() => setShowSaveModal(true)} style={styles.saveOutfitBtn}>
                💾 Save This Outfit
              </button>
              <button
                onClick={() => setSelectedItems([])}
                style={styles.clearBtn}
              >
                Clear
              </button>
            </div>
          )}

          {/* SAVED OUTFITS */}
          <h2 style={styles.sectionTitle}>Saved Outfits ({outfits.length})</h2>
          <div style={styles.savedOutfitsList}>
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                onClick={() => setCurrentOutfit(outfit)}
                style={{
                  ...styles.savedOutfitCard,
                  ...(currentOutfit?.id === outfit.id ? styles.savedOutfitCardActive : {}),
                }}
              >
                <div style={styles.outfitPreviewMini}>
                  {WARDROBE.filter((item) => outfit.items.includes(item.id)).map(
                    (item) => (
                      <span key={item.id} style={styles.miniImage}>
                        {item.image}
                      </span>
                    )
                  )}
                </div>
                <p style={styles.outfitNameSmall}>{outfit.name}</p>
                <p style={styles.outfitOccasion}>{outfit.occasion}</p>
                <p style={styles.outfitRating}>⭐ {outfit.rating}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: WARDROBE SELECTOR */}
        <section style={styles.wardrobeSection}>
          <h2 style={styles.sectionTitle}>Your Wardrobe</h2>

          <div style={styles.categoryTabs}>
            {["All", "Tops", "Bottoms", "Shoes", "Accessories", "Outerwear"].map((cat) => (
              <button key={cat} style={styles.categoryTab}>
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.wardrobeGrid}>
            {WARDROBE.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item)}
                onClick={() => handleAddItem(item)}
                style={{
                  ...styles.wardrobeItem,
                  ...(selectedItems.find((i) => i.id === item.id)
                    ? styles.wardrobeItemSelected
                    : {}),
                }}
              >
                <div style={styles.wardrobeItemImage}>{item.image}</div>
                <p style={styles.wardrobeItemName}>{item.name}</p>
                <p style={styles.wardrobeItemCategory}>{item.category}</p>
              </div>
            ))}
          </div>

          {/* TIPS */}
          <div style={styles.tipsBox}>
            <h3 style={styles.tipsTitle}>💡 Quick Tips</h3>
            <ul style={styles.tipsList}>
              <li>Mix and match textures</li>
              <li>Stick to a color palette</li>
              <li>Balance proportions</li>
              <li>One statement piece per outfit</li>
              <li>Accessories elevate any look</li>
            </ul>
          </div>
        </section>
      </div>

      {/* SAVE OUTFIT MODAL */}
      {showSaveModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button
              onClick={() => setShowSaveModal(false)}
              style={styles.closeBtn}
            >
              ✕
            </button>
            <h2 style={styles.modalTitle}>Save This Outfit</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Outfit Name</label>
              <input
                type="text"
                placeholder="e.g., Monday Meeting"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Occasion</label>
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                style={styles.input}
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.itemsPreview}>
              <p style={styles.label}>Items ({selectedItems.length})</p>
              <div style={styles.previewThumbnails}>
                {selectedItems.map((item) => (
                  <span key={item.id} style={styles.thumbnail}>
                    {item.image}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={handleSaveOutfit} style={styles.saveBtn}>
              Save Outfit
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
  },
  previewSection: {},
  wardrobeSection: {},
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  previewBox: {
    background: "linear-gradient(135deg, #fff5fa, #f9f5ff)",
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "32px 24px",
    minHeight: "400px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewEmpty: {
    textAlign: "center",
    color: "#9ca3af",
  },
  previewEmptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "12px",
  },
  previewItems: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
    gap: "16px",
    width: "100%",
  },
  previewItem: {
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center",
    position: "relative",
  },
  previewItemImage: {
    fontSize: "32px",
    display: "block",
    marginBottom: "8px",
  },
  previewItemName: {
    fontSize: "12px",
    color: "#111827",
    fontWeight: "600",
    margin: "0",
  },
  removeItemBtn: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    cursor: "pointer",
    fontSize: "14px",
  },
  outfitActions: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  },
  saveOutfitBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  clearBtn: {
    padding: "12px 24px",
    background: "#f9fafb",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  savedOutfitsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "12px",
  },
  savedOutfitCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  savedOutfitCardActive: {
    borderColor: "#ff4fa3",
    boxShadow: "0 0 12px rgba(255, 79, 163, 0.2)",
  },
  outfitPreviewMini: {
    display: "flex",
    gap: "4px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  miniImage: {
    fontSize: "16px",
  },
  outfitNameSmall: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "4px 0",
  },
  outfitOccasion: {
    fontSize: "10px",
    color: "#6b7280",
    margin: "2px 0",
  },
  outfitRating: {
    fontSize: "11px",
    color: "#fbbf24",
    margin: "2px 0",
  },
  categoryTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  categoryTab: {
    padding: "6px 12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  wardrobeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  wardrobeItem: {
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    cursor: "grab",
    textAlign: "center",
    transition: "all 0.2s",
  },
  wardrobeItemSelected: {
    borderColor: "#ff4fa3",
    background: "#fff5fa",
  },
  wardrobeItemImage: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  wardrobeItemName: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  wardrobeItemCategory: {
    fontSize: "10px",
    color: "#9ca3af",
    margin: 0,
  },
  tipsBox: {
    background: "#f9f5ff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "16px",
  },
  tipsTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  tipsList: {
    margin: 0,
    paddingLeft: "16px",
    fontSize: "12px",
    color: "#6b7280",
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
  itemsPreview: {
    marginBottom: "16px",
  },
  previewThumbnails: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  thumbnail: {
    fontSize: "24px",
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
  },
};
