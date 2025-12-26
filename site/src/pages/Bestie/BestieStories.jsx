import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-stories.css';

export default function BestieStories() {
  const navigate = useNavigate();
  const { user, groups } = useAuth();

  // Check if user has BESTIE tier
  const isBestie = groups?.includes('BESTIE') || groups?.includes('CREATOR');

  const [stories, setStories] = useState([
    {
      id: 1,
      creator: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      title: 'From Thrift Store to Runway',
      description: 'Found this amazing vintage jacket and styled it three different ways',
      image: 'https://images.unsplash.com/photo-1515612547382-ea7ee519a543?w=400&h=500&fit=crop',
      views: 2401,
      likes: 324,
      comments: 45,
      duration: '5 mins',
      episodes: 3,
      relatedLooks: [1, 2, 3],
      createdAt: '2 hours ago',
    },
    {
      id: 2,
      creator: 'Alex C.',
      avatar: 'https://images.unsplash.com/photo-1505886711895-a324da1c67d6?w=100&h=100&fit=crop',
      title: 'Winter Wardrobe Haul',
      description: 'Showing you my favorite seasonal pieces and how I style them',
      image: 'https://images.unsplash.com/photo-1516762689617-e1cffff0bef5?w=400&h=500&fit=crop',
      views: 1823,
      likes: 287,
      comments: 62,
      duration: '8 mins',
      episodes: 5,
      relatedLooks: [4, 5],
      createdAt: '1 day ago',
    },
    {
      id: 3,
      creator: 'Jordan P.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      title: 'Sustainable Style Series',
      description: 'Building a capsule wardrobe with ethical brands',
      image: 'https://images.unsplash.com/photo-1496217905904-2df2a418f1d5?w=400&h=500&fit=crop',
      views: 3456,
      likes: 512,
      comments: 128,
      duration: '12 mins',
      episodes: 4,
      relatedLooks: [6, 7, 8],
      createdAt: '3 days ago',
    },
  ]);

  const [myStories, setMyStories] = useState([
    {
      id: 101,
      title: 'My Style Journey',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
      episodes: 2,
      views: 156,
      status: 'published',
    },
  ]);

  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'myStories'
  const [selectedStory, setSelectedStory] = useState(null);

  const handleUpgrade = () => {
    navigate('/upgrade/bestie');
  };

  const handleCreateStory = () => {
    // Navigate to story creation
    navigate('/bestie/stories/create');
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Please log in to view stories.</p>
          <button className="cta-button" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isBestie) {
    return (
      <div className="page-container">
        <div className="upgrade-prompt">
          <div className="upgrade-content">
            <h2>Unlock Stories</h2>
            <p>Upgrade to Bestie to create and share your style stories with the community.</p>
            <button className="cta-button" onClick={handleUpgrade}>
              Upgrade to Bestie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bestie-stories-page">
      {/* Hero Section */}
      <div className="stories-hero">
        <h1>📖 Style Stories</h1>
        <p>Share your fashion journey, one episode at a time</p>
      </div>

      {/* Tabs */}
      <div className="stories-tabs">
        <button
          className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          🌟 Discover
        </button>
        <button
          className={`tab-btn ${activeTab === 'myStories' ? 'active' : ''}`}
          onClick={() => setActiveTab('myStories')}
        >
          📝 My Stories ({myStories.length})
        </button>
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="stories-discover">
          <div className="section-header">
            <h2>Community Stories</h2>
            <p>Explore fashion stories from Bestie creators</p>
          </div>

          <div className="stories-grid">
            {stories.map((story) => (
              <div
                key={story.id}
                className="story-card"
                onClick={() => handleViewStory(story)}
              >
                <div className="story-image-wrapper">
                  <img src={story.image} alt={story.title} className="story-image" />
                  <div className="story-overlay">
                    <div className="story-info-overlay">
                      <p className="story-duration">⏱️ {story.duration}</p>
                      <p className="story-episodes">📺 {story.episodes} episodes</p>
                    </div>
                  </div>
                </div>

                <div className="story-content">
                  <div className="story-creator">
                    <img src={story.avatar} alt={story.creator} className="creator-avatar" />
                    <div className="creator-info">
                      <p className="creator-name">{story.creator}</p>
                      <p className="story-time">{story.createdAt}</p>
                    </div>
                  </div>

                  <h3 className="story-title">{story.title}</h3>
                  <p className="story-description">{story.description}</p>

                  <div className="story-stats">
                    <span className="stat">👁️ {story.views}</span>
                    <span className="stat">❤️ {story.likes}</span>
                    <span className="stat">💬 {story.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Stories Tab */}
      {activeTab === 'myStories' && (
        <div className="my-stories-section">
          <div className="section-header">
            <h2>Your Stories</h2>
            <button className="primary-btn" onClick={handleCreateStory}>
              ✨ Create Story
            </button>
          </div>

          {myStories.length > 0 ? (
            <div className="my-stories-grid">
              {myStories.map((story) => (
                <div key={story.id} className="my-story-card">
                  <div className="my-story-image">
                    <img src={story.image} alt={story.title} />
                    <div className="story-status-badge">{story.status}</div>
                  </div>
                  <div className="my-story-info">
                    <h3>{story.title}</h3>
                    <p className="story-meta">
                      {story.episodes} episodes • {story.views} views
                    </p>
                    <div className="story-actions">
                      <button className="btn-action">✏️ Edit</button>
                      <button className="btn-action danger">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-stories">
              <p>You haven't created any stories yet</p>
              <button className="primary-btn" onClick={handleCreateStory}>
                Create Your First Story
              </button>
            </div>
          )}
        </div>
      )}

      {/* Story Detail Modal */}
      {selectedStory && (
        <div className="story-modal-overlay" onClick={handleCloseStory}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseStory}>
              ✕
            </button>

            <div className="modal-content">
              <div className="modal-image-section">
                <img src={selectedStory.image} alt={selectedStory.title} />
              </div>

              <div className="modal-info-section">
                <div className="modal-creator">
                  <img src={selectedStory.avatar} alt={selectedStory.creator} />
                  <div>
                    <h3>{selectedStory.creator}</h3>
                    <p>{selectedStory.createdAt}</p>
                  </div>
                  <button className="follow-btn">Follow</button>
                </div>

                <h2>{selectedStory.title}</h2>
                <p className="modal-description">{selectedStory.description}</p>

                <div className="modal-stats">
                  <div className="stat-item">
                    <span className="stat-number">{selectedStory.views}</span>
                    <span className="stat-label">Views</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{selectedStory.likes}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{selectedStory.comments}</span>
                    <span className="stat-label">Comments</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="action-btn primary">❤️ Like Story</button>
                  <button className="action-btn secondary">📤 Share</button>
                  <button className="action-btn secondary">💬 Comment</button>
                </div>

                {selectedStory.relatedLooks?.length > 0 && (
                  <div className="related-looks">
                    <h4>Related Looks</h4>
                    <p className="related-count">
                      This story links to {selectedStory.relatedLooks.length} looks
                    </p>
                    <button className="secondary-btn">View Looks →</button>
                  </div>
                )}

                <div className="episodes-section">
                  <h4>Episodes ({selectedStory.episodes})</h4>
                  <div className="episodes-list">
                    {[...Array(selectedStory.episodes)].map((_, i) => (
                      <div key={i} className="episode-item">
                        <span className="episode-number">Ep. {i + 1}</span>
                        <span className="episode-duration">2-3 min</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
