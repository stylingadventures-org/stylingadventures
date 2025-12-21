// site/src/routes/fan/Shop.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

const FEATURED_ITEMS = [
  { id: 1, name: "Lala's Gold Blazer", price: "$89", from: "Scene 3", image: "👗", affiliate: "Amazon" },
  { id: 2, name: "Signature Black Heels", price: "$120", from: "Scene 5", image: "👠", affiliate: "Amazon" },
  { id: 3, name: "Pearl Drop Necklace", price: "$45", from: "Scene 2", image: "💎", affiliate: "Etsy" },
  { id: 4, name: "Vintage Denim Jacket", price: "$75", from: "Scene 4", image: "🧥", affiliate: "Depop" },
];

const SCENE_COLLECTION = [
  { id: 1, scene: "Scene 1: First Impressions", items: 7, featured: "Gold Blazer" },
  { id: 2, scene: "Scene 2: Coffee Date", items: 5, featured: "White Sneakers" },
  { id: 3, scene: "Scene 3: Night Out", items: 8, featured: "Black Heels" },
  { id: 4, scene: "Scene 4: Casual Cool", items: 6, featured: "Denim Jacket" },
];

export default function FanShop() {
  const [activeTab, setActiveTab] = useState("featured");
  const [selectedScene, setSelectedScene] = useState(null);

  return (
    <div className="fan-shop">
      <style>{styles}</style>

      {/* HERO */}
      <section className="fs-hero card">
        <div className="fs-hero-main">
          <div>
            <p className="fs-pill">🛍️ SHOP</p>
            <h1 className="fs-title">Shop Lala's Look</h1>
            <p className="fs-sub">
              Find every outfit, piece, and accessory from Styling Adventures. 
              Earn Besties coins with every purchase through our affiliate partners.
            </p>
          </div>
          <div className="fs-hero-card">
            <p className="fs-stat-label">Total Items</p>
            <p className="fs-stat-value">200+</p>
            <p className="fs-stat-sub">Find your style</p>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="fs-tabs">
        <button
          className={`fs-tab ${activeTab === "featured" ? "active" : ""}`}
          onClick={() => setActiveTab("featured")}
        >
          ⭐ This Week's Picks
        </button>
        <button
          className={`fs-tab ${activeTab === "scenes" ? "active" : ""}`}
          onClick={() => setActiveTab("scenes")}
        >
          🎬 Shop by Scene
        </button>
        <button
          className={`fs-tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          📂 Categories
        </button>
      </div>

      {/* FEATURED */}
      {activeTab === "featured" && (
        <div className="fs-content">
          <p className="fs-section-label">This Week's Favorites</p>
          <div className="fs-items-grid">
            {FEATURED_ITEMS.map(item => (
              <div key={item.id} className="fs-item-card card">
                <div className="fs-item-image">{item.image}</div>
                <h3 className="fs-item-name">{item.name}</h3>
                <p className="fs-item-price">{item.price}</p>
                <p className="fs-item-scene">From {item.from}</p>
                <p className="fs-affiliate-badge">Shop on {item.affiliate}</p>
                <button className="btn btn-primary">View Item</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCENES */}
      {activeTab === "scenes" && (
        <div className="fs-content">
          <p className="fs-section-label">Shop by Episode Scene</p>
          <div className="fs-scenes-grid">
            {SCENE_COLLECTION.map(scene => (
              <div
                key={scene.id}
                className="fs-scene-card card"
                onClick={() => setSelectedScene(selectedScene === scene.id ? null : scene.id)}
              >
                <h3 className="fs-scene-title">{scene.scene}</h3>
                <p className="fs-scene-count">{scene.items} items</p>
                <p className="fs-scene-featured">Featured: {scene.featured}</p>
                {selectedScene === scene.id && (
                  <div className="fs-scene-details">
                    <p className="fs-scene-detail-text">Click "View Item" to explore all pieces from this scene</p>
                    <button className="btn btn-primary">View All {scene.items} Items</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES */}
      {activeTab === "categories" && (
        <div className="fs-content">
          <p className="fs-section-label">Browse by Category</p>
          <div className="fs-categories-grid">
            {["Dresses", "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Jewelry", "Bags"].map(cat => (
              <div key={cat} className="fs-category-card card">
                <p className="fs-category-emoji">
                  {cat === "Dresses" && "👗"}
                  {cat === "Tops" && "👕"}
                  {cat === "Bottoms" && "👖"}
                  {cat === "Outerwear" && "🧥"}
                  {cat === "Shoes" && "👠"}
                  {cat === "Accessories" && "🎀"}
                  {cat === "Jewelry" && "💎"}
                  {cat === "Bags" && "👜"}
                </p>
                <h3 className="fs-category-name">{cat}</h3>
                <button className="btn btn-secondary">Shop</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO SECTION */}
      <section className="fs-info card">
        <h2 className="fs-info-title">How Shopping Works</h2>
        <div className="fs-info-grid">
          <div className="fs-info-item">
            <p className="fs-info-icon">🔗</p>
            <h3 className="fs-info-heading">Affiliate Links</h3>
            <p className="fs-info-text">Shop through our partner links and earn commissions that go to Besties coins</p>
          </div>
          <div className="fs-info-item">
            <p className="fs-info-icon">💰</p>
            <h3 className="fs-info-heading">Earn Coins</h3>
            <p className="fs-info-text">Every purchase earns you 5% back in Besties coins</p>
          </div>
          <div className="fs-info-item">
            <p className="fs-info-icon">📦</p>
            <h3 className="fs-info-heading">Direct Checkout</h3>
            <p className="fs-info-text">Shop directly with retailers - we just connect you</p>
          </div>
          <div className="fs-info-item">
            <p className="fs-info-icon">🌟</p>
            <h3 className="fs-info-heading">Exclusive Finds</h3>
            <p className="fs-info-text">Discover where Lala shops and get styling tips</p>
          </div>
        </div>
      </section>

      {/* AFFIRM */}
      <section className="fs-affirm card">
        <p className="fs-affirm-main">Style like Lala. Shop with purpose.</p>
        <p className="fs-affirm-sub">
          200+ items from your favorite episodes. Every purchase supports creators. 🛍️
        </p>
        <Link to="/fan" className="btn btn-primary">Back to Fan Home</Link>
      </section>
    </div>
  );
}

const styles = `
.fan-shop {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 16px 40px rgba(148, 163, 184, 0.35);
}

/* HERO */
.fs-hero {
  padding: 18px 18px 16px;
  background:
    radial-gradient(circle at top left, rgba(252, 231, 243, 0.95), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at bottom right, rgba(249, 168, 212, 0.95), rgba(255, 255, 255, 1));
  border: 1px solid rgba(248, 250, 252, 0.9);
}

.fs-hero-main {
  display: grid;
  grid-template-columns: minmax(0, 2.4fr) minmax(0, 2fr);
  gap: 18px;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .fs-hero-main {
    grid-template-columns: minmax(0, 1fr);
  }
}

.fs-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: rgba(255, 255, 255, 0.9);
  color: #be185d;
  border: 1px solid rgba(252, 231, 243, 0.9);
}

.fs-title {
  margin: 8px 0 4px;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: #111827;
}

.fs-sub {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
  max-width: 520px;
}

.fs-hero-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  padding: 12px 14px 14px;
  border: 1px solid rgba(229, 231, 235, 0.9);
  box-shadow: 0 14px 32px rgba(148, 163, 184, 0.55);
}

.fs-stat-label {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #9ca3af;
}

.fs-stat-value {
  margin: 6px 0 4px;
  font-weight: 700;
  font-size: 1.6rem;
  color: #111827;
}

.fs-stat-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

/* TABS */
.fs-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fs-tab {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 140ms ease;
}

.fs-tab:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.fs-tab.active {
  background: linear-gradient(135deg, #ec4899, #be185d);
  color: #ffffff;
  border-color: #ec4899;
}

/* CONTENT */
.fs-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fs-section-label {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
  font-weight: 600;
}

/* ITEMS GRID */
.fs-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.fs-item-card {
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  transition: all 200ms ease;
}

.fs-item-card:hover {
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.25);
  transform: translateY(-2px);
}

.fs-item-image {
  font-size: 3rem;
}

.fs-item-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.fs-item-price {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ec4899;
}

.fs-item-scene {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.fs-affiliate-badge {
  margin: 4px 0 0;
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #fce7f3;
  border-radius: 999px;
  color: #be185d;
  display: inline-block;
}

/* SCENES */
.fs-scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.fs-scene-card {
  padding: 16px;
  cursor: pointer;
  transition: all 200ms ease;
}

.fs-scene-card:hover {
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.2);
  transform: translateY(-2px);
}

.fs-scene-title {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.fs-scene-count {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: #6b7280;
}

.fs-scene-featured {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.fs-scene-details {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
}

.fs-scene-detail-text {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #6b7280;
}

/* CATEGORIES */
.fs-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.fs-category-card {
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.fs-category-emoji {
  margin: 0;
  font-size: 2.4rem;
}

.fs-category-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

/* INFO */
.fs-info {
  padding: 18px;
}

.fs-info-title {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fs-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.fs-info-item {
  padding: 14px;
  background: linear-gradient(135deg, rgba(252, 231, 243, 0.1), rgba(249, 168, 212, 0.1));
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 12px;
  text-align: center;
}

.fs-info-icon {
  margin: 0;
  font-size: 2rem;
}

.fs-info-heading {
  margin: 8px 0 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.fs-info-text {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* AFFIRM */
.fs-affirm {
  padding: 18px;
  text-align: center;
}

.fs-affirm-main {
  margin: 0 0 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
}

.fs-affirm-sub {
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4b5563;
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
  transition: transform 40ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn:hover {
  background: #fce7f3;
  border-color: #fbcfe8;
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.25);
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background: linear-gradient(135deg, #ec4899, #be185d);
  border-color: #ec4899;
  color: #fff;
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.45);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #be185d, #9d174d);
  border-color: #be185d;
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
`;
