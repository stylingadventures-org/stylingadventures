import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/master-profile.css'

export default function MasterProfile() {
  const { userContext } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [syncPreviewPlatform, setSyncPreviewPlatform] = useState('instagram')

  // Master Profile State
  const [masterProfile, setMasterProfile] = useState({
    displayName: 'Styling Adventures',
    username: '@stylingadventures',
    bio: 'Fashion, creativity, and timeless style for everyone ✨',
    profilePhoto: '👗',
    brandColor1: '#ec4899',
    brandColor2: '#a855f7',
    linkInBio: 'www.stylingadventures.com',
  })

  // Platform Sync Settings (per platform control)
  const [platformMappings, setPlatformMappings] = useState({
    instagram: {
      connected: true,
      syncFields: {
        profilePhoto: true,
        displayName: false,
        bio: true,
        linkInBio: true,
        brandColor: false,
        thumbnail: false,
      }
    },
    tiktok: {
      connected: true,
      syncFields: {
        profilePhoto: true,
        displayName: true,
        bio: true,
        linkInBio: false,
        brandColor: false,
        thumbnail: true,
      }
    },
    pinterest: {
      connected: false,
      syncFields: {
        profilePhoto: true,
        displayName: true,
        bio: true,
        linkInBio: true,
        brandColor: false,
        thumbnail: true,
      }
    },
    x: {
      connected: false,
      syncFields: {
        profilePhoto: true,
        displayName: true,
        bio: true,
        linkInBio: true,
        brandColor: false,
        thumbnail: false,
      }
    },
    youtube: {
      connected: false,
      syncFields: {
        profilePhoto: true,
        displayName: true,
        bio: true,
        linkInBio: true,
        brandColor: false,
        thumbnail: false,
      }
    }
  })

  // Tier-based features
  const userTier = userContext?.tier || 'FAN'
  const isBestie = userTier === 'BESTIE' || userTier === 'PRIME'
  const isScene = userTier === 'SCENE' || userTier === 'ADMIN'

  // Available features per tier
  const features = {
    FAN: ['profilePhoto', 'displayName', 'bio'], // View only
    BESTIE: ['profilePhoto', 'displayName', 'bio', 'linkInBio', 'brandColor', 'thumbnail'],
    SCENE: ['profilePhoto', 'displayName', 'bio', 'linkInBio', 'brandColor', 'thumbnail', 'autoSync'],
  }

  // Thumbnail Presets
  const [thumbnailPresets, setThumbnailPresets] = useState([
    {
      id: 1,
      name: 'Brand Classic',
      size: 'square',
      textOverlay: 'STYLING ADVENTURES',
      colorOverlay: '#ec4899',
      emoji: '✨',
    },
    {
      id: 2,
      name: 'Minimalist',
      size: 'vertical',
      textOverlay: 'New Collection',
      colorOverlay: '#a855f7',
      emoji: '👗',
    }
  ])

  const platforms = [
    { id: 'instagram', name: 'Instagram', emoji: '📷', icon: '📷', color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok', emoji: '♪', icon: '♪', color: '#000000' },
    { id: 'pinterest', name: 'Pinterest', emoji: '📌', icon: '📌', color: '#E60023' },
    { id: 'x', name: 'X (Twitter)', emoji: '𝕏', icon: '𝕏', color: '#000000' },
    { id: 'youtube', name: 'YouTube', emoji: '▶️', icon: '▶️', color: '#FF0000' },
  ]

  const fieldLabels = {
    profilePhoto: 'Profile Photo',
    displayName: 'Display Name',
    bio: 'Bio / Description',
    linkInBio: 'Link-in-Bio',
    brandColor: 'Brand Colors',
    thumbnail: 'Thumbnail Presets',
  }

  const handleProfileChange = (field, value) => {
    setMasterProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSyncToggle = (platform, field) => {
    setPlatformMappings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        syncFields: {
          ...prev[platform].syncFields,
          [field]: !prev[platform].syncFields[field]
        }
      }
    }))
  }

  const handlePushSync = (platform) => {
    // Stub for real API call in v1.5
    alert(`Syncing profile to ${platform}... (API stub in v1.0)`)
    // Future: POST /api/socialbee/sync/{platform}
  }

  const platformPreviewData = {
    instagram: {
      bioLimit: 150,
      displayNameLimit: 30,
      linksAllowed: true,
      cropping: 'Square (1:1)',
      colorSupport: 'Limited',
    },
    tiktok: {
      bioLimit: 80,
      displayNameLimit: 30,
      linksAllowed: false,
      cropping: 'Square & Vertical',
      colorSupport: 'No',
    },
    pinterest: {
      bioLimit: 160,
      displayNameLimit: 50,
      linksAllowed: true,
      cropping: 'Square & Vertical',
      colorSupport: 'No',
    },
    x: {
      bioLimit: 160,
      displayNameLimit: 50,
      linksAllowed: true,
      cropping: 'Square (1:1)',
      colorSupport: 'Limited',
    },
    youtube: {
      bioLimit: 180,
      displayNameLimit: 30,
      linksAllowed: true,
      cropping: 'Square (1:1)',
      colorSupport: 'Limited',
    }
  }

  return (
    <div className="master-profile-container">
      {/* Header */}
      <div className="master-profile-header">
        <div className="header-content">
          <h1>👑 Master Profile</h1>
          <p>Your canonical identity across all platforms</p>
          <div className="tier-badge">
            {isBestie && <span className="badge-bestie">BESTIE - Full Control</span>}
            {isScene && <span className="badge-scene">SCENE - Auto-Sync Enabled</span>}
            {!isBestie && !isScene && <span className="badge-fan">FAN - Preview Only</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Master Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'mapping' ? 'active' : ''}`}
          onClick={() => setActiveTab('mapping')}
        >
          🔗 Platform Mapping
        </button>
        <button
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          👁️ Sync Preview
        </button>
        {isBestie && (
          <button
            className={`tab-button ${activeTab === 'thumbnails' ? 'active' : ''}`}
            onClick={() => setActiveTab('thumbnails')}
          >
            🖼️ Thumbnails
          </button>
        )}
      </div>

      {/* TAB: MASTER PROFILE */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          <div className="profile-section">
            {/* Profile Photo */}
            <div className="form-group">
              <label>Profile Photo</label>
              <div className="photo-upload">
                <div className="photo-preview">
                  <span className="photo-emoji">{masterProfile.profilePhoto}</span>
                </div>
                <div className="photo-controls">
                  <button className="btn-secondary">📤 Upload Photo</button>
                  <p className="help-text">Used across all platforms</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={masterProfile.displayName}
                onChange={(e) => handleProfileChange('displayName', e.target.value)}
                maxLength="50"
                placeholder="Your display name"
                disabled={!isBestie}
              />
              <p className="help-text">{masterProfile.displayName.length} / 50</p>
            </div>

            {/* Username */}
            <div className="form-group">
              <label>Username (Read-only)</label>
              <input
                type="text"
                value={masterProfile.username}
                disabled
                placeholder="Your LaLaVerse username"
              />
              <p className="help-text">Cannot be changed (your LaLaVerse identity)</p>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>Bio / Description</label>
              <textarea
                value={masterProfile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                maxLength="280"
                placeholder="Your bio"
                rows="3"
                disabled={!isBestie}
              />
              <p className="help-text">{masterProfile.bio.length} / 280 (optimized for longest platform)</p>
            </div>

            {/* Link-in-Bio */}
            {isBestie && (
              <div className="form-group">
                <label>Link-in-Bio</label>
                <input
                  type="url"
                  value={masterProfile.linkInBio}
                  onChange={(e) => handleProfileChange('linkInBio', e.target.value)}
                  placeholder="https://example.com"
                  disabled={!isBestie}
                />
                <p className="help-text">Available on: Instagram, TikTok, Pinterest, YouTube</p>
              </div>
            )}

            {/* Brand Colors */}
            {isBestie && (
              <div className="form-group">
                <label>Brand Colors</label>
                <div className="color-picker-group">
                  <div className="color-input">
                    <span>Primary</span>
                    <input
                      type="color"
                      value={masterProfile.brandColor1}
                      onChange={(e) => handleProfileChange('brandColor1', e.target.value)}
                    />
                    <code>{masterProfile.brandColor1}</code>
                  </div>
                  <div className="color-input">
                    <span>Secondary</span>
                    <input
                      type="color"
                      value={masterProfile.brandColor2}
                      onChange={(e) => handleProfileChange('brandColor2', e.target.value)}
                    />
                    <code>{masterProfile.brandColor2}</code>
                  </div>
                </div>
                <p className="help-text">Used in thumbnail overlays and brand templates</p>
              </div>
            )}

            {/* Save Button */}
            {isBestie && (
              <div className="form-actions">
                <button className="btn-primary">💾 Save Master Profile</button>
                <p className="help-text">Changes saved automatically</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PLATFORM MAPPING */}
      {activeTab === 'mapping' && (
        <div className="tab-content">
          <div className="mapping-section">
            <h3>🔗 Platform-Specific Sync Control</h3>
            <p className="section-desc">Choose which fields sync to each platform. Every platform is different.</p>

            {/* Mapping Table */}
            <div className="mapping-table">
              <div className="mapping-header">
                <div className="col-field">Field</div>
                {platforms.map(p => (
                  <div key={p.id} className="col-platform">
                    <span className="platform-icon">{p.emoji}</span>
                    <span className="platform-name">{p.name}</span>
                    {platformMappings[p.id]?.connected && <span className="connected-badge">✓</span>}
                  </div>
                ))}
              </div>

              {Object.entries(fieldLabels).map(([fieldKey, fieldLabel]) => (
                <div key={fieldKey} className="mapping-row">
                  <div className="col-field">{fieldLabel}</div>
                  {platforms.map(p => (
                    <div key={`${p.id}-${fieldKey}`} className="col-platform">
                      {platformMappings[p.id]?.connected ? (
                        <label className="sync-toggle">
                          <input
                            type="checkbox"
                            checked={platformMappings[p.id]?.syncFields[fieldKey] || false}
                            onChange={() => isBestie && handleSyncToggle(p.id, fieldKey)}
                            disabled={!isBestie}
                          />
                          <span className="checkmark"></span>
                        </label>
                      ) : (
                        <span className="disconnected">—</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Sync Buttons */}
            {isBestie && (
              <div className="sync-actions">
                <h4>📤 Push Sync to Platforms</h4>
                <div className="sync-buttons">
                  {platforms.map(p => (
                    platformMappings[p.id]?.connected && (
                      <button
                        key={p.id}
                        className="btn-sync"
                        onClick={() => handlePushSync(p.id)}
                      >
                        {p.emoji} Sync to {p.name}
                      </button>
                    )
                  ))}
                </div>
                <p className="help-text">ℹ️ Syncing updates your profile on each platform. You'll see a preview first.</p>
              </div>
            )}

            {/* Info Box */}
            <div className="info-box">
              <h4>ℹ️ Why Per-Platform Control?</h4>
              <ul>
                <li><strong>Instagram:</strong> Supports links, limited colors</li>
                <li><strong>TikTok:</strong> No external links, shorter bio</li>
                <li><strong>Pinterest:</strong> Grid-based, good for links</li>
                <li><strong>X:</strong> Character limits, full features</li>
                <li><strong>YouTube:</strong> Channel branding, customizable</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SYNC PREVIEW */}
      {activeTab === 'preview' && (
        <div className="tab-content">
          <div className="preview-section">
            <h3>👁️ How Your Profile Will Look</h3>

            {/* Platform Selector */}
            <div className="preview-selector">
              <p>Select platform to preview:</p>
              <div className="preview-chips">
                {platforms.map(p => (
                  <button
                    key={p.id}
                    className={`preview-chip ${syncPreviewPlatform === p.id ? 'active' : ''}`}
                    onClick={() => setSyncPreviewPlatform(p.id)}
                    disabled={!platformMappings[p.id]?.connected}
                  >
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Preview */}
            {platformMappings[syncPreviewPlatform]?.connected && (
              <div className="preview-container">
                <div className="preview-card">
                  <h4>{platforms.find(p => p.id === syncPreviewPlatform)?.name} Preview</h4>

                  {/* Profile Preview */}
                  <div className="platform-preview">
                    <div className="preview-header">
                      <span className="preview-photo">{masterProfile.profilePhoto}</span>
                      <div className="preview-info">
                        <div className="preview-name">
                          {platformMappings[syncPreviewPlatform]?.syncFields.displayName
                            ? masterProfile.displayName
                            : '(Name not synced)'}
                        </div>
                        <div className="preview-handle">
                          {platformMappings[syncPreviewPlatform]?.syncFields.linkInBio
                            ? masterProfile.username
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="preview-bio">
                      {platformMappings[syncPreviewPlatform]?.syncFields.bio
                        ? masterProfile.bio.substring(0, platformPreviewData[syncPreviewPlatform]?.bioLimit)
                        : '(Bio not synced)'}
                    </div>

                    {platformMappings[syncPreviewPlatform]?.syncFields.linkInBio && (
                      <div className="preview-link">
                        🔗 {masterProfile.linkInBio}
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  <div className="preview-warnings">
                    <h5>⚠️ Platform Details</h5>
                    <ul>
                      <li><strong>Bio Limit:</strong> {platformPreviewData[syncPreviewPlatform]?.bioLimit} characters</li>
                      <li><strong>Name Limit:</strong> {platformPreviewData[syncPreviewPlatform]?.displayNameLimit} characters</li>
                      <li><strong>Cropping:</strong> {platformPreviewData[syncPreviewPlatform]?.cropping}</li>
                      <li><strong>Color Support:</strong> {platformPreviewData[syncPreviewPlatform]?.colorSupport}</li>
                      <li><strong>Links:</strong> {platformPreviewData[syncPreviewPlatform]?.linksAllowed ? '✓ Allowed' : '✗ Not allowed'}</li>
                    </ul>
                  </div>

                  {/* Active Syncs */}
                  <div className="active-syncs">
                    <h5>✓ Fields Being Synced:</h5>
                    <div className="sync-list">
                      {Object.entries(platformMappings[syncPreviewPlatform]?.syncFields).map(([field, synced]) => (
                        synced && (
                          <span key={field} className="sync-badge">
                            {fieldLabels[field]}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!platformMappings[syncPreviewPlatform]?.connected && (
              <div className="not-connected">
                <p>Connect your {platforms.find(p => p.id === syncPreviewPlatform)?.name} account to see preview</p>
                <button className="btn-primary">🔗 Connect Account</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: THUMBNAILS (BESTIE+) */}
      {isBestie && activeTab === 'thumbnails' && (
        <div className="tab-content">
          <div className="thumbnails-section">
            <h3>🖼️ Thumbnail Presets</h3>
            <p className="section-desc">Create reusable thumbnail templates for your posts with brand consistency.</p>

            {/* Existing Presets */}
            <div className="presets-grid">
              {thumbnailPresets.map(preset => (
                <div key={preset.id} className="preset-card">
                  <div className="preset-preview">
                    <div
                      className="preset-thumbnail"
                      style={{
                        backgroundColor: preset.colorOverlay,
                        aspectRatio: preset.size === 'square' ? '1' : preset.size === 'vertical' ? '9/16' : '16/9'
                      }}
                    >
                      <div className="preset-content">
                        <span className="preset-emoji">{preset.emoji}</span>
                        <span className="preset-text">{preset.textOverlay}</span>
                      </div>
                    </div>
                  </div>
                  <div className="preset-info">
                    <h5>{preset.name}</h5>
                    <p>{preset.size} • {preset.textOverlay}</p>
                    <div className="preset-actions">
                      <button className="btn-text">✏️ Edit</button>
                      <button className="btn-text">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Preset */}
              <div className="preset-card new">
                <div className="preset-preview">
                  <div className="new-preset-box">
                    <span>+</span>
                  </div>
                </div>
                <div className="preset-info">
                  <h5>New Preset</h5>
                  <p>Create custom thumbnail</p>
                  <button className="btn-primary">➕ Add Preset</button>
                </div>
              </div>
            </div>

            {/* Creator Tips */}
            <div className="tips-box">
              <h4>💡 Thumbnail Tips</h4>
              <ul>
                <li><strong>Consistency:</strong> Use the same preset across posts for brand recognition</li>
                <li><strong>Sizes:</strong> Square for Instagram, Vertical for TikTok, Horizontal for YouTube</li>
                <li><strong>Text:</strong> Keep short (2-3 words max)</li>
                <li><strong>Colors:</strong> Use your brand colors for instant recognition</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
