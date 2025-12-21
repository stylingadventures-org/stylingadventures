import React, { useState } from "react";

export default function AIContentStudio() {
  const [contentType, setContentType] = useState("post");
  const [tone, setTone] = useState("authentic");
  const [generated, setGenerated] = useState(null);

  const handleGenerate = () => {
    const examples = {
      post: {
        hook: "Here's why most creators fail at consistency...",
        caption: "The problem isn't ideas. It's direction.\n\nWhen I started, I posted everything: tips, stories, promotions, random thoughts. I got burned out because I had no strategy.\n\nThen I did this ONE thing:\n\n→ Defined 3 content pillars\n→ Stuck to them\n→ Everything else was a NO\n\nNow? My content feels cohesive. My audience knows what to expect. And I'm WAY more motivated to create.\n\nWhat's your biggest content struggle? Drop it below 👇",
        cta: "Comment your biggest content block",
      },
      email: {
        subject: "One tiny shift that changed everything",
        preview: "It's not what you think...",
        body: "Hey [Name],\n\nLast week I almost quit creating.\n\nI'd been posting 5 days a week for 2 months and had nothing to show for it. No sales. No growth. Just exhaustion.\n\nThen my coach asked ONE question: \"Who are you really creating for?\"\n\nThat question changed everything.\n\nI realized I'd been chasing Instagram virality while my ideal clients were in my email list. I was creating content for the algorithm, not for the people who actually buy from me.\n\nSo I made ONE shift:\n\nInstead of posting for vanity metrics, I started creating to move people toward my offer.\n\nSame effort. Different direction. Different results.\n\nHere's what changed:\n→ I stopped worrying about engagement rates\n→ I wrote content my ideal client actually wanted\n→ I sold more without selling harder\n\nWhat if ONE shift is all you need too?\n\nReply to this email. Tell me what's blocking your growth right now.\n\n- [Your Name]",
      },
      script: {
        title: "TikTok: The One Question That Changed My Content",
        duration: "60 seconds",
        script: "HOOK (0-3 sec):\n\"I almost quit creating last month\"\n\nSTORY (3-45 sec):\n\"I was posting every day. No results. Just burnout. Then I asked ONE question: Who am I REALLY creating for?\"\n\n\"That's when everything changed.\"\n\n\"I stopped creating for the algorithm. Started creating for my people.\"\n\n\"Same effort. Different direction.\"\n\nCTA (45-60 sec):\n\"What's YOUR biggest content block? Comment below.\"\n\nON-SCREEN TEXT:\n\"Direction > Ideas\"\n\"Who are you creating for?\"\n\"Strategy beats ideas every time\"",
      },
    };

    setGenerated(examples[contentType]);
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>✨ AI STUDIO</p>
          <h1 style={styles.title}>AI Content Generator</h1>
          <p style={styles.subtitle}>
            Thoughts → Publish-ready content in minutes
          </p>
        </div>
      </section>

      {/* GENERATOR */}
      <div style={styles.grid}>
        {/* CONTROLS */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Generate Content</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Content Type</label>
            <select
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value);
                setGenerated(null);
              }}
              style={styles.select}
            >
              <option value="post">Instagram Post</option>
              <option value="email">Email</option>
              <option value="script">TikTok Script</option>
              <option value="blog">Blog Post</option>
              <option value="caption">Caption Ideas</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tone</label>
            <div style={styles.toneButtons}>
              {["authentic", "professional", "playful"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    ...styles.toneBtn,
                    ...(tone === t ? styles.toneBtnActive : {}),
                  }}
                >
                  {t === "authentic" && "🤝"}
                  {t === "professional" && "💼"}
                  {t === "playful" && "😄"}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>What's your main idea?</label>
            <textarea
              placeholder="E.g., Why consistency matters in content creation"
              style={styles.textarea}
            />
          </div>

          <button onClick={handleGenerate} style={styles.generateBtn}>
            ✨ Generate Content
          </button>
        </section>

        {/* OUTPUT */}
        {generated && (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Your Content</h2>
            {contentType === "post" && (
              <>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Hook</p>
                  <p style={styles.content}>{generated.hook}</p>
                </div>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Caption</p>
                  <p style={styles.content}>{generated.caption}</p>
                </div>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>CTA</p>
                  <p style={styles.content}>{generated.cta}</p>
                </div>
              </>
            )}
            {contentType === "email" && (
              <>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Subject Line</p>
                  <p style={styles.content}>{generated.subject}</p>
                </div>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Preview Text</p>
                  <p style={styles.content}>{generated.preview}</p>
                </div>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Email Body</p>
                  <p style={styles.content}>{generated.body}</p>
                </div>
              </>
            )}
            {contentType === "script" && (
              <>
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>{generated.title}</p>
                  <p style={styles.sectionMeta}>{generated.duration}</p>
                  <p style={styles.content}>{generated.script}</p>
                </div>
              </>
            )}
            <div style={styles.actions}>
              <button style={styles.copyBtn}>📋 Copy All</button>
              <button style={styles.saveBtn}>💾 Save to Library</button>
              <button style={styles.editBtn}>✏️ Edit</button>
            </div>
          </section>
        )}
      </div>

      {/* FEATURES */}
      <section style={styles.featuresBox}>
        <h2 style={styles.featuresTitle}>🧠 AI Uses Your Profile To Create</h2>
        <div style={styles.featuresList}>
          <div style={styles.feature}>
            <p style={styles.featureIcon}>🎭</p>
            <p style={styles.featureName}>Your Voice</p>
            <p style={styles.featureDesc}>Matches your tone & brand personality</p>
          </div>
          <div style={styles.feature}>
            <p style={styles.featureIcon}>🏛️</p>
            <p style={styles.featureName}>Your Pillars</p>
            <p style={styles.featureDesc}>Stays on-brand with your content pillars</p>
          </div>
          <div style={styles.feature}>
            <p style={styles.featureIcon}>👥</p>
            <p style={styles.featureName}>Your Audience</p>
            <p style={styles.featureDesc}>Resonates with who you're serving</p>
          </div>
          <div style={styles.feature}>
            <p style={styles.featureIcon}>💰</p>
            <p style={styles.featureName}>Your Offers</p>
            <p style={styles.featureDesc}>Content naturally leads to sales</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  css: `button:hover { opacity: 0.85; }`,
  hero: {
    marginBottom: "32px",
    padding: "32px",
    background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#be185d",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 20px 0",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "6px",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
  },
  toneButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  toneBtn: {
    padding: "8px 12px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  toneBtnActive: {
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    borderColor: "transparent",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "13px",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  generateBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  section: {
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    margin: "0 0 8px 0",
  },
  sectionMeta: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: "0 0 8px 0",
  },
  content: {
    fontSize: "13px",
    color: "#374151",
    margin: 0,
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  copyBtn: {
    flex: 1,
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 1,
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  editBtn: {
    flex: 1,
    padding: "8px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  featuresBox: {
    background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
    borderRadius: "12px",
    padding: "24px",
  },
  featuresTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#be185d",
    margin: "0 0 16px 0",
  },
  featuresList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  feature: {
    textAlign: "center",
  },
  featureIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  featureName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#be185d",
    margin: "0 0 4px 0",
  },
  featureDesc: {
    fontSize: "12px",
    color: "#9f1239",
    margin: 0,
  },
};
