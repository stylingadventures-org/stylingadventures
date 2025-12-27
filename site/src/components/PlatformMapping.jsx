import React, { useState } from 'react'
import '../styles/platform-mapping.css'

/**
 * PlatformMapping Component
 * 
 * Matrix showing which profile fields sync to which platforms
 * 
 * Props:
 * - masterProfile: { displayName, username, bio, profilePhoto, brandColor1, brandColor2, linkInBio }
 * - platformMappings: { instagram: { connected, syncFields }, ... }
 * - onMappingChange: callback when toggle changes
 * - onSyncPlatform: callback when Sync button clicked
 * - onPreviewPlatform: callback when Preview button clicked
 */
export default function PlatformMapping({
  masterProfile = {
    displayName: 'Olivia Chen',
    username: '@oliviadesigns',
    bio: 'Digital stylist helping besties find their vibe',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    brandColor1: '#ec4899',
    brandColor2: '#f9a8d4',
    linkInBio: 'https://lalaverse.com'
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
      connected: false,
      syncFields: { photo: false, displayName: false, bio: false, colors: false, link: false, thumbnail: false }
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
  onMappingChange = () => {},
  onSyncPlatform = () => {},
  onPreviewPlatform = () => {},
  userTier = 'BESTIE'
}) {
  const [syncingPlatform, setSyncingPlatform] = useState(null)

  // Platform definitions
  const platforms = [
    { id: 'instagram', name: 'Instagram', emoji: '📷', color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok', emoji: '♪', color: '#000000' },
    { id: 'pinterest', name: 'Pinterest', emoji: '📌', color: '#E60023' },
    { id: 'x', name: 'X', emoji: '𝕏', color: '#000000' },
    { id: 'youtube', name: 'YouTube', emoji: '▶️', color: '#FF0000' }
  ]

  // Sync fields
  const fields = [
    { id: 'photo', label: 'Profile Photo', icon: '📷', info: 'Your profile picture' },
    { id: 'displayName', label: 'Display Name', icon: '🔤', info: 'How you appear to others' },
    { id: 'bio', label: 'Bio', icon: '📝', info: 'Your main profile description' },
    { id: 'colors', label: 'Brand Colors', icon: '🎨', info: 'Your brand accent colors', proOnly: true },
    { id: 'link', label: 'Links', icon: '🔗', info: 'Your link-in-bio', tier: 'BESTIE' },
    { id: 'thumbnail', label: 'Thumbnails', icon: '🖼️', info: 'Preset visual style', tier: 'BESTIE' }
  ]

  // Check if field is locked
  const isFieldLocked = (fieldId) => {
    const field = fields.find(f => f.id === fieldId)
    if (field?.proOnly && userTier === 'FAN') return true
    if (field?.tier === 'BESTIE' && userTier === 'FAN') return true
    return false
  }

  // Handle toggle change
  const handleToggle = (platformId, fieldId) => {
    if (isFieldLocked(fieldId)) return
    if (!platformMappings[platformId]?.connected) return

    const newMappings = { ...platformMappings }
    newMappings[platformId].syncFields[fieldId] = !newMappings[platformId].syncFields[fieldId]
    onMappingChange(newMappings)
  }

  // Handle sync platform
  const handleSync = (platformId) => {
    setSyncingPlatform(platformId)
    onSyncPlatform(platformId)
    setTimeout(() => setSyncingPlatform(null), 2000)
  }

  return (
    <div className="platform-mapping">
      {/* Trust Builder Text */}
      <div className="trust-builder">
        <p>💖 Nothing updates without your permission. You're always in control.</p>
      </div>

      {/* Matrix Card */}
      <div className="mapping-card">
        {/* Card Header */}
        <div className="mapping-header">
          <h2 className="mapping-title">🐝 Platform Mapping</h2>
          <p className="mapping-subtitle">Choose what syncs where</p>
        </div>

        {/* Scrollable Matrix Container */}
        <div className="mapping-matrix-wrapper">
          <div className="mapping-matrix">
            {/* HEADER ROW - Platforms */}
            <div className="matrix-header-row">
              <div className="matrix-field-column"></div>

              {platforms.map(platform => (
                <div
                  key={platform.id}
                  className={`matrix-platform-column ${platformMappings[platform.id]?.connected ? 'connected' : 'disconnected'}`}
                >
                  <div className="platform-header">
                    <div className="platform-icon">{platform.emoji}</div>
                    <div className="platform-name">{platform.name}</div>
                    <div className="connection-badge">
                      {platformMappings[platform.id]?.connected ? (
                        <>
                          <span className="badge-dot connected-dot">●</span>
                          <span className="badge-text">Connected</span>
                        </>
                      ) : (
                        <>
                          <span className="badge-dot disconnected-dot">○</span>
                          <span className="badge-text">Connect</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FIELD ROWS */}
            {fields.map(field => (
              <div key={field.id} className="matrix-field-row">
                {/* Field Label (Left Column) */}
                <div className="matrix-field-label">
                  <div className="field-info">
                    <span className="field-icon">{field.icon}</span>
                    <span className="field-name">{field.label}</span>
                    <span className="field-tooltip" title={field.info}>ⓘ</span>
                  </div>
                  {field.proOnly && <span className="badge-pro">Pro</span>}
                  {field.tier === 'BESTIE' && <span className="badge-tier">Bestie+</span>}
                </div>

                {/* Toggle Cells */}
                {platforms.map(platform => {
                  const isConnected = platformMappings[platform.id]?.connected
                  const isSyncing = platformMappings[platform.id]?.syncFields[field.id]
                  const isLocked = isFieldLocked(field.id)

                  return (
                    <div
                      key={`${platform.id}-${field.id}`}
                      className={`matrix-toggle-cell ${!isConnected ? 'disabled' : ''}`}
                    >
                      {isLocked ? (
                        <div className="toggle-locked">
                          <span className="lock-icon">🔒</span>
                          <span className="lock-text">Upgrade</span>
                        </div>
                      ) : (
                        <button
                          className={`toggle-switch ${isSyncing ? 'on' : 'off'}`}
                          onClick={() => handleToggle(platform.id, field.id)}
                          disabled={!isConnected}
                          title={
                            isConnected
                              ? `${isSyncing ? 'Disable' : 'Enable'} sync to ${platform.name}`
                              : `Connect ${platform.name} to enable syncing`
                          }
                        >
                          <span className="toggle-inner">{isSyncing ? '✓' : ''}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* ACTION ROW - Sync Buttons */}
            <div className="matrix-action-row">
              <div className="matrix-field-label">
                <span className="action-label">Actions</span>
              </div>

              {platforms.map(platform => {
                const isConnected = platformMappings[platform.id]?.connected
                const hasSyncFields = Object.values(platformMappings[platform.id]?.syncFields || {}).some(v => v)

                return (
                  <div key={`action-${platform.id}`} className="matrix-action-cell">
                    {isConnected && (
                      <div className="action-buttons">
                        <button
                          className={`btn-action btn-preview`}
                          onClick={() => onPreviewPlatform(platform.id)}
                          title="Preview before syncing"
                        >
                          👁
                        </button>
                        <button
                          className={`btn-action btn-sync ${syncingPlatform === platform.id ? 'syncing' : ''}`}
                          onClick={() => handleSync(platform.id)}
                          disabled={!hasSyncFields || syncingPlatform === platform.id}
                          title={hasSyncFields ? `Sync to ${platform.name}` : `Select fields to sync to ${platform.name}`}
                        >
                          {syncingPlatform === platform.id ? '⏳' : '🔄'}
                        </button>
                      </div>
                    )}
                    {!isConnected && (
                      <button className="btn-connect" title={`Connect ${platform.name}`}>
                        Connect
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Disconnected Platform CTAs */}
        <div className="disconnected-ctAs">
          {platforms.map(platform => {
            if (platformMappings[platform.id]?.connected) return null
            return (
              <button
                key={`cta-${platform.id}`}
                className="cta-connect"
                title={`Connect your ${platform.name} account`}
              >
                <span className="cta-emoji">{platform.emoji}</span>
                <span className="cta-text">Connect {platform.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
