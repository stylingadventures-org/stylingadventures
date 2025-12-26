import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-closet.css';

export default function BestieCloset() {
  const navigate = useNavigate();
  const { user, groups } = useAuth();

  // Check if user has BESTIE tier
  const isBestie = groups?.includes('BESTIE') || groups?.includes('CREATOR');

  // State for closet data
  const [stats, setStats] = useState({
    totalLooks: 0,
    favorites: 0,
    totalViews: 0,
    collaborations: 0,
  });

  const [collections, setCollections] = useState([
    {
      id: 'casual',
      name: 'Casual Vibes',
      type: 'user',
      looks: 12,
      cover: 'https://images.unsplash.com/photo-1515612547382-ea7ee519a543?w=300&h=300&fit=crop',
    },
    {
      id: 'work',
      name: 'Office Looks',
      type: 'user',
      looks: 8,
      cover: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    },
    {
      id: 'seasonal-fall',
      name: 'Fall 2024',
      type: 'seasonal',
      looks: 15,
      cover: 'https://images.unsplash.com/photo-1505886711895-a324da1c67d6?w=300&h=300&fit=crop',
    },
  ]);

  const [looks, setLooks] = useState([
    {
      id: 1,
      title: 'Weekend Brunch',
      image: 'https://images.unsplash.com/photo-1515612547382-ea7ee519a543?w=300&h=300&fit=crop',
      hearts: 124,
      views: 892,
      collabs: 3,
      collections: ['casual', 'seasonal-fall'],
    },
    {
      id: 2,
      title: 'Office Chic',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      hearts: 89,
      views: 654,
      collabs: 1,
      collections: ['work'],
    },
    {
      id: 3,
      title: 'Night Out',
      image: 'https://images.unsplash.com/photo-1505886711895-a324da1c67d6?w=300&h=300&fit=crop',
      hearts: 234,
      views: 1542,
      collabs: 5,
      collections: ['seasonal-fall'],
    },
    {
      id: 4,
      title: 'Cozy Autumn',
      image: 'https://images.unsplash.com/photo-1516762689617-e1cffff0bef5?w=300&h=300&fit=crop',
      hearts: 167,
      views: 1203,
      collabs: 2,
      collections: ['casual', 'seasonal-fall'],
    },
  ]);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'collections', 'favorites'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

  useEffect(() => {
    // Calculate stats from looks
    const totalHearts = looks.reduce((sum, look) => sum + look.hearts, 0);
    const totalViews = looks.reduce((sum, look) => sum + look.views, 0);
    const totalCollabs = looks.reduce((sum, look) => sum + look.collabs, 0);

    setStats({
      totalLooks: looks.length,
      favorites: totalHearts,
      totalViews: totalViews,
      collaborations: totalCollabs,
    });
  }, [looks]);

  const handleUpgrade = () => {
    navigate('/upgrade/bestie');
  };

  const handleCreateLook = () => {
    navigate('/bestie/studio');
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Please log in to view your closet.</p>
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
            <h2>Unlock Your Closet</h2>
            <p>Upgrade to Bestie to create unlimited looks, collaborate with friends, and track your personal style stats.</p>
            <button className="cta-button" onClick={handleUpgrade}>
              Upgrade to Bestie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bestie-closet-page">
      {/* Hero Section */}
      <div className="closet-hero">
        <h1>✨ Your Style Closet</h1>
        <p>Organize, discover, and share your best looks</p>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">👗</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalLooks}</div>
            <div className="stat-label">Total Looks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.favorites}</div>
            <div className="stat-label">Total Hearts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalViews.toLocaleString()}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collaborations}</div>
            <div className="stat-label">Collaborations</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="primary-btn" onClick={handleCreateLook}>
          ✨ Create New Look
        </button>
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ▦ Grid
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ≡ List
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Looks
        </button>
        <button
          className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          Collections
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
      </div>

      {/* Content */}
      {activeTab === 'all' && (
        <div className={`looks-container ${viewMode}`}>
          {looks.map((look) => (
            <div key={look.id} className="look-card">
              <div className="look-image-wrapper">
                <img src={look.image} alt={look.title} className="look-image" />
                <div className="look-overlay">
                  <button className="look-action-btn">View Details</button>
                </div>
              </div>
              <div className="look-info">
                <h3 className="look-title">{look.title}</h3>
                <div className="look-meta">
                  <span className="meta-item">❤️ {look.hearts}</span>
                  <span className="meta-item">👁️ {look.views}</span>
                  {look.collabs > 0 && (
                    <span className="meta-item">🤝 {look.collabs}</span>
                  )}
                </div>
                <div className="look-collections">
                  {look.collections.map((collId) => {
                    const coll = collections.find((c) => c.id === collId);
                    return (
                      <span key={collId} className="collection-tag">
                        {coll?.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="collections-container">
          <div className="section-header">
            <h2>Your Collections</h2>
            <button className="secondary-btn" onClick={() => {}}>
              + New Collection
            </button>
          </div>

          <div className="collections-grid">
            {collections.map((collection) => (
              <div key={collection.id} className="collection-card">
                <div className="collection-cover">
                  <img src={collection.cover} alt={collection.name} />
                  {collection.type === 'seasonal' && (
                    <div className="seasonal-badge">Seasonal</div>
                  )}
                </div>
                <div className="collection-info">
                  <h3>{collection.name}</h3>
                  <p>{collection.looks} looks</p>
                  <button className="collection-action-btn">Browse →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="looks-container grid">
          {looks
            .filter((look) => look.hearts > 100)
            .map((look) => (
              <div key={look.id} className="look-card">
                <div className="look-image-wrapper">
                  <img src={look.image} alt={look.title} className="look-image" />
                  <div className="look-overlay">
                    <button className="look-action-btn">View Details</button>
                  </div>
                </div>
                <div className="look-info">
                  <h3 className="look-title">{look.title}</h3>
                  <div className="look-meta">
                    <span className="meta-item">❤️ {look.hearts}</span>
                    <span className="meta-item">👁️ {look.views}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
