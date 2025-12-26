import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { graphqlQuery } from '../api/graphql'
import { LIST_CREATOR_ASSETS, CREATE_ASSET, DELETE_ASSET } from '../api/graphql'
import { AssetUploader } from '../components/AssetUploader'
import { AssetGrid } from '../components/AssetGrid'
import '../styles/creator-cabinet.css'

/**
 * Creator Cabinet - manage assets, organize by type
 */
export default function CreatorCabinet() {
  const { userContext } = useAuth()
  const [cabinet, setCabinet] = useState('all')
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (userContext?.sub) {
      loadAssets()
    }
  }, [userContext])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const data = await graphqlQuery(LIST_CREATOR_ASSETS, {
        userId: userContext.sub,
      })
      setAssets(data?.listCreatorAssets?.items || [])
    } catch (err) {
      setError('Failed to load assets: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file, type) => {
    setUploading(true)
    try {
      // Step 1: Get presigned URL
      const presignResponse = await fetch(`${window.__CONFIG__.uploadsApiUrl}/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('id_token'),
        },
        body: JSON.stringify({
          filename: file.name,
          filetype: file.type,
        }),
      })

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { url, key } = await presignResponse.json()

      // Step 2: Upload to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Step 3: Create asset record in DB
      const assetUrl = `${window.__CONFIG__.assetsBucketUrl}/${key}`
      const createResponse = await graphqlQuery(CREATE_ASSET, {
        input: {
          userId: userContext.sub,
          name: file.name,
          type,
          url: assetUrl,
          cabinet,
        },
      })

      if (createResponse?.createAsset) {
        setAssets([...assets, createResponse.createAsset])
      }
    } catch (err) {
      setError('Upload failed: ' + err.message)
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (assetId) => {
    if (!confirm('Delete this asset?')) return

    try {
      await graphqlQuery(DELETE_ASSET, {
        id: assetId,
        userId: userContext.sub,
      })
      setAssets(assets.filter((a) => a.id !== assetId))
    } catch (err) {
      setError('Failed to delete: ' + err.message)
      console.error(err)
    }
  }

  const filteredAssets =
    cabinet === 'all' ? assets : assets.filter((a) => a.cabinet === cabinet)

  if (!userContext?.isCreator) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Only creators can access the cabinet.</p>
      </div>
    )
  }

  return (
    <div className="creator-cabinet">
      <div className="cabinet-header">
        <h1>Creator Cabinet</h1>
        <p>Manage your styled looks, outfits, and fashion content</p>
      </div>

      {error && <div style={{ padding: '15px', backgroundColor: '#fee', borderRadius: '8px', color: '#c33', marginBottom: '20px' }}>{error}</div>}

      {/* Cabinet Navigation */}
      <div className="cabinet-nav">
        {['all', 'outfits', 'accessories', 'hairstyles', 'styling-tips'].map((c) => (
          <button
            key={c}
            className={cabinet === c ? 'active' : ''}
            onClick={() => setCabinet(c)}
          >
            {c === 'all'
              ? '📦 All'
              : c === 'outfits'
              ? '👗 Outfits'
              : c === 'accessories'
              ? '💍 Accessories'
              : c === 'hairstyles'
              ? '💇 Hairstyles'
              : '✨ Tips'}
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Upload Assets</h2>
        <AssetUploader onUpload={handleUpload} />
        {uploading && <p style={{ textAlign: 'center', color: '#666' }}>Uploading...</p>}
      </div>

      {/* Assets Grid */}
      <div>
        <h2>
          {cabinet === 'all' ? 'All Assets' : cabinet.charAt(0).toUpperCase() + cabinet.slice(1)} (
          {filteredAssets.length})
        </h2>
        {loading ? (
          <p>Loading assets...</p>
        ) : (
          <AssetGrid assets={filteredAssets} onDelete={handleDelete} />
        )}
      </div>
    </div>
  )
}
