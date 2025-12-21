// site/src/routes/prime/StoryContentStudio.jsx
import React, { useState } from "react";

export default function StoryContentStudio() {
  const [contentType, setContentType] = useState("episode");
  const [tone, setTone] = useState("authentic");
  const [idea, setIdea] = useState("");
  const [generated, setGenerated] = useState("");

  const handleGenerate = () => {
    const ideas = {
      episode: {
        authentic: "Behind-the-scenes of today's wardrobe reveal - showing the styling process.",
        professional: "Professional styling consultation format for this week's featured look.",
        playful: "Fun challenge: style the same item 5 different ways!",
      },
      scene: {
        authentic: "Raw morning routine transformation shot sequence.",
        professional: "Structured makeover montage with expert styling tips.",
        playful: "Silly before/after transformation with personality.",
      },
      clip: {
        authentic: "Quick personal style reflection moment.",
        professional: "Educational fashion tip in 30 seconds.",
        playful: "Trending sound audio content with style twist.",
      },
    };
    setGenerated(ideas[contentType][tone]);
  };

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
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px",
      border: "1px solid #e5ddd0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    sectionLabel: {
      fontSize: "12px",
      fontWeight: "700",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: "12px",
      letterSpacing: "0.5px",
    },
    optionGroup: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "12px",
      marginBottom: "20px",
    },
    option: (isSelected) => ({
      padding: "12px 16px",
      border: `2px solid ${isSelected ? "#d4a574" : "#e5ddd0"}`,
      borderRadius: "8px",
      backgroundColor: isSelected ? "#fff9f5" : "#fff",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: isSelected ? "600" : "400",
      color: isSelected ? "#8b6f47" : "#666",
      transition: "all 0.2s ease",
    }),
    textarea: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5ddd0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "100px",
      marginBottom: "16px",
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
    buttonHover: {
      backgroundColor: "#c4956a",
    },
    output: {
      padding: "16px",
      backgroundColor: "#faf8f5",
      borderRadius: "8px",
      border: "1px solid #e5ddd0",
      lineHeight: "1.6",
      color: "#333",
    },
    actionButtons: {
      display: "flex",
      gap: "12px",
      marginTop: "16px",
    },
    smallButton: {
      padding: "8px 16px",
      backgroundColor: "#f0e8e0",
      color: "#666",
      border: "1px solid #e5ddd0",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    gridCols2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    insightCard: {
      padding: "16px",
      backgroundColor: "#fff9f5",
      borderLeft: "4px solid #d4a574",
      borderRadius: "4px",
      marginTop: "16px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Story & Content Studio</h1>
        <p style={styles.subtitle}>Generate story episodes, scenes, and content ideas</p>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Content Type</div>
        <div style={styles.optionGroup}>
          {["episode", "scene", "clip"].map((type) => (
            <button
              key={type}
              style={styles.option(contentType === type)}
              onClick={() => setContentType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Tone & Style</div>
        <div style={styles.optionGroup}>
          {["authentic", "professional", "playful"].map((t) => (
            <button
              key={t}
              style={styles.option(tone === t)}
              onClick={() => setTone(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>Your Idea</div>
        <textarea
          style={styles.textarea}
          placeholder="What's the core idea? (e.g., 'Summer wardrobe transitions', 'Color psychology', 'Capsule building')"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <button
          style={styles.button}
          onMouseEnter={(e) => (e.target.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = styles.button.backgroundColor)}
          onClick={handleGenerate}
        >
          Generate Content
        </button>
      </div>

      {generated && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Generated Content Outline</div>
          <div style={styles.output}>{generated}</div>
          <div style={styles.actionButtons}>
            <button style={styles.smallButton}>Copy</button>
            <button style={styles.smallButton}>Save as Draft</button>
            <button style={styles.smallButton}>Expand Details</button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.insightCard}>
          <strong>💡 Tip:</strong> Start with your transformation theme, add the tone that matches your brand voice, and let AI help structure your content outline. You'll refine details in Story Profile and Shows & Series.
        </div>
      </div>
    </div>
  );
}
