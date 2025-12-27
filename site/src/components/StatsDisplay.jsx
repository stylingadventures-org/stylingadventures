import { useBestieStats, useEngagementMetrics, useEarningsData, useAchievements } from '../hooks/useBestieStats'
import '../styles/stats-display.css'

/**
 * Display component for Bestie dashboard stats
 * Shows real user data connected to backend
 */
export function StatsGrid() {
  const { stats, loading } = useBestieStats()

  if (loading) {
    return <div className="stats-loading">Loading your stats...</div>
  }

  return (
    <div className="stats-grid">
      {/* Activity Stats */}
      <div className="stat-card activity">
        <div className="stat-icon">🔥</div>
        <div className="stat-content">
          <div className="stat-value">{stats.stylingStreak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>

      <div className="stat-card content">
        <div className="stat-icon">👗</div>
        <div className="stat-content">
          <div className="stat-value">{stats.lookCount}</div>
          <div className="stat-label">Looks Created</div>
        </div>
      </div>

      <div className="stat-card collab">
        <div className="stat-icon">🤝</div>
        <div className="stat-content">
          <div className="stat-value">{stats.collabCount}</div>
          <div className="stat-label">Collaborations</div>
        </div>
      </div>

      <div className="stat-card followers">
        <div className="stat-icon">👥</div>
        <div className="stat-content">
          <div className="stat-value">{stats.followerCount.toLocaleString()}</div>
          <div className="stat-label">Followers</div>
        </div>
      </div>

      {/* Earnings Stats */}
      <div className="stat-card earnings">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <div className="stat-value">${stats.thisMonthEarnings}</div>
          <div className="stat-label">This Month</div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="stat-card engagement">
        <div className="stat-icon">❤️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalLikes.toLocaleString()}</div>
          <div className="stat-label">Total Likes</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Display engagement metrics
 */
export function EngagementWidget() {
  const { metrics, loading } = useEngagementMetrics()

  if (loading) {
    return <div className="widget-loading">Loading engagement data...</div>
  }

  return (
    <div className="engagement-widget">
      <h3>📊 Engagement Metrics</h3>
      <div className="metrics-row">
        <div className="metric">
          <span className="metric-label">Views (Today)</span>
          <span className="metric-value">{metrics.views_today.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Likes (Today)</span>
          <span className="metric-value">{metrics.likes_today}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Engagement Rate</span>
          <span className="metric-value">{metrics.engagement_rate}%</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Display earnings widget
 */
export function EarningsWidget() {
  const { earnings, loading } = useEarningsData()

  if (loading) {
    return <div className="widget-loading">Loading earnings data...</div>
  }

  return (
    <div className="earnings-widget">
      <h3>💸 Earnings Overview</h3>
      <div className="earnings-summary">
        <div className="earning-stat">
          <span className="label">Available Balance</span>
          <span className="value">${earnings.balance}</span>
        </div>
        <div className="earning-stat">
          <span className="label">Pending</span>
          <span className="value">${earnings.pending}</span>
        </div>
        <div className="earning-stat">
          <span className="label">This Month</span>
          <span className="value">${earnings.this_month}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Display achievements
 */
export function AchievementsWidget() {
  const { achievements, loading } = useAchievements()

  if (loading) {
    return <div className="widget-loading">Loading achievements...</div>
  }

  return (
    <div className="achievements-widget">
      <h3>🏆 Achievements</h3>
      <div className="achievement-progress">
        <div className="level-info">
          <span className="level">Level {achievements.level}</span>
          <span className="xp">{achievements.xp} / {achievements.next_level_xp} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(achievements.xp / achievements.next_level_xp) * 100}%` }}></div>
        </div>
      </div>
      <div className="badges-preview">
        <p className="badges-count">{achievements.total_unlocked} / {achievements.total_available} Badges Unlocked</p>
      </div>
    </div>
  )
}

/**
 * Combined dashboard widget
 */
export function BestieDashboard() {
  return (
    <div className="bestie-dashboard">
      <h2>📈 Your Dashboard</h2>
      <StatsGrid />
      <div className="widgets-grid">
        <EngagementWidget />
        <EarningsWidget />
        <AchievementsWidget />
      </div>
    </div>
  )
}
