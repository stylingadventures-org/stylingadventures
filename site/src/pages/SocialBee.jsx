import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/socialbee.css'

export default function SocialBee() {
  const { userContext, isAuthenticated } = useAuth()
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedComments, setExpandedComments] = useState(null)

  // Mock posts (Instagram + TikTok)
  const mockPosts = [
    {
      id: 1,
      platform: 'tiktok',
      platformLabel: 'TikTok',
      account: '@StyleGurus',
      avatar: '✨',
      content: 'POV: You just discovered the perfect spring jacket 🧥✨ Who else is obsessed?',
      image: '📹',
      status: 'posted',
      timestamp: '2 hours ago',
      likes: 24500,
      comments: 1240,
      shares: 890,
      views: 125000,
      commentsList: [
        { author: 'FashionForward', text: '😭 I NEED THIS' },
        { author: 'StyleQueen', text: 'Where is it from??' },
        { author: 'CreatorHub', text: 'The fit is everything!' }
      ]
    },
    {
      id: 2,
      platform: 'instagram',
      platformLabel: 'Instagram',
      account: '@LalaCloset',
      avatar: '👗',
      content: 'New closet organization hack that changed my life 🔥 Swipe for the after! #OrganizedChaos #ClosetGoals',
      image: '📸',
      status: 'posted',
      timestamp: '4 hours ago',
      likes: 3420,
      comments: 267,
      shares: 145,
      views: null,
      commentsList: [
        { author: 'OrganizeWithMe', text: 'This is genius!! Stealing this idea' },
        { author: 'MinimalistStyle', text: 'So satisfying to watch' },
        { author: 'HomeGoals', text: 'How long did this take?' }
      ]
    },
    {
      id: 3,
      platform: 'tiktok',
      platformLabel: 'TikTok',
      account: '@TrendAlert',
      avatar: '🚨',
      content: 'Fashion trend that ACTUALLY looks good on everyone 💅 Try it!',
      image: '📹',
      status: 'posted',
      timestamp: '5 hours ago',
      likes: 89200,
      comments: 4560,
      shares: 2340,
      views: 543000,
      commentsList: [
        { author: 'Everyone', text: '🔥🔥🔥' },
        { author: 'TrendSetter', text: 'Finally something I can actually wear' },
        { author: 'StyleInspo', text: 'This is THE trend for spring' }
      ]
    },
    {
      id: 4,
      platform: 'instagram',
      platformLabel: 'Instagram',
      account: '@StyleGurus',
      avatar: '✨',
      content: 'Behind the scenes: How we style this season\'s hottest look 📷 Full video on our channel!',
      image: '📸',
      status: 'scheduled',
      timestamp: 'Tomorrow at 2 PM',
      likes: 0,
      comments: 0,
      shares: 0,
      views: null,
      commentsList: []
    },
    {
      id: 5,
      platform: 'tiktok',
      platformLabel: 'TikTok',
      account: '@LalaCloset',
      avatar: '👗',
      content: 'Thrifting finds that cost less than coffee ☕ These are STEALS #ThriftHaul #Affordable',
      image: '📹',
      status: 'draft',
      timestamp: 'Draft',
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      commentsList: []
    }
  ]

  const platforms = [
    { id: 'all', label: '🐝 All', icon: '🐝' },
    { id: 'tiktok', label: '♪ TikTok', icon: '♪' },
    { id: 'instagram', label: '📷 Instagram', icon: '📷' }
  ]

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'posted', label: 'Posted' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'draft', label: 'Drafts' }
  ]

  // Filter posts
  const filteredPosts = mockPosts.filter(post => {
    if (activeFilter === 'all') return true
    return post.platform === activeFilter
  })

  return (
    <div className="socialbee-container">
      {/* Left Sidebar */}
      <aside className="socialbee-sidebar">
        <div className="sidebar-header">
          <span className="bee-logo">🐝</span>
          <h2>SocialBee™</h2>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Hive Feed</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">✏️</span>
            <span className="nav-label">Create</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">💬</span>
            <span className="nav-label">Buzz</span>
            <span className="badge">3</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📅</span>
            <span className="nav-label">Calendar</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="connected-accounts">
            <p className="footer-label">Connected</p>
            <div className="account-list">
              <div className="account-item">
                <span className="account-platform">♪</span>
                <span className="account-name">@StyleGurus</span>
              </div>
              <div className="account-item">
                <span className="account-platform">📷</span>
                <span className="account-name">@LalaCloset</span>
              </div>
            </div>
          </div>
          <button className="btn-secondary">+ Connect Account</button>
        </div>
      </aside>

      {/* Main Feed */}
      <div className="socialbee-main">
        {/* Header */}
        <div className="feed-header">
          <div className="header-title">
            <h1>🐝 Hive Feed</h1>
            <p>Everything you've posted, everywhere</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <span className="filter-label">Platform:</span>
            <div className="filter-chips">
              {platforms.map(p => (
                <button
                  key={p.id}
                  className={`filter-chip ${activeFilter === p.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Timeline */}
        <div className="feed-timeline">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🐝</span>
              <h3>No posts found</h3>
              <p>Try connecting an account or changing filters</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className={`feed-post ${post.status}`}>
                {/* Post Header */}
                <div className="post-header">
                  <div className="post-meta">
                    <span className={`platform-badge ${post.platform}`}>
                      {post.platformLabel}
                    </span>
                    <span className="account-name">{post.account}</span>
                    <span className="timestamp">{post.timestamp}</span>
                  </div>
                  <div className="status-indicator">
                    {post.status === 'posted' && <span className="badge-posted">✓ Posted</span>}
                    {post.status === 'scheduled' && <span className="badge-scheduled">⏱ Scheduled</span>}
                    {post.status === 'draft' && <span className="badge-draft">✏️ Draft</span>}
                  </div>
                </div>

                {/* Post Content */}
                <div className="post-content">
                  <p className="post-caption">{post.content}</p>
                  <div className="post-media">{post.image}</div>
                </div>

                {/* Engagement Stats */}
                {post.status === 'posted' && (
                  <div className="engagement-row">
                    <span className="engagement-stat">❤️ {post.likes.toLocaleString()}</span>
                    <span className="engagement-stat">💬 {post.comments.toLocaleString()}</span>
                    <span className="engagement-stat">🔁 {post.shares.toLocaleString()}</span>
                    {post.views && <span className="engagement-stat">👁 {post.views.toLocaleString()}</span>}
                  </div>
                )}

                {/* Engagement Peek */}
                {post.status === 'posted' && post.commentsList.length > 0 && (
                  <div className="engagement-peek">
                    <button
                      className="peek-toggle"
                      onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                    >
                      View Buzz ({post.comments})
                    </button>

                    {expandedComments === post.id && (
                      <div className="comments-preview">
                        {post.commentsList.map((comment, idx) => (
                          <div key={idx} className="comment-item">
                            <strong>{comment.author}</strong>
                            <p>{comment.text}</p>
                          </div>
                        ))}
                        <button className="btn-text">View all comments →</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="post-actions">
                  {post.status === 'draft' && (
                    <>
                      <button className="btn-primary">Publish</button>
                      <button className="btn-secondary">Schedule</button>
                    </>
                  )}
                  {post.status === 'posted' && (
                    <>
                      <button className="btn-secondary">💬 Reply</button>
                      <button className="btn-secondary">🔄 Repost</button>
                      <button className="btn-secondary">📌 Save</button>
                    </>
                  )}
                  {post.status === 'scheduled' && (
                    <>
                      <button className="btn-secondary">Edit</button>
                      <button className="btn-secondary">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Buzz/Engagement */}
      <aside className="socialbee-buzz">
        <div className="buzz-header">
          <h3>💬 Buzz</h3>
          <p className="buzz-subtext">What people are saying</p>
        </div>

        <div className="buzz-content">
          {/* Buzz Items */}
          <div className="buzz-item priority">
            <span className="buzz-icon">🔥</span>
            <div className="buzz-text">
              <strong>@StyleGurus</strong>
              <p>Your TikTok just hit 100K views!</p>
              <small>2 min ago</small>
            </div>
          </div>

          <div className="buzz-item">
            <span className="buzz-icon">❤️</span>
            <div className="buzz-text">
              <strong>@FashionIcon</strong>
              <p>Loved your closet hack! 😍</p>
              <small>5 min ago</small>
            </div>
          </div>

          <div className="buzz-item">
            <span className="buzz-icon">💬</span>
            <div className="buzz-text">
              <strong>@TrendSetter</strong>
              <p>How did you find this piece?</p>
              <small>12 min ago</small>
            </div>
          </div>

          <div className="buzz-section-title">
            <span>All Notifications</span>
          </div>

          <div className="buzz-item">
            <span className="buzz-icon">👍</span>
            <div className="buzz-text">
              <strong>@StyleGurus</strong>
              <p>Liked your post</p>
              <small>1 hour ago</small>
            </div>
          </div>

          <div className="buzz-item">
            <span className="buzz-icon">👥</span>
            <div className="buzz-text">
              <strong>@Creator</strong>
              <p>Started following you</p>
              <small>3 hours ago</small>
            </div>
          </div>
        </div>

        {/* Platform Filters */}
        <div className="buzz-filters">
          <p className="buzz-filter-label">Filter by platform</p>
          <div className="mini-chips">
            <button className="mini-chip active">All</button>
            <button className="mini-chip">TikTok</button>
            <button className="mini-chip">Instagram</button>
          </div>
        </div>
      </aside>
    </div>
  )
}
