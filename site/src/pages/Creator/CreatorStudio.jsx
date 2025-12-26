import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/creator-studio.css';

export default function CreatorStudio() {
  const navigate = useNavigate();
  const { user, groups } = useAuth();

  // Check if user has CREATOR tier
  const isCreator = groups?.includes('CREATOR');

  const [dashboardData] = useState({
    totalEarnings: 12450.75,
    monthlyEarnings: 3250.50,
    totalCollaborations: 24,
    activePartners: 8,
    averageEngagement: 8.5,
    followerGrowth: '+1,240',
  });

  const [revenueBreakdown] = useState([
    { source: 'Collaborations', amount: 6500, percentage: 52 },
    { source: 'Brand Partnerships', amount: 4200, percentage: 34 },
    { source: 'Creator Shop', amount: 1750, percentage: 14 },
  ]);

  const [monthlyData] = useState([
    { month: 'Jan', earnings: 2800 },
    { month: 'Feb', earnings: 2950 },
    { month: 'Mar', earnings: 3100 },
    { month: 'Apr', earnings: 2700 },
    { month: 'May', earnings: 3250 },
    { month: 'Jun', earnings: 3450 },
  ]);

  const [partnerships] = useState([
    {
      id: 1,
      name: 'SustainStyle Co.',
      status: 'active',
      earnings: 2400,
      startDate: 'Jan 2024',
      items: 12,
    },
    {
      id: 2,
      name: 'Vintage Finds',
      status: 'active',
      earnings: 1800,
      startDate: 'Feb 2024',
      items: 8,
    },
    {
      id: 3,
      name: 'Eco Fashion Hub',
      status: 'pending',
      earnings: 0,
      startDate: 'Jun 2024',
      items: 5,
    },
    {
      id: 4,
      name: 'Local Artisans',
      status: 'completed',
      earnings: 950,
      startDate: 'Mar 2024',
      items: 6,
    },
  ]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'revenue', 'partnerships'

  const handleUpgrade = () => {
    navigate('/upgrade/creator');
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Please log in to access Creator Studio.</p>
          <button className="cta-button" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="page-container">
        <div className="upgrade-prompt">
          <div className="upgrade-content">
            <h2>Unlock Creator Studio</h2>
            <p>Upgrade to Creator to monetize your influence, track earnings, and manage brand partnerships.</p>
            <button className="cta-button" onClick={handleUpgrade}>
              Upgrade to Creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-studio-page">
      {/* Hero Section */}
      <div className="studio-hero">
        <h1>💰 Creator Studio</h1>
        <p>Monetize your influence, track earnings, and grow your brand</p>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card primary">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <p className="card-label">Total Earnings</p>
            <p className="card-value">${dashboardData.totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <p className="card-label">This Month</p>
            <p className="card-value">${dashboardData.monthlyEarnings.toLocaleString()}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🤝</div>
          <div className="card-content">
            <p className="card-label">Active Partnerships</p>
            <p className="card-value">{dashboardData.activePartners}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <p className="card-label">Avg. Engagement</p>
            <p className="card-value">{dashboardData.averageEngagement}%</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <p className="card-label">Growth This Month</p>
            <p className="card-value">{dashboardData.followerGrowth}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <p className="card-label">Total Collabs</p>
            <p className="card-value">{dashboardData.totalCollaborations}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="studio-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💹 Revenue Tracking
        </button>
        <button
          className={`tab-btn ${activeTab === 'partnerships' ? 'active' : ''}`}
          onClick={() => setActiveTab('partnerships')}
        >
          🤝 Partnerships
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-grid">
            {/* Revenue Breakdown */}
            <div className="card">
              <h3>Revenue Breakdown</h3>
              <div className="breakdown-list">
                {revenueBreakdown.map((item, idx) => (
                  <div key={idx} className="breakdown-item">
                    <div className="breakdown-info">
                      <p className="breakdown-source">{item.source}</p>
                      <p className="breakdown-amount">${item.amount.toLocaleString()}</p>
                    </div>
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Earnings Chart */}
            <div className="card">
              <h3>6-Month Earnings Trend</h3>
              <div className="chart-container">
                <div className="simple-chart">
                  {monthlyData.map((data, idx) => {
                    const maxEarnings = Math.max(...monthlyData.map((d) => d.earnings));
                    const height = (data.earnings / maxEarnings) * 150;
                    return (
                      <div key={idx} className="chart-bar-wrapper">
                        <div
                          className="chart-bar"
                          style={{ height: `${height}px` }}
                          title={`$${data.earnings}`}
                        ></div>
                        <p className="chart-label">{data.month}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="revenue-section">
          <div className="revenue-header">
            <h2>Revenue Tracking</h2>
            <button className="secondary-btn">📥 Download Report</button>
          </div>

          <div className="revenue-cards">
            <div className="revenue-card">
              <h4>By Source</h4>
              <table className="revenue-table">
                <tbody>
                  {revenueBreakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.source}</td>
                      <td>${item.amount.toLocaleString()}</td>
                      <td className="percentage">{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="revenue-card">
              <h4>By Month</h4>
              <table className="revenue-table">
                <tbody>
                  {monthlyData.map((data, idx) => (
                    <tr key={idx}>
                      <td>{data.month} 2024</td>
                      <td>${data.earnings.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Partnerships Tab */}
      {activeTab === 'partnerships' && (
        <div className="partnerships-section">
          <div className="partnerships-header">
            <h2>Brand Partnerships</h2>
            <button className="primary-btn">+ New Partnership</button>
          </div>

          <div className="partnerships-list">
            {partnerships.map((partner) => (
              <div
                key={partner.id}
                className={`partnership-card ${partner.status}`}
              >
                <div className="partnership-header-row">
                  <div>
                    <h3>{partner.name}</h3>
                    <p className="partnership-meta">
                      Started {partner.startDate} • {partner.items} items
                    </p>
                  </div>
                  <div className={`status-badge ${partner.status}`}>
                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  </div>
                </div>

                <div className="partnership-stats">
                  {partner.earnings > 0 && (
                    <div className="stat">
                      <span className="stat-value">
                        ${partner.earnings.toLocaleString()}
                      </span>
                      <span className="stat-label">Earned</span>
                    </div>
                  )}
                  <div className="stat">
                    <span className="stat-value">{partner.items}</span>
                    <span className="stat-label">Collaborations</span>
                  </div>
                </div>

                <div className="partnership-actions">
                  <button className="action-btn">View Details</button>
                  {partner.status === 'active' && (
                    <button className="action-btn secondary">Message</button>
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
