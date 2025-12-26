import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ImageUploader from '../components/ImageUploader'
import FanLayout from '../components/FanLayout'

export default function CreatorSettings() {
  const navigate = useNavigate()
  const { userContext } = useAuth()

  // Profile data
  const [profile, setProfile] = useState({
    displayName: 'Alex Chen',
    handle: 'alexchen',
    bio: 'Fashion designer × Digital artist. Creating sustainable collections.',
    genres: ['Fashion', 'Digital Art', 'Sustainability'],
    avatar: 'https://d3fghn37bcpbig.cloudfront.net/avatar-placeholder.jpg',
    cover: 'https://d3fghn37bcpbig.cloudfront.net/cover-placeholder.jpg',
    instagram: 'https://instagram.com/alexchen',
    tiktok: 'https://tiktok.com/@alexchen',
    twitter: '',
    collabAvailability: 'OPEN',
  })

  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Redirect if not authenticated
  useEffect(() => {
    if (!userContext?.email) {
      navigate('/discover')
    }
  }, [userContext, navigate])

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
    setSaved(false)
  }

  const handleGenreChange = (index, value) => {
    const newGenres = [...profile.genres]
    newGenres[index] = value
    setProfile(prev => ({
      ...prev,
      genres: newGenres.filter(g => g.trim())
    }))
    setSaved(false)
  }

  const addGenre = () => {
    setProfile(prev => ({
      ...prev,
      genres: [...prev.genres, '']
    }))
  }

  const handleImageUpload = async (file, type) => {
    try {
      setUploading(true)
      
      // TODO: Wire up to actual Uploads API
      // For now, simulate upload with local preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          [type]: e.target.result
        }))
        setSaved(false)
      }
      reader.readAsDataURL(file)

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUploading(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image')
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setUploading(true)
      
      // TODO: Call GraphQL updateCreatorProfile mutation
      // For now, simulate save
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setEditing(false)
      setUploading(false)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save profile')
      setUploading(false)
    }
  }

  return (
    <FanLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Creator Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile, images, and links</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex gap-8">
              {['profile', 'images', 'links'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 font-semibold border-b-2 capitalize transition ${
                    activeTab === tab
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'profile' ? '👤 Profile' : tab === 'images' ? '🖼️ Images' : '🔗 Links'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {saved && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  ✓ Profile saved successfully!
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Basic Info</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      disabled={!editing}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Handle
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">@</span>
                      <input
                        type="text"
                        value={profile.handle}
                        onChange={(e) => handleInputChange('handle', e.target.value)}
                        disabled={!editing}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                        placeholder="yourhandle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!editing}
                      rows={4}
                      maxLength={160}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                      placeholder="Tell creators and fans about yourself..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.bio.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Genres / Tags
                    </label>
                    <div className="space-y-2">
                      {profile.genres.map((genre, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={genre}
                          onChange={(e) => handleGenreChange(idx, e.target.value)}
                          disabled={!editing}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                          placeholder="e.g., Fashion, Music"
                        />
                      ))}
                      {editing && (
                        <button
                          onClick={addGenre}
                          className="text-pink-600 hover:text-pink-700 font-semibold text-sm"
                        >
                          + Add genre
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collaboration Availability
                    </label>
                    <select
                      value={profile.collabAvailability}
                      onChange={(e) => handleInputChange('collabAvailability', e.target.value)}
                      disabled={!editing}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                    >
                      <option value="OPEN">Open to collaborations</option>
                      <option value="SELECTIVE">Selective collaborations</option>
                      <option value="CLOSED">Not taking collaborations</option>
                    </select>
                  </div>
                </div>

                {/* Edit/Save Buttons */}
                <div className="mt-6 flex gap-3">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-6 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={uploading}
                        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {uploading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-900 font-semibold rounded-full hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-8">
              {/* Cover Image */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Cover Image</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This appears at the top of your profile. Recommended size: 1200x400px
                </p>
                <ImageUploader
                  type="cover"
                  currentImage={profile.cover}
                  onUpload={(file) => handleImageUpload(file, 'cover')}
                  loading={uploading}
                  aspectRatio="3/1"
                />
              </div>

              {/* Avatar Image */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Avatar</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your profile picture. Recommended size: 256x256px or larger
                </p>
                <ImageUploader
                  type="avatar"
                  currentImage={profile.avatar}
                  onUpload={(file) => handleImageUpload(file, 'avatar')}
                  loading={uploading}
                  aspectRatio="1/1"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💾 Automatic Saving:</strong> Images are automatically saved when uploaded. 
                  Multiple sizes are generated for fast loading (avatar: 64px, 128px, 256px; cover: 1200x400px).
                </p>
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Social & External Links</h2>
              <p className="text-sm text-gray-600 mb-6">
                Add links to your social media and other profiles
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📱 Instagram
                  </label>
                  <input
                    type="url"
                    value={profile.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎵 TikTok
                  </label>
                  <input
                    type="url"
                    value={profile.tiktok}
                    onChange={(e) => handleInputChange('tiktok', e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    𝕏 Twitter
                  </label>
                  <input
                    type="url"
                    value={profile.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    disabled={!editing}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 disabled:bg-gray-50"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>

              {/* Edit/Save Buttons */}
              <div className="mt-6 flex gap-3">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition"
                  >
                    Edit Links
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={uploading}
                      className="px-6 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {uploading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-900 font-semibold rounded-full hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </FanLayout>
  )
}
