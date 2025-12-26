import { useState } from 'react'
import '../../styles/bestie.css'

export default function BestieStudio() {
  const [activeTab, setActiveTab] = useState('create')

  const drafts = [
    { id: 1, name: 'Pink Winter Dream', created: '2 hours ago', status: 'draft' },
    { id: 2, name: 'Glam Gala Vibes', created: '1 day ago', status: 'draft' },
    { id: 3, name: 'Street Cool', created: '3 days ago', status: 'published' },
  ]

  return (
    <div className="bestie-wrapper">
      {/* HEADER */}
      <section className="bestie-header">
        <div className="header-card">
          <div className="header-kicker">🎨 Creative Studio</div>
          <h1 className="header-title">Build Your Looks</h1>
          <p className="header-subtitle">Create, edit, and publish your style creations</p>
        </div>
      </section>

      {/* TABS */}
      <section className="studio-tabs">
        <button 
          className={`studio-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create New Look
        </button>
        <button 
          className={`studio-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          📝 My Drafts
        </button>
        <button 
          className={`studio-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          ✅ Published
        </button>
      </section>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <section className="studio-create">
          <div className="create-grid">
            <div className="create-card">
              <div className="create-icon">📸</div>
              <h3>Upload Image</h3>
              <p>Add your look photo or moodboard</p>
              <button className="btn btn-primary">Upload</button>
            </div>

            <div className="create-card">
              <div className="create-icon">✏️</div>
              <h3>Add Details</h3>
              <p>Name, tags, description, mood</p>
              <button className="btn btn-primary">Fill In</button>
            </div>

            <div className="create-card">
              <div className="create-icon">🏷️</div>
              <h3>Tag Items</h3>
              <p>Tag specific pieces in your look</p>
              <button className="btn btn-primary">Tag</button>
            </div>

            <div className="create-card">
              <div className="create-icon">💬</div>
              <h3>Add Caption</h3>
              <p>Tell the story behind this look</p>
              <button className="btn btn-primary">Write</button>
            </div>
          </div>

          <div className="create-info">
            <h3>💡 Pro Tips</h3>
            <ul>
              <li>Good lighting = better photos</li>
              <li>Clear tags help people find pieces</li>
              <li>Captions get more votes</li>
              <li>Publish to earn coins!</li>
            </ul>
          </div>
        </section>
      )}

      {/* DRAFTS TAB */}
      {activeTab === 'drafts' && (
        <section className="studio-list">
          <div className="list-header">
            <h2>Your Draft Looks</h2>
            <p>Private until you publish</p>
          </div>
          <div className="list-items">
            {drafts.filter(d => d.status === 'draft').map((draft) => (
              <div key={draft.id} className="list-item">
                <div className="list-image">🎨</div>
                <div className="list-content">
                  <h3>{draft.name}</h3>
                  <p>Created {draft.created}</p>
                </div>
                <div className="list-actions">
                  <button className="btn btn-secondary btn-sm">Edit</button>
                  <button className="btn btn-primary btn-sm">Publish</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PUBLISHED TAB */}
      {activeTab === 'published' && (
        <section className="studio-list">
          <div className="list-header">
            <h2>Your Published Looks</h2>
            <p>Earning coins and getting votes</p>
          </div>
          <div className="list-items">
            {drafts.filter(d => d.status === 'published').map((item) => (
              <div key={item.id} className="list-item">
                <div className="list-image">🎨</div>
                <div className="list-content">
                  <h3>{item.name}</h3>
                  <p>Published {item.created}</p>
                </div>
                <div className="list-actions">
                  <button className="btn btn-secondary btn-sm">Edit</button>
                  <button className="btn btn-secondary btn-sm">Stats</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STYLE CHALLENGES */}
      <section className="studio-challenges">
        <h2 className="section-title">Active Style Challenges</h2>
        <p className="section-subtitle">Use our prompts as inspiration</p>
        <div className="challenges-grid">
          <div className="challenge-prompt">
            <div className="challenge-emoji">🎨</div>
            <h3>"Pink Fantasy Week"</h3>
            <p>Style a look in hot pink tones</p>
            <div className="challenge-reward">💰 400 coins</div>
            <button className="btn btn-primary btn-sm">Start</button>
          </div>

          <div className="challenge-prompt">
            <div className="challenge-emoji">🌃</div>
            <h3>"Night Out Glam"</h3>
            <p>Your best evening look</p>
            <div className="challenge-reward">💰 350 coins</div>
            <button className="btn btn-primary btn-sm">Start</button>
          </div>

          <div className="challenge-prompt">
            <div className="challenge-emoji">🛍️</div>
            <h3>"Thrift Score"</h3>
            <p>Style a secondhand find</p>
            <div className="challenge-reward">💰 300 coins</div>
            <button className="btn btn-primary btn-sm">Start</button>
          </div>
        </div>
      </section>
    </div>
  )
}
