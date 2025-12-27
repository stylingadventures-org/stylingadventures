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

export function SceneClub() {
  const [currentPage, setCurrentPage] = useState('sceneclub');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Club stats
  const clubStats = {
    members: 12450,
    activeEvents: 8,
    messagesToday: 342,
    eventAttendance: 89,
  };

  // Live events
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

  // Exclusive content
  const exclusiveContent = [
    {
      id: 'content_1',
      title: 'Behind-the-Scenes: Fashion Show Prep',
      creator: 'Luna Style Guide',
      views: 3420,
      likes: 1850,
      emoji: '🎬',
      exclusive: true,
      description: 'See how professionals prepare for major fashion events',
    },
    {
      id: 'content_2',
      title: 'Creator Collab: Styling Challenges',
      creator: 'Multiple Creators',
      views: 2890,
      likes: 1320,
      emoji: '🤝',
      exclusive: true,
      description: 'Watch creators style the same brief 5 different ways',
    },
    {
      id: 'content_3',
      title: 'Advanced Color Matching Masterclass',
      creator: 'Zara Creates',
      views: 4120,
      likes: 2100,
      emoji: '🎨',
      exclusive: true,
      description: 'Deep dive into color theory and personal palettes',
    },
  ];

  // Chat channels
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

  // Member highlights
  const memberHighlights = [
    {
      id: 'member_1',
      name: 'Emma S.',
      style: 'Minimalist',
      followers: 890,
      posts: 156,
      joinedDaysAgo: 45,
      avatar: '👩‍🦰',
    },
    {
      id: 'member_2',
      name: 'Alex M.',
      style: 'Maximalist',
      followers: 1230,
      posts: 234,
      joinedDaysAgo: 28,
      avatar: '👨‍🦱',
    },
    {
      id: 'member_3',
      name: 'Jordan T.',
      style: 'Avant-Garde',
      followers: 2340,
      posts: 412,
      joinedDaysAgo: 12,
      avatar: '👩‍🦳',
    },
  ];

  return (
    <MainLayout
      tier={currentUser.tier}
      username={currentUser.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">🎭 Scene Club Exclusive</h1>
          <p className="text-gray-300 text-lg">
            Join {clubStats.members.toLocaleString()} Besties for live events, exclusive content, and direct creator interaction.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Members"
            value={`${(clubStats.members / 1000).toFixed(1)}k`}
            trend={{ value: 15, positive: true }}
            icon="👥"
          />
          <StatCard
            title="Live Events Today"
            value={clubStats.activeEvents}
            trend={{ value: 2, positive: true }}
            icon="🎬"
          />
          <StatCard
            title="Messages Today"
            value={`${(clubStats.messagesToday / 100).toFixed(0)}k`}
            trend={{ value: 23, positive: true }}
            icon="💬"
          />
          <StatCard
            title="Event Attendance"
            value={`${clubStats.eventAttendance}%`}
            trend={{ value: 5, positive: true }}
            icon="🎯"
          />
        </div>

        {/* Live Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🔴 LIVE NOW & UPCOMING</h2>
            <Badge variant="danger">LIVE</Badge>
          </div>
          <div className="space-y-4">
            {liveEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`w-full text-left p-6 rounded-lg border transition-all ${
                  selectedEvent === event.id
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-gray-800/50 border-gray-700 hover:border-red-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{event.emoji}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{event.title}</h3>
                        <p className="text-gray-400 text-sm">{event.creator}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{event.topic}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>🕐 {event.startTime}</span>
                      <span>⏱️ {event.duration}</span>
                      <span>👥 {event.attendees.toLocaleString()} / {event.maxAttendees.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="danger">{event.status}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button variant="primary" className="w-full mt-4">
            Join Selected Event
          </Button>
        </div>

        {/* Exclusive Content */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">✨ Exclusive BESTIE Content</h2>
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 mb-4">
            <p className="text-purple-300 text-sm">
              🔒 Only available to Bestie members. Watch creator-exclusive tutorials, behind-the-scenes content, and advanced workshops.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exclusiveContent.map((content) => (
              <Card key={content.id} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <div className="p-6">
                  <div className="text-4xl mb-3">{content.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{content.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{content.creator}</p>
                  <p className="text-gray-300 text-sm mb-4">{content.description}</p>
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <span>👁️ {(content.views / 1000).toFixed(1)}K</span>
                    <span>❤️ {(content.likes / 1000).toFixed(1)}K</span>
                  </div>
                  <Button variant="primary" size="sm" className="w-full">
                    Watch Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Channels */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">💬 Community Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <button
                key={channel.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{channel.emoji}</span>
                  <Badge variant="secondary" className="text-xs">{channel.category}</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{channel.name}</h3>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>👥 {channel.members.toLocaleString()}</span>
                  <span>🟢 {channel.activeNow} online</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Member Highlights */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🌟 Member Spotlight</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memberHighlights.map((member) => (
              <Card key={member.id} className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-500/30">
                <div className="p-6 text-center">
                  <div className="text-5xl mb-3">{member.avatar}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{member.style} Styler</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Followers</span>
                      <span className="font-bold text-cyan-300">{member.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Posts</span>
                      <span className="font-bold text-cyan-300">{member.posts}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Member for</span>
                      <span className="font-bold text-cyan-300">{member.joinedDaysAgo} days</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="w-full">
                    Follow
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Exclusive Benefits */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">💎 BESTIE Exclusive Perks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <span className="text-3xl">🎬</span>
              <div>
                <h3 className="font-bold text-white mb-1">Exclusive Live Events</h3>
                <p className="text-gray-300 text-sm">Attend 20+ monthly live styling sessions with top creators</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">🎓</span>
              <div>
                <h3 className="font-bold text-white mb-1">Advanced Masterclasses</h3>
                <p className="text-gray-300 text-sm">Access expert-only courses on advanced styling techniques</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">⭐</span>
              <div>
                <h3 className="font-bold text-white mb-1">Creator Direct Access</h3>
                <p className="text-gray-300 text-sm">Private chats and personalized feedback from your favorite creators</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">🏆</span>
              <div>
                <h3 className="font-bold text-white mb-1">VIP Competition Access</h3>
                <p className="text-gray-300 text-sm">Enter exclusive contests with higher prize pools and rewards</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">🎨</span>
              <div>
                <h3 className="font-bold text-white mb-1">Early Trend Access</h3>
                <p className="text-gray-300 text-sm">See emerging trends 2 weeks before the general community</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-3xl">💰</span>
              <div>
                <h3 className="font-bold text-white mb-1">Bonus Prime Coins</h3>
                <p className="text-gray-300 text-sm">Earn 3x more coins from challenges and community activities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default SceneClub;
