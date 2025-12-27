import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import PlatformStrip from '../components/PlatformStrip'
import UnifiedFeed from '../components/UnifiedFeed'
import SmartPanel from '../components/SmartPanel'
import PostingFlow from '../components/PostingFlow'
import { getApolloClient } from '../api/apollo'
import { CLOSET_FEED, LIST_CREATORS_FOR_FEED } from '../api/graphql'
import '../styles/socialbee.css'

export default function SocialBee() {
  const { user, userContext, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [activePlatform, setActivePlatform] = useState('all')
  const [isPostingFlow, setIsPostingFlow] = useState(false)
  const [selectedPlatformsForPost, setSelectedPlatformsForPost] = useState([])
  const [closetItems, setClosetItems] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasRetried, setHasRetried] = useState(false)

  // Determine user tier based on context (more reliable than email)
  const getUserTier = () => {
    if (!userContext) return 'fan'
    
    // Check multiple tier indicators
    if (userContext.tier === 'SCENE' || userContext.role === 'SCENE') return 'scene'
    if (userContext.tier === 'BESTIE' || userContext.role === 'BESTIE' || userContext.isBestie) return 'bestie'
    if (userContext.tier === 'CREATOR' || userContext.role === 'CREATOR' || userContext.isCreator) return 'creator'
    
    return 'fan'
  }

  const userTier = getUserTier()
  
  // Determine if user can create posts (BESTIE+ only)
  const canCreatePosts = isAuthenticated && ['bestie', 'scene', 'creator'].includes(userTier)

  // Fetch closet feed and creators from AppSync
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🐝 SocialBee: Initializing data fetch...')
        setLoading(true)
        setError(null)
        
        const client = await getApolloClient()
        
        if (!client) {
          console.error('❌ Apollo Client failed to initialize')
          setError('Unable to connect to the backend. Please refresh the page.')
          return
        }

        console.log('✅ Apollo Client initialized, fetching closet feed...')

        // Fetch closet feed (fashion items)
        const feedResult = await client.query({
          query: CLOSET_FEED,
          variables: {
            limit: 20,
            sort: 'NEWEST'
          }
        })

        console.log('📊 Feed result:', feedResult.data)

        // Fetch creators for sidebar/profiles
        const creatorsResult = await client.query({
          query: LIST_CREATORS_FOR_FEED,
          variables: {
            limit: 10
          }
        })

        console.log('👥 Creators result:', creatorsResult.data)

        if (feedResult.data?.closetFeed?.items) {
          setClosetItems(feedResult.data.closetFeed.items)
          console.log(`✅ Loaded ${feedResult.data.closetFeed.items.length} items`)
        } else {
          console.warn('⚠️ No closetFeed items in response')
        }

        if (creatorsResult.data?.listCreators?.items) {
          setCreators(creatorsResult.data.listCreators.items)
          console.log(`✅ Loaded ${creatorsResult.data.listCreators.items.length} creators`)
        } else {
          console.warn('⚠️ No creators in response')
        }

        setError(null)
      } catch (err) {
        console.error('❌ Error fetching SocialBee data:', err)
        
        // Provide specific error messages
        let errorMessage = 'Failed to load feed'
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          errorMessage = 'Authentication error. Please log in again.'
        } else if (err.message?.includes('Network')) {
          errorMessage = 'Network error. Check your connection.'
        } else if (err.message?.includes('AppSync') || err.message?.includes('GraphQL')) {
          errorMessage = 'Backend error. Please try again later.'
        } else {
          errorMessage = `${err.message || 'Failed to load feed'}`
        }
        
        setError(errorMessage)
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

  // Show loading state
  if (loading && closetItems.length === 0) {
    return (
      <div className="socialbee-container">
        <div className="socialbee-loading">
          <div className="loading-spinner"></div>
          <p>Loading your social feed...</p>
          <small>Connecting to Bestie Closets & Creator Feeds</small>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error && !loading) {
    return (
      <div className="socialbee-container">
        <div className="socialbee-error">
          <p>⚠️ {error}</p>
          <p style={{fontSize: '0.9em', marginTop: '10px', color: '#666'}}>
            Troubleshooting tips:
          </p>
          <ul style={{fontSize: '0.9em', color: '#666', margin: '10px 0'}}>
            <li>Check that you're connected to the internet</li>
            <li>Try refreshing the page (F5)</li>
            <li>Verify AppSync API is running</li>
            <li>Check browser console (F12) for more details</li>
          </ul>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="socialbee-container">
      {/* Platform Navigation Strip - below header */}
      <PlatformStrip 
        activePlatform={activePlatform}
        onPlatformChange={setActivePlatform}
        userTier={userTier}
        platforms={[
          { id: 'all', name: 'All Platforms', icon: '🌐', connected: true },
          { id: 'instagram', name: 'Instagram', icon: '📸', connected: true },
          { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: true },
          { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: userTier === 'scene' },
          { id: 'x', name: 'X', icon: '🐦', connected: userTier === 'scene' },
          { id: 'youtube', name: 'YouTube', icon: '▶️', connected: userTier === 'scene' }
        ]}
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
              canInteract={isAuthenticated}
              onPostClick={(post) => console.log('Post clicked:', post)}
              onEngagement={(postId, action) => console.log(`${action} on post ${postId}`)}
            />
          ) : (
            <div className="empty-feed">
              <p style={{fontSize: '2em', marginBottom: '10px'}}>📭</p>
              <h3>No posts yet</h3>
              <p>Start following creators to see content on SocialBee!</p>
              <button 
                onClick={() => navigate('/discover')}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  background: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔎 Discover Creators
              </button>
            </div>
          )}
        </div>

        {/* Smart Panel (Right Sidebar) - Only on desktop */}
        {!isPostingFlow && (
          <SmartPanel 
            isPosting={false}
            userTier={userTier}
            connectedPlatforms={[
              { id: 'instagram', name: 'Instagram', icon: '📸', connected: true },
              { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: true },
              { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: userTier === 'scene' },
              { id: 'x', name: 'X', icon: '🐦', connected: userTier === 'scene' },
              { id: 'youtube', name: 'YouTube', icon: '▶️', connected: userTier === 'scene' }
            ]}
            onUpgradeClick={() => navigate('/upgrade/bestie')}
          />
        )}
      </div>

      {/* PostingFlow Modal */}
      {isPostingFlow && canCreatePosts && (
        <PostingFlow 
          userTier={userTier}
          connectedPlatforms={[
            { id: 'instagram', name: 'Instagram', icon: '📸', connected: true },
            { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: true },
            { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: userTier === 'scene' },
            { id: 'x', name: 'X', icon: '🐦', connected: userTier === 'scene' },
            { id: 'youtube', name: 'YouTube', icon: '▶️', connected: userTier === 'scene' }
          ]}
          onPublish={(postData) => {
            console.log('Publishing post:', postData)
            setIsPostingFlow(false)
            // TODO: API call to publish post
          }}
          onClose={() => setIsPostingFlow(false)}
        />
      )}
    </div>
  )
}