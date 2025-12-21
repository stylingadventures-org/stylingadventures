// site/src/routes/prime/StoryProfile.jsx
import React, { useState } from "react";

export default function StoryProfile() {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    title: "The Modern Minimalist",
    tagline: "Sustainable style for the conscious creator",
    audience: ["Eco-conscious", "25-45 years old", "Urban professionals", "Sustainability advocates"],
    transformation: "Help viewers build a capsule wardrobe that reduces waste while increasing style confidence",
    themes: ["Minimalism", "Sustainability", "Timeless style", "Budget-friendly"],
    tone: "Authentic, educational, empowering",
    platforms: ["YouTube", "Instagram", "TikTok", "Blog"],
  });

  const [formData, setFormData] = useState(profile);

  const handleSave = () => {
    setProfile(formData);
    setEditMode(false);
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
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#333",
    },
    subtitle: {
      fontSize: "14px",
      color: "#666",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#d4a574",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
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
      marginBottom: "12px",
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
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #e5ddd0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
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
    tagList: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    tag: {
      padding: "8px 12px",
      backgroundColor: "#fff9f5",
      border: "1px solid #d4a574",
      borderRadius: "20px",
      fontSize: "13px",
      color: "#666",
    },
    displayValue: {
      fontSize: "14px",
      color: "#333",
      lineHeight: "1.6",
    },
    gridCols2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    actionButtons: {
      display: "flex",
      gap: "12px",
      marginTop: "24px",
    },
    secondaryButton: {
      padding: "10px 20px",
      backgroundColor: "#f0e8e0",
      color: "#666",
      border: "1px solid #e5ddd0",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Story Profile</h1>
          <p style={styles.subtitle}>Define who you are and your audience transformation</p>
        </div>
        <button
          style={styles.button}
          onClick={() => (editMode ? handleSave() : setEditMode(true))}
        >
          {editMode ? "Save Profile" : "Edit Profile"}
        </button>
      </div>

      {editMode ? (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>Story Title & Tagline</div>
            <div style={styles.field}>
              <label style={styles.label}>Story Title</label>
              <input
                style={styles.input}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tagline</label>
              <input
                style={styles.input}
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>Who You Are</div>
            <div style={styles.field}>
              <label style={styles.label}>Transformation You Offer</label>
              <textarea
                style={styles.textarea}
                value={formData.transformation}
                onChange={(e) => setFormData({ ...formData, transformation: e.target.value })}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Tone & Voice</label>
              <input
                style={styles.input}
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>Your Audience</div>
            <div style={styles.field}>
              <label style={styles.label}>Who watches your stories?</label>
              <textarea
                style={styles.textarea}
                value={formData.audience.join(", ")}
                onChange={(e) =>
                  setFormData({ ...formData, audience: e.target.value.split(",").map((a) => a.trim()) })
                }
                placeholder="E.g., 'Eco-conscious 25-45 year olds, Urban professionals'"
              />
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.actionButtons}>
              <button style={styles.button} onClick={handleSave}>
                Save Changes
              </button>
              <button style={styles.secondaryButton} onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>Your Story</div>
            <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
              {profile.title}
            </h2>
            <p style={{ fontSize: "16px", color: "#666", marginBottom: "16px" }}>{profile.tagline}</p>
          </div>

          <div style={styles.gridCols2}>
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Transformation</div>
              <p style={styles.displayValue}>{profile.transformation}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionLabel}>Audience</div>
              <div style={styles.tagList}>
                {profile.audience.map((item) => (
                  <span key={item} style={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.gridCols2}>
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Tone & Voice</div>
              <p style={styles.displayValue}>{profile.tone}</p>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionLabel}>Platforms</div>
              <div style={styles.tagList}>
                {profile.platforms.map((platform) => (
                  <span key={platform} style={styles.tag}>
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
