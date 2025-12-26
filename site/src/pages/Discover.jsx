import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { graphqlQuery, GET_CREATORS } from '../api/graphql'
import '../styles/discover.css'

const allGenres = ['Fashion', 'Music', 'Art', 'Gaming', 'Lifestyle', 'Lo-Fi', 'Indie', 'Animation', 'Design']

export default function Discover() {
  const navigate = useNavigate()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [sortBy, setSortBy] = useState('followers')
  const [filterView, setFilterView] = useState('all')

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true)
        setUsingDemoData(false)

        const data = await graphqlQuery(GET_CREATORS, { limit: 100 })
        
        if (data?.listCreators?.items) {
          setCreators(data.listCreators.items)
        } else {
          throw new Error('No creators found')
        }
      } catch (err) {
        console.error('Error fetching creators:', err.message)
        setUsingDemoData(true)

        setCreators([
          {
            id: 'lala',
            displayName: 'Lala',
            tier: 'pro',
            bio: 'Fashion explorer & styling coach',
            followers: 1250,
            tracks: 847,
            genres: ['Fashion', 'Lifestyle'],
            isVerified: true,
            isTrending: true,
            isNew: false,
          },
          {
            id: 'marcus',
            displayName: 'Marcus',
            tier: 'independent',
            bio: 'Visual artist & animator',
            followers: 892,
            tracks: 156,
            genres: ['Art', 'Animation'],
            isVerified: false,
            isTrending: true,
            isNew: false,
          },
          {
            id: 'sophie',
            displayName: 'Sophie Chen',
            tier: 'indie',
            bio: 'Indie music producer | Lo-fi beats',
            followers: 648,
            tracks: 342,
            genres: ['Music', 'Lo-Fi'],
            isVerified: true,
            isTrending: false,
            isNew: false,
          },
          {
            id: 'alex',
            displayName: 'Alex Rivera',
            tier: 'creator',
            bio: 'Gaming content creator & streamer',
            followers: 542,
            tracks: 89,
            genres: ['Gaming', 'Music'],
            isVerified: false,
            isTrending: false,
            isNew: true,
          },
          {
            id: 'jade',
            displayName: 'Jade Park',
            tier: 'indie',
            bio: 'Graphic designer & brand storyteller',
            followers: 734,
            tracks: 203,
            genres: ['Design', 'Art'],
            isVerified: true,
            isTrending: true,
            isNew: false,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenres([])
    setSortBy('followers')
    setFilterView('all')
  }

  const filteredCreators = useMemo(() => {
    let result = creators.filter((creator) => {
      const name = (creator.displayName || creator.name || '').toLowerCase()
      const bio = (creator.bio || '').toLowerCase()
      const q = searchQuery.toLowerCase()

      const matchesSearch = name.includes(q) || bio.includes(q)
      const matchesGenre =
        selectedGenres.length === 0 || selectedGenres.some((g) => (creator.genres || []).includes(g))

      let matchesView = true
      if (filterView === 'trending') matchesView = creator.isTrending
      if (filterView === 'new') matchesView = creator.isNew
      if (filterView === 'verified') matchesView = creator.isVerified

      return matchesSearch && matchesGenre && matchesView
    })

    result.sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return (b.followers || 0) - (a.followers || 0)
        case 'tracks':
          return (b.tracks || 0) - (a.tracks || 0)
        default:
          return 0
      }
    })

    return result
  }, [creators, searchQuery, selectedGenres, sortBy, filterView])

  const totalCreators = creators.length
  const totalFollowers = creators.reduce((sum, c) => sum + (c.followers || 0), 0)
  const totalTracks = creators.reduce((sum, c) => sum + (c.tracks || 0), 0)
  const trendingCount = creators.filter(c => c.isTrending).length

  return (
    <div className="discover-container">
      {/* ENHANCED HERO SECTION */}
      <section className="discover-hero">
        <div className="hero-background"></div>
        <div className="hero-content">
          <h1 className="hero-title">Creator District</h1>
          <p className="hero-subtitle">
            Explore creators shaping LaLaVerse — style, sound, art, and story.
          </p>
          
          <div className="hero-stats">
            <div className="stat-pill">
              <span className="stat-emoji">✨</span>
              <span className="stat-text">{totalCreators} creators</span>
            </div>
            <div className="stat-pill">
              <span className="stat-emoji">👥</span>
              <span className="stat-text">{totalFollowers.toLocaleString()} followers</span>
            </div>
            <div className="stat-pill">
              <span className="stat-emoji">🎧</span>
              <span className="stat-text">{totalTracks.toLocaleString()} tracks</span>
            </div>
            <div className="stat-pill">
              <span className="stat-emoji">🔥</span>
              <span className="stat-text">{trendingCount} trending</span>
            </div>
            {usingDemoData && <div className="stat-pill demo-mode">Preview mode</div>}
          </div>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/signup/creator')}>
              ✨ Become a Creator
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/become-bestie')}>
              💜 Become a Bestie
            </button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="discover-main">
        {/* FILTERS SIDEBAR */}
        <aside className="discover-filters">
          <div className="filter-card">
            <div className="filter-header">
              <h3>Explore</h3>
              {(searchQuery || selectedGenres.length > 0 || filterView !== 'all') && (
                <button className="filter-reset" onClick={clearFilters}>
                  ✕ Reset
                </button>
              )}
            </div>

            {/* View Tabs */}
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterView === 'all' ? 'active' : ''}`}
                onClick={() => setFilterView('all')}
              >
                All Creators
              </button>
              <button
                className={`filter-tab ${filterView === 'trending' ? 'active' : ''}`}
                onClick={() => setFilterView('trending')}
              >
                🔥 Trending
              </button>
              <button
                className={`filter-tab ${filterView === 'new' ? 'active' : ''}`}
                onClick={() => setFilterView('new')}
              >
                ✨ New
              </button>
              <button
                className={`filter-tab ${filterView === 'verified' ? 'active' : ''}`}
                onClick={() => setFilterView('verified')}
              >
                ✅ Verified
              </button>
            </div>

            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discover-search"
            />

            <div className="filter-section">
              <label className="filter-label">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="discover-select"
              >
                <option value="followers">👥 Most Followers</option>
                <option value="tracks">🎧 Most Tracks</option>
              </select>
            </div>

            <div className="filter-section">
              <div className="filter-label-row">
                <label className="filter-label">Genres</label>
                {selectedGenres.length > 0 && (
                  <span className="filter-count">{selectedGenres.length}</span>
                )}
              </div>
              <div className="genre-list">
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    className={`genre-tag ${selectedGenres.includes(genre) ? 'active' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INFO CARD */}
          <div className="filter-card info-card">
            <h3 className="filter-label">About</h3>
            <p className="info-text">
              Discover creators across fashion, music, art, and animation. Follow creators you love — your support helps shape what drops next.
            </p>
          </div>
        </aside>

        {/* CREATORS GRID */}
        <main className="discover-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading creators...</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🔍</div>
              <h2>No creators found</h2>
              <p>Try adjusting your filters or search term</p>
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2 className="results-count">
                  {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
                </h2>
              </div>
              
              <div className="creators-grid">
                {filteredCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="creator-card"
                    onClick={() => navigate(`/creator/${creator.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Badges */}
                    <div className="creator-badges">
                      {creator.isVerified && <span className="badge-verified" title="Verified">✅</span>}
                      {creator.isTrending && <span className="badge-trending" title="Trending">🔥</span>}
                      {creator.isNew && <span className="badge-new" title="New Creator">✨</span>}
                    </div>

                    {/* Avatar */}
                    <div className="creator-avatar" data-tier={creator.tier}>
                      {creator.displayName?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    
                    <h3 className="creator-name">{creator.displayName || 'Unknown'}</h3>
                    
                    {/* Tier Badge */}
                    {creator.tier && (
                      <div className={`creator-tier tier-${creator.tier}`}>
                        {creator.tier.toUpperCase()}
                      </div>
                    )}
                    
                    <p className="creator-bio">{creator.bio || 'No bio'}</p>
                    
                    {/* Genres */}
                    {creator.genres && creator.genres.length > 0 && (
                      <div className="creator-genres">
                        {creator.genres.slice(0, 2).map((genre) => (
                          <span key={genre} className="genre-badge">
                            {genre}
                          </span>
                        ))}
                        {creator.genres.length > 2 && (
                          <span className="genre-badge">+{creator.genres.length - 2}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="creator-stats">
                      <div className="stat">
                        <span className="stat-value">{(creator.followers || 0).toLocaleString()}</span>
                        <span className="stat-label">followers</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{creator.tracks || 0}</span>
                        <span className="stat-label">tracks</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="creator-actions">
                      <button
                        className="btn-action btn-follow"
                        onClick={(e) => e.stopPropagation()}
                      >
                        💜 Follow
                      </button>
                      <button
                        className="btn-action btn-view"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/creator/${creator.id}`)
                        }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}


