import React, { useState } from 'react'
import '../styles/unified-feed.css'

/**
 * UnifiedFeed Component
 * 
 * Card-based unified feed with mixed content types
 * Shows posts from all tiers with platform mirrors
 * 
 * Props:
 * - posts: array of post objects
 * - currentPlatform: 'all' | 'instagram' | 'tiktok' | 'pinterest' | 'x' | 'youtube'
 * - userTier: 'fan' | 'bestie' | 'scene'
 * - userId: current user ID
 * - onPostClick: (post) => void
 * - onEngagement: (postId, action) => void
 */

const UnifiedFeed = ({
  posts = [],
  currentPlatform = 'all',
  userTier = 'fan',
  userId = null,
  onPostClick = () => {},
  onEngagement = () => {}
}) => {
  const [expandedPost, setExpandedPost] = useState(null)
  const [engagementState, setEngagementState] = useState({})

  // Mock posts if none provided
  const mockPosts = [
    {
      id: 'post-1',
      author: {
        id: 'user-1',
        name: 'Sophie Chen',
        username: '@sophiechen',
        tier: 'scene',
        avatar: '👩‍🎨',
        image: null
      },
      content: {
        type: 'image',
        media: '📸',
        caption: 'Just dropped my new collection! Link in bio ✨',
        mediaUrl: null
      },
      platforms: ['instagram', 'tiktok', 'pinterest'],
      mirrored: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      engagement: {
        likes: 2341,
        comments: 156,
        shares: 89
      },
      userInteraction: {
        liked: false,
        commented: false,
        shared: false
      }
    },
    {
      id: 'post-2',
      author: {
        id: 'user-2',
        name: 'Marcus Design',
        username: '@marcusdesign',
        tier: 'bestie',
        avatar: '👨‍💼',
        image: null
      },
      content: {
        type: 'video',
        media: '🎬',
        caption: 'Creative process behind the scenes',
        mediaUrl: null
      },
      platforms: ['youtube'],
      mirrored: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      engagement: {
        likes: 1203,
        comments: 89,
        shares: 45
      },
      userInteraction: {
        liked: false,
        commented: false,
        shared: false
      }
    },
    {
      id: 'post-3',
      author: {
        id: 'user-3',
        name: 'Alex Rivera',
        username: '@alexrivera',
        tier: 'fan',
        avatar: '👩‍🎤',
        image: null
      },
      content: {
        type: 'carousel',
        media: '🎪',
        caption: 'Mood board for my next project',
        mediaUrl: null
      },
      platforms: [],
      mirrored: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      engagement: {
        likes: 456,
        comments: 32,
        shares: 12
      },
      userInteraction: {
        liked: false,
        commented: false,
        shared: false
      }
    }
  ]

  const displayPosts = posts.length > 0 ? posts : mockPosts

  // Filter by platform
  const filteredPosts =
    currentPlatform === 'all'
      ? displayPosts
      : displayPosts.filter(post => post.platforms.includes(currentPlatform))

  const getTierColor = (tier) => {
    const tierMap = {
      fan: { bg: '#fce7f3', text: '#7e22ce', label: '🐝 StyleVerse™' },
      bestie: { bg: '#ffe4f3', text: '#ec4899', label: '🐝🐝 The Style Floor™' },
      scene: { bg: '#f9a8d4', text: '#a855f7', label: '🐝🐝🐝 The Scene™' }
    }
    return tierMap[tier] || tierMap.fan
  }

  const getTierLabel = (tier) => {
    const tierMap = {
      fan: '🐝 StyleVerse™',
      bestie: '🐝🐝 The Style Floor™',
      scene: '🐝🐝🐝 The Scene™'
    }
    return tierMap[tier] || 'StyleVerse™'
  }

  const formatTime = (date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 1) return 'now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleEngagement = (postId, action) => {
    const key = `${postId}-${action}`
    setEngagementState(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    onEngagement(postId, action)
  }

  return (
    <div className="unified-feed">
      {filteredPosts.length === 0 ? (
        <div className="feed-empty">
          <p className="empty-emoji">🌈</p>
          <p className="empty-title">No posts yet</p>
          <p className="empty-text">
            {currentPlatform === 'all'
              ? 'Check back soon for new content!'
              : `No posts from ${currentPlatform} yet`}
          </p>
        </div>
      ) : (
        <div className="feed-container">
          {filteredPosts.map(post => {
            const tierInfo = getTierColor(post.author.tier)
            return (
              <article key={post.id} className="feed-card">
                {/* Post Header */}
                <div className="card-header">
                  <div className="header-left">
                    <div className="avatar-section">
                      <span className="avatar">{post.author.avatar}</span>
                    </div>
                    <div className="author-info">
                      <div className="name-row">
                        <h3 className="author-name">{post.author.name}</h3>
                        <span
                          className="tier-badge"
                          style={{
                            backgroundColor: tierInfo.bg,
                            color: tierInfo.text
                          }}
                        >
                          {getTierLabel(post.author.tier)}
                        </span>
                      </div>
                      <p className="author-username">{post.author.username}</p>
                    </div>
                  </div>
                  <div className="header-right">
                    <span className="post-time">{formatTime(post.createdAt)}</span>
                    <button className="menu-btn">⋯</button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="card-content">
                  {/* Media Placeholder */}
                  <div className="media-container">
                    <div className="media-placeholder">
                      <span className="media-icon">{post.content.media}</span>
                    </div>
                  </div>

                  {/* Caption */}
                  <p className="post-caption">{post.content.caption}</p>
                </div>

                {/* Platform Badges */}
                {post.platforms.length > 0 && (
                  <div className="platform-badges">
                    {post.platforms.map(platform => {
                      const platformIcons = {
                        instagram: '📸',
                        tiktok: '🎵',
                        pinterest: '📌',
                        x: '🐦',
                        youtube: '▶️'
                      }
                      return (
                        <span key={platform} className="platform-badge" title={platform}>
                          {platformIcons[platform]}
                        </span>
                      )
                    })}
                    {post.mirrored && (
                      <span className="mirror-indicator" title="Auto-mirrored to platforms">
                        🔄
                      </span>
                    )}
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="engagement-stats">
                  <span className="stat">
                    <strong>{post.engagement.likes.toLocaleString()}</strong> likes
                  </span>
                  <span className="stat">
                    <strong>{post.engagement.comments}</strong> comments
                  </span>
                  <span className="stat">
                    <strong>{post.engagement.shares}</strong> shares
                  </span>
                </div>

                {/* Engagement Actions */}
                <div className="engagement-actions">
                  <button
                    className={`action-btn ${
                      engagementState[`${post.id}-like`] ? 'active' : ''
                    }`}
                    onClick={() => handleEngagement(post.id, 'like')}
                    title="Like this post"
                  >
                    <span className="action-icon">
                      {engagementState[`${post.id}-like`] ? '❤️' : '🤍'}
                    </span>
                    <span className="action-label">Like</span>
                  </button>

                  <button
                    className={`action-btn ${
                      engagementState[`${post.id}-comment`] ? 'active' : ''
                    }`}
                    onClick={() => handleEngagement(post.id, 'comment')}
                    title="Comment on this post"
                  >
                    <span className="action-icon">💬</span>
                    <span className="action-label">Comment</span>
                  </button>

                  <button
                    className={`action-btn ${
                      engagementState[`${post.id}-share`] ? 'active' : ''
                    }`}
                    onClick={() => handleEngagement(post.id, 'share')}
                    title="Share this post"
                  >
                    <span className="action-icon">📤</span>
                    <span className="action-label">Share</span>
                  </button>

                  <button
                    className="action-btn save-btn"
                    onClick={() => handleEngagement(post.id, 'save')}
                    title="Save this post"
                  >
                    <span className="action-icon">🔖</span>
                    <span className="action-label">Save</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UnifiedFeed
