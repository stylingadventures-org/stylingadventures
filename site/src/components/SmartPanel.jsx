import React, { useState } from 'react'
import '../styles/smart-panel.css'

/**
 * SmartPanel Component
 * 
 * Dynamic right context panel that changes based on context
 * Default: Connected platforms, brand sync status, recent activity
 * While posting: Platform previews, warnings, tier upgrade hints
 * 
 * Props:
 * - isPosting: boolean (default false)
 * - postingContext: object with post data
 * - userTier: 'fan' | 'bestie' | 'scene'
 * - connectedPlatforms: array
 * - onUpgradeClick: () => void
 */

const SmartPanel = ({
  isPosting = false,
  postingContext = null,
  userTier = 'fan',
  connectedPlatforms = ['instagram', 'tiktok'],
  onUpgradeClick = () => {}
}) => {
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)

  // Tier-based capabilities
  const tierCapabilities = {
    fan: {
      maxPlatforms: 0,
      canSchedule: false,
      canAutoSync: false,
      canUseStories: false,
      label: '🐝 StyleVerse™'
    },
    bestie: {
      maxPlatforms: 2,
      canSchedule: false,
      canAutoSync: false,
      canUseStories: false,
      label: '🐝🐝 The Style Floor™'
    },
    scene: {
      maxPlatforms: 6,
      canSchedule: true,
      canAutoSync: true,
      canUseStories: true,
      label: '🐝🐝🐝 The Scene™'
    }
  }

  const allPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸', connected: connectedPlatforms.includes('instagram') },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: connectedPlatforms.includes('tiktok') },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: connectedPlatforms.includes('pinterest') },
    { id: 'x', name: 'X', icon: '🐦', connected: connectedPlatforms.includes('x') },
    { id: 'youtube', name: 'YouTube', icon: '▶️', connected: connectedPlatforms.includes('youtube') }
  ]

  const getTierColor = (tier) => {
    const tierMap = {
      fan: { bg: '#fce7f3', text: '#7e22ce' },
      bestie: { bg: '#ffe4f3', text: '#ec4899' },
      scene: { bg: '#f9a8d4', text: '#a855f7' }
    }
    return tierMap[tier] || tierMap.fan
  }

  const getCrospostLimitInfo = () => {
    const tier = tierCapabilities[userTier]
    if (userTier === 'fan') {
      return 'Upgrade to Tier 2 to unlock crossposting to 1-2 platforms'
    }
    if (userTier === 'bestie') {
      return `Can sync to ${tier.maxPlatforms} platforms. Upgrade to Tier 3 for all platforms + auto-sync`
    }
    return 'Sync to all platforms + auto-formatting enabled'
  }

  const getMissingFeatures = () => {
    const features = []
    if (!tierCapabilities[userTier].canSchedule) {
      features.push({ icon: '📅', text: 'Schedule posts', tier: 'Tier 3' })
    }
    if (!tierCapabilities[userTier].canAutoSync) {
      features.push({ icon: '🔄', text: 'Auto-sync & format', tier: 'Tier 3' })
    }
    if (!tierCapabilities[userTier].canUseStories) {
      features.push({ icon: '🎬', text: 'Stories / Shorts / Reels', tier: 'Tier 3' })
    }
    return features
  }

  return (
    <div className={`smart-panel ${isPosting ? 'posting-mode' : 'default-mode'}`}>
      {!isPosting ? (
        // DEFAULT MODE - Platform status & sync info
        <div className="panel-default">
          {/* Tier Badge */}
          <div className="tier-section">
            <div
              className="tier-pill"
              style={{
                backgroundColor: getTierColor(userTier).bg,
                color: getTierColor(userTier).text
              }}
            >
              {tierCapabilities[userTier].label}
            </div>
            <p className="tier-description">{getCrospostLimitInfo()}</p>
          </div>

          {/* Connected Platforms */}
          <div className="platforms-section">
            <h3 className="section-title">Connected Platforms</h3>
            <div className="platforms-grid">
              {allPlatforms.slice(0, showAllPlatforms ? allPlatforms.length : 3).map(platform => (
                <div
                  key={platform.id}
                  className={`platform-item ${platform.connected ? 'connected' : 'disconnected'}`}
                >
                  <span className="platform-icon">{platform.icon}</span>
                  <span className="platform-name">{platform.name}</span>
                  <span className="status-indicator">
                    {platform.connected ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>
            {allPlatforms.length > 3 && !showAllPlatforms && (
              <button className="show-more-btn" onClick={() => setShowAllPlatforms(true)}>
                +{allPlatforms.length - 3} more
              </button>
            )}
          </div>

          {/* Brand Sync Status */}
          <div className="brand-status-section">
            <h3 className="section-title">Brand Sync Status</h3>
            <div className="sync-item">
              <div className="sync-icon">📸</div>
              <div className="sync-info">
                <p className="sync-name">Profile Photo</p>
                <p className="sync-detail">Synced 2 hours ago</p>
              </div>
              <span className="sync-badge">✓</span>
            </div>
            <div className="sync-item">
              <div className="sync-icon">🎨</div>
              <div className="sync-info">
                <p className="sync-name">Brand Colors</p>
                <p className="sync-detail">Synced 1 day ago</p>
              </div>
              <span className="sync-badge">✓</span>
            </div>
            <div className="sync-item">
              <div className="sync-icon">✍️</div>
              <div className="sync-info">
                <p className="sync-name">Bio Text</p>
                <p className="sync-detail">Not synced</p>
              </div>
              <span className="sync-badge pending">⏳</span>
            </div>
          </div>

          {/* Recent Crosspost Activity */}
          <div className="activity-section">
            <h3 className="section-title">Recent Crosspost Activity</h3>
            <div className="activity-item">
              <p className="activity-title">Fashion collab announcement</p>
              <p className="activity-time">Posted 3 hours ago</p>
              <div className="activity-platforms">
                <span>📸</span>
                <span>🎵</span>
              </div>
            </div>
            <div className="activity-item">
              <p className="activity-title">Behind the scenes content</p>
              <p className="activity-time">Posted yesterday</p>
              <div className="activity-platforms">
                <span>📸</span>
                <span>🎵</span>
                <span>▶️</span>
              </div>
            </div>
          </div>

          {/* Tier Upgrade Hints */}
          {getMissingFeatures().length > 0 && (
            <div className="upgrade-hints">
              <h3 className="section-title">🔓 Unlock Features</h3>
              {getMissingFeatures().map((feature, idx) => (
                <div key={idx} className="hint-item">
                  <span className="hint-icon">{feature.icon}</span>
                  <div className="hint-text">
                    <p className="hint-name">{feature.text}</p>
                    <p className="hint-tier">{feature.tier}</p>
                  </div>
                </div>
              ))}
              <button className="upgrade-btn" onClick={onUpgradeClick}>
                ✨ Upgrade Now
              </button>
            </div>
          )}
        </div>
      ) : (
        // POSTING MODE - Platform previews & warnings
        <div className="panel-posting">
          <div className="posting-header">
            <h3>Where to Post?</h3>
            <p className="posting-subtitle">Select where this post will appear</p>
          </div>

          {/* Available Platforms for Posting */}
          <div className="posting-platforms">
            {/* Always available: SocialBee */}
            <div className="platform-option available">
              <label className="option-label">
                <input type="checkbox" defaultChecked disabled />
                <span className="option-icon">🐝</span>
                <span className="option-name">SocialBee Feed</span>
              </label>
              <span className="option-badge">Always</span>
            </div>

            {/* Tier-locked platforms */}
            {userTier !== 'fan' &&
              allPlatforms.map(platform => (
                <div key={platform.id} className={`platform-option ${platform.connected ? 'available' : 'disconnected'}`}>
                  <label className="option-label">
                    <input type="checkbox" disabled={!platform.connected} />
                    <span className="option-icon">{platform.icon}</span>
                    <span className="option-name">{platform.name}</span>
                  </label>
                  {!platform.connected && <span className="option-badge">Not connected</span>}
                </div>
              ))}

            {/* FAN tier lock notice */}
            {userTier === 'fan' && (
              <div className="tier-lock-notice">
                <span className="lock-icon">🔒</span>
                <div className="lock-text">
                  <p className="lock-title">Crossposting locked</p>
                  <p className="lock-detail">Upgrade to Tier 2 to crosspost to platforms</p>
                </div>
              </div>
            )}
          </div>

          {/* Platform Warnings */}
          {postingContext?.content?.caption && (
            <div className="warnings-section">
              <h4 className="warnings-title">⚠️ Platform Warnings</h4>

              {/* Instagram Caption Length */}
              {userTier !== 'fan' && (
                <div className={`warning ${postingContext.content.caption.length > 2200 ? 'active' : ''}`}>
                  <span className="warning-icon">📸</span>
                  <div className="warning-text">
                    <p className="warning-name">Instagram Caption</p>
                    <p className="warning-detail">
                      {postingContext.content.caption.length}/2,200 characters
                    </p>
                  </div>
                  {postingContext.content.caption.length > 2200 && (
                    <span className="warning-badge">Over limit</span>
                  )}
                </div>
              )}

              {/* TikTok Caption Length */}
              {userTier !== 'fan' && (
                <div className={`warning ${postingContext.content.caption.length > 150 ? 'caution' : ''}`}>
                  <span className="warning-icon">🎵</span>
                  <div className="warning-text">
                    <p className="warning-name">TikTok Caption</p>
                    <p className="warning-detail">
                      {postingContext.content.caption.length}/150 recommended
                    </p>
                  </div>
                  {postingContext.content.caption.length > 150 && (
                    <span className="warning-badge">Long caption</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Posting Options - Tier-based */}
          <div className="posting-options">
            <h4 className="options-title">Publishing Options</h4>

            <div className="option-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Post now</span>
              </label>
            </div>

            {tierCapabilities[userTier].canSchedule && (
              <div className="option-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Schedule for later</span>
                </label>
              </div>
            )}

            <div className="option-group">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Save as draft</span>
              </label>
            </div>
          </div>

          {/* Non-intrusive Tier Upgrade Suggestion */}
          {getMissingFeatures().length > 0 && (
            <div className="subtle-upgrade">
              <p className="upgrade-text">
                ✨ {tierCapabilities[userTier === 'fan' ? 'bestie' : 'scene'].label} includes{' '}
                {userTier === 'fan' ? 'platform crossposting' : 'auto-sync & scheduling'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SmartPanel
