import React, { useState } from 'react'
import '../styles/fan-episodes.css'

const EPISODES = [
  { id: 1, emoji: '🎬', title: 'Fashion Rebels', season: 1, description: 'Meet the team that started it all', duration: 45, views: 125000 },
  { id: 2, emoji: '👗', title: 'Wardrobe Wars', season: 1, description: 'Compete in epic styling challenges', duration: 38, views: 98000 },
  { id: 3, emoji: '✨', title: 'The Golden Seam', season: 1, description: 'Discover hidden fashion treasures', duration: 42, views: 87000 },
  { id: 4, emoji: '🌟', title: 'Runway Dreams', season: 2, description: 'Behind the scenes of fashion shows', duration: 50, views: 156000 },
  { id: 5, emoji: '💫', title: 'Color Theory', season: 2, description: 'Master the art of color mixing', duration: 35, views: 72000 },
]

export default function FanEpisodes() {
  const [selectedEpisode, setSelectedEpisode] = useState(EPISODES[0])

  return (
    <div className="fan-episodes">
      {/* Featured Episode */}
      <section className="fe-hero">
        <div className="fe-hero-content">
          <div className="fe-hero-emoji">{selectedEpisode.emoji}</div>
          <h1 className="fe-hero-title">{selectedEpisode.title}</h1>
          <p className="fe-hero-desc">{selectedEpisode.description}</p>
          <div className="fe-hero-meta">
            <span>Season {selectedEpisode.season}</span>
            <span>•</span>
            <span>{selectedEpisode.duration} min</span>
            <span>•</span>
            <span>{(selectedEpisode.views / 1000).toFixed(0)}K views</span>
          </div>
          <button className="fe-btn-primary">▶ Watch Now</button>
        </div>
      </section>

      {/* Episodes Grid */}
      <section className="fe-section">
        <h2 className="fe-section-title">All Episodes</h2>
        <div className="fe-grid">
          {EPISODES.map((episode) => (
            <div
              key={episode.id}
              className={`fe-episode-card ${selectedEpisode.id === episode.id ? 'active' : ''}`}
              onClick={() => setSelectedEpisode(episode)}
            >
              <div className="fe-episode-emoji">{episode.emoji}</div>
              <h3 className="fe-episode-title">{episode.title}</h3>
              <p className="fe-episode-season">Season {episode.season}</p>
              <div className="fe-episode-stats">
                <span>{episode.duration}m</span>
                <span>•</span>
                <span>{(episode.views / 1000).toFixed(0)}K</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
