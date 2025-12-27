/**
 * BESTIE Tier - Scene Club Page
 * Features: Exclusive community, live styling events, direct creator interaction
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-home.css';

export default function SceneClub() {
  const { userContext } = useAuth();
  const [selectedTab, setSelectedTab] = useState('events');

  const clubStats = {
    members: 12450,
    activeEvents: 8,
    messagesToday: 342,
    eventAttendance: 89,
  };

  const liveEvents = [
    {
      id: 'event_1',
      title: 'Live Styling with Luna Style Guide',
      creator: 'Luna Style Guide',
      startTime: '6:00 PM',
      duration: '1 hour',
      attendees: 2340,
      maxAttendees: 3000,
      topic: 'Street Style Photography Tips',
      status: 'Starting in 15 min',
      emoji: '📸',
    },
    {
      id: 'event_2',
      title: 'Q&A: Sustainable Fashion',
      creator: 'Zara Creates',
      startTime: '7:30 PM',
      duration: '1.5 hours',
      attendees: 890,
      maxAttendees: 2000,
      topic: 'Eco-Friendly Shopping & Styling',
      status: 'Starts in 2 hours',
      emoji: '🌿',
    },
    {
      id: 'event_3',
      title: 'Professional Wardrobe Workshop',
      creator: 'Marcus Fashion',
      startTime: '8:00 PM',
      duration: '1.5 hours',
      attendees: 1560,
      maxAttendees: 2500,
      topic: 'Building Your Power Wardrobe',
      status: 'Starts in 2.5 hours',
      emoji: '💼',
    },
  ];

  const exclusiveContent = [
    {
      id: 'content_1',
      title: 'Behind-the-Scenes: Fashion Show Prep',
      creator: 'Luna Style Guide',
      views: 3420,
      likes: 1850,
      emoji: '🎬',
      description: 'See how professionals prepare for major fashion events',
    },
    {
      id: 'content_2',
      title: 'Creator Collab: Styling Challenges',
      creator: 'Multiple Creators',
      views: 2890,
      likes: 1320,
      emoji: '🤝',
      description: 'Watch creators style the same brief 5 different ways',
    },
    {
      id: 'content_3',
      title: 'Advanced Color Matching Masterclass',
      creator: 'Zara Creates',
      views: 4120,
      likes: 2100,
      emoji: '🎨',
      description: 'Deep dive into color theory and personal palettes',
    },
  ];

  const channels = [
    {
      id: 'channel_1',
      name: 'Street Style Inspo',
      members: 4230,
      activeNow: 340,
      emoji: '📸',
      category: 'Inspiration',
    },
    {
      id: 'channel_2',
      name: 'Outfit Feedback',
      members: 3890,
      activeNow: 280,
      emoji: '👗',
      category: 'Community',
    },
    {
      id: 'channel_3',
      name: 'Sustainable Fashion Talk',
      members: 2450,
      activeNow: 190,
      emoji: '🌿',
      category: 'Learning',
    },
    {
      id: 'channel_4',
      name: 'Budget Shopping Hauls',
      members: 5670,
      activeNow: 520,
      emoji: '🛍️',
      category: 'Community',
    },
    {
      id: 'channel_5',
      name: 'Creator Spotlight',
      members: 3120,
      activeNow: 420,
      emoji: '⭐',
      category: 'Creator',
    },
    {
      id: 'channel_6',
      name: 'Styling Challenges Hub',
      members: 2890,
      activeNow: 350,
      emoji: '🏆',
      category: 'Challenges',
    },
  ];

  return (
    <div className="bestie-home">
      {/* Header */}
      <div className="bestie-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>🎭 Scene Club Exclusive</h1>
            <p>Join {clubStats.members.toLocaleString()} Besties for live events, exclusive content, and direct creator interaction</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary">
              📺 Watch Live
            </button>
            <button className="action-btn secondary">
              💬 Browse Chats
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{clubStats.members.toLocaleString()}</div>
            <div className="stat-label">Club Members</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎥</div>
          <div className="stat-content">
            <div className="stat-value">{clubStats.activeEvents}</div>
            <div className="stat-label">Active Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{clubStats.messagesToday}</div>
            <div className="stat-label">Messages Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{clubStats.eventAttendance}%</div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <span className="qa-icon">📺</span>
            <span className="qa-text">Watch Live Events</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">🎤</span>
            <span className="qa-text">Host an Event</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">💬</span>
            <span className="qa-text">Join Channels</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">⭐</span>
            <span className="qa-text">View Highlights</span>
            <span className="qa-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bestie-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${selectedTab === 'events' ? 'active' : ''}`}
            onClick={() => setSelectedTab('events')}
          >
            📺 Live Events
          </button>
          <button
            className={`tab-btn ${selectedTab === 'content' ? 'active' : ''}`}
            onClick={() => setSelectedTab('content')}
          >
            🎬 Exclusive Content
          </button>
          <button
            className={`tab-btn ${selectedTab === 'channels' ? 'active' : ''}`}
            onClick={() => setSelectedTab('channels')}
          >
            💬 Channels
          </button>
        </div>

        {/* Live Events Tab */}
        {selectedTab === 'events' && (
          <div className="tab-content">
            <h3>Upcoming Live Events</h3>
            <div className="looks-grid">
              {liveEvents.map((event) => (
                <div key={event.id} className="look-card event-card">
                  <div className="look-image">{event.emoji}</div>
                  <div className="look-info">
                    <h4>{event.title}</h4>
                    <p className="card-creator">{event.creator}</p>
                    <div className="event-details">
                      <span>🕐 {event.startTime}</span>
                      <span>⏱️ {event.duration}</span>
                    </div>
                    <div className="look-stats">
                      <span>👥 {event.attendees}/{event.maxAttendees}</span>
                    </div>
                    <div className="event-status">{event.status}</div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Join Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exclusive Content Tab */}
        {selectedTab === 'content' && (
          <div className="tab-content">
            <h3>Exclusive Bestie Content</h3>
            <div className="looks-grid">
              {exclusiveContent.map((content) => (
                <div key={content.id} className="look-card content-card">
                  <div className="look-image">{content.emoji}</div>
                  <div className="look-info">
                    <h4>{content.title}</h4>
                    <p className="card-creator">{content.creator}</p>
                    <p className="card-description">{content.description}</p>
                    <div className="look-stats">
                      <span>👀 {content.views}</span>
                      <span>❤️ {content.likes}</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {selectedTab === 'channels' && (
          <div className="tab-content">
            <h3>Community Channels</h3>
            <div className="looks-grid">
              {channels.map((channel) => (
                <div key={channel.id} className="look-card channel-card">
                  <div className="look-image">{channel.emoji}</div>
                  <div className="look-info">
                    <h4>{channel.name}</h4>
                    <p className="card-creator">{channel.category}</p>
                    <div className="event-details">
                      <span>👥 {channel.members.toLocaleString()} members</span>
                      <span>🟢 {channel.activeNow} online</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Join Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Promo Card */}
      <div className="bestie-tabs" style={{ marginTop: '40px' }}>
        <div className="promo-card">
          <div className="promo-icon">⭐</div>
          <div className="promo-content">
            <h3>Unlock Creator Status</h3>
            <p>Become a Scene Club Creator and host your own events. Earn rewards, build your audience, and inspire the community!</p>
            <button className="action-btn primary" style={{ marginTop: '12px' }}>
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
