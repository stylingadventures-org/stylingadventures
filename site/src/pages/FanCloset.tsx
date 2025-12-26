import React, { useState } from 'react'
import '../styles/fan-closet.css'

const MOODS = [
  { id: 'all', label: '✨ All Moods', emoji: '✨' },
  { id: 'pastel', label: '💕 Pastel Barbiecore', emoji: '💕' },
  { id: 'preppy', label: '👗 Preppy Chic', emoji: '👗' },
  { id: 'indie', label: '🎸 Indie Aesthetic', emoji: '🎸' },
  { id: 'maximalist', label: '🌟 Maximalist', emoji: '🌟' },
]

const OUTFIT_ITEMS = [
  { id: 1, emoji: '👗', name: 'Pink Silk Dress', mood: 'pastel', hearts: 342, description: 'Summer brunch vibes' },
  { id: 2, emoji: '🧥', name: 'Oversized Blazer', mood: 'preppy', hearts: 298, description: 'Perfect layering piece' },
  { id: 3, emoji: '👖', name: 'Vintage Jeans', mood: 'indie', hearts: 275, description: 'Thrifted treasure' },
  { id: 4, emoji: '🌈', name: 'Rainbow Knit', mood: 'maximalist', hearts: 512, description: 'Make a statement' },
  { id: 5, emoji: '👠', name: 'Ballet Flats', mood: 'pastel', hearts: 401, description: 'Cute and comfy' },
  { id: 6, emoji: '🎀', name: 'Bow Accessories', mood: 'pastel', hearts: 389, description: 'Details matter' },
]

export default function FanCloset() {
  const [selectedMood, setSelectedMood] = useState('all')
  const [hearted, setHearted] = useState<Set<number>>(new Set())

  const filteredItems = selectedMood === 'all' ? OUTFIT_ITEMS : OUTFIT_ITEMS.filter(item => item.mood === selectedMood)

  const toggleHeart = (id: number) => {
    const newHearted = new Set(hearted)
    if (newHearted.has(id)) {
      newHearted.delete(id)
    } else {
      newHearted.add(id)
    }
    setHearted(newHearted)
  }

  const stats = [
    { label: 'Total Outfits', value: OUTFIT_ITEMS.length, emoji: '👗' },
    { label: 'Your Hearts', value: hearted.size, emoji: '❤️' },
    { label: 'Most Loved', value: '512', emoji: '⭐' },
  ]

  return (
    <div className="fan-closet">
      {/* Hero Section */}
      <section className="fc-hero">
        <div className="fc-hero-content">
          <h1 className="fc-hero-title">Come Style Me, Bestie! 💜</h1>
          <p className="fc-hero-subtitle">Heart your favorite looks and inspire my future drops</p>
          <button className="fc-btn-primary">Open Style Lab →</button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="fc-section">
        <h2 className="fc-section-title">Your Stats</h2>
        <div className="fc-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="fc-stat-card">
              <div className="fc-stat-icon">{stat.emoji}</div>
              <div className="fc-stat-content">
                <div className="fc-stat-number">{stat.value}</div>
                <div className="fc-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood Selector */}
      <section className="fc-section">
        <h2 className="fc-section-title">Filter by Mood</h2>
        <div className="fc-mood-grid">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              className={`fc-mood-btn ${selectedMood === mood.id ? 'active' : ''}`}
              onClick={() => setSelectedMood(mood.id)}
            >
              <span className="fc-mood-emoji">{mood.emoji}</span>
              <span className="fc-mood-label">{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Outfit Grid */}
      <section className="fc-section">
        <h2 className="fc-section-title">Closet Items ({filteredItems.length})</h2>
        <div className="fc-outfit-grid">
          {filteredItems.map((outfit) => (
            <div key={outfit.id} className="fc-outfit-card">
              <div className="fc-outfit-header">
                <div className="fc-outfit-emoji">{outfit.emoji}</div>
                <button
                  className={`fc-heart-btn ${hearted.has(outfit.id) ? 'hearted' : ''}`}
                  onClick={() => toggleHeart(outfit.id)}
                >
                  {hearted.has(outfit.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <h3 className="fc-outfit-name">{outfit.name}</h3>
              <p className="fc-outfit-desc">{outfit.description}</p>
              <div className="fc-outfit-footer">
                <span className="fc-outfit-hearts">❤️ {outfit.hearts} hearts</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
