import React, { useState } from 'react'

/**
 * Display assets in a grid layout
 */
export function AssetGrid({ assets = [], onSelect, onDelete, isSelectable = false }) {
  const [selected, setSelected] = useState(new Set())

  const toggleSelect = (assetId) => {
    const newSelected = new Set(selected)
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId)
    } else {
      newSelected.add(assetId)
    }
    setSelected(newSelected)
    if (onSelect) {
      onSelect(Array.from(newSelected))
    }
  }

  if (assets.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        color: '#999',
      }}>
        <p style={{ fontSize: '3rem', margin: 0 }}>📦</p>
        <p>No assets yet. Upload some to get started!</p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        padding: '20px',
      }}
    >
      {assets.map((asset) => (
        <div
          key={asset.id}
          style={{
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
            cursor: isSelectable ? 'pointer' : 'default',
            border: selected.has(asset.id) ? '3px solid #2563eb' : '1px solid #ddd',
            transition: 'all 0.2s',
          }}
          onClick={() => isSelectable && toggleSelect(asset.id)}
        >
          {/* Thumbnail */}
          <div style={{ aspectRatio: '1', overflow: 'hidden', backgroundColor: '#e0e0e0' }}>
            {asset.type === 'image' ? (
              <img
                src={asset.url}
                alt={asset.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : asset.type === 'video' ? (
              <video
                src={asset.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}>
                📄
              </div>
            )}
          </div>

          {/* Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '0.85rem',
          }}>
            <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {asset.name}
            </p>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(asset.id)
                }}
                style={{
                  marginTop: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Selection checkmark */}
          {isSelectable && selected.has(asset.id) && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#2563eb',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              ✓
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
