import React, { useState } from 'react'
import '../styles/fan-magazine.css'

const MAGAZINES = [
  { id: 1, emoji: '❄️', title: 'Winter Fashion 2026', issue: '#12', featured: ['Trending Colors', 'Layering Guide', 'Fabric Focus'] },
  { id: 2, emoji: '🎨', title: 'The Minimalist Guide', issue: '#11', featured: ['Capsule Wardrobes', 'Essential Pieces', 'Timeless Classics'] },
  { id: 3, emoji: '💃', title: 'Bold & Vibrant', issue: '#10', featured: ['Color Psychology', 'Pattern Mixing', 'Statement Pieces'] },
  { id: 4, emoji: '🌸', title: 'Spring Collection', issue: '#9', featured: ['Fresh Pastels', 'Light Layers', 'Garden Vibes'] },
]

export default function FanMagazine() {
  const [selectedMag, setSelectedMag] = useState(MAGAZINES[0])

  return (
    <div className="fan-magazine">
      {/* Featured Magazine */}
      <section className="fm-hero">
        <div className="fm-hero-content">
          <div className="fm-hero-emoji">{selectedMag.emoji}</div>
          <h1 className="fm-hero-title">{selectedMag.title}</h1>
          <p className="fm-hero-issue">Issue {selectedMag.issue}</p>
          <div className="fm-hero-featured">
            <p className="fm-featured-label">Featured in this issue:</p>
            <ul className="fm-featured-list">
              {selectedMag.featured.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <button className="fm-btn-primary">Read Full Issue →</button>
        </div>
      </section>

      {/* Magazine Grid */}
      <section className="fm-section">
        <h2 className="fm-section-title">All Issues</h2>
        <div className="fm-grid">
          {MAGAZINES.map((mag) => (
            <div
              key={mag.id}
              className={`fm-mag-card ${selectedMag.id === mag.id ? 'active' : ''}`}
              onClick={() => setSelectedMag(mag)}
            >
              <div className="fm-mag-emoji">{mag.emoji}</div>
              <h3 className="fm-mag-title">{mag.title}</h3>
              <p className="fm-mag-issue">{mag.issue}</p>
              <div className="fm-mag-preview">
                {mag.featured.slice(0, 2).map((item, idx) => (
                  <span key={idx}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
