/**
 * FAN Tier - Magazine Page
 * Features: Editorial spreads, interviews, curated content
 */

import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const magazines = [
  {
    id: 'mag_1',
    title: 'Winter Fashion 2026',
    issue: 'Issue #12',
    emoji: '❄️',
    coverImage: '🧥',
    featured: ['Trending Colors', 'Layering Guide', 'Fabric Focus'],
    releaseDate: new Date('2025-12-20'),
  },
  {
    id: 'mag_2',
    title: 'The Minimalist Guide',
    issue: 'Issue #11',
    emoji: '🎨',
    coverImage: '👔',
    featured: ['Capsule Wardrobes', 'Essential Pieces', 'Timeless Classics'],
    releaseDate: new Date('2025-12-10'),
  },
  {
    id: 'mag_3',
    title: 'Bold & Vibrant',
    issue: 'Issue #10',
    emoji: '💃',
    coverImage: '🌈',
    featured: ['Color Psychology', 'Pattern Mixing', 'Statement Pieces'],
    releaseDate: new Date('2025-11-30'),
  },
];

const interviews = [
  {
    id: 'int_1',
    title: 'Q&A with Lala',
    guest: 'Lala',
    emoji: '⭐',
    excerpt: 'An exclusive conversation with Lala about her creative process and fashion journey.',
    published: new Date('2025-12-15'),
  },
  {
    id: 'int_2',
    title: 'Sustainable Fashion Talk',
    guest: 'Eco Fashion Expert',
    emoji: '🌱',
    excerpt: 'How to build a sustainable fashion habit without compromising on style.',
    published: new Date('2025-12-05'),
  },
];

export function FanMagazine() {
  const [currentPage, setCurrentPage] = useState('magazine');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });
  const [selectedMag, setSelectedMag] = useState<string | null>(null);

  const selected = magazines.find((mag) => mag.id === selectedMag);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📰 LALA Magazine</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Editorial spreads, expert interviews, and curated fashion stories
        </p>
      </div>

      {/* Magazine Detail View */}
      {selected ? (
        <div className="mb-8">
          <button
            onClick={() => setSelectedMag(null)}
            className="text-purple-600 hover:text-purple-700 mb-4 font-semibold"
          >
            ← Back to Magazine
          </button>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-1 bg-gradient-to-br from-purple-300 to-pink-300 aspect-auto flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-8xl mb-4">{selected.coverImage}</div>
                  <p className="text-2xl font-bold">{selected.issue}</p>
                </div>
              </div>
              <div className="md:col-span-2 p-8">
                <h2 className="text-4xl font-bold mb-2">{selected.title}</h2>
                <Badge variant="info" className="mb-6">
                  {selected.releaseDate.toLocaleDateString()}
                </Badge>

                <h3 className="text-xl font-bold mb-3">In This Issue:</h3>
                <ul className="space-y-2 mb-6">
                  {selected.featured.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-purple-600">✨</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="primary" size="lg">
                  Read Full Magazine
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Latest Issues */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Latest Issues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {magazines.map((mag) => (
                <Card
                  key={mag.id}
                  hoverable
                  onClick={() => setSelectedMag(mag.id)}
                  className="overflow-hidden cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-purple-200 to-pink-200 aspect-square flex items-center justify-center text-6xl">
                    {mag.coverImage}
                  </div>
                  <div className="p-4">
                    <Badge variant="default" className="mb-2">
                      {mag.issue}
                    </Badge>
                    <h3 className="text-xl font-bold mb-2">{mag.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {mag.featured.slice(0, 2).join(' • ')}
                    </p>
                    <Button variant="primary" size="sm" className="w-full">
                      Read Issue
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Interviews */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Expert Interviews</h2>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <Card key={interview.id} hoverable className="p-6 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl flex-shrink-0">{interview.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{interview.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">with {interview.guest}</p>
                      <p className="mb-4">{interview.excerpt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {interview.published.toLocaleDateString()}
                        </span>
                        <Button variant="primary" size="sm">
                          Read Interview
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Archive CTA */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Browse Our Archive 📚</h2>
                <p className="text-lg opacity-90">
                  Access all past issues and premium content with Bestie tier!
                </p>
              </div>
              <Button variant="secondary" size="lg">
                Upgrade →
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default FanMagazine;
