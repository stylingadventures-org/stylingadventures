import React, { useState } from 'react'

/**
 * File uploader with drag-and-drop support
 */
export function AssetUploader({ onUpload, accepting = 'image/*,video/*' }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = async (files) => {
    setUploading(true)
    
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const type = isImage ? 'image' : isVideo ? 'video' : 'file'
      
      try {
        await onUpload(file, type)
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
      }
    }
    
    setUploading(false)
  }

  return (
    <div
      className={`asset-uploader ${dragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: dragging ? '#f0f0f0' : 'transparent',
        transition: 'all 0.2s',
      }}
    >
      <input
        type="file"
        multiple
        accept={accepting}
        onChange={(e) => handleFiles(Array.from(e.target.files))}
        style={{ display: 'none' }}
        id="fileInput"
        disabled={uploading}
      />
      <label
        htmlFor="fileInput"
        style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'block',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📁</div>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
          Supports images and videos
        </p>
      </label>
    </div>
  )
}
