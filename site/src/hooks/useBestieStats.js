import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook to manage and fetch Bestie user stats
 * Connects to backend API (currently with mock data as fallback)
 */
export function useBestieStats() {
  const { userContext } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Default mock stats (fallback when backend unavailable)
  const defaultStats = {
    // Activity Stats
    stylingStreak: 42,
    lookCount: 247,
    collabCount: 18,

    // Social Stats
    followerCount: 1250,
    followingCount: 342,
    totalViews: 45230,

    // Earnings Stats
    thisMonthEarnings: 0,
    totalEarnings: 0,
    pendingEarnings: 0,

    // Engagement Stats
    totalLikes: 12540,
    totalComments: 2340,
    totalShares: 1250,

    // Content Stats
    publishedLooks: 247,
    draftLooks: 8,
    totalWardrobeItems: 342,

    // Achievement Stats
    badges: 12,
    challenges_won: 5,
    achievements_unlocked: 18,

    // Update timestamp
    lastUpdated: new Date().toISOString(),
  }

  // Fetch stats from backend
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual backend API call when ready
      // Example endpoint: /api/user/stats or GraphQL query
      // const response = await fetch('/api/user/stats', {
      //   headers: {
      //     'Authorization': `Bearer ${userContext?.id_token}`
      //   }
      // })
      // const data = await response.json()
      // setStats(data)

      // For now, use mock data with slight randomization for demo
      const mockStats = {
        ...defaultStats,
        stylingStreak: Math.floor(Math.random() * 100) + 1,
        lookCount: Math.floor(Math.random() * 500) + 100,
        followerCount: Math.floor(Math.random() * 5000) + 1000,
        totalLikes: Math.floor(Math.random() * 50000) + 5000,
      }

      setStats(mockStats)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err.message)
      // Fallback to default stats on error
      setStats(defaultStats)
    } finally {
      setLoading(false)
    }
  }, [userContext])

  // Fetch stats on mount and when userContext changes
  useEffect(() => {
    if (userContext?.email) {
      fetchStats()
    }
  }, [userContext?.email, fetchStats])

  // Refetch function for manual updates
  const refetch = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats: stats || defaultStats,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook for user engagement metrics
 */
export function useEngagementMetrics() {
  const { userContext } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const defaultMetrics = {
    views_today: 342,
    views_week: 2450,
    views_month: 12340,
    
    likes_today: 125,
    likes_week: 890,
    likes_month: 3450,
    
    engagement_rate: 8.5, // percentage
    trending_looks: [],
    top_performing_look: {
      title: 'Summer Vibes',
      likes: 1250,
      views: 5234,
    }
  }

  useEffect(() => {
    if (userContext?.email) {
      // TODO: Fetch real engagement metrics from backend
      setMetrics(defaultMetrics)
      setLoading(false)
    }
  }, [userContext?.email])

  return { metrics: metrics || defaultMetrics, loading }
}

/**
 * Hook for earnings and financials
 */
export function useEarningsData() {
  const { userContext } = useAuth()
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)

  const defaultEarnings = {
    balance: 0,
    pending: 0,
    lifetime_total: 0,
    
    this_month: 0,
    this_week: 0,
    
    breakdown: {
      collaborations: 0,
      challenges: 0,
      sponsorships: 0,
      other: 0,
    },
    
    recent_transactions: [],
    
    payment_method: null,
    is_verified: false,
  }

  useEffect(() => {
    if (userContext?.email) {
      // TODO: Fetch real earnings data from backend
      setEarnings(defaultEarnings)
      setLoading(false)
    }
  }, [userContext?.email])

  return { earnings: earnings || defaultEarnings, loading }
}

/**
 * Hook for user achievements and badges
 */
export function useAchievements() {
  const { userContext } = useAuth()
  const [achievements, setAchievements] = useState(null)
  const [loading, setLoading] = useState(true)

  const defaultAchievements = {
    total_unlocked: 18,
    total_available: 50,
    
    badges: [
      { id: 1, name: 'First Look', description: 'Create your first look', unlocked: true, date: '2024-01-15' },
      { id: 2, name: 'Collaborator', description: 'Complete 5 collaborations', unlocked: true, date: '2024-02-20' },
      { id: 3, name: 'Style Icon', description: 'Get 1000 followers', unlocked: true, date: '2024-03-10' },
    ],
    
    level: 12,
    xp: 4500,
    next_level_xp: 5000,
  }

  useEffect(() => {
    if (userContext?.email) {
      // TODO: Fetch real achievements from backend
      setAchievements(defaultAchievements)
      setLoading(false)
    }
  }, [userContext?.email])

  return { achievements: achievements || defaultAchievements, loading }
}
