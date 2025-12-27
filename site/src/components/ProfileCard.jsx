import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/profile-card.css'

/**
 * ProfileCard Component
 * 
 * Displays creator profile with Master Profile/SocialBee integration
 * 
 * Props:
 * - creator: { id, name, username, bio, profilePhoto, tier, platformsConnected, brandSync, thumbnailStyle }
 * - onEditClick: callback when Edit Profile clicked
 * - onSyncClick: callback when Sync Brand clicked
 * - onPostClick: callback when Create Post clicked
 * - showStats: boolean (show stats for higher tiers)
 */
export default function ProfileCard({ 
  creator = {
    id: '1',
    name: 'Olivia Chen',
    username: '@oliviadesigns',
    bio: 'Digital stylist ✨\nHelping besties find their vibe.',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop',
    tier: 'BESTIE',
    platformsConnected: 5,
    brandSync: true,
    thumbnailStyle: 'Brand Classic',
    postsToday: 3,
    engagementScore: 87,
    brandConsistency: 94
  },
  onEditClick,
  onSyncClick,
  onPostClick,
  showStats = true
}) {
  const navigate = useNavigate()
  const { userContext } = useAuth()
  const [imageError, setImageError] = useState(false)

  // Determine tier badge
  const getTierBadge = (tier) => {
    switch(tier) {
      case 'FAN':
        return { emoji: '🐝', label: 'StyleVerse™' }
      case 'BESTIE':
        return { emoji: '🐝🐝', label: 'The Style Floor™' }
      case 'SCENE':
        return { emoji: '🐝🐝🐝', label: 'The Scene™' }
      default:
        return { emoji: '🐝', label: 'Creator' }
    }
  }

  const tierBadge = getTierBadge(creator.tier)

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
  }

  // Default handlers if not provided
  const handleEdit = onEditClick || (() => navigate('/bestie/master-profile'))
  const handleSync = onSyncClick || (() => navigate('/bestie/master-profile'))
  const handlePost = onPostClick || (() => navigate('/bestie/socialbee'))

  return (
    <div className="profile-card">
      {/* HEADER STRIP - Brand Signal */}
      <div className="profile-card-header">
        <div className="header-gradient"></div>
        <div className="tier-badge">
          <span className="tier-emoji">{tierBadge.emoji}</span>
          <span className="tier-label">{tierBadge.label}</span>
        </div>
      </div>

      {/* PROFILE IMAGE - Anchor Element */}
      <div className="profile-image-container">
        {!imageError && creator.profilePhoto ? (
          <img
            src={creator.profilePhoto}
            alt={creator.name}
            className="profile-image"
            onError={handleImageError}
          />
        ) : (
          <div className="profile-image-placeholder">
            <span>{creator.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* IDENTITY BLOCK */}
      <div className="identity-block">
        <h3 className="profile-name">{creator.name}</h3>
        <p className="profile-username">{creator.username}</p>
      </div>

      {/* BIO / DESCRIPTION */}
      {creator.bio && (
        <div className="bio-section">
          <p className="bio-text">{creator.bio}</p>
        </div>
      )}

      {/* BRAND STATUS ROW - SocialBee Differentiator */}
      <div className="brand-status-row">
        <div className="status-pill">
          <span className="status-icon">🔗</span>
          <span className="status-text">{creator.platformsConnected} Platforms</span>
        </div>

        <div className={`status-pill ${creator.brandSync ? 'active' : 'inactive'}`}>
          <span className="status-icon">🎨</span>
          <span className="status-text">
            {creator.brandSync ? 'Sync: ON' : 'Sync: OFF'}
          </span>
        </div>

        <div className="status-pill">
          <span className="status-icon">📸</span>
          <span className="status-text">{creator.thumbnailStyle}</span>
        </div>
      </div>

      {/* ACTION BUTTONS - Primary CTA Zone */}
      <div className="action-buttons">
        <button
          className="btn btn-primary btn-create-post"
          onClick={handlePost}
          title="Create a new post on SocialBee"
        >
          ✏️ Create Post
        </button>

        <div className="secondary-buttons">
          <button
            className="btn btn-secondary btn-edit"
            onClick={handleEdit}
            title="Edit your Master Profile"
          >
            ✏️ Edit Profile
          </button>

          <button
            className="btn btn-secondary btn-sync"
            onClick={handleSync}
            title="Sync brand across platforms"
          >
            🔄 Sync Brand
          </button>
        </div>
      </div>

      {/* QUICK STATS - Tier-Based */}
      {showStats && creator.tier !== 'FAN' && (
        <div className="quick-stats">
          <div className="stat-block">
            <span className="stat-number">{creator.postsToday}</span>
            <span className="stat-label">Today</span>
          </div>

          <div className="stat-block">
            <span className="stat-number">{creator.engagementScore}</span>
            <span className="stat-label">Engagement</span>
          </div>

          <div className="stat-block">
            <span className="stat-number">{creator.brandConsistency}%</span>
            <span className="stat-label">Brand Sync</span>
          </div>
        </div>
      )}
    </div>
  )
}
