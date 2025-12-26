import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { graphqlQuery, GET_CREATORS } from '../api/graphql'
import '../styles/pages.css'

const allGenres = ['Fashion', 'Music', 'Art', 'Gaming', 'Lifestyle', 'Lo-Fi', 'Indie', 'Animation', 'Design']

export default function Discover() {
  const navigate = useNavigate()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [sortBy, setSortBy] = useState('followers')

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true)
        const result = await graphqlQuery(GET_CREATORS, { limit: 50 })
        const creatorsList = result?.listCreators?.items || []
        setCreators(creatorsList)
      } catch (err) {
        console.error('Failed to fetch creators:', err)
        setError(err.message)
        // Fallback to mock data for demo
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
            id: 'sophie',
            displayName: 'Sophie Chen',
            tier: 'indie',
            bio: 'Indie music producer | Lo-fi beats',
            followers: 648,
            tracks: 342,
            genres: ['Music', 'Lo-Fi'],
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
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  const filteredCreators = useMemo(() => {
    let result = creators.filter(creator => {
      const matchesSearch = 
        (creator.displayName || creator.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creator.bio || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(g => (creator.genres || []).includes(g))
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

  return (
    <div className="page-container">
      <div className="discover-hero">
        <h1>Discover Creators</h1>
        <p>Find amazing creators building on Styling Adventures</p>
      </div>

      <div className="discover-filters">
        <input
          type="text"
          placeholder="Search creators..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="filter-section">
          <h3>Genre</h3>
          <div className="genre-tags">
            {allGenres.map(genre => (
              <button
                key={genre}
                className={`tag ${selectedGenres.includes(genre) ? 'active' : ''}`}
                onClick={() => setSelectedGenres(prev => 
                  prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Sort By</h3>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="followers">Followers</option>
            <option value="tracks">Tracks</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">Loading creators...</div>}
      {error && <div className="error">Failed to load creators (showing demo data)</div>}

      <div className="creators-grid">
        {filteredCreators.map(creator => (
          <div key={creator.id} className="creator-card">
            <div className="creator-header">
              <div>
                <h3>{creator.displayName || creator.name}</h3>
                <span className={`tier tier-${creator.tier}`}>{creator.tier}</span>
              </div>
            </div>
            
            <p className="creator-bio">{creator.bio}</p>
            
            <div className="creator-stats">
              <div className="stat">
                <div className="stat-value">{creator.followers || 0}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat">
                <div className="stat-value">{creator.tracks || 0}</div>
                <div className="stat-label">Tracks</div>
              </div>
            </div>

            <div className="creator-genres">
              {(creator.genres || []).map(genre => (
                <span key={genre} className="genre-badge">{genre}</span>
              ))}
            </div>

            <button 
              className="btn btn-primary btn-block"
              onClick={() => navigate('/signup/bestie', { state: { suggestedCreator: creator } })}
            >
              Follow Creator
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

