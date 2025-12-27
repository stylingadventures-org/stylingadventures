import React, { useState } from 'react'
import '../styles/posting-flow.css'

/**
 * PostingFlow Component
 * 
 * 4-step posting composer:
 * 1. Create (media + caption)
 * 2. Where to Post (platform selection with tier locks)
 * 3. Sync Preview (platform-specific previews)
 * 4. Publish (now/schedule/draft options)
 * 
 * Props:
 * - userTier: 'fan' | 'bestie' | 'scene'
 * - connectedPlatforms: array
 * - onPublish: (post) => void
 * - onClose: () => void
 * - initialContent: object (optional)
 */

const PostingFlow = ({
  userTier = 'fan',
  connectedPlatforms = ['instagram', 'tiktok'],
  onPublish = () => {},
  onClose = () => {},
  initialContent = null
}) => {
  const [step, setStep] = useState(1)
  const [content, setContent] = useState({
    caption: initialContent?.caption || '',
    media: initialContent?.media || null,
    mediaType: initialContent?.mediaType || 'image'
  })
  const [selectedPlatforms, setSelectedPlatforms] = useState(['socialbee'])
  const [publishType, setPublishType] = useState('now')
  const [scheduledTime, setScheduledTime] = useState('')

  const tierCapabilities = {
    fan: { maxPlatforms: 0, canSchedule: false },
    bestie: { maxPlatforms: 2, canSchedule: false },
    scene: { maxPlatforms: 6, canSchedule: true }
  }

  const allPlatforms = [
    { id: 'socialbee', name: 'SocialBee Feed', icon: '🐝', required: true },
    { id: 'instagram', name: 'Instagram', icon: '📸', connected: connectedPlatforms.includes('instagram') },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: connectedPlatforms.includes('tiktok') },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: connectedPlatforms.includes('pinterest') },
    { id: 'x', name: 'X', icon: '🐦', connected: connectedPlatforms.includes('x') },
    { id: 'youtube', name: 'YouTube', icon: '▶️', connected: connectedPlatforms.includes('youtube') }
  ]

  const platformLimits = {
    instagram: { captionMax: 2200, aspectRatios: ['square', '4:5', '1.91:1'] },
    tiktok: { captionMax: 150, aspectRatios: ['9:16'] },
    pinterest: { captionMax: 500, aspectRatios: ['1000:1500', 'square', '1.91:1'] },
    x: { captionMax: 280, aspectRatios: ['square', '16:9'] },
    youtube: { captionMax: 5000, aspectRatios: ['16:9', '1:1'] }
  }

  const handlePlatformToggle = (platformId) => {
    if (platformId === 'socialbee') return // Always selected

    const nonSocialBee = selectedPlatforms.filter(p => p !== 'socialbee')
    const maxPlatforms = tierCapabilities[userTier].maxPlatforms

    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId))
    } else if (nonSocialBee.length < maxPlatforms) {
      setSelectedPlatforms([...selectedPlatforms, platformId])
    }
  }

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const isVideo = file.type.startsWith('video')
      setContent({
        ...content,
        media: file.name,
        mediaType: isVideo ? 'video' : 'image'
      })
    }
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handlePublish = () => {
    const post = {
      content,
      platforms: selectedPlatforms,
      publishType,
      scheduledTime: publishType === 'scheduled' ? scheduledTime : null,
      createdAt: new Date()
    }
    onPublish(post)
    onClose()
  }

  const getWarnings = () => {
    const warnings = []
    selectedPlatforms.forEach(platformId => {
      if (platformId === 'socialbee') return
      const limit = platformLimits[platformId]
      if (limit && content.caption.length > limit.captionMax) {
        warnings.push({
          platform: platformId,
          icon: allPlatforms.find(p => p.id === platformId)?.icon,
          message: `Caption too long (${content.caption.length}/${limit.captionMax})`
        })
      }
    })
    return warnings
  }

  const warnings = getWarnings()

  return (
    <div className="posting-flow">
      {/* Header */}
      <div className="flow-header">
        <h2 className="flow-title">Create a Post</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`step-dot ${s === step ? 'active' : s < step ? 'completed' : ''}`}
            onClick={() => s < step && setStep(s)}
          >
            {s < step ? '✓' : s}
          </div>
        ))}
      </div>

      {/* Step 1: Create */}
      {step === 1 && (
        <div className="flow-step step-1">
          <h3 className="step-title">Step 1: Create</h3>
          <p className="step-description">Upload media and write your caption</p>

          {/* Media Upload */}
          <div className="media-section">
            <label className="upload-label">
              <div className="upload-area">
                {content.media ? (
                  <>
                    <p className="media-emoji">{content.mediaType === 'video' ? '🎬' : '📸'}</p>
                    <p className="media-name">{content.media}</p>
                    <button
                      type="button"
                      className="change-media-btn"
                      onClick={() => setContent({ ...content, media: null })}
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <p className="upload-emoji">📸</p>
                    <p className="upload-text">Click to upload or drag and drop</p>
                    <p className="upload-hint">PNG, JPG, GIF or MP4 (max 100MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="file-input"
              />
            </label>
          </div>

          {/* Caption */}
          <div className="caption-section">
            <label className="caption-label">
              <span className="label-text">Caption</span>
              <span className="char-count">{content.caption.length}</span>
            </label>
            <textarea
              className="caption-input"
              value={content.caption}
              onChange={e => setContent({ ...content, caption: e.target.value })}
              placeholder="What's on your mind? Share your story..."
              rows={6}
            />
            <p className="caption-hint">Tip: Great captions get more engagement!</p>
          </div>
        </div>
      )}

      {/* Step 2: Where to Post */}
      {step === 2 && (
        <div className="flow-step step-2">
          <h3 className="step-title">Step 2: Where to Post?</h3>
          <p className="step-description">Choose which platforms to share this post</p>

          {/* Platform Toggle Grid */}
          <div className="platform-grid">
            {allPlatforms.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id)
              const isLocked = platform.id !== 'socialbee' && userTier === 'fan'
              const isDisconnected = platform.id !== 'socialbee' && !platform.connected
              const isDisabled = isLocked || isDisconnected

              return (
                <div
                  key={platform.id}
                  className={`platform-toggle ${isSelected ? 'selected' : ''} ${
                    isDisabled ? 'disabled' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(platform.id)}
                    disabled={isDisabled}
                    id={`platform-${platform.id}`}
                  />
                  <label htmlFor={`platform-${platform.id}`} className="toggle-label">
                    <span className="toggle-icon">{platform.icon}</span>
                    <span className="toggle-name">{platform.name}</span>
                    {platform.required && <span className="required-badge">Always</span>}
                  </label>
                  {isLocked && <span className="lock-badge">🔒 Tier 2+</span>}
                  {isDisconnected && <span className="disconnect-badge">Not connected</span>}
                </div>
              )
            })}
          </div>

          {/* Platform Limit Info */}
          {userTier !== 'fan' && (
            <div className="limit-info">
              <p className="limit-text">
                Selected: {selectedPlatforms.filter(p => p !== 'socialbee').length} /{' '}
                {tierCapabilities[userTier].maxPlatforms} platforms
              </p>
            </div>
          )}

          {/* Tier Lock Notice for FAN */}
          {userTier === 'fan' && (
            <div className="tier-notice">
              <span className="notice-icon">🔒</span>
              <div>
                <p className="notice-title">Crossposting locked</p>
                <p className="notice-text">Upgrade to Tier 2 to sync to external platforms</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Sync Preview */}
      {step === 3 && (
        <div className="flow-step step-3">
          <h3 className="step-title">Step 3: Preview & Warnings</h3>
          <p className="step-description">How your post will appear on each platform</p>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="warnings-list">
              {warnings.map((warning, idx) => (
                <div key={idx} className="warning-item">
                  <span className="warning-icon">{warning.icon}</span>
                  <p className="warning-message">{warning.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Platform Previews */}
          <div className="preview-grid">
            {selectedPlatforms.map(platformId => {
              const platform = allPlatforms.find(p => p.id === platformId)
              const limits = platformLimits[platformId]
              return (
                <div key={platformId} className="preview-card">
                  <div className="preview-header">
                    <span className="preview-icon">{platform.icon}</span>
                    <span className="preview-name">{platform.name}</span>
                  </div>
                  <div className="preview-content">
                    {content.media && (
                      <div className="preview-media">
                        <p className="media-emoji">
                          {content.mediaType === 'video' ? '🎬' : '📸'}
                        </p>
                      </div>
                    )}
                    <p className="preview-caption">
                      {content.caption.substring(0, limits?.captionMax || 280)}
                      {content.caption.length > (limits?.captionMax || 280) && '...'}
                    </p>
                  </div>
                  {limits && (
                    <div className="preview-footer">
                      <p className="limit-text">
                        {content.caption.length}/{limits.captionMax} chars
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* No platforms selected warning */}
          {selectedPlatforms.length === 1 && (
            <div className="info-box">
              <p>💡 Only posting to SocialBee Feed. Add platforms above to expand reach!</p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Publish */}
      {step === 4 && (
        <div className="flow-step step-4">
          <h3 className="step-title">Step 4: Publish</h3>
          <p className="step-description">Choose how to publish your post</p>

          {/* Publishing Options */}
          <div className="publish-options">
            {/* Post Now */}
            <label className="radio-label">
              <input
                type="radio"
                name="publish-type"
                value="now"
                checked={publishType === 'now'}
                onChange={e => setPublishType(e.target.value)}
              />
              <div className="radio-content">
                <p className="radio-title">Post Now</p>
                <p className="radio-description">Publish immediately to all selected platforms</p>
              </div>
            </label>

            {/* Schedule */}
            {tierCapabilities[userTier].canSchedule && (
              <label className="radio-label">
                <input
                  type="radio"
                  name="publish-type"
                  value="scheduled"
                  checked={publishType === 'scheduled'}
                  onChange={e => setPublishType(e.target.value)}
                />
                <div className="radio-content">
                  <p className="radio-title">Schedule for Later</p>
                  <p className="radio-description">Choose date and time to publish</p>
                  {publishType === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="schedule-input"
                    />
                  )}
                </div>
              </label>
            )}

            {/* Draft */}
            <label className="radio-label">
              <input
                type="radio"
                name="publish-type"
                value="draft"
                checked={publishType === 'draft'}
                onChange={e => setPublishType(e.target.value)}
              />
              <div className="radio-content">
                <p className="radio-title">Save as Draft</p>
                <p className="radio-description">Save this post to edit later</p>
              </div>
            </label>
          </div>

          {/* Summary */}
          <div className="publish-summary">
            <h4 className="summary-title">Summary</h4>
            <div className="summary-item">
              <span className="summary-label">Platforms:</span>
              <div className="summary-platforms">
                {selectedPlatforms.map(id => {
                  const p = allPlatforms.find(x => x.id === id)
                  return (
                    <span key={id} className="summary-badge">
                      {p.icon}
                    </span>
                  )
                })}
              </div>
            </div>
            {publishType === 'scheduled' && (
              <div className="summary-item">
                <span className="summary-label">Scheduled for:</span>
                <span className="summary-value">
                  {new Date(scheduledTime).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step Navigation */}
      <div className="flow-actions">
        {step > 1 && (
          <button className="btn-secondary" onClick={handleBack}>
            ← Back
          </button>
        )}
        {step < 4 && (
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={step === 1 && !content.media}
          >
            Next →
          </button>
        )}
        {step === 4 && (
          <button className="btn-primary" onClick={handlePublish}>
            {publishType === 'now' && '🚀 Publish Now'}
            {publishType === 'scheduled' && '📅 Schedule Post'}
            {publishType === 'draft' && '📝 Save Draft'}
          </button>
        )}
      </div>
    </div>
  )
}

export default PostingFlow
