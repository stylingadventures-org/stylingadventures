import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-studio.css';

export default function BestieStudio() {
  const navigate = useNavigate();
  const { user, groups } = useAuth();

  // Check if user has BESTIE tier
  const isBestie = groups?.includes('BESTIE') || groups?.includes('CREATOR');

  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'gallery', 'drafts', 'challenges'

  const [drafts, setDrafts] = useState([
    {
      id: 1,
      title: 'Untitled Look',
      savedAt: '2 hours ago',
      items: 4,
    },
    {
      id: 2,
      title: 'Summer Adventure',
      savedAt: '1 day ago',
      items: 7,
    },
  ]);

  const [gallery, setGallery] = useState([
    {
      id: 1,
      title: 'Weekend Brunch',
      createdAt: 'Jan 15, 2024',
      likes: 124,
      views: 892,
      image: 'https://images.unsplash.com/photo-1515612547382-ea7ee519a543?w=300&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Office Chic',
      createdAt: 'Jan 10, 2024',
      likes: 89,
      views: 654,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Night Out',
      createdAt: 'Jan 8, 2024',
      likes: 234,
      views: 1542,
      image: 'https://images.unsplash.com/photo-1505886711895-a324da1c67d6?w=300&h=300&fit=crop',
    },
  ]);

  const [challenges, setChallenges] = useState([
    {
      id: 1,
      title: 'Winter Whites',
      description: 'Create a stunning all-white winter look',
      endDate: '5 days left',
      reward: '50 coins',
      submitted: false,
      image: 'https://images.unsplash.com/photo-1516762689617-e1cffff0bef5?w=300&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Retro Vibes',
      description: 'Mix vintage pieces with modern style',
      endDate: '12 days left',
      reward: '75 coins',
      submitted: true,
      image: 'https://images.unsplash.com/photo-1535723066465-c7b646ef45f8?w=300&h=300&fit=crop',
    },
  ]);

  const [builderState, setBuilderState] = useState({
    currentLook: null,
    items: [],
  });

  const handleUpgrade = () => {
    navigate('/upgrade/bestie');
  };

  const handleCreateNew = () => {
    // Initialize a new look
    setBuilderState({
      currentLook: { title: 'New Look', createdAt: new Date() },
      items: [],
    });
  };

  const handleDeleteDraft = (id) => {
    setDrafts(drafts.filter((d) => d.id !== id));
  };

  const handleSubmitChallenge = (challengeId) => {
    setChallenges(
      challenges.map((c) =>
        c.id === challengeId ? { ...c, submitted: true } : c
      )
    );
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Please log in to use the Studio.</p>
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
            <h2>Unlock Your Studio</h2>
            <p>Upgrade to Bestie to create custom looks, build collections, and submit to challenges.</p>
            <button className="cta-button" onClick={handleUpgrade}>
              Upgrade to Bestie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bestie-studio-page">
      {/* Hero Section */}
      <div className="studio-hero">
        <h1>🎨 Your Style Studio</h1>
        <p>Design, create, and share your signature looks</p>
      </div>

      {/* Action Bar */}
      <div className="studio-action-bar">
        <button className="primary-btn" onClick={handleCreateNew}>
          ✨ Create New Look
        </button>
      </div>

      {/* Tabs */}
      <div className="studio-tabs">
        <button
          className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          🎨 Look Builder
        </button>
        <button
          className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          📷 Gallery ({gallery.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          📝 Drafts ({drafts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          🏆 Challenges
        </button>
      </div>

      {/* Content */}
      {activeTab === 'builder' && (
        <div className="builder-container">
          {builderState.currentLook ? (
            <div className="builder-workspace">
              <div className="builder-canvas">
                <div className="canvas-placeholder">
                  <p>👗 Look Preview Area</p>
                  <p className="subtitle">Add items to see your look come together</p>
                </div>
              </div>

              <div className="builder-controls">
                <div className="control-section">
                  <h3>Look Title</h3>
                  <input
                    type="text"
                    defaultValue={builderState.currentLook.title}
                    className="look-title-input"
                    placeholder="Give your look a name"
                  />
                </div>

                <div className="control-section">
                  <h3>Add Items</h3>
                  <div className="item-categories">
                    <button className="category-btn">Tops</button>
                    <button className="category-btn">Bottoms</button>
                    <button className="category-btn">Dresses</button>
                    <button className="category-btn">Shoes</button>
                    <button className="category-btn">Accessories</button>
                    <button className="category-btn">Outerwear</button>
                  </div>
                </div>

                <div className="control-section">
                  <h3>Actions</h3>
                  <div className="action-buttons">
                    <button className="secondary-btn">💾 Save as Draft</button>
                    <button className="primary-btn">📤 Publish Look</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-builder">
              <div className="empty-icon">🎨</div>
              <h2>Start Creating!</h2>
              <p>Click "Create New Look" to get started with the look builder</p>
              <button className="primary-btn" onClick={handleCreateNew}>
                Create New Look
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="gallery-container">
          {gallery.length > 0 ? (
            <div className="gallery-grid">
              {gallery.map((look) => (
                <div key={look.id} className="gallery-card">
                  <div className="gallery-image-wrapper">
                    <img src={look.image} alt={look.title} className="gallery-image" />
                    <div className="gallery-overlay">
                      <button className="gallery-action-btn">View</button>
                      <button className="gallery-action-btn edit">Edit</button>
                    </div>
                  </div>
                  <div className="gallery-info">
                    <h3>{look.title}</h3>
                    <p className="date">{look.createdAt}</p>
                    <div className="gallery-stats">
                      <span>❤️ {look.likes}</span>
                      <span>👁️ {look.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-large">
              <p>No published looks yet</p>
              <button className="primary-btn" onClick={handleCreateNew}>
                Create Your First Look
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'drafts' && (
        <div className="drafts-container">
          {drafts.length > 0 ? (
            <div className="drafts-list">
              {drafts.map((draft) => (
                <div key={draft.id} className="draft-card">
                  <div className="draft-content">
                    <h3>{draft.title}</h3>
                    <p className="draft-meta">Saved {draft.savedAt} • {draft.items} items</p>
                  </div>
                  <div className="draft-actions">
                    <button className="btn-icon" title="Continue editing">
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Delete draft"
                      onClick={() => handleDeleteDraft(draft.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-large">
              <p>No drafts saved yet</p>
              <button className="primary-btn" onClick={handleCreateNew}>
                Start Creating
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'challenges' && (
        <div className="challenges-container">
          <div className="challenges-grid">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="challenge-card">
                <div className="challenge-image-wrapper">
                  <img src={challenge.image} alt={challenge.title} className="challenge-image" />
                  {challenge.submitted && <div className="submitted-badge">✓ Submitted</div>}
                </div>
                <div className="challenge-content">
                  <h3>{challenge.title}</h3>
                  <p className="description">{challenge.description}</p>
                  <div className="challenge-meta">
                    <span className="time">{challenge.endDate}</span>
                    <span className="reward">🏆 {challenge.reward}</span>
                  </div>
                  {challenge.submitted ? (
                    <button className="secondary-btn" disabled>
                      ✓ Already Submitted
                    </button>
                  ) : (
                    <button
                      className="primary-btn"
                      onClick={() => handleSubmitChallenge(challenge.id)}
                    >
                      Submit Look
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
