import React, { useState, useRef } from 'react'
import '../styles/thumbnail-presets.css'

/**
 * ThumbnailPresets Component
 * 
 * Create & manage reusable branded thumbnail styles
 * 
 * Props:
 * - presets: array of preset objects
 * - onSavePreset: callback when saving new preset
 * - onApplyPreset: callback when applying preset to post
 * - onDeletePreset: callback when deleting preset
 * - onSetDefault: callback when setting preset as default
 * - userTier: 'FAN', 'BESTIE', 'SCENE'
 * - defaultPresetId: currently active preset
 */
export default function ThumbnailPresets({
  presets = [
    {
      id: 'brand-classic',
      name: 'Brand Classic',
      tag: 'Default',
      aspect: 'square',
      preview: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=300&h=300&fit=crop',
      config: {
        headline: 'New Trend',
        subtext: 'This Season',
        font: 'Clean',
        alignment: 'center',
        emoji: '✨',
        bgColor: '#ffe4f3',
        accentColor: '#ec4899',
        textColor: '#1f2937'
      },
      isPro: false,
      isDefault: true
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      tag: 'Reel',
      aspect: 'vertical',
      preview: 'https://images.unsplash.com/photo-1515212335169-2fc991827064?w=200&h=300&fit=crop',
      config: {
        headline: 'Style',
        subtext: '',
        font: 'Bold',
        alignment: 'bottom',
        emoji: '💄',
        bgColor: '#ffffff',
        accentColor: '#a855f7',
        textColor: '#1f2937'
      },
      isPro: false,
      isDefault: false
    }
  ],
  onSavePreset = () => {},
  onApplyPreset = () => {},
  onDeletePreset = () => {},
  onSetDefault = () => {},
  userTier = 'BESTIE',
  defaultPresetId = 'brand-classic'
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(defaultPresetId)
  const [editingPreset, setEditingPreset] = useState(presets.find(p => p.id === defaultPresetId))
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showNewPresetModal, setShowNewPresetModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const canvasRef = useRef(null)

  // Check tier access
  const canCreatePresets = userTier !== 'FAN'
  const canEditPresets = userTier !== 'FAN'
  const canAutoApply = userTier === 'SCENE'

  // Brand color shortcuts
  const brandColors = [
    { name: 'Light Pink', value: '#ffe4f3' },
    { name: 'Warm Pink', value: '#f9a8d4' },
    { name: 'Hot Pink', value: '#ec4899' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'White', value: '#ffffff' },
    { name: 'Dark', value: '#1f2937' }
  ]

  // Emoji options (curated, not full Unicode chaos)
  const emojiOptions = [
    '✨', '💫', '⭐', '🌟',
    '💄', '👗', '👠', '💅',
    '🎨', '🎭', '🎪', '🎬',
    '❤️', '💖', '💝', '💘',
    '🔥', '⚡', '💥', '✨',
    '👑', '🐝', '🌸', '🌺'
  ]

  // Font options
  const fontOptions = ['Clean', 'Bold', 'Script']

  // Alignment options
  const alignmentOptions = [
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' }
  ]

  // Aspect ratio options
  const aspectOptions = [
    { label: 'Square', value: 'square' },
    { label: 'Vertical', value: 'vertical' },
    { label: 'Horizontal', value: 'horizontal' }
  ]

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id)
    setEditingPreset(preset)
  }

  // Handle config change
  const handleConfigChange = (key, value) => {
    setEditingPreset({
      ...editingPreset,
      config: {
        ...editingPreset.config,
        [key]: value
      }
    })
  }

  // Handle save preset
  const handleSavePreset = () => {
    onSavePreset(editingPreset)
  }

  // Handle apply preset
  const handleApplyPreset = () => {
    onApplyPreset(editingPreset)
  }

  // Handle create new preset
  const handleCreateNewPreset = () => {
    if (!newPresetName.trim()) return

    const newPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      tag: 'Custom',
      aspect: 'square',
      preview: 'https://images.unsplash.com/photo-1557672172-298e090d0f80?w=300&h=300&fit=crop',
      config: editingPreset?.config || {
        headline: 'My Preset',
        subtext: '',
        font: 'Clean',
        alignment: 'center',
        emoji: '✨',
        bgColor: '#ffe4f3',
        accentColor: '#ec4899',
        textColor: '#1f2937'
      },
      isPro: false,
      isDefault: false
    }

    onSavePreset(newPreset)
    setNewPresetName('')
    setShowNewPresetModal(false)
  }

  // Canvas aspect ratio dimensions
  const getCanvasDimensions = () => {
    switch (editingPreset?.aspect) {
      case 'vertical':
        return { width: 280, height: 420 }
      case 'horizontal':
        return { width: 480, height: 270 }
      default: // square
        return { width: 340, height: 340 }
    }
  }

  const canvasDims = getCanvasDimensions()

  return (
    <div className="thumbnail-presets">
      {/* Header */}
      <div className="presets-header">
        <h2 className="presets-title">🎨 Thumbnail Presets</h2>
        <p className="presets-subtitle">Create & reuse branded thumbnail styles</p>
      </div>

      {/* Main Grid */}
      <div className="presets-grid">
        {/* LEFT COLUMN - Preset Grid */}
        <div className="presets-left">
          <h3 className="section-title">Your Presets</h3>

          <div className="preset-grid">
            {presets.map(preset => (
              <div
                key={preset.id}
                className={`preset-card ${selectedPresetId === preset.id ? 'active' : ''} ${preset.isPro ? 'locked' : ''}`}
                onClick={() => !preset.isPro && handleSelectPreset(preset)}
              >
                {preset.isPro && (
                  <div className="preset-lock">
                    <span className="lock-icon">🔒</span>
                    <span className="lock-text">Upgrade</span>
                  </div>
                )}

                <div className="preset-preview">
                  <img src={preset.preview} alt={preset.name} />
                </div>

                <div className="preset-info">
                  <h4 className="preset-name">{preset.name}</h4>
                  <span className="preset-tag">{preset.tag}</span>
                </div>

                {!preset.isPro && (
                  <div className="preset-actions">
                    <button
                      className="action-btn apply-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectPreset(preset)
                      }}
                      title="Apply this preset"
                    >
                      ✨
                    </button>
                    {canEditPresets && (
                      <>
                        <button
                          className="action-btn edit-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectPreset(preset)
                          }}
                          title="Edit this preset"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(preset.id)
                          }}
                          title="Delete this preset"
                        >
                          🗑
                        </button>
                      </>
                    )}
                    {preset.isDefault ? (
                      <button
                        className="action-btn star-btn active"
                        title="Default preset"
                      >
                        ⭐
                      </button>
                    ) : (
                      canEditPresets && (
                        <button
                          className="action-btn star-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetDefault(preset.id)
                          }}
                          title="Set as default"
                        >
                          ☆
                        </button>
                      )
                    )}
                  </div>
                )}

                {selectedPresetId === preset.id && !preset.isPro && (
                  <div className="preset-selected-indicator">✓</div>
                )}
              </div>
            ))}

            {/* Create New Button */}
            {canCreatePresets && (
              <button
                className="preset-card create-new"
                onClick={() => setShowNewPresetModal(true)}
                title="Create a new preset"
              >
                <div className="create-icon">+</div>
                <span className="create-text">Create New</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Custom Editor */}
        <div className="presets-right">
          <h3 className="section-title">Thumbnail Editor</h3>

          {editingPreset && (
            <div className="editor-container">
              {/* Thumbnail Canvas */}
              <div className="canvas-section">
                <div
                  className="thumbnail-canvas"
                  ref={canvasRef}
                  style={{
                    width: `${canvasDims.width}px`,
                    height: `${canvasDims.height}px`,
                    backgroundColor: editingPreset.config.bgColor,
                    backgroundImage: `linear-gradient(135deg, ${editingPreset.config.bgColor} 0%, ${editingPreset.config.accentColor}33 100%)`
                  }}
                >
                  {/* Safe area guide */}
                  <div className="safe-area-guide"></div>

                  {/* Emoji overlay */}
                  {editingPreset.config.emoji && (
                    <div className="emoji-overlay">
                      <span className="emoji">{editingPreset.config.emoji}</span>
                    </div>
                  )}

                  {/* Text content */}
                  <div className={`canvas-text text-${editingPreset.config.alignment}`}>
                    <h3
                      className={`canvas-headline font-${editingPreset.config.font.toLowerCase()}`}
                      style={{ color: editingPreset.config.textColor }}
                    >
                      {editingPreset.config.headline}
                    </h3>
                    {editingPreset.config.subtext && (
                      <p
                        className="canvas-subtext"
                        style={{ color: editingPreset.config.textColor }}
                      >
                        {editingPreset.config.subtext}
                      </p>
                    )}
                  </div>
                </div>

                {/* Aspect Selector */}
                <div className="control-group">
                  <label className="control-label">Aspect Ratio</label>
                  <div className="aspect-buttons">
                    {aspectOptions.map(option => (
                      <button
                        key={option.value}
                        className={`aspect-btn ${editingPreset.aspect === option.value ? 'active' : ''}`}
                        onClick={() => handleConfigChange('aspect', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Controls */}
              <div className="control-group">
                <label className="control-label">Headline</label>
                <input
                  type="text"
                  className="text-input"
                  value={editingPreset.config.headline}
                  onChange={(e) => handleConfigChange('headline', e.target.value)}
                  placeholder="Enter headline text"
                  maxLength="30"
                />
              </div>

              <div className="control-group">
                <label className="control-label">Subtext (Optional)</label>
                <input
                  type="text"
                  className="text-input"
                  value={editingPreset.config.subtext}
                  onChange={(e) => handleConfigChange('subtext', e.target.value)}
                  placeholder="Enter subtext"
                  maxLength="30"
                />
              </div>

              {/* Font Style */}
              <div className="control-group">
                <label className="control-label">Font Style</label>
                <div className="font-buttons">
                  {fontOptions.map(font => (
                    <button
                      key={font}
                      className={`font-btn ${editingPreset.config.font === font ? 'active' : ''}`}
                      onClick={() => handleConfigChange('font', font)}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="control-group">
                <label className="control-label">Alignment</label>
                <div className="alignment-buttons">
                  {alignmentOptions.map(option => (
                    <button
                      key={option.value}
                      className={`align-btn ${editingPreset.config.alignment === option.value ? 'active' : ''}`}
                      onClick={() => handleConfigChange('alignment', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Selector */}
              <div className="control-group">
                <label className="control-label">Emoji Accent</label>
                <div className="emoji-grid">
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      className={`emoji-btn ${editingPreset.config.emoji === emoji ? 'active' : ''}`}
                      onClick={() => handleConfigChange('emoji', emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Controls */}
              <div className="control-group">
                <label className="control-label">Background Color</label>
                <div className="color-shortcuts">
                  {brandColors.map(color => (
                    <button
                      key={color.value}
                      className={`color-btn ${editingPreset.config.bgColor === color.value ? 'active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleConfigChange('bgColor', color.value)}
                      title={color.name}
                    >
                      {editingPreset.config.bgColor === color.value && <span className="checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Accent Color</label>
                <div className="color-shortcuts">
                  {brandColors.map(color => (
                    <button
                      key={color.value}
                      className={`color-btn ${editingPreset.config.accentColor === color.value ? 'active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleConfigChange('accentColor', color.value)}
                      title={color.name}
                    >
                      {editingPreset.config.accentColor === color.value && <span className="checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Text Color</label>
                <div className="color-shortcuts">
                  {brandColors.slice(-3).map(color => (
                    <button
                      key={color.value}
                      className={`color-btn ${editingPreset.config.textColor === color.value ? 'active' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleConfigChange('textColor', color.value)}
                      title={color.name}
                    >
                      {editingPreset.config.textColor === color.value && <span className="checkmark">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleApplyPreset}
                  title="Apply this preset to your post"
                >
                  ✨ Apply to Post
                </button>
                {canEditPresets && (
                  <button
                    className="btn btn-secondary"
                    onClick={handleSavePreset}
                    title="Save changes to this preset"
                  >
                    💾 Save Preset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Preset?</h3>
            <p className="modal-text">This cannot be undone.</p>
            <div className="modal-buttons">
              <button
                className="btn btn-danger"
                onClick={() => {
                  onDeletePreset(deleteConfirm)
                  setDeleteConfirm(null)
                }}
              >
                Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Preset Modal */}
      {showNewPresetModal && (
        <div className="modal-overlay" onClick={() => setShowNewPresetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create New Preset</h3>
            <input
              type="text"
              className="text-input"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name (e.g., Summer Vibes)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateNewPreset()
              }}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="btn btn-primary"
                onClick={handleCreateNewPreset}
                disabled={!newPresetName.trim()}
              >
                Create
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewPresetModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
