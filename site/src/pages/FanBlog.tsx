import React, { useState } from 'react'
import '../styles/fan-blog.css'

const BLOG_POSTS = [
  { id: 1, emoji: '✨', title: 'Fashion Philosophy', excerpt: 'Discover the principles guiding my style', author: 'Lala', date: '2025-12-20', readTime: 5 },
  { id: 2, emoji: '👗', title: 'My Signature Look', excerpt: 'The story behind my iconic style', author: 'Lala', date: '2025-12-18', readTime: 7 },
  { id: 3, emoji: '🎨', title: 'Color Theory Basics', excerpt: 'Master color combinations for styling', author: 'Team', date: '2025-12-15', readTime: 6 },
  { id: 4, emoji: '💰', title: 'Budget Fashion Hacks', excerpt: 'Look fabulous on any budget', author: 'Lala', date: '2025-12-12', readTime: 4 },
  { id: 5, emoji: '🌈', title: 'Pattern Mixing Guide', excerpt: 'Bold combos that actually work', author: 'Team', date: '2025-12-10', readTime: 8 },
]

export default function FanBlog() {
  const [selectedPost, setSelectedPost] = useState(BLOG_POSTS[0])

  return (
    <div className="fan-blog">
      {/* Featured Post */}
      <section className="fb-hero">
        <div className="fb-hero-content">
          <div className="fb-hero-emoji">{selectedPost.emoji}</div>
          <h1 className="fb-hero-title">{selectedPost.title}</h1>
          <p className="fb-hero-desc">{selectedPost.excerpt}</p>
          <div className="fb-hero-meta">
            <span>By {selectedPost.author}</span>
            <span>•</span>
            <span>{selectedPost.date}</span>
            <span>•</span>
            <span>{selectedPost.readTime} min read</span>
          </div>
          <button className="fb-btn-primary">Read Article →</button>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="fb-section">
        <h2 className="fb-section-title">Latest Articles</h2>
        <div className="fb-grid">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              className={`fb-post-card ${selectedPost.id === post.id ? 'active' : ''}`}
              onClick={() => setSelectedPost(post)}
            >
              <div className="fb-post-emoji">{post.emoji}</div>
              <h3 className="fb-post-title">{post.title}</h3>
              <p className="fb-post-excerpt">{post.excerpt}</p>
              <div className="fb-post-meta">
                <span className="fb-post-author">{post.author}</span>
                <span className="fb-post-readtime">{post.readTime}m</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
