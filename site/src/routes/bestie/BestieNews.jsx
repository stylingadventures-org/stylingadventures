import React, { useState } from "react";

const NEWS_ITEMS = [
  {
    id: 1,
    timestamp: "5 mins ago",
    type: "breaking",
    icon: "🔥",
    headline: "Lala's Night Out Look Goes Viral",
    preview: "The Episode 6 outfit that has everyone talking. 12.4K reactions already!",
    reactions: { love: 4230, fire: 3120, amazing: 2890 },
    reactionEmojis: { love: "💕", fire: "🔥", amazing: "😍" },
  },
  {
    id: 2,
    timestamp: "2 hours ago",
    type: "community",
    icon: "💬",
    headline: "Community Recreations Are FIRE",
    preview: "Check out how Besties are styling Lala's looks IRL. Some are better than the show!",
    reactions: { amazing: 5640, perfect: 3450, clap: 2100 },
    reactionEmojis: { amazing: "😍", perfect: "💯", clap: "👏" },
  },
  {
    id: 3,
    timestamp: "4 hours ago",
    type: "behind-scenes",
    icon: "🎬",
    headline: "Renee Drops a Behind-The-Scenes Teaser",
    preview: "See how she styles Lala's makeup in real time. The precision is INSANE.",
    reactions: { mind: 6780, art: 4560, perfect: 3340 },
    reactionEmojis: { mind: "🤯", art: "🎨", perfect: "💯" },
  },
  {
    id: 4,
    timestamp: "7 hours ago",
    type: "achievement",
    icon: "🏆",
    headline: "100K Besties Milestone Celebration!",
    preview: "We hit 100,000 members! Thank you for making Styling Adventures legendary.",
    reactions: { party: 8900, love: 7340, hands: 5670 },
    reactionEmojis: { party: "🎉", love: "💕", hands: "🙌" },
  },
  {
    id: 5,
    timestamp: "1 day ago",
    type: "shop",
    icon: "🛍️",
    headline: "New Affiliate Collection: Sustainable Style",
    preview: "Eco-friendly pieces that match Lala's aesthetic. Support the planet and earn coins!",
    reactions: { heart: 4230, fashion: 3890, earth: 2560 },
    reactionEmojis: { heart: "💚", fashion: "👗", earth: "🌍" },
  },
];

const TRENDING_TOPICS = [
  { tag: "#LalasWardrobeGoals", count: "24.5K" },
  { tag: "#EpisodeStyleRecap", count: "18.3K" },
  { tag: "#BestiesCommunity", count: "16.8K" },
  { tag: "#StyleTheory", count: "12.4K" },
  { tag: "#LalaTheories", count: "9.7K" },
];

export default function BestieNews() {
  const [reactions, setReactions] = useState({});

  const toggleReaction = (newsId, emoji) => {
    const key = `${newsId}-${emoji}`;
    setReactions({
      ...reactions,
      [key]: !reactions[key],
    });
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>📰 BESTIE NEWS</p>
          <h1 style={styles.title}>Stay in the Loop</h1>
          <p style={styles.subtitle}>
            Real-time updates on Lala, the community, and the culture we're building together
          </p>
        </div>
      </section>

      <div style={styles.mainContent}>
        {/* NEWS FEED */}
        <section style={styles.newsFeed}>
          <h2 style={styles.feedTitle}>Latest Updates</h2>
          {NEWS_ITEMS.map((item) => (
            <article key={item.id} style={styles.newsCard}>
              <div style={styles.newsHeader}>
                <div style={styles.newsType}>
                  <span style={styles.typeIcon}>{item.icon}</span>
                  <span style={styles.typeLabel}>{item.type.replace("-", " ").toUpperCase()}</span>
                </div>
                <span style={styles.timestamp}>{item.timestamp}</span>
              </div>

              <h3 style={styles.newsHeadline}>{item.headline}</h3>
              <p style={styles.newsPreview}>{item.preview}</p>

              <div style={styles.reactions}>
                {Object.entries(item.reactions).map(([key, count]) => (
                  <button
                    key={key}
                    onClick={() => toggleReaction(item.id, key)}
                    style={{
                      ...styles.reactionBtn,
                      ...(reactions[`${item.id}-${key}`] ? styles.reactionActive : {}),
                    }}
                  >
                    <span>{item.reactionEmojis[key]}</span>
                    <span style={styles.reactionCount}>{count}</span>
                  </button>
                ))}
              </div>

              <button style={styles.readMore}>Read Full Story →</button>
            </article>
          ))}
        </section>

        {/* SIDEBAR - TRENDING */}
        <aside style={styles.sidebar}>
          <div style={styles.trendingBox}>
            <h3 style={styles.trendingTitle}>🔥 Trending in Besties</h3>
            <div style={styles.trendingList}>
              {TRENDING_TOPICS.map((topic, idx) => (
                <div key={idx} style={styles.trendingItem}>
                  <p style={styles.trendingTag}>{topic.tag}</p>
                  <p style={styles.trendingCount}>{topic.count} posts</p>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.newsletterBox}>
            <h3 style={styles.newsLetterTitle}>💌 Get Updates</h3>
            <p style={styles.newsLetterDesc}>
              Get Bestie News delivered to your inbox every Friday
            </p>
            <input type="email" placeholder="Your email" style={styles.emailInput} />
            <button style={styles.subscribeBtn}>Subscribe</button>
          </div>

          <div style={styles.communityBox}>
            <h3 style={styles.communityTitle}>👥 Community Stats</h3>
            <div style={styles.statRow}>
              <span>Total Besties</span>
              <strong>100.2K</strong>
            </div>
            <div style={styles.statRow}>
              <span>This Week Active</span>
              <strong>67.8K</strong>
            </div>
            <div style={styles.statRow}>
              <span>Stories Shared</span>
              <strong>8,456</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  css: `
    button:hover {
      opacity: 0.85;
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
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: "32px",
  },
  newsFeed: {},
  feedTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  },
  newsCard: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
    transition: "all 0.2s",
  },
  newsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  newsType: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  typeIcon: {
    fontSize: "16px",
  },
  typeLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  timestamp: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  newsHeadline: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  },
  newsPreview: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 16px 0",
    lineHeight: "1.6",
  },
  reactions: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  reactionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 10px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  reactionActive: {
    background: "#fff5fa",
    borderColor: "#ff4fa3",
  },
  reactionCount: {
    fontSize: "11px",
    color: "#6b7280",
  },
  readMore: {
    background: "transparent",
    border: "none",
    color: "#ff4fa3",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    padding: 0,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  trendingBox: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  trendingTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  trendingList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  trendingItem: {
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  trendingTag: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  trendingCount: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
  },
  newsletterBox: {
    background: "linear-gradient(135deg, #ffe7f6, #f3e3ff)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  newsLetterTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px 0",
  },
  newsLetterDesc: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 12px 0",
  },
  emailInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    fontSize: "12px",
    marginBottom: "8px",
    boxSizing: "border-box",
  },
  subscribeBtn: {
    width: "100%",
    padding: "8px 12px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
  },
  communityBox: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  communityTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "8px",
    marginBottom: "8px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "12px",
  },
};
