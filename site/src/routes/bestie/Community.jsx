import React, { useState } from "react";

const SAMPLE_POSTS = [
  {
    id: 1,
    author: "Sarah M.",
    avatar: "👩‍🦰",
    content: "Just saved this neutral capsule wardrobe for work trips!",
    likes: 24,
    comments: 3,
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    author: "Maya K.",
    avatar: "👩‍🦱",
    content: "My style analytics showed I wear navy 3× more than I thought 😅",
    likes: 18,
    comments: 5,
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    author: "Lala Team",
    avatar: "✨",
    content: "New Smart Cart feature is live! Get AI-curated item recommendations 🛍️",
    likes: 156,
    comments: 42,
    timestamp: "1 day ago",
  },
];

export default function BestieCommunity() {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [newPost, setNewPost] = useState("");
  const [likes, setLikes] = useState({});

  const handleLike = (id) => {
    setLikes({
      ...likes,
      [id]: (likes[id] || 0) + 1,
    });
  };

  const handlePost = () => {
    if (newPost.trim()) {
      setPosts([
        {
          id: posts.length + 1,
          author: "You",
          avatar: "👤",
          content: newPost,
          likes: 0,
          comments: 0,
          timestamp: "Just now",
        },
        ...posts,
      ]);
      setNewPost("");
    }
  };

  return (
    <div style={styles.container}>
      <style>{styles.css}</style>

      {/* HERO */}
      <section style={styles.hero}>
        <div>
          <p style={styles.pill}>👥 COMMUNITY</p>
          <h1 style={styles.title}>Bestie Circle</h1>
          <p style={styles.subtitle}>
            Connect, share, and inspire with other fashion-forward Besties
          </p>
        </div>
      </section>

      <div style={styles.mainGrid}>
        {/* FEED */}
        <section style={styles.feedSection}>
          {/* POST CREATOR */}
          <div style={styles.postCreator}>
            <textarea
              placeholder="Share your style wins, tips, or outfit inspo..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              style={styles.textarea}
            />
            <div style={styles.creatorFooter}>
              <div style={styles.creatorActions}>
                <button style={styles.actionBtn}>📸</button>
                <button style={styles.actionBtn}>😊</button>
                <button style={styles.actionBtn}>#️⃣</button>
              </div>
              <button
                onClick={handlePost}
                style={styles.postBtn}
                disabled={!newPost.trim()}
              >
                Post
              </button>
            </div>
          </div>

          {/* POSTS */}
          <div style={styles.postsList}>
            {posts.map((post) => (
              <div key={post.id} style={styles.post}>
                <div style={styles.postHeader}>
                  <span style={styles.avatar}>{post.avatar}</span>
                  <div style={styles.postMeta}>
                    <p style={styles.author}>{post.author}</p>
                    <p style={styles.timestamp}>{post.timestamp}</p>
                  </div>
                </div>
                <p style={styles.postContent}>{post.content}</p>
                <div style={styles.postActions}>
                  <button
                    onClick={() => handleLike(post.id)}
                    style={styles.actionButton}
                  >
                    ❤️ {post.likes + (likes[post.id] || 0)}
                  </button>
                  <button style={styles.actionButton}>💬 {post.comments}</button>
                  <button style={styles.actionButton}>↗️ Share</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          {/* TRENDING */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>🔥 Trending Topics</h3>
            <div style={styles.topicsList}>
              {["#WorkStyle", "#CapsuleWardrobe", "#SeasonalMustHaves", "#StyleInspo"].map(
                (topic, idx) => (
                  <button key={idx} style={styles.topicTag}>
                    {topic}
                  </button>
                )
              )}
            </div>
          </div>

          {/* EVENTS */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>📅 Upcoming</h3>
            <div style={styles.eventsList}>
              <div style={styles.event}>
                <p style={styles.eventTitle}>Capsule Workshop</p>
                <p style={styles.eventTime}>Tomorrow at 2PM</p>
              </div>
              <div style={styles.event}>
                <p style={styles.eventTitle}>Style Challenge</p>
                <p style={styles.eventTime}>Friday</p>
              </div>
            </div>
          </div>

          {/* RULES */}
          <div style={styles.sidebarBox}>
            <h3 style={styles.sidebarTitle}>📋 Community Rules</h3>
            <ul style={styles.rulesList}>
              <li>Be respectful & inclusive</li>
              <li>Share authentic feedback</li>
              <li>No spam or self-promotion</li>
              <li>Celebrate everyone's style</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
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
    background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
    borderRadius: "16px",
  },
  pill: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.16em",
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
  },
  feedSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  postCreator: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  textarea: {
    width: "100%",
    minHeight: "80px",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "12px",
  },
  creatorFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creatorActions: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontSize: "16px",
  },
  postBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #ff4fa3, #a855f7)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  postsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  post: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  postHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  avatar: {
    fontSize: "32px",
  },
  postMeta: {
    flex: 1,
  },
  author: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 2px 0",
  },
  timestamp: {
    fontSize: "11px",
    color: "#9ca3af",
    margin: 0,
  },
  postContent: {
    fontSize: "14px",
    color: "#374151",
    margin: "0 0 12px 0",
    lineHeight: "1.5",
  },
  postActions: {
    display: "flex",
    gap: "16px",
  },
  actionButton: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: "600",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sidebarBox: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 12px 0",
  },
  topicsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  topicTag: {
    padding: "8px 12px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#111827",
    cursor: "pointer",
    textAlign: "left",
  },
  eventsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  event: {
    background: "#f9fafb",
    padding: "12px",
    borderRadius: "8px",
  },
  eventTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
  },
  eventTime: {
    fontSize: "11px",
    color: "#6b7280",
    margin: 0,
  },
  rulesList: {
    margin: 0,
    paddingLeft: "16px",
    fontSize: "12px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
};
