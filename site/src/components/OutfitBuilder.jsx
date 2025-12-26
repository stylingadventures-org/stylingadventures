import React, { useState } from 'react'

/**
 * Outfit builder - select items to create an outfit
 */
export default function OutfitBuilder({ availableAssets = [], onSubmit, requiredSlots = 5 }) {
  const [selectedAssets, setSelectedAssets] = useState([])

  const toggleAsset = (assetId) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId)
      }
      if (prev.length < requiredSlots) {
        return [...prev, assetId]
      }
      return prev
    })
  }

  const handleSubmit = () => {
    if (selectedAssets.length !== requiredSlots) {
      alert(`Please select exactly ${requiredSlots} items`)
      return
    }
    onSubmit(selectedAssets)
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px' }}>
      <h2>Build Your Outfit</h2>
      <p style={{ color: '#666' }}>
        Select {requiredSlots} items to complete this challenge
        {selectedAssets.length > 0 && ` (${selectedAssets.length}/${requiredSlots} selected)`}
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#2563eb',
            width: `${(selectedAssets.length / requiredSlots) * 100}%`,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Asset grid for selection */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {availableAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => toggleAsset(asset.id)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              border: selectedAssets.includes(asset.id)
                ? '3px solid #2563eb'
                : '2px solid #e5e7eb',
              backgroundColor: selectedAssets.includes(asset.id) ? '#e0e7ff' : 'white',
              transition: 'all 0.2s',
              transform: selectedAssets.includes(asset.id) ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <div
              style={{
                aspectRatio: '1',
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              {asset.type === 'image' ? (
                <img
                  src={asset.url}
                  alt={asset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  🎬
                </div>
              )}
            </div>
            {selectedAssets.includes(asset.id) && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={selectedAssets.length !== requiredSlots}
        style={{
          width: '100%',
          padding: '12px 20px',
          backgroundColor: selectedAssets.length === requiredSlots ? '#2563eb' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: selectedAssets.length === requiredSlots ? 'pointer' : 'not-allowed',
        }}
      >
        {selectedAssets.length === requiredSlots ? 'Submit Outfit' : 'Select All Items'}
      </button>
    </div>
  )
}
