import React, { useState } from "react";

const SAMPLE_CART = [
  {
    id: 1,
    name: "Classic White Sneakers",
    price: 89.99,
    image: "👟",
    shop: "Fan Shop",
    reason: "Matches 12 outfits in your inventory",
  },
  {
    id: 2,
    name: "Navy Blazer",
    price: 129.99,
    image: "🧥",
    shop: "Fan Shop",
    reason: "Perfect for work outfits - gap in wardrobe",
  },
  {
    id: 3,
    name: "Gold Layered Necklace",
    price: 34.99,
    image: "⛓️",
    shop: "Fan Shop",
    reason: "Accessory to elevate 8 existing looks",
  },
];

export default function ShoppingCart() {
  const [cartItems, setCartItems] = useState(SAMPLE_CART);
  const [showNotification, setShowNotification] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleRemove = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleCheckout = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>🛍️ SMART CART</p>
          <h1 style={styles.title}>Shopping Cart</h1>
          <p style={styles.subtitle}>
            AI-curated items that fill gaps in your wardrobe & match your style
          </p>
        </div>
      </section>

      <div style={styles.mainGrid}>
        {/* CART ITEMS */}
        <section style={styles.cartSection}>
          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>
              <p style={styles.emptyIcon}>🛒</p>
              <p style={styles.emptyTitle}>Your cart is empty</p>
              <p style={styles.emptyText}>
                Browse the Fan Shop to add items that match your style
              </p>
            </div>
          ) : (
            <div>
              <h2 style={styles.itemsTitle}>{cartItems.length} Items in Cart</h2>
              <div style={styles.itemsList}>
                {cartItems.map((item) => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.itemImage}>{item.image}</div>
                    <div style={styles.itemInfo}>
                      <h3 style={styles.itemName}>{item.name}</h3>
                      <p style={styles.itemShop}>{item.shop}</p>
                      <p style={styles.itemReason}>💡 {item.reason}</p>
                    </div>
                    <div style={styles.itemRight}>
                      <p style={styles.itemPrice}>${item.price.toFixed(2)}</p>
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          {/* SUMMARY */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>Order Summary</h3>
            <div style={styles.summaryLine}>
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div style={styles.summaryLine}>
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div style={styles.summaryLine}>
              <span>Bestie Discount (10%)</span>
              <span style={styles.discount}>-${(total * 0.1).toFixed(2)}</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryLine}>
              <strong>Total</strong>
              <strong>${(total * 0.9).toFixed(2)}</strong>
            </div>
            <button
              onClick={handleCheckout}
              style={styles.checkoutBtn}
            >
              Proceed to Checkout
            </button>
            <button style={styles.continueShoppingBtn}>Continue Shopping</button>
          </div>

          {/* CART TIPS */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>💡 Smart Cart Tips</h3>
            <ul style={styles.tipsList}>
              <li>Items suggested based on your inventory</li>
              <li>All recommended for 5+ outfit matches</li>
              <li>Bestie exclusive 10% discount applied</li>
              <li>Bundle discounts available (see below)</li>
            </ul>
          </div>

          {/* BUNDLE */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>📦 Bundle & Save</h3>
            <div style={styles.bundleCard}>
              <p style={styles.bundleTitle}>Neutral Basics Bundle</p>
              <p style={styles.bundleText}>Get the first 2 items + save 15%</p>
              <p style={styles.bundlePrice}>Save $32.99</p>
              <button style={styles.bundleBtn}>Add Bundle</button>
            </div>
          </div>
        </aside>
      </div>

      {/* NOTIFICATION */}
      {showNotification && (
        <div style={styles.notification}>✓ Item removed from cart</div>
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
    background: "linear-gradient(135deg, #ffeaa7, #fdcb6e)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#d63031",
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
    gridTemplateColumns: "2fr 1fr",
    gap: "32px",
  },
  cartSection: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
  },
  emptyCart: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyIcon: {
    fontSize: "48px",
    margin: "0 0 16px 0",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  emptyText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  itemsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  cartItem: {
    display: "flex",
    gap: "16px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
    alignItems: "flex-start",
  },
  itemImage: {
    fontSize: "40px",
    minWidth: "60px",
    textAlign: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  itemShop: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "0 0 6px 0",
  },
  itemReason: {
    fontSize: "12px",
    color: "#059669",
    margin: 0,
  },
  itemRight: {
    textAlign: "right",
    minWidth: "100px",
  },
  itemPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#d63031",
    margin: "0 0 8px 0",
  },
  removeBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sidebarBox: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  summaryLine: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "8px",
  },
  discount: {
    color: "#059669",
    fontWeight: "600",
  },
  summaryDivider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "12px 0",
  },
  checkoutBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "8px",
  },
  continueShoppingBtn: {
    width: "100%",
    padding: "10px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tipsList: {
    margin: 0,
    paddingLeft: "16px",
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
  bundleCard: {
    background: "linear-gradient(135deg, #ffeaa7, #fdcb6e)",
    borderRadius: "8px",
    padding: "12px",
  },
  bundleTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  bundleText: {
    fontSize: "11px",
    color: "#6b7280",
    margin: "0 0 6px 0",
  },
  bundlePrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#d63031",
    margin: "0 0 8px 0",
  },
  bundleBtn: {
    width: "100%",
    padding: "8px",
    background: "#ffffff",
    border: "none",
    borderRadius: "4px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
  },
  notification: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#059669",
    color: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
  },
};
