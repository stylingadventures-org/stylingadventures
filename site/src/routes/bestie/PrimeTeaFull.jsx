import React, { useState } from "react";

const CATEGORIES = [
  {
    id: 1,
    name: "Full Articles",
    icon: "📄",
    description: "Deep dives on style, lore, and behind-the-scenes magic",
    items: [
      {
        title: "The Psychology of Lala's Color Palette",
        author: "Renee",
        reads: "2.4K",
        premium: true,
        comments: "234",
      },
      {
        title: "Season 1 Fashion Breakdown: Episode by Episode",
        author: "Style Team",
        reads: "3.1K",
        premium: true,
        comments: "456",
      },
      {
        title: "How Real Fashion Influences Lala's Looks",
        author: "Renee",
        reads: "1.8K",
        premium: true,
        comments: "189",
      },
    ],
  },
  {
    id: 2,
    name: "Trend Predictions",
    icon: "🔮",
    description: "What's next in the Styling Adventures universe",
    items: [
      {
        title: "Q1 2026 Fashion Forecast: What Lala Might Wear",
        author: "Trend Team",
        reads: "4.2K",
        premium: true,
        comments: "567",
      },
      {
        title: "The Cottagecore Influence We're Seeing",
        author: "Creative",
        reads: "2.7K",
        premium: true,
        comments: "342",
      },
    ],
  },
  {
    id: 3,
    name: "Bestie Spotlights",
    icon: "⭐",
    description: "Celebrate amazing Besties doing amazing things",
    items: [
      {
        title: "Feature: Maya's IRL Lala Recreation Goes Viral",
        author: "Community Team",
        reads: "5.6K",
        premium: true,
        comments: "892",
      },
      {
        title: "Artist Feature: The Fan Art That Made Us Cry",
        author: "Creative",
        reads: "3.3K",
        premium: true,
        comments: "456",
      },
    ],
  },
];

const THEORIES = [
  {
    id: 1,
    title: "Why Lala Always Wears Gold",
    author: "TheoryTeam",
    votes: "1.2K",
    replies: "234",
    pinned: true,
  },
  {
    id: 2,
    title: "The Crew's Hidden Connection Theory",
    author: "Fan_Deep_Diver",
    votes: "892",
    replies: "156",
    pinned: true,
  },
  {
    id: 3,
    title: "Musical References in Episode 5's Styling",
    author: "MusicNerd",
    votes: "567",
    replies: "89",
    pinned: false,
  },
];

export default function PrimeTea() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [expandedTheory, setExpandedTheory] = useState(null);

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>☕ PRIME TEA</p>
          <h1 style={styles.title}>The Deep Dive</h1>
          <p style={styles.subtitle}>
            Full articles, trend predictions, and Bestie theories. This is where the real conversation happens.
          </p>
        </div>
      </section>

      {/* FEATURED ARTICLE */}
      <section style={styles.featured}>
        <div style={styles.featuredContent}>
          <span style={styles.featuredBadge}>FEATURED</span>
          <h2 style={styles.featuredTitle}>
            The Hidden Symbolism in Lala's Makeup Choices
          </h2>
          <p style={styles.featuredDesc}>
            Renee breaks down why every makeup look tells a story about Lala's emotional journey.
          </p>
          <div style={styles.featuredMeta}>
            <span>By Renee</span>
            <span>•</span>
            <span>23 min read</span>
            <span>•</span>
            <span>487 comments</span>
          </div>
          <button style={styles.readBtn}>Read Now →</button>
        </div>
        <div style={styles.featuredIcon}>💄</div>
      </section>

      {/* ARTICLES BY CATEGORY */}
      <section style={styles.articlesSection}>
        <div style={styles.categoryTabs}>
          {CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(idx)}
              style={{
                ...styles.categoryTab,
                ...(activeCategory === idx ? styles.categoryTabActive : {}),
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div style={styles.categoryContent}>
          <h2 style={styles.categoryTitle}>
            {CATEGORIES[activeCategory].name}
          </h2>
          <p style={styles.categoryDesc}>
            {CATEGORIES[activeCategory].description}
          </p>

          <div style={styles.articlesList}>
            {CATEGORIES[activeCategory].items.map((item, idx) => (
              <article key={idx} style={styles.articleCard}>
                <div>
                  <h3 style={styles.articleTitle}>{item.title}</h3>
                  <p style={styles.articleMeta}>
                    <strong>{item.author}</strong> • {item.reads} reads
                  </p>
                </div>
                <div style={styles.articleFooter}>
                  <span style={styles.commentCount}>💬 {item.comments}</span>
                  {item.premium && <span style={styles.premiumBadge}>👑 PREMIUM</span>}
                  <button style={styles.viewBtn}>View →</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THEORIES SECTION */}
      <section style={styles.theoriesSection}>
        <h2 style={styles.sectionTitle}>🧵 Bestie Theories</h2>
        <p style={styles.sectionDesc}>
          Share your thoughts, debate theories, and uncover hidden meanings with the community
        </p>

        <div style={styles.theoriesList}>
          {THEORIES.map((theory) => (
            <div
              key={theory.id}
              style={{
                ...styles.theoryCard,
                ...(theory.pinned ? styles.theoryPinned : {}),
              }}
            >
              <div style={styles.theoryHeader}>
                <div>
                  {theory.pinned && <span style={styles.pinIcon}>📌 PINNED</span>}
                  <h3 style={styles.theoryTitle}>{theory.title}</h3>
                  <p style={styles.theoryAuthor}>@{theory.author}</p>
                </div>
                <button
                  onClick={() => setExpandedTheory(expandedTheory === theory.id ? null : theory.id)}
                  style={styles.expandBtn}
                >
                  {expandedTheory === theory.id ? "−" : "+"}
                </button>
              </div>

              <div style={styles.theoryFooter}>
                <span style={styles.theoryVotes}>👍 {theory.votes} upvotes</span>
                <span style={styles.theoryReplies}>💬 {theory.replies} replies</span>
              </div>

              {expandedTheory === theory.id && (
                <div style={styles.theoryExpanded}>
                  <p style={styles.theoryContent}>
                    {theory.id === 1 &&
                      "Gold is symbolic of Lala's confidence and inner light. Every time she faces a challenge, her gold elements become more prominent..."}
                    {theory.id === 2 &&
                      "Notice how Lala, Tony, and Renee always wear complementary colors in scenes together? It's not random—it's showing their balance and harmony..."}
                    {theory.id === 3 &&
                      "The makeup looks in Episode 5 mirror the song choices in the episode's soundtrack. Here's the breakdown..."}
                  </p>
                  <button style={styles.replyBtn}>Join the Discussion →</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Want to Submit Your Theory?</h2>
        <p style={styles.ctaDesc}>
          We love hearing what Besties are thinking. Share your insights and earn community recognition!
        </p>
        <button style={styles.ctaBtn}>Start a Theory Thread</button>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
    }
  `,
  hero: {
    marginBottom: "40px",
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
  featured: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    background: "linear-gradient(135deg, #f3e3ff, #fce7f3)",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "40px",
    border: "2px solid #a855f7",
  },
  featuredContent: {
    flex: 1,
  },
  featuredBadge: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.16em",
    color: "#a855f7",
    textTransform: "uppercase",
  },
  featuredTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: "8px 0",
  },
  featuredDesc: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "8px 0",
  },
  featuredMeta: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "12px 0",
  },
  readBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "12px",
  },
  featuredIcon: {
    fontSize: "64px",
  },
  articlesSection: {
    marginBottom: "40px",
  },
  categoryTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    borderBottom: "2px solid #e5e7eb",
    overflowX: "auto",
    paddingBottom: "12px",
  },
  categoryTab: {
    padding: "8px 16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "#9ca3af",
    borderBottom: "2px solid transparent",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  categoryTabActive: {
    color: "#ff4fa3",
    borderBottomColor: "#ff4fa3",
  },
  categoryContent: {
    marginBottom: "24px",
  },
  categoryTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  categoryDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  articlesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  articleCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    transition: "all 0.2s",
  },
  articleTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  articleMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  articleFooter: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  commentCount: {
    fontSize: "12px",
    color: "#6b7280",
  },
  premiumBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#a855f7",
  },
  viewBtn: {
    padding: "6px 12px",
    background: "#f3e3ff",
    color: "#a855f7",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  theoriesSection: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  sectionDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 20px 0",
  },
  theoriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  theoryCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
  },
  theoryPinned: {
    borderColor: "#a855f7",
    background: "#f9f5ff",
  },
  theoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  pinIcon: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#a855f7",
    letterSpacing: "0.08em",
    marginBottom: "4px",
    display: "inline-block",
  },
  theoryTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "4px 0 4px 0",
  },
  theoryAuthor: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  expandBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6b7280",
  },
  theoryFooter: {
    display: "flex",
    gap: "16px",
    fontSize: "12px",
    color: "#6b7280",
  },
  theoryVotes: {
    cursor: "pointer",
  },
  theoryReplies: {
    cursor: "pointer",
  },
  theoryExpanded: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
  },
  theoryContent: {
    fontSize: "13px",
    color: "#4b5563",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  replyBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  ctaSection: {
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  ctaDesc: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
  },
  ctaBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
};
