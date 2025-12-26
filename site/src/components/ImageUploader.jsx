import { useState, useRef } from 'react'

export default function ImageUploader({ 
  onUpload, 
  loading = false,
  type = 'avatar', // 'avatar' or 'cover'
  currentImage = null,
  aspectRatio = '1/1' // '1/1' for avatar, '3/1' for cover
}) {
  const [preview, setPreview] = useState(currentImage)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Upload to server
    await onUpload(file)
  }

  const isAvatar = type === 'avatar'

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive 
            ? 'border-pink-500 bg-pink-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        {/* Preview or Icon */}
        <div className="mb-4 flex justify-center">
          {preview ? (
            <div className={`relative ${isAvatar ? 'w-24 h-24' : 'w-full h-40'} overflow-hidden rounded`}
              style={{ aspectRatio }}>
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          ) : (
            <div className={isAvatar ? 'text-5xl' : 'text-6xl'}>
              {isAvatar ? '📸' : '🖼️'}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-gray-700 font-semibold mb-1">
            {preview ? 'Change image' : 'Upload image'}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-400">
            {isAvatar 
              ? 'PNG, JPG, GIF up to 5MB (recommended: 256x256px or larger)'
              : 'PNG, JPG, GIF up to 5MB (recommended: 1200x400px or larger)'}
          </p>
        </div>

        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={loading}
          className="hidden"
        />
      </div>

      {/* Upload Status */}
      {loading && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
          ⏳ Uploading image...
        </div>
      )}
    </div>
  )
}
