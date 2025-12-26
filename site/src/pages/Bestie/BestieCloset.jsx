import { useState } from 'react'
import '../../styles/bestie.css'

export default function BestieCloset() {
  const [selectedCollection, setSelectedCollection] = useState('all')

  const collections = [
    { id: 'all', label: 'All Looks', count: 142 },
    { id: 'casual', label: 'Casual', count: 38 },
    { id: 'glam', label: 'Glam', count: 45 },
    { id: 'street', label: 'Street', count: 32 },
    { id: 'fantasy', label: 'Fantasy', count: 27 },
    { id: 'seasonal', label: 'Seasonal', count: 12 },
  ]

  const looks = [
    { id: 1, name: 'Pink Sunset', tags: ['Casual', 'Summer'], coinsEarned: 240, favorites: 18, votes: 45 },
    { id: 2, name: 'Glam Night Out', tags: ['Glam', 'Evening'], coinsEarned: 380, favorites: 34, votes: 89 },
    { id: 3, name: 'Street Style', tags: ['Street', 'Casual'], coinsEarned: 195, favorites: 12, votes: 28 },
    { id: 4, name: 'Fantasy Adventure', tags: ['Fantasy'], coinsEarned: 520, favorites: 67, votes: 142 },
    { id: 5, name: 'Holiday Sparkle', tags: ['Seasonal', 'Glam'], coinsEarned: 450, favorites: 52, votes: 110 },
    { id: 6, name: 'Spring Fresh', tags: ['Casual', 'Seasonal'], coinsEarned: 310, favorites: 28, votes: 61 },
  ]

  const stats = [
    { icon: '👗', label: 'Total Looks', value: 142 },
    { icon: '💰', label: 'Coins Earned', value: '2,480' },
    { icon: '❤️', label: 'Total Favorites', value: 211 },
    { icon: '✅', label: 'Total Votes', value: 475 },
  ]

  return (
    <div className="bestie-wrapper">
      {/* HEADER */}
      <section className="bestie-header">
        <div className="header-card">
          <div className="header-kicker">👗 My Digital Closet</div>
          <h1 className="header-title">Your Look Collection</h1>
          <p className="header-subtitle">Manage, organize, and track your saved looks</p>
        </div>
      </section>

      {/* STATS GRID */}
      <section className="bestie-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* COLLECTION FILTERS */}
      <section className="bestie-filters">
        <div className="filter-tabs">
          {collections.map((col) => (
            <button
              key={col.id}
              className={`filter-tab ${selectedCollection === col.id ? 'active' : ''}`}
              onClick={() => setSelectedCollection(col.id)}
            >
              {col.label}
              <span className="filter-count">{col.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* LOOKS GRID */}
      <section className="bestie-looks">
        <div className="looks-grid">
          {looks.map((look) => (
            <div key={look.id} className="look-card">
              <div className="look-image">🎨</div>
              <div className="look-content">
                <h3 className="look-name">{look.name}</h3>
                <div className="look-tags">
                  {look.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="look-stats">
                  <div className="look-stat">
                    <span className="stat-icon">💰</span>
                    <span className="stat-value">{look.coinsEarned}</span>
                  </div>
                  <div className="look-stat">
                    <span className="stat-icon">❤️</span>
                    <span className="stat-value">{look.favorites}</span>
                  </div>
                  <div className="look-stat">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{look.votes}</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">Edit</button>
            </div>
          ))}
        </div>
      </section>

      {/* SEASONAL COLLECTIONS */}
      <section className="bestie-seasonal">
        <h2 className="section-title">Seasonal Collections</h2>
        <div className="seasonal-grid">
          <div className="seasonal-card">
            <div className="seasonal-icon">❄️</div>
            <h3>Winter '25</h3>
            <p>18 looks</p>
            <button className="btn btn-secondary btn-sm">View</button>
          </div>
          <div className="seasonal-card">
            <div className="seasonal-icon">🌸</div>
            <h3>Spring '25</h3>
            <p>22 looks</p>
            <button className="btn btn-secondary btn-sm">View</button>
          </div>
          <div className="seasonal-card">
            <div className="seasonal-icon">☀️</div>
            <h3>Summer '25</h3>
            <p>16 looks</p>
            <button className="btn btn-secondary btn-sm">View</button>
          </div>
          <div className="seasonal-card">
            <div className="seasonal-icon">🍂</div>
            <h3>Fall '25</h3>
            <p>14 looks</p>
            <button className="btn btn-secondary btn-sm">View</button>
          </div>
        </div>
      </section>
    </div>
  )
}
