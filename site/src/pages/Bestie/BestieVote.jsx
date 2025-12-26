import { useState } from 'react'
import '../../styles/bestie.css'

export default function BestieVote() {
  const [activeCategory, setActiveCategory] = useState('looks')

  const votingCategories = [
    { id: 'looks', label: '👗 Top Looks', active: true },
    { id: 'episodes', label: '📺 Episode Styling', active: true },
    { id: 'drops', label: '🛍️ Closet Drops', active: false },
  ]

  const lookVotes = [
    {
      id: 1,
      name: 'Pink Fantasy',
      creator: 'Maya',
      votes: 340,
      isVoted: false,
      reward: 50,
    },
    {
      id: 2,
      name: 'Street Cool Vibes',
      creator: 'Zara',
      votes: 298,
      isVoted: true,
      reward: 25,
    },
    {
      id: 3,
      name: 'Glam Night Out',
      creator: 'Sofia',
      votes: 267,
      isVoted: false,
      reward: 50,
    },
    {
      id: 4,
      name: 'Casual Sunday',
      creator: 'Emma',
      votes: 201,
      isVoted: false,
      reward: 50,
    },
  ]

  const episodeVotes = [
    {
      id: 1,
      episode: 'Episode 8: The Ball',
      options: [
        { name: 'Royal Purple Gown', votes: 523, image: '👑' },
        { name: 'Silver Starlight', votes: 412, image: '✨' },
        { name: 'Gold Goddess', votes: 389, image: '👑' },
      ],
      timeLeft: '48 hours',
      voted: false,
      reward: 100,
    },
  ]

  return (
    <div className="bestie-wrapper">
      {/* HEADER */}
      <section className="bestie-header">
        <div className="header-card">
          <div className="header-kicker">✅ Your Vote Matters</div>
          <h1 className="header-title">Vote & Influence</h1>
          <p className="header-subtitle">Shape the LaLaVerse by voting on featured looks and episodes</p>
        </div>
      </section>

      {/* VOTING STATS */}
      <section className="vote-stats">
        <div className="vote-stat-card">
          <div className="vote-icon">🗳️</div>
          <div className="vote-content">
            <div className="vote-label">Votes Cast</div>
            <div className="vote-value">47</div>
          </div>
        </div>
        <div className="vote-stat-card">
          <div className="vote-icon">⭐</div>
          <div className="vote-content">
            <div className="vote-label">Coins Earned</div>
            <div className="vote-value">575</div>
          </div>
        </div>
        <div className="vote-stat-card">
          <div className="vote-icon">🏆</div>
          <div className="vote-content">
            <div className="vote-label">Influence Score</div>
            <div className="vote-value">82</div>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS */}
      <section className="vote-tabs">
        {votingCategories.map((cat) => (
          <button
            key={cat.id}
            className={`vote-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            disabled={!cat.active}
          >
            {cat.label}
            {!cat.active && <span className="badge-soon">Coming Soon</span>}
          </button>
        ))}
      </section>

      {/* TOP LOOKS VOTING */}
      {activeCategory === 'looks' && (
        <section className="voting-section">
          <h2 className="section-title">Vote on This Week's Top Looks</h2>
          <p className="section-subtitle">Your vote helps decide featured content. Every vote earns 25-50 coins!</p>

          <div className="vote-items">
            {lookVotes.map((look) => (
              <div key={look.id} className="vote-item">
                <div className="vote-image">🎨</div>
                <div className="vote-content">
                  <h3 className="vote-title">{look.name}</h3>
                  <p className="vote-creator">by {look.creator}</p>
                  <div className="vote-progress">
                    <div className="vote-count">{look.votes} votes</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${(look.votes / 350) * 100}%`}}></div>
                    </div>
                  </div>
                </div>
                <button className={`btn ${look.isVoted ? 'btn-secondary' : 'btn-primary'}`}>
                  {look.isVoted ? '✓ Voted' : 'Vote'}
                </button>
                <div className="vote-reward">+{look.reward}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EPISODE STYLING VOTING */}
      {activeCategory === 'episodes' && (
        <section className="voting-section">
          <h2 className="section-title">Vote on Episode Styling</h2>
          <p className="section-subtitle">Help decide what Lala wears in upcoming episodes. Earn 100 coins per vote!</p>

          <div className="episode-votes">
            {episodeVotes.map((ep) => (
              <div key={ep.id} className="episode-vote-card">
                <div className="episode-header">
                  <h3 className="episode-title">{ep.episode}</h3>
                  <div className="episode-timer">⏱️ {ep.timeLeft}</div>
                </div>

                <div className="episode-options">
                  {ep.options.map((opt, idx) => (
                    <div key={idx} className="option-card">
                      <div className="option-image">{opt.image}</div>
                      <div className="option-details">
                        <h4 className="option-name">{opt.name}</h4>
                        <div className="option-votes">{opt.votes} votes</div>
                      </div>
                      <button className="btn btn-primary btn-sm">Vote</button>
                    </div>
                  ))}
                </div>

                <div className="episode-reward">
                  💰 Earn 100 coins for voting
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VOTING TIPS */}
      <section className="vote-tips">
        <h2 className="section-title">Tips to Maximize Your Influence</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">⭐</div>
            <h3>Vote Early</h3>
            <p>Early votes carry more weight in close matches</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h3>Vote Often</h3>
            <p>More votes = more coins. Vote daily for best rewards</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📺</div>
            <h3>Episode Votes</h3>
            <p>Episode styling votes are worth more coins</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🏆</div>
            <h3>Build Influence</h3>
            <p>High influence unlocks exclusive voting categories</p>
          </div>
        </div>
      </section>

      {/* PAST VOTING RESULTS */}
      <section className="voting-history">
        <h2 className="section-title">Recent Voting Results</h2>
        <div className="results-list">
          <div className="result-item">
            <div className="result-emoji">🎨</div>
            <div className="result-content">
              <h3>Pink Fantasy Week Winner</h3>
              <p>Maya's look won with 523 votes</p>
            </div>
            <div className="result-date">2 days ago</div>
          </div>
          <div className="result-item">
            <div className="result-emoji">📺</div>
            <div className="result-content">
              <h3>Episode 7 Styling Decided</h3>
              <p>Besties chose the Glam Goddess look</p>
            </div>
            <div className="result-date">5 days ago</div>
          </div>
          <div className="result-item">
            <div className="result-emoji">🎨</div>
            <div className="result-content">
              <h3>Street Style Challenge Vote</h3>
              <p>Zara's entry was featured</p>
            </div>
            <div className="result-date">1 week ago</div>
          </div>
        </div>
      </section>
    </div>
  )
}
