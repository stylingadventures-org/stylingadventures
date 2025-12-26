import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FanLayout from '../components/FanLayout'

export default function CreatorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userContext } = useAuth()
  const [creator, setCreator] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [portfolio, setPortfolio] = useState([])

  useEffect(() => {
    loadCreatorProfile()
  }, [id])

  const loadCreatorProfile = async () => {
    try {
      setLoading(true)
      // TODO: Replace with real GraphQL query to fetch creator by ID
      // For now, mock data
      const mockCreator = {
        id: id,
        displayName: 'Alex Chen',
        handle: '@alexchen',
        tier: 'CREATOR',
        bio: 'Fashion designer × Digital artist. Creating sustainable collections.',
        genres: ['Fashion', 'Digital Art', 'Sustainability'],
        avatar: 'https://d3fghn37bcpbig.cloudfront.net/avatar-placeholder.jpg',
        cover: 'https://d3fghn37bcpbig.cloudfront.net/cover-placeholder.jpg',
        stats: {
          followers: 1250,
          posts: 24,
          tracks: 0,
        },
        isFollowing: false,
        bio_long: 'Sustainable fashion designer based in NYC. Merging tech with textile design. Open to collaborations on digital fashion projects.',
        links: {
          instagram: 'https://instagram.com/alexchen',
          tiktok: 'https://tiktok.com/@alexchen',
          shop: null,
        },
        collabAvailability: 'Open',
      }

      setCreator(mockCreator)
      setIsFollowing(mockCreator.isFollowing)

      // Mock posts
      setPosts([
        {
          id: '1',
          title: 'New Collection Drop',
          excerpt: 'Just launched sustainable sneaker line...',
          image: 'https://d3fghn37bcpbig.cloudfront.net/post-1.jpg',
          likes: 245,
          date: '2025-12-23',
        },
        {
          id: '2',
          title: 'Design Process Breakdown',
          excerpt: 'How I design with recycled materials...',
          image: 'https://d3fghn37bcpbig.cloudfront.net/post-2.jpg',
          likes: 189,
          date: '2025-12-20',
        },
      ])

      // Mock portfolio
      setPortfolio([
        {
          id: '1',
          title: 'Eco Sneaker Line',
          image: 'https://d3fghn37bcpbig.cloudfront.net/portfolio-1.jpg',
          featured: true,
        },
        {
          id: '2',
          title: 'Textile Digital Art',
          image: 'https://d3fghn37bcpbig.cloudfront.net/portfolio-2.jpg',
          featured: false,
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error loading creator profile:', error)
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    // TODO: Call GraphQL mutation to follow/unfollow
    setIsFollowing(!isFollowing)
  }

  const handleMessage = () => {
    // TODO: Navigate to message composer or inbox
    alert('Message feature coming soon!')
  }

  if (loading) {
    return (
      <FanLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </FanLayout>
    )
  }

  if (!creator) {
    return (
      <FanLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
          <button
            onClick={() => navigate('/fan/home')}
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600"
          >
            Back to Home
          </button>
        </div>
      </FanLayout>
    )
  }

  return (
    <FanLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image */}
          <div
            className="h-48 sm:h-64 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 bg-cover bg-center relative"
            style={{
              backgroundImage: `url('${creator.cover}')`,
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Avatar + Info Section */}
          <div className="px-4 sm:px-6 pb-6">
            <div className="max-w-4xl mx-auto">
              {/* Avatar positioned over cover */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 relative z-10">
                <img
                  src={creator.avatar}
                  alt={creator.displayName}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg bg-gray-200"
                />

                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold text-gray-900">{creator.displayName}</h1>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                      {creator.tier}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">@{creator.handle}</p>
                  <p className="text-gray-700 text-sm mb-2">{creator.bio}</p>

                  {/* Genres/Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {creator.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>

                  {/* Collab Badge */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      ✓ Open to Collabs
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 sm:pb-2">
                  <button
                    onClick={handleFollow}
                    className={`flex-1 sm:flex-none px-6 py-2 font-semibold rounded-full transition ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={handleMessage}
                    className="flex-1 sm:flex-none px-6 py-2 font-semibold rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-b bg-white sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{creator.stats.followers}</p>
                <p className="text-sm text-gray-600">Followers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{creator.stats.posts}</p>
                <p className="text-sm text-gray-600">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{creator.stats.tracks}</p>
                <p className="text-sm text-gray-600">Tracks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b sticky top-16 z-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex gap-6">
              {['posts', 'portfolio', 'about'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 font-semibold border-b-2 capitalize transition ${
                    activeTab === tab
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'posts' && (
            <div className="grid gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer"
                >
                  <div className="flex gap-4 p-4">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{post.excerpt}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>❤️ {post.likes} likes</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {portfolio.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer relative"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  {item.featured && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      ✨ Featured
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-gray-700 mb-4">{creator.bio_long}</p>

              <h3 className="text-lg font-bold mb-3 mt-6">Links</h3>
              <div className="space-y-2">
                {creator.links.instagram && (
                  <a
                    href={creator.links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-pink-600 hover:underline"
                  >
                    📱 Instagram
                  </a>
                )}
                {creator.links.tiktok && (
                  <a
                    href={creator.links.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-pink-600 hover:underline"
                  >
                    🎵 TikTok
                  </a>
                )}
              </div>

              <h3 className="text-lg font-bold mb-3 mt-6">Collaboration Info</h3>
              <p className="text-gray-700">
                <strong>Status:</strong> {creator.collabAvailability}
              </p>
            </div>
          )}
        </div>
      </div>
    </FanLayout>
  )
}
