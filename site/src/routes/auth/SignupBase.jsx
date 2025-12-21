// site/src/routes/auth/SignupBase.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function SignupBase({ role, title, subtitle, benefits, icon, gradient, buttonText = "Get Started" }) {
  const nav = useNavigate();

  const handleSignup = () => {
    // Open login modal with role context
    window.dispatchEvent(new CustomEvent('openLoginModal', { detail: { role } }));
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Hero */}
      <section style={{ ...styles.hero, background: gradient }}>
        <div style={styles.heroContent}>
          <div style={styles.heroIcon}>{icon}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <button onClick={handleSignup} style={styles.cta}>
            {buttonText}
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section style={styles.benefits}>
        <h2>What you get</h2>
        <ul style={styles.list}>
          {benefits.map((benefit, i) => (
            <li key={i}>{benefit}</li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section style={styles.footer}>
        <button onClick={handleSignup} style={styles.primaryBtn}>
          {buttonText}
        </button>
        <button onClick={() => nav("/")} style={styles.secondaryBtn}>
          Back to home
        </button>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    paddingBottom: "60px",
  },
  hero: {
    borderRadius: "20px",
    padding: "60px 40px",
    textAlign: "center",
    color: "#fff",
    marginBottom: "40px",
  },
  heroContent: {},
  heroIcon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  benefits: {
    background: "#f9fafb",
    borderRadius: "16px",
    padding: "40px",
    marginBottom: "40px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: "20px 0 0 0",
    display: "grid",
    gap: "12px",
  },
  footer: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  cta: {
    marginTop: "20px",
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "999px",
    border: "none",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  secondaryBtn: {
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "999px",
    border: "2px solid #e5e7eb",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    transition: "all 0.3s",
  },
};

const css = `
h1 { margin: 0 0 12px; font-size: 2rem; }
p { margin: 0 0 24px; font-size: 1.1rem; opacity: 0.95; }
h2 { margin: 0 0 20px; font-size: 1.4rem; color: #111; }
li { font-size: 1rem; padding-left: 24px; position: relative; color: #374151; }
li:before { content: "✓"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
button:hover { opacity: 0.9; transform: translateY(-2px); }
`;
