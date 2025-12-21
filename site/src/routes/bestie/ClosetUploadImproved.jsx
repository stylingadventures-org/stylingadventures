import React, { useState } from "react";

const UPLOAD_STEPS = [
  { step: 1, label: "Photo Upload", icon: "📸", active: true },
  { step: 2, label: "Tag Items", icon: "🏷️", active: false },
  { step: 3, label: "Find Exact Items", icon: "🔍", active: false },
  { step: 4, label: "Share & Earn", icon: "✨", active: false },
];

export default function ClosetUploadBestie() {
  const [step, setStep] = useState(1);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedPhoto({
        name: file.name,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>📸 CLOSET UPLOAD</p>
          <h1 style={styles.title}>Share Your Fit</h1>
          <p style={styles.subtitle}>
            Upload your Lala-inspired outfit, tag exact items, and earn rewards. Plus help other Besties find their pieces!
          </p>
        </div>
      </section>

      {/* PROGRESS STEPS */}
      <div style={styles.stepsContainer}>
        {UPLOAD_STEPS.map((s) => (
          <div
            key={s.step}
            onClick={() => setStep(s.step)}
            style={{
              ...styles.step,
              ...(step === s.step ? styles.stepActive : {}),
            }}
          >
            <div style={styles.stepNumber}>{s.icon}</div>
            <p style={styles.stepLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* STEP 1: PHOTO UPLOAD */}
      {step === 1 && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>Step 1: Upload Your Photo</h2>

          {!uploadedPhoto ? (
            <div style={styles.uploadZone}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={styles.hiddenInput}
                id="photoInput"
              />
              <label htmlFor="photoInput" style={styles.uploadLabel}>
                <div style={styles.uploadContent}>
                  <p style={styles.uploadIcon}>📸</p>
                  <p style={styles.uploadText}>Click to upload or drag & drop</p>
                  <p style={styles.uploadHint}>PNG, JPG or GIF (max 5MB)</p>
                </div>
              </label>
            </div>
          ) : (
            <div style={styles.previewSection}>
              <div style={styles.photoPreview}>
                <img
                  src={uploadedPhoto.preview}
                  alt="Preview"
                  style={styles.previewImg}
                />
              </div>
              <div style={styles.photoInfo}>
                <p style={styles.photoName}>{uploadedPhoto.name}</p>
                <button
                  onClick={() => setUploadedPhoto(null)}
                  style={styles.changeBtn}
                >
                  Change Photo
                </button>
              </div>
            </div>
          )}

          {uploadedPhoto && (
            <div style={styles.captionSection}>
              <label style={styles.label}>Add a Caption (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your outfit, the vibe, inspiration from the show..."
                style={styles.textarea}
              />
            </div>
          )}

          {uploadedPhoto && (
            <button
              onClick={() => setStep(2)}
              style={styles.nextBtn}
            >
              Next: Tag Items →
            </button>
          )}
        </section>
      )}

      {/* STEP 2: TAG ITEMS */}
      {step === 2 && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>Step 2: Tag Items in Your Outfit</h2>

          <div style={styles.taggingSuggestions}>
            <p style={styles.suggestionLabel}>Quick Tags:</p>
            <div style={styles.quickTags}>
              {[
                "Top/Shirt",
                "Pants/Bottoms",
                "Dress",
                "Shoes",
                "Accessories",
                "Bag",
                "Makeup",
                "Hair",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  style={{
                    ...styles.tagButton,
                    ...(tags.includes(tag) ? styles.tagButtonActive : {}),
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div style={styles.selectedTags}>
              <h3 style={styles.selectedLabel}>Tagged ({tags.length}):</h3>
              <div style={styles.tagsList}>
                {tags.map((tag) => (
                  <div key={tag} style={styles.selectedTag}>
                    <span>{tag}</span>
                    <button onClick={() => removeTag(tag)} style={styles.removeBtn}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={styles.navigationButtons}>
            <button onClick={() => setStep(1)} style={styles.backBtn}>
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={tags.length === 0}
              style={{
                ...styles.nextBtn,
                ...(tags.length === 0 ? styles.disabledBtn : {}),
              }}
            >
              Next: Find Items →
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: FIND ITEMS */}
      {step === 3 && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>Step 3: Find Exact Items</h2>
          <p style={styles.stepDesc}>
            Help Besties recreate your look! Link to the exact pieces you're wearing.
          </p>

          <div style={styles.itemsGrid}>
            {tags.map((tag, idx) => (
              <div key={idx} style={styles.itemCard}>
                <p style={styles.itemTag}>{tag}</p>
                <input
                  type="text"
                  placeholder="Brand/Store name (optional)"
                  style={styles.itemInput}
                />
                <input
                  type="text"
                  placeholder="Product name"
                  style={styles.itemInput}
                />
                <input
                  type="text"
                  placeholder="Link to item (affiliate link)"
                  style={styles.itemInput}
                />
                <p style={styles.itemHint}>
                  💡 Use Amazon, Etsy, Shein, or other retailers. You earn commissions!
                </p>
              </div>
            ))}
          </div>

          <div style={styles.affiliateNote}>
            <p style={styles.affiliateIcon}>🤝</p>
            <div>
              <h4 style={styles.affiliateTitle}>Earn Commission!</h4>
              <p style={styles.affiliateText}>
                When a Bestie clicks your link and buys, you earn a commission. Add your affiliate links to maximize earnings!
              </p>
            </div>
          </div>

          <div style={styles.navigationButtons}>
            <button onClick={() => setStep(2)} style={styles.backBtn}>
              ← Back
            </button>
            <button onClick={() => setStep(4)} style={styles.nextBtn}>
              Next: Share & Earn →
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: SHARE & EARN */}
      {step === 4 && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>Step 4: Share Your Outfit!</h2>

          <div style={styles.summaryBox}>
            <h3 style={styles.summaryTitle}>Your Outfit Summary</h3>
            <div style={styles.summaryItem}>
              <span>Photo:</span>
              <strong>{uploadedPhoto?.name}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span>Tagged Items:</span>
              <strong>{tags.length} pieces</strong>
            </div>
            {description && (
              <div style={styles.summaryItem}>
                <span>Caption:</span>
                <strong>"{description}"</strong>
              </div>
            )}
          </div>

          <div style={styles.rewardsBox}>
            <h3 style={styles.rewardsTitle}>Your Rewards</h3>
            <div style={styles.rewardItem}>
              <span style={styles.rewardIcon}>🪙</span>
              <div>
                <p style={styles.rewardLabel}>Upload Bonus</p>
                <p style={styles.rewardValue}>+100 coins</p>
              </div>
            </div>
            <div style={styles.rewardItem}>
              <span style={styles.rewardIcon}>💰</span>
              <div>
                <p style={styles.rewardLabel}>Commission Potential</p>
                <p style={styles.rewardValue}>Per click or purchase</p>
              </div>
            </div>
            <div style={styles.rewardItem}>
              <span style={styles.rewardIcon}>👑</span>
              <div>
                <p style={styles.rewardLabel}>Featured Outfit Bonus</p>
                <p style={styles.rewardValue}>+500 coins (if selected)</p>
              </div>
            </div>
          </div>

          <div style={styles.checkboxes}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              I confirm this is my own outfit and content
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
              Make my outfit public so other Besties can discover it
            </label>
          </div>

          <div style={styles.navigationButtons}>
            <button onClick={() => setStep(3)} style={styles.backBtn}>
              ← Back
            </button>
            <button style={styles.publishBtn}>
              🎉 Publish & Earn Coins
            </button>
          </div>

          <p style={styles.successMsg}>
            ✨ Once published, your outfit appears in the community gallery and you'll start earning rewards!
          </p>
        </section>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
  stepsContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "32px",
    justifyContent: "space-between",
  },
  step: {
    flex: 1,
    textAlign: "center",
    padding: "16px",
    background: "#f9fafb",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  stepActive: {
    background: "#fff5fa",
    borderColor: "#ff4fa3",
  },
  stepNumber: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  stepLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    margin: 0,
  },
  section: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "32px",
  },
  stepTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  stepDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  uploadZone: {
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
    marginBottom: "24px",
    background: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  hiddenInput: {
    display: "none",
  },
  uploadLabel: {
    cursor: "pointer",
    display: "block",
  },
  uploadContent: {
    pointerEvents: "none",
  },
  uploadIcon: {
    fontSize: "48px",
    margin: "0 0 12px 0",
  },
  uploadText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    margin: "0",
  },
  uploadHint: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "4px 0 0 0",
  },
  previewSection: {
    display: "flex",
    gap: "20px",
    marginBottom: "24px",
  },
  photoPreview: {
    flex: 1,
    maxWidth: "400px",
  },
  previewImg: {
    width: "100%",
    borderRadius: "8px",
    background: "#f9fafb",
  },
  photoInfo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  photoName: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 8px 0",
  },
  changeBtn: {
    padding: "8px 16px",
    background: "#f3e3ff",
    color: "#a855f7",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  captionSection: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    minHeight: "100px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  taggingSuggestions: {
    marginBottom: "24px",
  },
  suggestionLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  quickTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tagButton: {
    padding: "8px 16px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tagButtonActive: {
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    borderColor: "transparent",
  },
  selectedTags: {
    marginBottom: "24px",
  },
  selectedLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
    textTransform: "uppercase",
  },
  tagsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  selectedTag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "#fff5fa",
    border: "1px solid #ff4fa3",
    borderRadius: "20px",
    fontSize: "12px",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#ff4fa3",
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  itemCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  itemTag: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#ff4fa3",
    margin: "0 0 12px 0",
  },
  itemInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    marginBottom: "8px",
    boxSizing: "border-box",
  },
  itemHint: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: "8px 0 0 0",
  },
  affiliateNote: {
    display: "flex",
    gap: "12px",
    background: "#ffe7f6",
    border: "1px solid #ffb3dd",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  affiliateIcon: {
    fontSize: "24px",
    margin: 0,
  },
  affiliateTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  affiliateText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  summaryBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  summaryTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  rewardsBox: {
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    border: "2px solid #a855f7",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  rewardsTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  rewardItem: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
  },
  rewardIcon: {
    fontSize: "20px",
  },
  rewardLabel: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 2px 0",
  },
  rewardValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ff4fa3",
    margin: 0,
  },
  checkboxes: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    cursor: "pointer",
  },
  checkbox: {
    cursor: "pointer",
  },
  navigationButtons: {
    display: "flex",
    gap: "12px",
  },
  backBtn: {
    padding: "12px 20px",
    background: "#f9fafb",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  nextBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  publishBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
  },
  successMsg: {
    marginTop: "16px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
    textAlign: "center",
  },
};
