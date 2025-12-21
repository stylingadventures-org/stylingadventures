// site/src/routes/admin/AIManagement.jsx
import React, { useState } from "react";

export default function AIManagement() {
  const [tab, setTab] = useState("prompts");
  const [bestiePersonality, setBestiePersonality] = useState("warm, supportive, fashion-forward");
  const [lalaPersonality, setLalaPersonality] = useState("playful, empowering, conversational");

  const styles = {
    container: {
      padding: "24px",
      backgroundColor: "#f9f5f0",
      minHeight: "100vh",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: {
      marginBottom: "32px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#666",
    },
    tabs: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      borderBottom: "1px solid #e5ddd0",
    },
    tab: (isActive) => ({
      padding: "12px 20px",
      backgroundColor: "transparent",
      border: "none",
      borderBottom: isActive ? "3px solid #d4a574" : "3px solid transparent",
      fontSize: "14px",
      fontWeight: isActive ? "600" : "500",
      color: isActive ? "#d4a574" : "#999",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }),
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
    field: {
      marginBottom: "20px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "8px",
      display: "block",
    },
    textarea: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5ddd0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      minHeight: "80px",
      resize: "vertical",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5ddd0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
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
      transition: "background-color 0.2s ease",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
    },
    statBox: {
      padding: "16px",
      backgroundColor: "#faf8f5",
      borderRadius: "8px",
      borderLeft: "4px solid #d4a574",
    },
    statLabel: {
      fontSize: "12px",
      color: "#999",
      marginBottom: "8px",
      textTransform: "uppercase",
      fontWeight: "600",
    },
    statValue: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#333",
    },
    promptCard: {
      padding: "16px",
      backgroundColor: "#faf8f5",
      borderRadius: "8px",
      borderLeft: "3px solid #d4a574",
      marginBottom: "12px",
    },
    promptTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "4px",
    },
    promptText: {
      fontSize: "13px",
      color: "#666",
      fontStyle: "italic",
      lineHeight: "1.5",
    },
    guardrailsList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    guardrailItem: {
      padding: "12px",
      backgroundColor: "#faf8f5",
      borderRadius: "6px",
      marginBottom: "8px",
      fontSize: "13px",
      color: "#666",
      borderLeft: "2px solid #f59e0b",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🤖 AI Management</h1>
        <p style={styles.subtitle}>Control personalities, prompts, usage, and guardrails</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={styles.tab(tab === "prompts")}
          onClick={() => setTab("prompts")}
        >
          Prompt Library
        </button>
        <button
          style={styles.tab(tab === "personalities")}
          onClick={() => setTab("personalities")}
        >
          Personalities
        </button>
        <button
          style={styles.tab(tab === "guardrails")}
          onClick={() => setTab("guardrails")}
        >
          Guardrails
        </button>
        <button
          style={styles.tab(tab === "usage")}
          onClick={() => setTab("usage")}
        >
          Usage & Costs
        </button>
      </div>

      {tab === "prompts" && (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>Approved Prompts</div>
            <div style={styles.promptCard}>
              <div style={styles.promptTitle}>Caption Generator (Bestie)</div>
              <div style={styles.promptText}>
                "Create a 3-sentence Instagram caption about {topic}. Style: {tone}. Focus on: {focus}. Include relevant emojis."
              </div>
            </div>
            <div style={styles.promptCard}>
              <div style={styles.promptTitle}>Email Subject Line (Creator)</div>
              <div style={styles.promptText}>
                "Generate 5 compelling email subject lines for: {content_type}. Audience: {audience}. Max 50 characters."
              </div>
            </div>
            <div style={styles.promptCard}>
              <div style={styles.promptTitle}>Script Generator (Creator)</div>
              <div style={styles.promptText}>
                "Write a {length} second video script about {topic}. Tone: {tone}. Platform: {platform}. Include hooks and CTAs."
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>Add New Prompt</div>
            <div style={styles.field}>
              <label style={styles.label}>Prompt Name</label>
              <input style={styles.input} placeholder="e.g., 'TikTok Hook Generator'" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Prompt Template</label>
              <textarea style={styles.textarea} placeholder="Describe the prompt, use {variables} for dynamic content" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Available for Tier(s)</label>
              <div style={{ display: "flex", gap: "12px" }}>
                <label>
                  <input type="checkbox" defaultChecked /> All Tiers
                </label>
                <label>
                  <input type="checkbox" /> Creator Pro+
                </label>
                <label>
                  <input type="checkbox" /> Elite Only
                </label>
              </div>
            </div>
            <button style={styles.button}>Save Prompt</button>
          </div>
        </>
      )}

      {tab === "personalities" && (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>Bestie Personality</div>
            <div style={styles.field}>
              <label style={styles.label}>Core Voice</label>
              <textarea
                style={styles.textarea}
                value={bestiePersonality}
                onChange={(e) => setBestiePersonality(e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tone Rules</label>
              <ul style={styles.guardrailsList}>
                <li style={styles.guardrailItem}>✓ Always supportive and encouraging</li>
                <li style={styles.guardrailItem}>✓ Use inclusive language</li>
                <li style={styles.guardrailItem}>✓ Celebrate wins, normalize struggles</li>
              </ul>
            </div>
            <button style={styles.button}>Update Bestie Voice</button>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>Lala Personality</div>
            <div style={styles.field}>
              <label style={styles.label}>Core Voice</label>
              <textarea
                style={styles.textarea}
                value={lalaPersonality}
                onChange={(e) => setLalaPersonality(e.target.value)}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Character Traits</label>
              <ul style={styles.guardrailsList}>
                <li style={styles.guardrailItem}>✓ Fun and animated</li>
                <li style={styles.guardrailItem}>✓ Fashion-focused insights</li>
                <li style={styles.guardrailItem}>✓ Education-first approach</li>
              </ul>
            </div>
            <button style={styles.button}>Update Lala Voice</button>
          </div>
        </>
      )}

      {tab === "guardrails" && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Safety & Compliance Rules</div>
          <div style={styles.grid}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>
                Content Guardrails
              </h3>
              <ul style={styles.guardrailsList}>
                <li style={styles.guardrailItem}>
                  <strong>No promotional spam</strong> — Maximum 1 CTA per response
                </li>
                <li style={styles.guardrailItem}>
                  <strong>No misinformation</strong> — Verify facts before generation
                </li>
                <li style={styles.guardrailItem}>
                  <strong>No harmful advice</strong> — Reject requests about dangerous content
                </li>
                <li style={styles.guardrailItem}>
                  <strong>No copyright violations</strong> — Flag existing work similarity
                </li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>
                Brand Guardrails
              </h3>
              <ul style={styles.guardrailsList}>
                <li style={styles.guardrailItem}>
                  <strong>Tone consistency</strong> — Must align with brand voice
                </li>
                <li style={styles.guardrailItem}>
                  <strong>Audience appropriate</strong> — Age/culture considerations
                </li>
                <li style={styles.guardrailItem}>
                  <strong>Platform compliant</strong> — Follow specific platform rules
                </li>
                <li style={styles.guardrailItem}>
                  <strong>Quality standard</strong> — Minimum readability/engagement score
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "usage" && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>AI Usage Dashboard</div>
          <div style={styles.grid}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>API Calls Today</div>
              <div style={styles.statValue}>2,847</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Estimated Cost</div>
              <div style={styles.statValue}>$12.34</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Monthly Budget</div>
              <div style={styles.statValue}>$500/mo</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>% of Budget Used</div>
              <div style={styles.statValue}>47.2%</div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Set Monthly Cost Cap</label>
            <input style={styles.input} placeholder="$1000" defaultValue="$500" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Usage Limits by Feature</label>
            <ul style={styles.guardrailsList}>
              <li style={styles.guardrailItem}>Caption Generator: 500 calls/mo (per user)</li>
              <li style={styles.guardrailItem}>Email Writer: 300 calls/mo (per user)</li>
              <li style={styles.guardrailItem}>Script Generator: 200 calls/mo (per user)</li>
              <li style={styles.guardrailItem}>Admin can override limits for specific users</li>
            </ul>
          </div>

          <button style={styles.button}>Update Usage Limits</button>
        </div>
      )}
    </div>
  );
}
