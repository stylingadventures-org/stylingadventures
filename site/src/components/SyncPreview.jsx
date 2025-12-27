import React, { useState } from 'react'
import '../styles/sync-preview.css'

/**
 * SyncPreview Component
 * 
 * Shows how profile will appear on each platform before syncing
 * 
 * Props:
 * - masterProfile: { displayName, username, bio, profilePhoto, brandColor1, brandColor2, linkInBio }
 * - platformMappings: which fields sync to which platforms
 * - onSync: callback when Sync Now clicked
 * - onBack: callback when closing
 * - initialPlatform: which platform to show initially
 */
export default function SyncPreview({
  masterProfile = {
    displayName: 'Olivia Chen',
    username: '@oliviadesigns',
    bio: 'Digital stylist helping besties find their vibe 💅',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    brandColor1: '#ec4899',
    brandColor2: '#f9a8d4',
    linkInBio: 'https://lalaverse.com/olivia'
  },
  platformMappings = {
    instagram: {
      connected: true,
      syncFields: { photo: true, displayName: true, bio: true, colors: true, link: false, thumbnail: false }
    },
    tiktok: {
      connected: true,
      syncFields: { photo: true, displayName: false, bio: true, colors: false, link: false, thumbnail: true }
    },
    pinterest: {
      connected: true,
      syncFields: { photo: true, displayName: true, bio: true, colors: false, link: true, thumbnail: false }
    },
    x: {
      connected: true,
      syncFields: { photo: true, displayName: true, bio: true, colors: false, link: true, thumbnail: false }
    },
    youtube: {
      connected: true,
      syncFields: { photo: true, displayName: true, bio: true, colors: true, link: true, thumbnail: true }
    }
  },
  onSync = () => {},
  onBack = () => {},
  initialPlatform = 'instagram'
}) {
  const [activePlatform, setActivePlatform] = useState(initialPlatform)
  const [activeTab, setActiveTab] = useState('after') // 'after', 'before', 'compare'
  const [syncing, setSyncing] = useState(false)

  // Platform definitions with constraints
  const platforms = {
    instagram: {
      name: 'Instagram',
      emoji: '📷',
      color: '#E4405F',
      bioLimit: 150,
      displayNameLimit: 25,
      cropType: 'square',
      supportsColors: true,
      supportsLink: true,
      constraints: [
        { label: 'Bio character limit', limit: 150, current: masterProfile.bio.length },
        { label: 'Display name limit', limit: 25, current: masterProfile.displayName.length },
        { label: 'Profile photo crop', detail: 'Square (1:1) recommended' }
      ]
    },
    tiktok: {
      name: 'TikTok',
      emoji: '♪',
      color: '#000000',
      bioLimit: 80,
      displayNameLimit: 30,
      cropType: 'square',
      supportsColors: false,
      supportsLink: false,
      constraints: [
        { label: 'Bio character limit', limit: 80, current: masterProfile.bio.length },
        { label: 'Display name limit', limit: 30, current: masterProfile.displayName.length },
        { label: 'Profile photo', detail: 'Square crop recommended' },
        { label: 'Link in bio', detail: 'Not supported - links disabled' }
      ]
    },
    pinterest: {
      name: 'Pinterest',
      emoji: '📌',
      color: '#E60023',
      bioLimit: 500,
      displayNameLimit: 24,
      cropType: 'square',
      supportsColors: false,
      supportsLink: true,
      constraints: [
        { label: 'Bio character limit', limit: 500, current: masterProfile.bio.length },
        { label: 'Display name limit', limit: 24, current: masterProfile.displayName.length },
        { label: 'Brand colors', detail: 'Limited support - links are primary' }
      ]
    },
    x: {
      name: 'X (Twitter)',
      emoji: '𝕏',
      color: '#000000',
      bioLimit: 160,
      displayNameLimit: 50,
      cropType: 'circle',
      supportsColors: false,
      supportsLink: true,
      constraints: [
        { label: 'Bio character limit', limit: 160, current: masterProfile.bio.length },
        { label: 'Display name limit', limit: 50, current: masterProfile.displayName.length },
        { label: 'Profile photo crop', detail: 'Circular crop' },
        { label: 'Brand colors', detail: 'Text-only (not supported)' }
      ]
    },
    youtube: {
      name: 'YouTube',
      emoji: '▶️',
      color: '#FF0000',
      bioLimit: 1000,
      displayNameLimit: 50,
      cropType: 'banner',
      supportsColors: true,
      supportsLink: true,
      constraints: [
        { label: 'Bio character limit', limit: 1000, current: masterProfile.bio.length },
        { label: 'Channel name limit', limit: 50, current: masterProfile.displayName.length },
        { label: 'Channel art', detail: 'Banner format (16:9)' }
      ]
    }
  }

  const currentPlatform = platforms[activePlatform]
  const currentMapping = platformMappings[activePlatform]
  const syncingFields = Object.entries(currentMapping?.syncFields || {})
    .filter(([key, value]) => value)
    .map(([key]) => key)

  // Get connected platforms
  const connectedPlatforms = Object.entries(platformMappings)
    .filter(([, data]) => data.connected)
    .map(([id]) => id)

  // Mock "before" data (last synced snapshot)
  const beforeProfile = {
    displayName: 'Olivia Chen',
    bio: 'Digital stylist ✨',
    link: 'lalaverse.com'
  }

  // Handle sync
  const handleSync = () => {
    setSyncing(true)
    onSync(activePlatform)
    setTimeout(() => setSyncing(false), 2000)
  }

  // Get truncated bio for platform
  const getTruncatedBio = (bio, limit) => {
    return bio.length > limit ? bio.substring(0, limit) + '…' : bio
  }

  // Get diff info
  const getBioTruncDiff = () => {
    if (masterProfile.bio.length > currentPlatform.bioLimit) {
      return `Bio trimmed from ${masterProfile.bio.length} → ${currentPlatform.bioLimit} chars`
    }
    return 'Bio: ✅ OK'
  }

  return (
    <div className="sync-preview">
      {/* Header */}
      <div className="sync-preview-header">
        <div className="header-content">
          <h2 className="preview-title">Sync Preview</h2>
          <p className="preview-subtitle">Review changes before pushing updates</p>
        </div>
        <button className="btn-close" onClick={onBack} title="Close preview">✕</button>
      </div>

      <div className="sync-preview-container">
        {/* LEFT COLUMN - Controls */}
        <div className="sync-preview-left">
          {/* Platform Selector */}
          <div className="platform-selector">
            <h3 className="section-title">Select Platform</h3>
            <div className="platform-pills">
              {connectedPlatforms.map(platformId => (
                <button
                  key={platformId}
                  className={`platform-pill ${activePlatform === platformId ? 'active' : ''}`}
                  onClick={() => setActivePlatform(platformId)}
                  title={`Preview ${platforms[platformId].name}`}
                >
                  <span className="pill-emoji">{platforms[platformId].emoji}</span>
                  <span className="pill-name">{platforms[platformId].name}</span>
                  <span className="pill-status">✅</span>
                </button>
              ))}
            </div>
          </div>

          {/* What's Syncing */}
          <div className="whats-syncing">
            <h3 className="section-title">What's Syncing</h3>
            <div className="field-checklist">
              {syncingFields.length > 0 ? (
                syncingFields.map(fieldId => (
                  <div key={fieldId} className="checklist-item">
                    <span className="check-icon">✅</span>
                    <span className="field-name">
                      {fieldId === 'photo' && 'Profile Photo'}
                      {fieldId === 'displayName' && 'Display Name'}
                      {fieldId === 'bio' && 'Bio'}
                      {fieldId === 'colors' && 'Brand Colors'}
                      {fieldId === 'link' && 'Links'}
                      {fieldId === 'thumbnail' && 'Thumbnails'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-fields">No fields selected for sync</p>
              )}
            </div>
            <button className="btn-edit-mapping" onClick={() => window.location.href = '#mapping'}>
              ← Edit mapping
            </button>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className={`btn btn-sync-now ${syncing ? 'syncing' : ''}`}
              onClick={handleSync}
              disabled={syncingFields.length === 0 || syncing}
              title="Sync to platform"
            >
              {syncing ? '⏳ Syncing...' : '🚀 Sync Now'}
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Preview */}
        <div className="sync-preview-right">
          {/* Tabs */}
          <div className="preview-tabs">
            <button
              className={`tab ${activeTab === 'after' ? 'active' : ''}`}
              onClick={() => setActiveTab('after')}
            >
              After ✨
            </button>
            <button
              className={`tab ${activeTab === 'before' ? 'active' : ''}`}
              onClick={() => setActiveTab('before')}
            >
              Before
            </button>
            <button
              className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              Compare
            </button>
          </div>

          {/* AFTER TAB - New Profile */}
          {activeTab === 'after' && (
            <div className="preview-frame">
              <div className="mock-platform">
                <div className="platform-header-bar">
                  <span className="platform-title">{currentPlatform.emoji} {currentPlatform.name}</span>
                  <span className="profile-label">Profile</span>
                </div>

                <div className="profile-content">
                  <div className="profile-avatar" style={{
                    borderColor: currentPlatform.cropType === 'circle' ? 'none' : '#e5e5e5',
                    borderRadius: currentPlatform.cropType === 'circle' ? '50%' : '8px'
                  }}>
                    <img src={masterProfile.profilePhoto} alt={masterProfile.displayName} />
                  </div>

                  <div className="profile-info">
                    <h4 className="mock-name">{masterProfile.displayName}</h4>
                    <p className="mock-username">{masterProfile.username}</p>

                    <p className="mock-bio">
                      {getTruncatedBio(masterProfile.bio, currentPlatform.bioLimit)}
                    </p>

                    {currentPlatform.supportsLink && currentMapping?.syncFields.link && (
                      <a href="#" className="mock-link">🔗 {masterProfile.linkInBio}</a>
                    )}

                    {currentPlatform.supportsColors && (
                      <div className="brand-colors-display">
                        <div className="color-swatch" style={{ backgroundColor: masterProfile.brandColor1 }}></div>
                        <div className="color-swatch" style={{ backgroundColor: masterProfile.brandColor2 }}></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="platform-footer-bar">
                  <button className="mock-btn">Follow</button>
                </div>
              </div>
            </div>
          )}

          {/* BEFORE TAB - Current Profile */}
          {activeTab === 'before' && (
            <div className="preview-frame">
              <div className="mock-platform">
                <div className="platform-header-bar">
                  <span className="platform-title">{currentPlatform.emoji} {currentPlatform.name}</span>
                  <span className="profile-label">Current</span>
                </div>

                <div className="profile-content">
                  <div className="profile-avatar">
                    <img src={masterProfile.profilePhoto} alt={masterProfile.displayName} />
                  </div>

                  <div className="profile-info">
                    <h4 className="mock-name">{beforeProfile.displayName}</h4>
                    <p className="mock-username">{masterProfile.username}</p>
                    <p className="mock-bio">{beforeProfile.bio}</p>

                    {currentPlatform.supportsLink && (
                      <a href="#" className="mock-link">🔗 {beforeProfile.link}</a>
                    )}
                  </div>
                </div>

                <div className="platform-footer-bar">
                  <button className="mock-btn">Following</button>
                </div>
              </div>
            </div>
          )}

          {/* COMPARE TAB - Side by Side */}
          {activeTab === 'compare' && (
            <div className="compare-view">
              <div className="compare-panels">
                <div className="compare-panel before">
                  <h4 className="compare-label">Current</h4>
                  <div className="mock-platform compact">
                    <div className="profile-content">
                      <div className="profile-avatar-sm">
                        <img src={masterProfile.profilePhoto} alt={masterProfile.displayName} />
                      </div>
                      <h5 className="mock-name-sm">{beforeProfile.displayName}</h5>
                      <p className="mock-bio-sm">{beforeProfile.bio}</p>
                    </div>
                  </div>
                </div>

                <div className="compare-arrow">→</div>

                <div className="compare-panel after">
                  <h4 className="compare-label">After Update</h4>
                  <div className="mock-platform compact">
                    <div className="profile-content">
                      <div className="profile-avatar-sm">
                        <img src={masterProfile.profilePhoto} alt={masterProfile.displayName} />
                      </div>
                      <h5 className="mock-name-sm">{masterProfile.displayName}</h5>
                      <p className="mock-bio-sm">
                        {getTruncatedBio(masterProfile.bio, currentPlatform.bioLimit)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diff List */}
              <div className="diff-list">
                <h4 className="diff-title">Changes</h4>
                <div className="diff-item">
                  <span className="diff-label">Name:</span>
                  <span className="diff-value">
                    {beforeProfile.displayName !== masterProfile.displayName ? '✏️ Updated' : '✅ Same'}
                  </span>
                </div>
                <div className="diff-item">
                  <span className="diff-label">Bio:</span>
                  <span className="diff-value">{getBioTruncDiff()}</span>
                </div>
                {currentPlatform.supportsLink && (
                  <div className="diff-item">
                    <span className="diff-label">Link:</span>
                    <span className="diff-value">
                      {masterProfile.linkInBio ? '✅ Added' : '⚪ None'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Constraints Card - Always Visible */}
          <div className="constraints-card">
            <h4 className="constraints-title">⚠️ Platform Constraints</h4>
            <div className="constraints-list">
              {currentPlatform.constraints.map((constraint, idx) => (
                <div key={idx} className="constraint-item">
                  <span className="constraint-label">{constraint.label}</span>
                  {constraint.limit ? (
                    <span className={`constraint-value ${constraint.current > constraint.limit ? 'warning' : ''}`}>
                      {constraint.current}/{constraint.limit}
                    </span>
                  ) : (
                    <span className="constraint-detail">{constraint.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
