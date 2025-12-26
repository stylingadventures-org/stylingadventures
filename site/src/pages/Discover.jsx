import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { graphqlQuery, GET_CREATORS } from '../api/graphql'
import FeaturedCreator from '../components/FeaturedCreator'
import '../styles/pages.css'

const allGenres = ['Fashion', 'Music', 'Art', 'Gaming', 'Lifestyle', 'Lo-Fi', 'Indie', 'Animation', 'Design']

// Small helper so unexpected tiers don’t break CSS
function normalizeTier(tier) {
  const t = String(tier || '').toLowerCase().trim()
  const map = {
    pro: 'pro',
    indie: 'indie',
    independent: 'independent',
    creator: 'creator',
    bestie: 'bestie',
    collaborator: 'collaborator',
    admin: 'admin',
  }
  return map[t] || 'default'
}

export default function Discover() {
  const navigate = useNavigate()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingDemoData, setUsingDemoData] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [sortBy, setSortBy] = useState('followers')
  const [activeTab, setActiveTab] = useState('creators') // creators | trending | about

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true)
        setUsingDemoData(false)

        // TODO: Enable this when listCreators resolver is deployed
        // For now, use demo data to avoid GraphQL errors
        // const result = await graphqlQuery(GET_CREATORS, { limit: 50 })
        // const creatorsList = result?.listCreators?.items || []
        // setCreators(creatorsList)

        // Use demo data for v1
        throw new Error('Using demo data - listCreators resolver not yet deployed')
      } catch (err) {
        console.warn('Fetching creators:', err.message)
        setUsingDemoData(true)

        // Demo fallback
        setCreators([
          {
            id: 'lala',
            displayName: 'Lala',
            tier: 'pro',
            bio: 'Fashion explorer & styling coach',
            followers: 1250,
            tracks: 847,
            genres: ['Fashion', 'Lifestyle'],
          },
          {
            id: 'marcus',
            displayName: 'Marcus',
            tier: 'independent',
            bio: 'Visual artist & animator',
            followers: 892,
            tracks: 156,
            genres: ['Art', 'Animation'],
          },
          {
            id: 'sophie',
            displayName: 'Sophie Chen',
            tier: 'indie',
            bio: 'Indie music producer | Lo-fi beats',
            followers: 648,
            tracks: 342,
            genres: ['Music', 'Lo-Fi'],
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
  }

  const filteredCreators = useMemo(() => {
    let result = creators.filter((creator) => {
      const name = (creator.displayName || creator.name || '').toLowerCase()
      const bio = (creator.bio || '').toLowerCase()
      const q = searchQuery.toLowerCase()

      const matchesSearch = name.includes(q) || bio.includes(q)
      const matchesGenre =
        selectedGenres.length === 0 || selectedGenres.some((g) => (creator.genres || []).includes(g))

      return matchesSearch && matchesGenre
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
  }, [creators, searchQuery, selectedGenres, sortBy])

  const trendingCreators = useMemo(() => {
    // Simple “trending” heuristic: mix followers + tracks
    const copy = [...creators]
    copy.sort((a, b) => ((b.followers || 0) + (b.tracks || 0) * 2) - ((a.followers || 0) + (a.tracks || 0) * 2))
    return copy.slice(0, 8)
  }, [creators])

  // Profile header stats
  const totalCreators = creators.length
  const totalFollowers = creators.reduce((sum, c) => sum + (c.followers || 0), 0)
  const totalTracks = creators.reduce((sum, c) => sum + (c.tracks || 0), 0)

  return (
    <div className="page-container">
      {/* FACEBOOK-STYLE PROFILE HEADER */}
      <section className="profile-shell">
        <div className="profile-cover">
          <div className="profile-cover-gradient" />
          <div className="profile-cover-sparkles" aria-hidden="true">✦ ✦ ✦</div>
        </div>

        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">🌟</div>

          <div className="profile-title">
            <h1 className="profile-name">Creator District</h1>
            <p className="profile-subtitle">
              Explore creators shaping LaLaVerse — style, sound, art, and story.
            </p>

            <div className="profile-badges">
              <span className="pill">✨ {totalCreators} creators</span>
              <span className="pill">👥 {totalFollowers.toLocaleString()} followers</span>
              <span className="pill">🎧 {totalTracks.toLocaleString()} tracks</span>
              {usingDemoData && <span className="pill pill-warn">Preview mode</span>}
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-primary" onClick={() => navigate('/signup/creator')}>
              Become a Creator
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/become-bestie')}>
              Become a Bestie
            </button>
          </div>
        </div>

        {/* Tabs row (Facebook profile tabs vibe) */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveTab('creators')}
          >
            Creators
          </button>
          <button
            className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </button>
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>
      </section>

      {/* PROFILE BODY (2-column like FB) */}
      <section className="profile-body">
        {/* LEFT COLUMN: About + Filters */}
        <aside className="profile-left">
          <div className="card">
            <h3 className="card-title">About this District</h3>
            <p className="card-text">
              Discover creators across fashion, music, art, and animation. Follow creators you love —
              your support helps shape what drops next in LaLaVerse.
            </p>
          </div>

          <div className="card">
            <div className="card-row">
              <h3 className="card-title">Search & Filters</h3>
              <button className="btn btn-tertiary btn-sm" onClick={clearFilters}>
                Reset
              </button>
            </div>

            <input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            <div className="filter-mini-row">
              <div className="sort-wrap">
                <label className="small-label">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select"
                >
                  <option value="followers">Followers</option>
                  <option value="tracks">Tracks</option>
                </select>
              </div>
            </div>

            <div className="filter-title-row">
              <h3 className="small-heading">Genres</h3>
              {selectedGenres.length > 0 && (
                <span className="small-muted">{selectedGenres.length} selected</span>
              )}
            </div>

            <div className="genre-tags">
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  className={`tag ${selectedGenres.includes(genre) ? 'active' : ''}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Quick Actions</h3>
            <div className="quick-actions">
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/episodes')}>
                Watch Episodes
              </button>
              <button className="btn btn-tertiary btn-block" onClick={() => navigate('/community')}>
                Community
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Feed */}
        <main className="profile-right">
          {loading && (
            <div className="skeleton-grid" aria-label="Loading creators">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-line lg" />
                  <div className="skeleton-line md" />
                  <div className="skeleton-line sm" />
                  <div className="skeleton-line md" style={{ marginTop: 16 }} />
                  <div className="skeleton-line sm" />
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === 'about' && (
            <div className="feed-card">
              <h2 className="feed-title">About the Creator District</h2>
              <p className="feed-text">
                This is where creators show up as living “profiles” inside LaLaVerse. Eventually you can
                click into a creator’s profile, explore their shop/space, and follow their drops.
              </p>
              <ul className="feed-list">
                <li>✨ Follow creators to support their work</li>
                <li>🎀 Besties unlock more creator worlds & perks</li>
                <li>🛍️ Future: creator shops + style drops</li>
              </ul>
            </div>
          )}

          {!loading && activeTab === 'trending' && (
            <>
              <div className="feed-card feed-card--header">
                <h2 className="feed-title">Trending Creators</h2>
                <p className="feed-text">Creators getting the most love right now.</p>
              </div>

              {trendingCreators.map((creator) => (
                <CreatorPost
                  key={creator.id}
                  creator={creator}
                  navigate={navigate}
                />
              ))}
            </>
          )}

          {!loading && activeTab === 'creators' && (
            <>
              {/* Featured Creator Pinned */}
              {filteredCreators.length > 0 && (
                <FeaturedCreator creator={filteredCreators[0]} />
              )}

              <div className="feed-card feed-card--header">
                <h2 className="feed-title">All Creators</h2>
                <p className="feed-text">
                  Showing <strong>{filteredCreators.length}</strong> creator profiles.
                </p>
              </div>

              {filteredCreators.length === 0 ? (
                <div className="empty-state">
                  <h3>No creators found</h3>
                  <p>Try a different search or clear your filters.</p>
                  <button className="btn btn-secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredCreators.map((creator) => (
                  <CreatorPost
                    key={creator.id}
                    creator={creator}
                    navigate={navigate}
                  />
                ))
              )}
            </>
          )}
        </main>
      </section>
    </div>
  )
}

function CreatorPost({ creator, navigate }) {
  const name = creator.displayName || creator.name || 'Creator'
  const tier = normalizeTier(creator.tier)
  const bio = creator.bio || 'Building something magical in LaLaVerse.'
  const genres = (creator.genres || []).slice(0, 4)

  const goViewProfile = () => {
    navigate(`/creator/${creator.id}`)
  }

  const goFollow = () => {
    // Keeps your current behavior for now
    navigate('/signup/bestie', { state: { suggestedCreator: creator } })
  }

  return (
    <article className="feed-post">
      <div className="post-header">
        <div className="post-avatar" aria-hidden="true">👤</div>

        <div className="post-meta">
          <div className="post-name-row">
            <h3 className="post-name">{name}</h3>
            <span className={`tier tier-${tier}`}>{tier}</span>
          </div>
          <div className="post-sub">
            <span className="post-stat">👥 {(creator.followers || 0).toLocaleString()} followers</span>
            <span className="dot">•</span>
            <span className="post-stat">🎧 {(creator.tracks || 0).toLocaleString()} tracks</span>
          </div>
        </div>

        <div className="post-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              goFollow()
            }}
          >
            Follow
          </button>
        </div>
      </div>

      <p className="post-bio">{bio}</p>

      {genres.length > 0 && (
        <div className="post-genres">
          {genres.map((g) => (
            <span key={g} className="genre-badge">{g}</span>
          ))}
        </div>
      )}

      <div className="post-footer">
        <button className="btn btn-tertiary btn-sm" onClick={(e) => {
          e.stopPropagation()
          goViewProfile()
        }}>
          View Profile
        </button>
        <button className="btn btn-tertiary btn-sm" onClick={(e) => e.stopPropagation()}>
          Share
        </button>
      </div>
    </article>
  )
}


