/**
 * FAN Tier - Lala's Closet Page
 * Features: Browse Lala's signature outfits, mood selector, hearts, styling inspiration
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { getMockUserCloset } from '../utils/mockData';
import '../styles/lalas-closet.css';

const CLOSET_MOODS = [
  { id: 'all', label: '✨ All', color: '#FFB6E1' },
  { id: 'pastel-barbiecore', label: '💕 Pastel Barbiecore', color: '#FFB6E1' },
  { id: 'preppy', label: '👗 Preppy Chic', color: '#B6D7FF' },
  { id: 'indie', label: '🎸 Indie Aesthetic', color: '#D4A5FF' },
  { id: 'maximalist', label: '🌟 Maximalist', color: '#FFD4A5' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'loved', label: 'Most Loved' },
  { id: 'lala-pick', label: "Lala's Pick" },
  { id: 'partel', label: 'Pastel' },
];

export function FanCloset() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState('pastel-barbiecore');
  const [selectedSort, setSelectedSort] = useState('loved');
  const [heartedItems, setHeartedItems] = useState<Set<string>>(new Set());

  const closetItems = getMockUserCloset();
  const selectedItemData = closetItems.find((item) => item.id === selectedItem);

  const toggleHeart = (itemId: string) => {
    const newHearted = new Set(heartedItems);
    if (newHearted.has(itemId)) {
      newHearted.delete(itemId);
    } else {
      newHearted.add(itemId);
    }
    setHeartedItems(newHearted);
  };

  // Sort items
  let sortedItems = [...closetItems];
  if (selectedSort === 'loved') {
    sortedItems.sort((a, b) => b.likes - a.likes);
  }

  const stats = {
    totalOutfits: closetItems.length,
    totalLikes: closetItems.reduce((sum, item) => sum + item.likes, 0),
    yourHearts: heartedItems.size,
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="closet-hero">
        <div className="closet-hero-content">
          <h1 className="closet-hero-title">Come style me, bestie 💜</h1>
          <p className="closet-hero-subtitle">
            Heart your fave looks and I'll use them to inspire future drops & Style Lab combos.
          </p>
        </div>

        <div className="closet-hero-sidebar">
          <div className="mood-card">
            <div className="mood-card-label">Closet mood</div>
            <div className="mood-selector">
              {CLOSET_MOODS.map((mood) => (
                <button
                  key={mood.id}
                  className={`mood-option ${selectedMood === mood.id ? 'active' : ''}`}
                  onClick={() => setSelectedMood(mood.id)}
                  style={{ 
                    backgroundColor: selectedMood === mood.id ? mood.color : 'transparent',
                  }}
                  title={mood.label}
                >
                  {mood.label}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full">
              Open Style Lab
            </Button>
          </div>
        </div>
      </section>

      {/* FILTER & SORT */}
      <section className="closet-controls">
        <div className="filter-tabs">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`filter-tab ${selectedSort === option.id ? 'active' : ''}`}
              onClick={() => setSelectedSort(option.id)}
            >
              {option.label}
            </button>
          ))}
          <span className="filter-count">Showing {sortedItems.length} of {closetItems.length} looks</span>
        </div>
      </section>

      {/* DETAILED VIEW */}
      {selectedItemData && (
        <section className="closet-detail">
          <div className="detail-container">
            <div className="detail-visual">
              <div className="detail-image">
                {selectedItemData.image}
              </div>
            </div>

            <div className="detail-info">
              <div className="detail-header">
                <div>
                  <h2 className="detail-name">{selectedItemData.name}</h2>
                  <p className="detail-subtitle">Closet look • Fan + Bestie</p>
                </div>
                <button 
                  className={`heart-button ${heartedItems.has(selectedItem!) ? 'hearted' : ''}`}
                  onClick={() => setSelectedItem(selectedItem!)}
                >
                  ❤️
                </button>
              </div>

              <div className="detail-stats">
                <div className="stat">
                  <span className="stat-count">❤️ {selectedItemData.likes}</span>
                  <span className="stat-label">Hearts</span>
                </div>
                <div className="stat">
                  <span className="stat-count">{selectedItemData.type}</span>
                  <span className="stat-label">Style Type</span>
                </div>
              </div>

              <p className="detail-description">
                I'd wear this to brunch or a picnic.
              </p>

              <div className="detail-colors">
                <p className="detail-label">Colors</p>
                <div className="color-chips">
                  {selectedItemData.colors.map((color) => (
                    <span key={color} className="color-chip">{color}</span>
                  ))}
                </div>
              </div>

              <div className="detail-actions">
                <Button variant="primary" size="lg" className="w-full">
                  Shop This Look
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GRID OF LOOKS */}
      <section className="closet-grid-section">
        <h2 className="grid-title">Lala's Closet Feed</h2>
        <p className="grid-subtitle">
          Tap a look to heart it and save inspo. The most-loved looks help decer futurebestrops.
        </p>

        <div className="closet-grid">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`closet-card ${selectedItem === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedItem(item.id)}
            >
              <div className="card-image">
                <div className="image-content">{item.image}</div>

                <button
                  className={`card-heart ${heartedItems.has(item.id) ? 'hearted' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHeart(item.id);
                  }}
                >
                  ❤️ {item.likes + (heartedItems.has(item.id) ? 1 : 0)}
                </button>
              </div>

              <div className="card-details">
                <h3 className="card-name">{item.name}</h3>
                <p className="card-note">Heart this if you'd wear it</p>
                <p className="card-social">You and {Math.floor(Math.random() * 50)} others love it</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="closet-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.totalOutfits}</span>
          <span className="stat-text">Looks in Lala's closet</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalLikes.toLocaleString()}</span>
          <span className="stat-text">Total hearts</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.yourHearts}</span>
          <span className="stat-text">Your hearts</span>
        </div>
      </section>

      {/* UPGRADE CTA */}
      <section className="closet-cta">
        <div className="cta-card">
          <div className="cta-content">
            <h2 className="cta-title">Upgrade to Bestie 💎</h2>
            <p className="cta-description">
              Create your own outfits, access the Style Lab, and get early drops.
            </p>
          </div>
          <Button variant="secondary" size="lg">
            Become a Bestie →
          </Button>
        </div>
      </section>
    </>
  );
}

export default FanCloset;
