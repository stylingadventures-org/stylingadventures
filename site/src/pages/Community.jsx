import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/community.css'

export default function Community() {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')
  const [commentingOn, setCommentingOn] = useState(null)
  const [comments, setComments] = useState({
    1: [
      { id: 1, author: 'StyleQueen', avatar: '👑', text: 'Love this look!' },
      { id: 2, author: 'FashionForward', avatar: '✨', text: 'Where did you get that?' }
    ],
    2: [{ id: 3, author: 'TrendSetter', avatar: '⭐', text: 'This is fire!' }]
  })

  // Mock feed data
  const feedPosts = [
    {
      id: 1,
      author: 'StyleGurus',
      avatar: '👗',
      handle: '@stylegurus',
      timestamp: '2 hours ago',
      content: 'New Spring Collection Drop! 🌸✨',
      image: '🖼️',
      likes: 1240,
      shares: 89,
      liked: false,
      type: 'post'
    },
    {
      id: 2,
      author: 'TrendMaster',
      avatar: '🎬',
      handle: '@trendmaster',
      timestamp: '4 hours ago',
      content: 'Watch how to style oversized blazers for any occasion 👌',
      image: '📹',
      likes: 3450,
      shares: 267,
      liked: false,
      type: 'video'
    },
    {
      id: 3,
      author: 'ClosetGoals',
      avatar: '💎',
      handle: '@closetgoals',
      timestamp: '6 hours ago',
      content: 'Thrifting finds that look like designer pieces!',
      image: '📸',
      likes: 2100,
      shares: 145,
      liked: false,
      type: 'post'
    }
  ]

  const trendingTopics = [
    { hashtag: '#SpringFashion', posts: '245K posts', trending: true },
    { hashtag: '#SustainableFashion', posts: '189K posts', trending: true },
    { hashtag: '#VintageStyle', posts: '156K posts', trending: false },
    { hashtag: '#StreetStyle', posts: '298K posts', trending: true },
    { hashtag: '#MinimalChic', posts: '127K posts', trending: false }
  ]

  const suggestedAccounts = [
    { name: 'FashionWeekly', handle: '@fashionweekly', followers: '542K', avatar: '📰' },
    { name: 'StyleInsider', handle: '@styleinsider', followers: '389K', avatar: '🎭' },
    { name: 'TrendAlert', handle: '@trendalert', followers: '678K', avatar: '🚨' },
    { name: 'CreatorHub', handle: '@creatorhub', followers: '421K', avatar: '🎨' }
  ]

  const handleComment = (postId, commentText) => {
    if (commentText.trim()) {
      const newComment = {
        id: Math.max(...(comments[postId]?.map(c => c.id) || [0])) + 1,
        author: user?.email?.split('@')[0] || 'You',
        avatar: '😊',
        text: commentText
      }
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }))
      setCommentingOn(null)
    }
  }

  return (
    <div className="community-container">
      {/* Header */}
      <div className="community-header">
        <div className="header-content">
          <div className="header-title">
            <span className="bee-icon">🐝</span>
            <h1>Socialbee</h1>
            <p>Your Fashion Community Hub</p>
          </div>
          {isAuthenticated && (
            <button className="create-post-btn">
              ✏️ Create Post
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="community-tabs">
        <button 
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          🏠 Feed
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
        <button 
          className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          👥 Suggestions
        </button>
      </div>

      {/* Main Content */}
      <div className="community-content">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div className="feed-container">
            {!isAuthenticated && (
              <div className="login-prompt">
                <div className="prompt-card">
                  <span className="prompt-icon">🔐</span>
                  <h3>Join Our Community!</h3>
                  <p>Sign in to share your style, comment on posts, and connect with fashionistas worldwide.</p>
                  <button className="prompt-btn">Login to Continue</button>
                </div>
              </div>
            )}

            {feedPosts.map(post => (
              <div key={post.id} className="feed-post">
                {/* Post Header */}
                <div className="post-header">
                  <div className="post-author">
                    <span className="author-avatar">{post.avatar}</span>
                    <div className="author-info">
                      <h4>{post.author}</h4>
                      <span className="post-meta">{post.handle} • {post.timestamp}</span>
                    </div>
                  </div>
                  <button className="more-btn">⋯</button>
                </div>

                {/* Post Content */}
                <div className="post-content">
                  <p>{post.content}</p>
                  <div className="post-media">{post.image}</div>
                </div>

                {/* Post Stats */}
                <div className="post-stats">
                  <span>❤️ {post.likes.toLocaleString()}</span>
                  <span>💬 {comments[post.id]?.length || 0}</span>
                  <span>↗️ {post.shares.toLocaleString()}</span>
                </div>

                {/* Post Actions */}
                <div className="post-actions">
                  <button className="action-btn">👍 Like</button>
                  <button className="action-btn" onClick={() => setCommentingOn(post.id)}>💬 Comment</button>
                  <button className="action-btn">↗️ Share</button>
                </div>

                {/* Comments Section */}
                {comments[post.id] && comments[post.id].length > 0 && (
                  <div className="comments-section">
                    {comments[post.id].map(comment => (
                      <div key={comment.id} className="comment">
                        <span className="comment-avatar">{comment.avatar}</span>
                        <div className="comment-content">
                          <span className="comment-author">{comment.author}</span>
                          <p>{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                {commentingOn === post.id && (
                  <div className="comment-input-section">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      className="comment-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleComment(post.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="trending-container">
            <div className="trending-list">
              {trendingTopics.map((topic, idx) => (
                <div key={idx} className="trending-item">
                  <div className="trending-info">
                    <h4>{topic.hashtag}</h4>
                    <p>{topic.posts}</p>
                  </div>
                  {topic.trending && <span className="trending-badge">🔥 TRENDING</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="suggestions-container">
            <div className="suggestions-grid">
              {suggestedAccounts.map((account, idx) => (
                <div key={idx} className="suggestion-card">
                  <div className="suggestion-avatar">{account.avatar}</div>
                  <h4>{account.name}</h4>
                  <p className="suggestion-handle">{account.handle}</p>
                  <p className="suggestion-followers">{account.followers} followers</p>
                  <button className="follow-btn">Follow</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside className="community-sidebar">
          <div className="sidebar-section">
            <h3>💡 Trending Now</h3>
            {trendingTopics.slice(0, 3).map((topic, idx) => (
              <div key={idx} className="trending-tag">
                <span>{topic.hashtag}</span>
                <small>{topic.posts}</small>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>⭐ Featured Creators</h3>
            {suggestedAccounts.slice(0, 3).map((account, idx) => (
              <div key={idx} className="featured-creator">
                <span className="creator-avatar-small">{account.avatar}</span>
                <div className="creator-details">
                  <p className="creator-name">{account.name}</p>
                  <small>{account.followers}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>ℹ️ About Socialbee</h3>
            <p className="about-text">Connect, share, and discover amazing fashion content with our global styling community. Follow creators, comment on posts, and stay on top of the latest trends!</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
