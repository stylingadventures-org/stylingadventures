import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PlatformStrip from '../components/PlatformStrip'
import UnifiedFeed from '../components/UnifiedFeed'
import SmartPanel from '../components/SmartPanel'
import PostingFlow from '../components/PostingFlow'
import '../styles/socialbee.css'

export default function SocialBee() {
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
      avatar: '✨',
      handle: '@stylegurus',
      tier: 'scene',
      timestamp: '2 hours ago',
      caption: 'POV: You just discovered the perfect spring jacket 🧥✨ Who else is obsessed?',
      platforms: ['tiktok'],
      mediaType: 'video',
      media: '📹',
      likes: 24500,
      comments: 1240,
      shares: 890,
      userId: 'user1'
    },
    {
      id: 2,
      author: 'LalaCloset',
      avatar: '👗',
      handle: '@lalacloset',
      tier: 'bestie',
      timestamp: '4 hours ago',
      caption: 'New closet organization hack that changed my life 🔥 Swipe for the after! #OrganizedChaos #ClosetGoals',
      platforms: ['instagram'],
      mediaType: 'image',
      media: '📸',
      likes: 3420,
      comments: 267,
      shares: 145,
      userId: 'user2'
    },
    {
      id: 3,
      author: 'TrendAlert',
      avatar: '🚨',
      handle: '@trendalert',
      tier: 'scene',
      timestamp: '5 hours ago',
      caption: 'Fashion trend that ACTUALLY looks good on everyone 💅 Try it!',
      platforms: ['tiktok', 'instagram'],
      mediaType: 'video',
      media: '📹',
      likes: 89200,
      comments: 4560,
      shares: 2340,
      userId: 'user3'
    },
    {
      id: 4,
      author: 'StyleInsider',
      avatar: '🎭',
      handle: '@styleinsider',
      tier: 'bestie',
      timestamp: '6 hours ago',
      caption: 'Behind the scenes: How we style this season\'s hottest look 📷 Full video on our channel!',
      platforms: ['instagram'],
      mediaType: 'carousel',
      media: '🎪',
      likes: 5230,
      comments: 389,
      shares: 156,
      userId: 'user4'
    }
  ]

  const handlePostPublish = (postData) => {
    console.log('Publishing post:', postData)
    setIsPostingFlow(false)
    // TODO: API call to publish post
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