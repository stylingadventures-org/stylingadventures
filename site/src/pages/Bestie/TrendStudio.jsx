/**
 * BESTIE Tier - Trend Studio Page
 * Features: Early trend access, trend forecasting, trendsetter tools
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/bestie-home.css';

export default function TrendStudio() {
  const { userContext } = useAuth();
  const [selectedTab, setSelectedTab] = useState('emerging');

  const trendStats = {
    trendsPredicted: 34,
    accuracyRate: 87,
    followersInfluenced: 12340,
    trendsetsCreated: 8,
  };

  const emergingTrends = [
    {
      id: 'trend_1',
      name: 'Cyberpunk Elegance',
      description: 'Metallic accents meet minimalist silhouettes',
      momentum: 92,
      adoption: 'Rising Rapidly',
      colors: ['Silver', 'Black', 'Electric Blue'],
      styles: ['Futuristic', 'Bold', 'Sleek'],
      prediction: 'Will dominate Q1 2025',
      emoji: '🤖',
    },
    {
      id: 'trend_2',
      name: 'Cottagecore Luxury',
      description: 'Romantic details meet high-end materials',
      momentum: 78,
      adoption: 'Growing',
      colors: ['Cream', 'Sage Green', 'Rose Gold'],
      styles: ['Romantic', 'Elegant', 'Cozy'],
      prediction: 'Sustained growth through winter',
      emoji: '🌿',
    },
    {
      id: 'trend_3',
      name: 'Tech Noir Wave',
      description: 'Dark, sleek designs with tech inspirations',
      momentum: 88,
      adoption: 'Viral',
      colors: ['Black', 'Deep Navy', 'Chrome'],
      styles: ['Edgy', 'Modern', 'Minimal'],
      prediction: 'Will influence luxury brands',
      emoji: '⚫',
    },
  ];

  const trendForecasts = [
    {
      id: 'forecast_1',
      title: 'Spring/Summer 2025 Color Palette',
      description: 'Early predictions for next season',
      accuracy: 89,
      followers: 3420,
      emoji: '🎨',
      stage: 'Forecast',
    },
    {
      id: 'forecast_2',
      title: 'Fabric Innovations',
      description: 'New materials dominating runways',
      accuracy: 76,
      followers: 2890,
      emoji: '🧵',
      stage: 'Trending',
    },
    {
      id: 'forecast_3',
      title: 'Accessory Trends 2025',
      description: 'What accessories will define the year',
      accuracy: 92,
      followers: 5420,
      emoji: '✨',
      stage: 'Live Trend',
    },
  ];

  const trendsetters = [
    {
      id: 'setter_1',
      name: 'Luna Style Guide',
      influence: '234K followers',
      trendsCreated: 12,
      accuracy: 94,
      emoji: '👑',
    },
    {
      id: 'setter_2',
      name: 'Zara Creates',
      influence: '189K followers',
      trendsCreated: 8,
      accuracy: 88,
      emoji: '✨',
    },
    {
      id: 'setter_3',
      name: 'Marcus Fashion',
      influence: '156K followers',
      trendsCreated: 6,
      accuracy: 85,
      emoji: '🎯',
    },
  ];

  return (
    <div className="bestie-home">
      {/* Header */}
      <div className="bestie-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>⭐ Trend Studio</h1>
            <p>Get early access to emerging trends 2 weeks before the general community. Predict, create, and lead fashion!</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary">
              📊 View Forecasts
            </button>
            <button className="action-btn secondary">
              🎯 Create Trend
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{trendStats.trendsPredicted}</div>
            <div className="stat-label">Trends Predicted</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{trendStats.accuracyRate}%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{(trendStats.followersInfluenced / 1000).toFixed(0)}K</div>
            <div className="stat-label">Followers Influenced</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-value">{trendStats.trendsetsCreated}</div>
            <div className="stat-label">Trendsets Created</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <span className="qa-icon">📊</span>
            <span className="qa-text">View Forecasts</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">🎯</span>
            <span className="qa-text">Create a Trend</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">🏆</span>
            <span className="qa-text">Top Trendsetters</span>
            <span className="qa-arrow">→</span>
          </button>
          <button className="quick-action-card">
            <span className="qa-icon">📱</span>
            <span className="qa-text">My Predictions</span>
            <span className="qa-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bestie-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${selectedTab === 'emerging' ? 'active' : ''}`}
            onClick={() => setSelectedTab('emerging')}
          >
            🚀 Emerging Trends
          </button>
          <button
            className={`tab-btn ${selectedTab === 'forecasts' ? 'active' : ''}`}
            onClick={() => setSelectedTab('forecasts')}
          >
            📊 Forecasts
          </button>
          <button
            className={`tab-btn ${selectedTab === 'leaders' ? 'active' : ''}`}
            onClick={() => setSelectedTab('leaders')}
          >
            👑 Trendsetters
          </button>
        </div>

        {/* Emerging Trends Tab */}
        {selectedTab === 'emerging' && (
          <div className="tab-content">
            <h3>Emerging Trends (Early Access)</h3>
            <div className="looks-grid">
              {emergingTrends.map((trend) => (
                <div key={trend.id} className="look-card trend-card">
                  <div className="look-image">{trend.emoji}</div>
                  <div className="look-info">
                    <h4>{trend.name}</h4>
                    <p className="card-description">{trend.description}</p>
                    <div className="trend-stats">
                      <span className="trend-momentum">📈 Momentum: {trend.momentum}%</span>
                      <span className="trend-adoption">{trend.adoption}</span>
                    </div>
                    <div className="trend-details">
                      <div>
                        <strong>Colors:</strong> {trend.colors.join(', ')}
                      </div>
                      <div>
                        <strong>Styles:</strong> {trend.styles.join(', ')}
                      </div>
                    </div>
                    <p className="trend-prediction">🔮 {trend.prediction}</p>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Join Trend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecasts Tab */}
        {selectedTab === 'forecasts' && (
          <div className="tab-content">
            <h3>Trend Forecasts</h3>
            <div className="looks-grid">
              {trendForecasts.map((forecast) => (
                <div key={forecast.id} className="look-card forecast-card">
                  <div className="look-image">{forecast.emoji}</div>
                  <div className="look-info">
                    <h4>{forecast.title}</h4>
                    <p className="card-description">{forecast.description}</p>
                    <div className="look-stats">
                      <span>🎯 Accuracy: {forecast.accuracy}%</span>
                      <span>👥 {forecast.followers.toLocaleString()}</span>
                    </div>
                    <div className="forecast-stage">{forecast.stage}</div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trendsetters Tab */}
        {selectedTab === 'leaders' && (
          <div className="tab-content">
            <h3>Top Trendsetters</h3>
            <div className="looks-grid">
              {trendsetters.map((setter) => (
                <div key={setter.id} className="look-card trendsetter-card">
                  <div className="look-image">{setter.emoji}</div>
                  <div className="look-info">
                    <h4>{setter.name}</h4>
                    <p className="card-creator">{setter.influence}</p>
                    <div className="event-details">
                      <span>🎯 {setter.trendsCreated} trends created</span>
                      <span>🎯 {setter.accuracy}% accuracy</span>
                    </div>
                    <button className="action-btn primary" style={{ width: '100%', marginTop: '8px' }}>
                      Follow Trendsetter
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
          <div className="promo-icon">🏆</div>
          <div className="promo-content">
            <h3>Become a Trendsetter</h3>
            <p>Your trend predictions are accurate? Unlock Creator Status and get recognized as a fashion influencer. Earn rewards for every trend you launch!</p>
            <button className="action-btn primary" style={{ marginTop: '12px' }}>
              Apply for Creator Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
