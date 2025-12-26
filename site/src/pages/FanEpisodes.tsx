/**
 * FAN Tier - Episodes Page (Netflix-style)
 * Features: Hero banner, continue watching, episode carousels, trending section
 */

import React, { useState, useRef } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { getMockEpisodes } from '../utils/mockData';
import '../styles/episodes-netflix.css';

export function FanEpisodes() {
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const episodes = getMockEpisodes();
  const selectedEp = episodes.find((ep) => ep.id === selectedEpisode) || episodes[0];
  
  // Continue watching (first 3 episodes)
  const continueWatching = episodes.slice(0, 3);
  // New releases
  const newReleases = episodes.slice(0, 6);
  // Trending
  const trending = episodes.filter((_, i) => i % 2 === 0);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      {/* NETFLIX-STYLE HERO */}
      <div className="episode-hero" style={{
        backgroundImage: `linear-gradient(135deg, rgba(162, 74, 255, 0.8), rgba(255, 105, 180, 0.8))`,
      }}>
        <div className="episode-hero-content">
          <div className="episode-hero-title">
            <div className="episode-hero-season">
              <Badge variant="success">SEASON 1 • EPISODE {selectedEp.id}</Badge>
            </div>
            <h1 className="episode-hero-name">{selectedEp.title}</h1>
            <p className="episode-hero-description">{selectedEp.description}</p>
            
            <div className="episode-hero-stats">
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{(selectedEp.duration / 60).toFixed(0)}min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Views</span>
                <span className="stat-value">{(selectedEp.views / 1000).toFixed(0)}K</span>
              </div>
              <div className="stat">
                <span className="stat-label">Quality</span>
                <span className="stat-value">{selectedEp.quality}</span>
              </div>
            </div>

            <div className="episode-hero-buttons">
              <Button variant="primary" size="lg" className="btn-play">
                ▶ Watch Preview (5 min)
              </Button>
              <Button variant="ghost" size="lg" className="btn-info">
                ℹ More Info
              </Button>
            </div>
          </div>

          <div className="episode-hero-poster">
            <div className="poster-frame">
              {selectedEp.thumbnail}
            </div>
          </div>
        </div>
      </div>

      {/* CONTINUE WATCHING */}
      {continueWatching.length > 0 && (
        <section className="episode-carousel-section">
          <h2 className="carousel-title">Continue Watching</h2>
          <div className="carousel-wrapper">
            <button className="carousel-arrow left" onClick={() => scroll('left')}>‹</button>
            <div className="carousel-container" ref={carouselRef}>
              {continueWatching.map((ep) => (
                <div 
                  key={ep.id} 
                  className={`carousel-item ${selectedEpisode === ep.id ? 'active' : ''}`}
                  onClick={() => setSelectedEpisode(ep.id)}
                >
                  <div className="carousel-card">
                    <div className="card-thumbnail">
                      {ep.thumbnail}
                    </div>
                    <div className="card-progress">
                      <div className="progress-bar"></div>
                    </div>
                    <div className="card-info">
                      <p className="card-title">{ep.title}</p>
                      <p className="card-duration">{(ep.duration / 60).toFixed(0)} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="carousel-arrow right" onClick={() => scroll('right')}>›</button>
          </div>
        </section>
      )}

      {/* NEW RELEASES */}
      <section className="episode-carousel-section">
        <h2 className="carousel-title">Latest Episodes</h2>
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scroll('left')}>‹</button>
          <div className="carousel-container" ref={carouselRef}>
            {newReleases.map((ep) => (
              <div 
                key={ep.id}
                className={`carousel-item ${selectedEpisode === ep.id ? 'active' : ''}`}
                onClick={() => setSelectedEpisode(ep.id)}
              >
                <div className="carousel-card">
                  <div className="card-thumbnail">
                    {ep.thumbnail}
                  </div>
                  <div className="card-badge">NEW</div>
                  <div className="card-info">
                    <p className="card-title">{ep.title}</p>
                    <p className="card-duration">{(ep.duration / 60).toFixed(0)} min</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-arrow right" onClick={() => scroll('right')}>›</button>
        </div>
      </section>

      {/* TRENDING NOW */}
      <section className="episode-carousel-section">
        <h2 className="carousel-title">Trending Now</h2>
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scroll('left')}>‹</button>
          <div className="carousel-container" ref={carouselRef}>
            {trending.map((ep, idx) => (
              <div 
                key={ep.id}
                className={`carousel-item trending ${selectedEpisode === ep.id ? 'active' : ''}`}
                onClick={() => setSelectedEpisode(ep.id)}
              >
                <div className="carousel-card trending-card">
                  <div className="trending-number">#{idx + 1}</div>
                  <div className="card-thumbnail">
                    {ep.thumbnail}
                  </div>
                  <div className="card-info">
                    <p className="card-title">{ep.title}</p>
                    <p className="card-duration">👁 {(ep.views / 1000).toFixed(0)}K views</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-arrow right" onClick={() => scroll('right')}>›</button>
        </div>
      </section>

      {/* UPGRADE CTA */}
      <section className="upgrade-cta-section">
        <div className="upgrade-card">
          <div className="upgrade-content">
            <h2 className="upgrade-title">🎬 Want Full Episodes?</h2>
            <p className="upgrade-description">
              Upgrade to Bestie to watch complete episodes with exclusive bonus content, behind-the-scenes, and early releases.
            </p>
            <Button variant="secondary" size="lg">
              Upgrade to Bestie →
            </Button>
          </div>
          <div className="upgrade-visual">✨</div>
        </div>
      </section>
    </>
  );
}

export default FanEpisodes;
