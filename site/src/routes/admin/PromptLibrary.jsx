// site/src/routes/admin/PromptLibrary.jsx
import React, { useState } from "react";

export default function PromptLibrary() {
  const [prompts] = useState([
    {
      id: 1,
      category: "Captions",
      name: "Instagram Caption Generator",
      template: "Create a {length} Instagram caption about {topic}. Tone: {tone}. Include {count} emojis.",
      locked: false,
      usage: 1247,
    },
    {
      id: 2,
      category: "Emails",
      name: "Newsletter Subject Lines",
      template: "Generate 5 email subject lines for: {content}. Max {length} characters. Focus on {benefit}.",
      locked: false,
      usage: 843,
    },
    {
      id: 3,
      category: "Scripts",
      name: "TikTok Hook Generator",
      template: "Write a {length} second TikTok hook about {topic}. Hook style: {style}. Audience: {audience}.",
      locked: true,
      usage: 2104,
    },
    {
      id: 4,
      category: "Captions",
      name: "LinkedIn Professional Post",
      template: "Write a LinkedIn post about {topic}. Tone: Professional yet approachable. Include {cta}.",
      locked: false,
      usage: 456,
    },
  ]);

  const styles = {
    container: { padding: "24px", backgroundColor: "#f9f5f0", minHeight: "100vh", fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
    header: { marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "8px" },
    card: { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", marginBottom: "20px", border: "1px solid #e5ddd0" },
    sectionLabel: { fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "16px", letterSpacing: "0.5px" },
    promptCard: { padding: "16px", backgroundColor: "#faf8f5", borderRadius: "8px", marginBottom: "12px", borderLeft: "3px solid #d4a574" },
    promptTitle: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" },
    promptCategory: { display: "inline-block", padding: "4px 8px", backgroundColor: "#d4a57420", color: "#8b6f47", borderRadius: "4px", fontSize: "11px", fontWeight: "600", marginBottom: "8px" },
    promptText: { fontSize: "12px", color: "#666", fontStyle: "italic", marginBottom: "8px", fontFamily: "monospace", backgroundColor: "#fff", padding: "8px", borderRadius: "4px" },
    meta: { fontSize: "11px", color: "#999", display: "flex", gap: "12px" },
    button: { padding: "8px 16px", backgroundColor: "#d4a574", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" },
    field: { marginBottom: "20px" },
    label: { fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px", display: "block" },
    input: { width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit" },
    textarea: { width: "100%", padding: "12px", border: "1px solid #e5ddd0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", minHeight: "60px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 Prompt & Template Library</h1>
        <p style={{ fontSize: "14px", color: "#666" }}>Manage approved prompts and content frameworks</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Approved Prompts</div>
        {prompts.map((prompt) => (
          <div key={prompt.id} style={styles.promptCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
              <div style={{ flex: 1 }}>
                <div style={styles.promptTitle}>{prompt.name}</div>
                <span style={styles.promptCategory}>{prompt.category}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#d4a574" }}>
                {prompt.locked ? "🔒 Locked" : "🔓 Editable"}
              </span>
            </div>
            <div style={styles.promptText}>{prompt.template}</div>
            <div style={styles.meta}>
              <span>💬 Used {prompt.usage} times</span>
              <button style={styles.button}>Edit</button>
              <button style={{...styles.button, backgroundColor: "#999"}}>View Versions</button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Create New Prompt</div>
        <div style={styles.field}>
          <label style={styles.label}>Prompt Name</label>
          <input style={styles.input} placeholder="e.g., 'Product Launch Announcement'" />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Category</label>
          <select style={styles.input}>
            <option>Captions</option>
            <option>Emails</option>
            <option>Scripts</option>
            <option>Blog Posts</option>
            <option>Other</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Prompt Template</label>
          <textarea
            style={styles.textarea}
            placeholder="Use {variable_name} for dynamic content. E.g., 'Write a caption about {topic} in {tone} voice.'"
          />
        </div>
        <div style={styles.field}>
          <label style={{ display: "flex", gap: "8px" }}>
            <input type="checkbox" /> Lock this prompt (users cannot customize)
          </label>
        </div>
        <button style={{ ...styles.button, backgroundColor: "#d4a574", padding: "12px 24px", fontSize: "14px" }}>
          Create Prompt
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Content Frameworks</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>The Hook-Story-CTA</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Proven framework for video content</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>AIDA (Attention-Interest-Desire-Action)</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Classic copywriting structure</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Problem-Agitate-Solve</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Results-driven email sequences</div>
          </div>
          <div style={{ padding: "12px", backgroundColor: "#faf8f5", borderRadius: "6px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>Storytelling Arc</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Build emotional connection</div>
          </div>
        </div>
      </div>
    </div>
  );
}
