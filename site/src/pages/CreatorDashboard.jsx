// site/src/pages/CreatorDashboard.jsx
// Creator dashboard - application status OR business HQ

import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

export default function CreatorDashboard({ approved = false }) {
  const { userContext } = useAuth()

  if (!userContext) return null

  const profile = userContext.profile || {}
  const creatorStatus = userContext.creatorApplicationStatus || {}
  const displayName = profile.displayName || userContext.email
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (!approved) {
    // Not approved - show application status
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <div className="profile-header">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <h3>{displayName}</h3>
              <p>Creator Application Pending</p>
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">📝 Your Application</h3>
          <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '2rem' }}>⏳</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#b45309' }}>Status: {creatorStatus.status || 'PENDING'}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  Your application is being reviewed by our team. This usually takes 5-7 business days.
                </p>
              </div>
            </div>
          </div>

          {/* Application Checklist */}
          <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '1rem' }}>Application Checklist</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span style={{ color: '#166534' }}>Profile Information Completed</span>
            </div>
            <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>✓</span>
              <span style={{ color: '#166534' }}>Portfolio Links Provided</span>
            </div>
            <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>○</span>
              <span style={{ color: '#991b1b' }}>Brand Agreement Signed</span>
            </div>
            <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>○</span>
              <span style={{ color: '#991b1b' }}>Tax Documents Submitted</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">🎯 What Happens Next?</h3>
          <div style={{ background: '#f0f9ff', borderLeft: '3px solid #0284c7', padding: '16px', borderRadius: '4px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Step 1: Review (Current)</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Our team reviews your portfolio and background.</p>
          </div>
          <div style={{ background: '#f3f4f6', borderLeft: '3px solid #d1d5db', padding: '16px', borderRadius: '4px', marginBottom: '12px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Step 2: Decision</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>You'll receive an email with approval or next steps.</p>
          </div>
          <div style={{ background: '#f3f4f6', borderLeft: '3px solid #d1d5db', padding: '16px', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Step 3: Shop Setup</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Once approved, you'll set up your creator shop and start uploading content.</p>
          </div>
        </div>

        {/* Resources */}
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">📚 Resources</h3>
          <div className="list-item">
            <div>
              <div className="list-item-title">Creator Guidelines</div>
              <div className="list-item-meta">Learn what we're looking for</div>
            </div>
            <button className="btn-secondary">Read</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-item-title">FAQ</div>
              <div className="list-item-meta">Answers to common questions</div>
            </div>
            <button className="btn-secondary">View</button>
          </div>
          <div className="list-item">
            <div>
              <div className="list-item-title">Contact Support</div>
              <div className="list-item-meta">Questions about your application?</div>
            </div>
            <button className="btn-secondary">Email</button>
          </div>
        </div>
      </div>
    )
  }

  // Approved - show Creator HQ
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Creator HQ</h2>
          <p className="dashboard-subtitle">Welcome back, {displayName}!</p>
        </div>
      </div>

      {/* Creator Profile */}
      <div className="dashboard-section">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h3>{displayName}</h3>
            <p>Approved Creator ✓</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Shop: {creatorStatus.shopStatus || 'Draft'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">⚡ Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <button className="btn-primary">📦 Create Drop</button>
          <button className="btn-primary">🛍️ Add Product</button>
          <button className="btn-primary">📁 Assets Library</button>
          <button className="btn-primary">⚙️ Shop Settings</button>
        </div>
      </div>

      {/* Shop Status */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">🏪 Shop Status</h3>
        <div className="list-item">
          <div>
            <div className="list-item-title">Shop Setup</div>
            <div className="list-item-meta">Complete your shop profile and branding</div>
          </div>
          <span className="status-badge" style={{ background: '#fef3c7', color: '#b45309' }}>In Progress</span>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Products Added</div>
            <div className="list-item-meta">0 products • Ready to sell</div>
          </div>
          <button className="btn-secondary">Add Products</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Shop Visibility</div>
            <div className="list-item-meta">Not yet published</div>
          </div>
          <button className="btn-secondary">Publish</button>
        </div>
      </div>

      {/* Performance */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📊 Performance</h3>
        <div className="section-grid">
          <div className="stat-card">
            <div className="stat-label">Views</div>
            <div className="stat-value">1,243</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clicks</div>
            <div className="stat-value">287</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Orders</div>
            <div className="stat-value">12</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">$458</div>
          </div>
        </div>
      </div>

      {/* Story Integrations */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📺 Story Integrations</h3>
        <p className="dashboard-section-subtitle">Pitch your products and collaborate with content creators</p>
        <div className="list-item">
          <div>
            <div className="list-item-title">Pitch to Storyline</div>
            <div className="list-item-meta">Submit products for featured episodes</div>
          </div>
          <button className="btn-secondary">Submit</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Collaboration Portal</div>
            <div className="list-item-meta">Connect with other creators and brands</div>
          </div>
          <button className="btn-secondary">Explore</button>
        </div>
        <div className="list-item">
          <div>
            <div className="list-item-title">Affiliate Program</div>
            <div className="list-item-meta">Earn commission on product referrals</div>
          </div>
          <button className="btn-secondary">Learn More</button>
        </div>
      </div>

      {/* Assets Library */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📁 Assets Library (Cabinets)</h3>
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <p className="empty-state-text">No asset collections yet. Create one to organize your images and videos.</p>
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
          Create Cabinet
        </button>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">📝 Recent Activity</h3>
        <div className="empty-state">
          <p className="empty-state-text">No recent activity. Create your first drop to get started!</p>
        </div>
      </div>
    </div>
  )
}
