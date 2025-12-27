/**
 * BESTIE Tier - Inbox (Messaging) Page
 * Features: Direct messages from followers, creator DMs, styled conversations
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-home.css';

export default function BestieInbox() {
  const { userContext } = useAuth();
  const [selectedTab, setSelectedTab] = useState('direct');
  const [selectedConversation, setSelectedConversation] = useState('conv_1');

  const inboxStats = {
    totalMessages: 342,
    unreadCount: 12,
    activeConversations: 28,
    creatorCount: 5,
  };

  const conversations = [
    {
      id: 'conv_1',
      name: 'Luna Style Guide',
      avatar: '👑',
      lastMessage: 'Love your color combinations! Would love to collab ✨',
      timestamp: '2 min ago',
      unread: true,
      status: 'Creator',
      messageCount: 8,
      preview: 'Creator collaboration discussion',
    },
    {
      id: 'conv_2',
      name: 'Style Sisters Group',
      avatar: '👯',
      lastMessage: 'Sarah: That outfit is fire! 🔥',
      timestamp: '15 min ago',
      unread: false,
      status: 'Group',
      messageCount: 24,
      preview: 'Group styling tips & feedback',
    },
    {
      id: 'conv_3',
      name: 'Emma S.',
      avatar: '👩‍🦰',
      lastMessage: 'Where do you get all your inspo?',
      timestamp: '1 hour ago',
      unread: false,
      status: 'Follower',
      messageCount: 12,
      preview: 'Direct message from follower',
    },
    {
      id: 'conv_4',
      name: 'Zara Creates',
      avatar: '✨',
      lastMessage: 'Check out my new collection!',
      timestamp: '3 hours ago',
      unread: false,
      status: 'Creator',
      messageCount: 6,
      preview: 'Creator partnership inquiry',
    },
    {
      id: 'conv_5',
      name: 'Fashion Forward Collective',
      avatar: '🎨',
      lastMessage: 'Welcome to our exclusive group!',
      timestamp: '1 day ago',
      unread: false,
      status: 'Community',
      messageCount: 45,
      preview: 'Exclusive styling community',
    },
  ];

  const creatorMessages = [
    {
      id: 'creator_1',
      creator: 'Luna Style Guide',
      avatar: '👑',
      subject: 'Collaboration Opportunity',
      message: 'Would you be interested in collaborating on a styling series?',
      timestamp: '2 min ago',
      unread: true,
    },
    {
      id: 'creator_2',
      creator: 'Zara Creates',
      avatar: '✨',
      subject: 'New Collection Launch',
      message: 'Exclusive early access to my spring collection for Besties!',
      timestamp: '5 hours ago',
      unread: false,
    },
    {
      id: 'creator_3',
      creator: 'Marcus Fashion',
      avatar: '🎯',
      subject: 'Styling Challenge',
      message: 'Join my exclusive styling challenge with $500 prize pool!',
      timestamp: '1 day ago',
      unread: false,
    },
  ];

  const systemNotifications = [
    {
      id: 'notif_1',
      title: 'New Achievement Unlocked',
      message: 'You earned the "Trendsetter" badge for creating a viral look!',
      timestamp: '3 hours ago',
      emoji: '🏆',
      unread: true,
    },
    {
      id: 'notif_2',
      title: 'Daily Quest Complete',
      message: 'Great job! You completed today\'s styling quest and earned 10 XP.',
      timestamp: '1 day ago',
      emoji: '✅',
      unread: false,
    },
    {
      id: 'notif_3',
      title: 'Challenge Started',
      message: 'New styling challenge "Color Theory Master" is live!',
      timestamp: '2 days ago',
      emoji: '🎨',
      unread: false,
    },
  ];

  return (
    <div className="bestie-home">
      {/* Header */}
      <div className="bestie-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>💬 Inbox</h1>
            <p>Connect with creators, followers, and community members. {inboxStats.unreadCount} unread messages</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary">
              ✍️ New Message
            </button>
            <button className="action-btn secondary">
              🔔 Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-value">{inboxStats.totalMessages}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <div className="stat-value">{inboxStats.unreadCount}</div>
            <div className="stat-label">Unread Messages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{inboxStats.activeConversations}</div>
            <div className="stat-label">Active Chats</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-value">{inboxStats.creatorCount}</div>
            <div className="stat-label">Creator Chats</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <span className="qa-icon">✍️</span>
            <span className="qa-text">New Message</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">👑</span>
            <span className="qa-text">Creator Messages</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">👥</span>
            <span className="qa-text">Groups</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">🔔</span>
            <span className="qa-text">Notifications</span>
            <span className="qa-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bestie-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${selectedTab === 'direct' ? 'active' : ''}`}
            onClick={() => setSelectedTab('direct')}
          >
            💬 Direct Messages
          </button>
          <button
            className={`tab-btn ${selectedTab === 'creators' ? 'active' : ''}`}
            onClick={() => setSelectedTab('creators')}
          >
            👑 Creator Messages
          </button>
          <button
            className={`tab-btn ${selectedTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setSelectedTab('notifications')}
          >
            🔔 Notifications
          </button>
        </div>

        {/* Direct Messages Tab */}
        {selectedTab === 'direct' && (
          <div className="tab-content">
            <h3>Your Conversations</h3>
            <div className="looks-grid">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`look-card conversation-card ${selectedConversation === conv.id ? 'active' : ''} ${
                    conv.unread ? 'unread' : ''
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="look-image">{conv.avatar}</div>
                  <div className="look-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4>{conv.name}</h4>
                      {conv.unread && <span className="unread-badge">●</span>}
                    </div>
                    <p className="card-creator">{conv.status}</p>
                    <p className="card-description">{conv.preview}</p>
                    <p className="message-preview">{conv.lastMessage}</p>
                    <div className="look-stats">
                      <span>💬 {conv.messageCount}</span>
                      <span>🕐 {conv.timestamp}</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Open Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator Messages Tab */}
        {selectedTab === 'creators' && (
          <div className="tab-content">
            <h3>Messages from Creators</h3>
            <div className="looks-grid">
              {creatorMessages.map((msg) => (
                <div key={msg.id} className={`look-card creator-msg-card ${msg.unread ? 'unread' : ''}`}>
                  <div className="look-image">{msg.avatar}</div>
                  <div className="look-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4>{msg.creator}</h4>
                      {msg.unread && <span className="unread-badge">●</span>}
                    </div>
                    <h5 style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: '600' }}>
                      {msg.subject}
                    </h5>
                    <p className="card-description">{msg.message}</p>
                    <div className="look-stats">
                      <span>🕐 {msg.timestamp}</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {selectedTab === 'notifications' && (
          <div className="tab-content">
            <h3>Your Notifications</h3>
            <div className="looks-grid">
              {systemNotifications.map((notif) => (
                <div key={notif.id} className={`look-card notification-card ${notif.unread ? 'unread' : ''}`}>
                  <div className="look-image">{notif.emoji}</div>
                  <div className="look-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4>{notif.title}</h4>
                      {notif.unread && <span className="unread-badge">●</span>}
                    </div>
                    <p className="card-description">{notif.message}</p>
                    <div className="look-stats">
                      <span>🕐 {notif.timestamp}</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      View
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
          <div className="promo-icon">💎</div>
          <div className="promo-content">
            <h3>Connect with Creators</h3>
            <p>Build relationships with top creators and other Besties. Get exclusive access to collaborations, early content, and community events!</p>
            <button className="action-btn primary" style={{ marginTop: '12px' }}>
              Browse Creators
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
