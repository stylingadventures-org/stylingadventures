import React, { useState } from "react";

export default function CreatorUpgrade() {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const plans = [
    { name: "Starter", price: "$0", features: ["Basic analytics", "1 integration", "Community access"], current: true },
    { name: "Creator Pro", price: "$99", features: ["Advanced analytics", "Unlimited integrations", "Priority support", "AI tools"], popular: true },
    { name: "Creator Elite", price: "$299", features: ["White-label tools", "Dedicated account manager", "Custom training", "API access"] },
  ];

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <p style={styles.pill}>💎 UPGRADE</p>
        <h1 style={styles.title}>Creator Tiers</h1>
        <p style={styles.subtitle}>Choose the plan that scales with you</p>
      </section>

      <div style={styles.plansGrid}>
        {plans.map((plan, i) => (
          <div key={i} style={{ ...styles.planCard, ...(plan.popular ? styles.planCardPopular : {}), ...(plan.current ? styles.planCardCurrent : {}) }}>
            {plan.popular && <p style={styles.popularBadge}>Most Popular</p>}
            {plan.current && <p style={styles.currentBadge}>Your Current Plan</p>}
            <p style={styles.planName}>{plan.name}</p>
            <p style={styles.planPrice}>{plan.price}</p>
            <p style={styles.planPeriod}>/month</p>
            <ul style={styles.featuresList}>
              {plan.features.map((feature, f) => (
                <li key={f} style={styles.featureItem}>✓ {feature}</li>
              ))}
            </ul>
            <button style={{ ...styles.upgradeBtn, background: plan.current ? "#f3f4f6" : plan.popular ? "#7c3aed" : "#f3f4f6", color: plan.current ? "#6b7280" : plan.popular ? "white" : "#111827" }}>
              {plan.current ? "Current Plan" : "Upgrade Now"}
            </button>
          </div>
        ))}
      </div>

      <section style={styles.faqSection}>
        <h2 style={styles.faqTitle}>Frequently Asked Questions</h2>
        <div style={styles.faqList}>
          {[
            { q: "Can I change plans anytime?", a: "Yes, downgrade or upgrade anytime. Changes take effect next billing cycle." },
            { q: "What payment methods do you accept?", a: "Credit card, debit card, and PayPal. All payments are secure and encrypted." },
            { q: "Is there a free trial?", a: "Yes, try Creator Pro free for 14 days. No credit card required." },
          ].map((item, i) => (
            <div key={i} style={styles.faqItem}>
              <p style={styles.faqQuestion}>{item.q}</p>
              <p style={styles.faqAnswer}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  hero: { marginBottom: "40px", padding: "40px", background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)", borderRadius: "16px" },
  pill: { fontSize: "11px", fontWeight: "700", color: "#6b21a8", margin: "0 0 8px 0", textTransform: "uppercase" },
  title: { fontSize: "32px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6b7280", margin: 0 },
  plansGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" },
  planCard: { background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px", position: "relative" },
  planCardPopular: { borderColor: "#7c3aed", boxShadow: "0 0 0 2px rgba(124, 58, 237, 0.1)", transform: "scale(1.05)" },
  planCardCurrent: { borderColor: "#10b981" },
  popularBadge: { position: "absolute", top: "-12px", left: "16px", background: "#7c3aed", color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", margin: 0 },
  currentBadge: { position: "absolute", top: "-12px", left: "16px", background: "#10b981", color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", margin: 0 },
  planName: { fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  planPrice: { fontSize: "36px", fontWeight: "700", color: "#7c3aed", margin: 0 },
  planPeriod: { fontSize: "13px", color: "#6b7280", margin: "0 0 20px 0" },
  featuresList: { listStyle: "none", padding: 0, margin: "0 0 24px 0" },
  featureItem: { fontSize: "13px", color: "#111827", padding: "8px 0", borderBottom: "1px solid #e5e7eb" },
  upgradeBtn: { width: "100%", padding: "12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontWeight: "600", cursor: "pointer" },
  faqSection: { marginTop: "40px" },
  faqTitle: { fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 24px 0" },
  faqList: { display: "flex", flexDirection: "column", gap: "16px" },
  faqItem: { background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" },
  faqQuestion: { fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 8px 0" },
  faqAnswer: { fontSize: "13px", color: "#6b7280", margin: 0 },
};
