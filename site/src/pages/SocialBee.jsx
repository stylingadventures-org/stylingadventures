import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import PlatformStrip from '../components/PlatformStrip'
import UnifiedFeed from '../components/UnifiedFeed'
import SmartPanel from '../components/SmartPanel'
import PostingFlow from '../components/PostingFlow'
import { getApolloClient } from '../api/apollo'
import { CLOSET_FEED, LIST_CREATORS_FOR_FEED } from '../api/graphql'
import '../styles/socialbee.css'

export default function SocialBee() {
  const { user, userContext, isAuthenticated } = useAuth()
  const [activePlatform, setActivePlatform] = useState('all')
  const [isPostingFlow, setIsPostingFlow] = useState(false)
  const [selectedPlatformsForPost, setSelectedPlatformsForPost] = useState([])
  const [closetItems, setClosetItems] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Determine user tier based on email or context
  const getUserTier = () => {
    if (!userContext) return 'fan'
    const email = userContext.email || user?.email || ''
    if (email.includes('scene')) return 'scene'
    if (email.includes('bestie')) return 'bestie'
    return 'fan'
  }

  const userTier = getUserTier()

  // Fetch closet feed and creators from AppSync
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const client = await getApolloClient()
        
        if (!client) {
          console.error('Apollo Client not initialized')
          setError('Failed to initialize API client')
          return
        }

        // Fetch closet feed (fashion items)
        const feedResult = await client.query({
          query: CLOSET_FEED,
          variables: {
            limit: 20,
            sort: 'NEWEST'
          }
        })

        // Fetch creators for sidebar/profiles
        const creatorsResult = await client.query({
          query: LIST_CREATORS_FOR_FEED,
          variables: {
            limit: 10
          }
        })

        if (feedResult.data?.closetFeed?.items) {
          setClosetItems(feedResult.data.closetFeed.items)
        }

        if (creatorsResult.data?.listCreators?.items) {
          setCreators(creatorsResult.data.listCreators.items)
        }

        setError(null)
      } catch (err) {
        console.error('Error fetching SocialBee data:', err)
        setError(`Failed to load feed: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Convert ClosetItems to post format for UnifiedFeed
  const transformedPosts = closetItems.map((item, index) => {
    // Find creator info if available
    const creator = creators.find(c => c.id === item.ownerId)
    
    return {
      id: item.id,
      author: creator?.displayName || `Creator ${index + 1}`,
      avatar: creator?.avatarUrl ? '👤' : '✨',
      handle: creator?.handle || `@creator${index}`,
      tier: creator?.tier || userTier,
      timestamp: new Date(item.createdAt).toLocaleDateString(),
      caption: item.title || item.notes || 'Shared a closet item',
      platforms: ['instagram', 'tiktok'], // Default platforms, can be enhanced
      mediaType: 'image',
      media: '📸',
      likes: Math.floor(Math.random() * 5000), // Will be replaced with real engagement data
      comments: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 100),
      userId: item.ownerId,
      // Store original closet item data
      _closetItem: item
    }
  })

  // Mock connected platforms (will be replaced with real platform sync data)
  const connectedPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸', connected: true },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: true },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: userTier === 'scene' },
    { id: 'x', name: 'X', icon: '🐦', connected: userTier === 'scene' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', connected: userTier === 'scene' }
  ]

  const handlePostPublish = (postData) => {
    console.log('Publishing post:', postData)
    setIsPostingFlow(false)
    // TODO: API call to publish post
  }

  // Show loading state
  if (loading && closetItems.length === 0) {
    return (
      <div className="socialbee-container socialbee-platform">
        <div className="socialbee-header">
          <div className="header-left">
            <span className="bee-icon">🐝</span>
            <h1>SocialBee</h1>
          </div>
        </div>
        <div className="socialbee-loading">
          <p>Loading your social feed...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="socialbee-container socialbee-platform">
        <div className="socialbee-header">
          <div className="header-left">
            <span className="bee-icon">🐝</span>
            <h1>SocialBee</h1>
          </div>
        </div>
        <div className="socialbee-error">
          <p>⚠️ {error}</p>
          <p style={{fontSize: '0.9em', marginTop: '10px', color: '#666'}}>
            Make sure the backend is running and AppSync is configured correctly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="socialbee-container socialbee-platform">
      {/* SocialBee Platform Header */}
      <div className="socialbee-header">
        <div className="header-left">
          <span className="bee-icon">🐝</span>
          <h1>SocialBee</h1>
        </div>
        {isAuthenticated && (
          <button 
            className="create-post-btn"
            onClick={() => setIsPostingFlow(true)}
          >
            ✏️ Create Post
          </button>
        )}
      </div>

      {/* Platform Navigation Strip */}
      <PlatformStrip 
        activePlatform={activePlatform}
        onPlatformChange={setActivePlatform}
        userTier={userTier}
        platforms={connectedPlatforms}
      />

      {/* Main Content Layout: Feed + Panel */}
      <div className="socialbee-content">
        {/* Unified Feed */}
        <div className="socialbee-feed-wrapper">
          {transformedPosts.length > 0 ? (
            <UnifiedFeed 
              posts={transformedPosts}
              currentPlatform={activePlatform}
              userTier={userTier}
              userId={user?.id || 'user-current'}
              onPostClick={(post) => console.log('Post clicked:', post)}
              onEngagement={(postId, action) => console.log(`${action} on post ${postId}`)}
            />
          ) : (
            <div className="empty-feed">
              <p>📭 No posts yet. Start following creators to see content!</p>
            </div>
          )}
        </div>

        {/* Smart Panel (Right Sidebar) - Only on desktop */}
        <SmartPanel 
          isPosting={isPostingFlow}
          postingContext={{
            selectedPlatforms: selectedPlatformsForPost,
            characterCounts: {}
          }}
          userTier={userTier}
          connectedPlatforms={connectedPlatforms}
          onUpgradeClick={() => console.log('Upgrade clicked')}
        />
      </div>

      {/* PostingFlow Modal */}
      {isPostingFlow && (
        <PostingFlow 
          userTier={userTier}
          connectedPlatforms={connectedPlatforms}
          onPublish={handlePostPublish}
          onClose={() => setIsPostingFlow(false)}
        />
      )}
    </div>
  )
}