import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PlatformStrip from '../components/PlatformStrip'
import UnifiedFeed from '../components/UnifiedFeed'
import SmartPanel from '../components/SmartPanel'
import PostingFlow from '../components/PostingFlow'
import '../styles/community.css'

export default function Community() {
  const { user, userContext, isAuthenticated } = useAuth()
  const [activePlatform, setActivePlatform] = useState('all')
  const [isPostingFlow, setIsPostingFlow] = useState(false)
  const [selectedPlatformsForPost, setSelectedPlatformsForPost] = useState([])

  // Determine user tier based on email or context
  const getUserTier = () => {
    if (!userContext) return 'fan'
    const email = userContext.email || user?.email || ''
    if (email.includes('scene')) return 'scene'
    if (email.includes('bestie')) return 'bestie'
    return 'fan'
  }

  const userTier = getUserTier()

  // Mock connected platforms
  const connectedPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: '📸', connected: true },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: true },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: userTier === 'scene' },
    { id: 'x', name: 'X', icon: '🐦', connected: userTier === 'scene' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', connected: userTier === 'scene' }
  ]

  // Mock posts for UnifiedFeed
  const mockPosts = [
    {
      id: 1,
      author: 'StyleGurus',
      avatar: '👗',
      handle: '@stylegurus',
      tier: 'scene',
      timestamp: '2 hours ago',
      caption: 'New Spring Collection Drop! 🌸✨ Finally added these pieces to my closet.',
      platforms: ['instagram', 'tiktok'],
      mediaType: 'image',
      media: '📸',
      likes: 2450,
      comments: 128,
      shares: 89,
      userId: 'user1'
    },
    {
      id: 2,
      author: 'TrendMaster',
      avatar: '🎬',
      handle: '@trendmaster',
      tier: 'bestie',
      timestamp: '4 hours ago',
      caption: 'Watch how to style oversized blazers for any occasion 👌',
      platforms: ['instagram'],
      mediaType: 'video',
      media: '🎬',
      likes: 5340,
      comments: 267,
      shares: 445,
      userId: 'user2'
    },
    {
      id: 3,
      author: 'ClosetGoals',
      avatar: '💎',
      handle: '@closetgoals',
      tier: 'scene',
      timestamp: '6 hours ago',
      caption: 'Thrifting finds that look like designer pieces! 🎯',
      platforms: ['instagram', 'tiktok', 'pinterest'],
      mediaType: 'carousel',
      media: '🎪',
      likes: 3210,
      comments: 145,
      shares: 212,
      userId: 'user3'
    },
    {
      id: 4,
      author: 'VintageVibes',
      avatar: '✨',
      handle: '@vintagevibes',
      tier: 'fan',
      timestamp: '8 hours ago',
      caption: 'My favorite vintage find from the weekend market 🛍️',
      platforms: ['instagram'],
      mediaType: 'image',
      media: '📸',
      likes: 890,
      comments: 34,
      shares: 12,
      userId: 'user4'
    }
  ]

  const handlePostPublish = (postData) => {
    console.log('Publishing post:', postData)
    setIsPostingFlow(false)
    // TODO: API call to publish post
  }

  return (
    <div className="community-container socialbee-platform">
      {/* SocialBee Platform: Header with Platform Navigation */}
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
          <UnifiedFeed 
            posts={mockPosts}
            currentPlatform={activePlatform}
            userTier={userTier}
            userId={user?.id || 'user-current'}
            onPostClick={(post) => console.log('Post clicked:', post)}
            onEngagement={(postId, action) => console.log(`${action} on post ${postId}`)}
          />
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
