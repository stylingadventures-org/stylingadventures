import React, { useState } from 'react'
import '../styles/platform-strip.css'

/**
 * PlatformStrip Component
 * 
 * Horizontal pill navigation bar for platform selection
 * Replaces Feed/Trending/Suggestions in main layout
 * 
 * Props:
 * - activePlatform: string (default 'all')
 * - onPlatformChange: (platform) => void
 * - userTier: 'fan' | 'bestie' | 'scene' (default 'fan')
 * - platforms: array of platform objects (optional, auto-generated)
 */

const PlatformStrip = ({
  activePlatform = 'all',
  onPlatformChange = () => {},
  userTier = 'fan'
}) => {
  const [active, setActive] = useState(activePlatform)

  // Tier-based platform access
  const tierAccess = {
    fan: ['all'],           // FAN: view all, no crosspost
    bestie: ['all', 'instagram', 'tiktok', 'pinterest', 'x', 'youtube'], // BESTIE: access all for viewing
    scene: ['all', 'instagram', 'tiktok', 'pinterest', 'x', 'youtube']   // SCENE: full access
  }

  // Platform definitions
  const platforms = [
    {
      id: 'all',
      label: 'All Platforms',
      icon: '🐝',
      color: 'all-platforms',
      locked: false
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: '📸',
      color: 'instagram',
      locked: userTier === 'fan' && !tierAccess[userTier].includes('instagram')
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      icon: '🎵',
      color: 'tiktok',
      locked: userTier === 'fan' && !tierAccess[userTier].includes('tiktok')
    },
    {
      id: 'pinterest',
      label: 'Pinterest',
      icon: '📌',
      color: 'pinterest',
      locked: userTier === 'fan' && !tierAccess[userTier].includes('pinterest')
    },
    {
      id: 'x',
      label: 'X',
      icon: '🐦',
      color: 'x',
      locked: userTier === 'fan' && !tierAccess[userTier].includes('x')
    },
    {
      id: 'youtube',
      label: 'YouTube',
      icon: '▶️',
      color: 'youtube',
      locked: userTier === 'fan' && !tierAccess[userTier].includes('youtube')
    }
  ]

  const handlePlatformClick = (platformId) => {
    // Only allow clicking if not locked
    if (!platforms.find(p => p.id === platformId)?.locked) {
      setActive(platformId)
      onPlatformChange(platformId)
    }
  }

  return (
    <div className="platform-strip">
      <div className="platform-pills-container">
        <div className="platform-pills">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              className={`platform-pill ${active === platform.id ? 'active' : ''} ${
                platform.locked ? 'locked' : ''
              } color-${platform.color}`}
              onClick={() => handlePlatformClick(platform.id)}
              disabled={platform.locked}
              title={
                platform.locked
                  ? `Unlock with ${userTier === 'fan' ? 'Tier 2 (The Style Floor)' : 'Tier 3 (The Scene)'}`
                  : platform.label
              }
            >
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-text">{platform.label}</span>
              {platform.locked && <span className="platform-lock">🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Info Row */}
      <div className="platform-info">
        <div className="info-content">
          {/* Connection Status */}
          {active !== 'all' && (
            <div className="connection-status">
              <span className="status-badge connected">✓ Connected</span>
              <span className="status-text">Last synced: 2 hours ago</span>
            </div>
          )}

          {/* Tier Lock Info */}
          {platforms.find(p => p.id === active)?.locked && (
            <div className="tier-lock-info">
              <span className="lock-icon">🔒</span>
              <span className="lock-text">Upgrade to {userTier === 'fan' ? 'Tier 2' : 'Tier 3'} to unlock</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlatformStrip
