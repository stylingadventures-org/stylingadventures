import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-home.css';

export default function BestieHome() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('feed');

  // Mock data for demonstration
  const stats = {
    stylingStreak: 42,
    lookCount: 247,
    collabCount: 18,
    followerCount: 1250,
    thisMonthEarnings: 0,
  };

  const recentLooks = [
    { id: 1, title: 'Summer Casual', image: '☀️', likes: 342, collabs: 2 },
    { id: 2, title: 'Evening Glam', image: '✨', likes: 521, collabs: 1 },
    { id: 3, title: 'Weekend Vibes', image: '🌿', likes: 198, collabs: 0 },
  ];

  const recentCollabs = [
    { id: 1, creator: 'Emma Style', role: 'Paired with', status: 'Active', earnings: '$0' },
    { id: 2, creator: 'Fashion Forward', role: 'Invited by', status: 'Pending', earnings: '$0' },
  ];

  const challenges = [
    { id: 1, title: 'Color Challenge', description: 'Build an outfit around one color', prize: '$50', participants: 342, status: 'Active' },
    { id: 2, title: 'Season Shift', description: 'Transition your style for fall', prize: '$75', participants: 567, status: 'Active' },
    { id: 3, title: 'Thrift Find', description: 'Style your best thrifted piece', prize: '$100', participants: 289, status: 'Ending Soon' },
  ];

  const dailyQuests = [
    { id: 1, title: 'Create a Look', reward: 10, icon: '✨', completed: true },
    { id: 2, title: 'Give Feedback', reward: 5, icon: '💬', completed: false },
    { id: 3, title: 'Visit a Creator', reward: 5, icon: '👀', completed: false },
  ];

  return (
    <div className="bestie-home">
      {/* Header */}
      <div className="bestie-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.email?.split('@')[0]}! 👋</h1>
            <p>Your personal style hub is ready to explore</p>
          </div>
          <div className="header-actions">
            <Link to="/bestie/studio" className="action-btn primary">
              ✨ Create Look
            </Link>
            <Link to="/bestie/closet" className="action-btn secondary">
              👗 My Closet
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.stylingStreak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👗</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lookCount}</div>
            <div className="stat-label">Looks Created</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.collabCount}</div>
            <div className="stat-label">Collaborations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.followerCount}</div>
            <div className="stat-label">Followers</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/bestie/studio" className="quick-action-card">
            <span className="qa-icon">✨</span>
            <span className="qa-text">Start Styling</span>
            <span className="qa-arrow">→</span>
          </Link>
          <Link to="/bestie/challenges" className="quick-action-card">
            <span className="qa-icon">🏆</span>
            <span className="qa-text">Join Challenge</span>
            <span className="qa-arrow">→</span>
          </Link>
          <Link to="/bestie/studio" className="quick-action-card">
            <span className="qa-icon">👥</span>
            <span className="qa-text">Find Collab</span>
            <span className="qa-arrow">→</span>
          </Link>
          <Link to="/bestie/profile" className="quick-action-card">
            <span className="qa-icon">⚙️</span>
            <span className="qa-text">My Profile</span>
            <span className="qa-arrow">→</span>
          </Link>
        </div>
      </div>

      {/* Daily Quests */}
      <div className="daily-quests-section">
        <h2>Today's Quests</h2>
        <div className="quests-list">
          {dailyQuests.map((quest) => (
            <div key={quest.id} className={`quest-card ${quest.completed ? 'completed' : ''}`}>
              <div className="quest-content">
                <span className="quest-icon">{quest.icon}</span>
                <div className="quest-info">
                  <div className="quest-title">{quest.title}</div>
                  <div className="quest-reward">+{quest.reward} XP</div>
                </div>
              </div>
              {quest.completed ? (
                <div className="quest-badge completed">✓</div>
              ) : (
                <div className="quest-badge pending">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bestie-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${selectedTab === 'feed' ? 'active' : ''}`}
            onClick={() => setSelectedTab('feed')}
          >
            🎬 Feed
          </button>
          <button
            className={`tab-btn ${selectedTab === 'challenges' ? 'active' : ''}`}
            onClick={() => setSelectedTab('challenges')}
          >
            🏆 Challenges
          </button>
          <button
            className={`tab-btn ${selectedTab === 'collabs' ? 'active' : ''}`}
            onClick={() => setSelectedTab('collabs')}
          >
            🤝 Collabs
          </button>
        </div>

        {/* Feed Tab */}
        {selectedTab === 'feed' && (
          <div className="tab-content">
            <h3>Your Recent Looks</h3>
            <div className="looks-grid">
              {recentLooks.map((look) => (
                <div key={look.id} className="look-card">
                  <div className="look-image">{look.image}</div>
                  <div className="look-info">
                    <h4>{look.title}</h4>
                    <div className="look-stats">
                      <span>❤️ {look.likes}</span>
                      <span>🤝 {look.collabs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/bestie/studio" className="view-all-link">
              View All Looks →
            </Link>
          </div>
        )}

        {/* Challenges Tab */}
        {selectedTab === 'challenges' && (
          <div className="tab-content">
            <h3>Active Challenges</h3>
            <div className="challenges-list">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="challenge-card">
                  <div className="challenge-header">
                    <h4>{challenge.title}</h4>
                    <span className={`challenge-status ${challenge.status.toLowerCase().replace(' ', '-')}`}>
                      {challenge.status}
                    </span>
                  </div>
                  <p className="challenge-description">{challenge.description}</p>
                  <div className="challenge-footer">
                    <div className="challenge-stats">
                      <span>🏆 Prize: {challenge.prize}</span>
                      <span>👥 {challenge.participants} participants</span>
                    </div>
                    <Link to="/bestie/challenges" className="challenge-btn">
                      View Challenge →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collabs Tab */}
        {selectedTab === 'collabs' && (
          <div className="tab-content">
            <h3>Your Collaborations</h3>
            <div className="collabs-list">
              {recentCollabs.length > 0 ? (
                recentCollabs.map((collab) => (
                  <div key={collab.id} className="collab-card">
                    <div className="collab-avatar">👤</div>
                    <div className="collab-info">
                      <h4>{collab.creator}</h4>
                      <p>{collab.role}</p>
                    </div>
                    <div className="collab-meta">
                      <span className={`status ${collab.status.toLowerCase()}`}>
                        {collab.status}
                      </span>
                      <span className="earnings">{collab.earnings}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>👀 No collaborations yet</p>
                  <Link to="/bestie/studio" className="cta-link">
                    Start a collaboration →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Promotions */}
      <div className="promo-section">
        <div className="promo-card creator-promo">
          <div className="promo-content">
            <h3>Ready to earn?</h3>
            <p>Join Creator tier and start monetizing your style expertise</p>
            <Link to="/upgrade/creator" className="promo-btn">
              Upgrade to Creator →
            </Link>
          </div>
          <div className="promo-icon">💰</div>
        </div>
      </div>
    </div>
  );
}
