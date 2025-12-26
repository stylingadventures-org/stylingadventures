/**
 * FAN Tier - Episodes Page
 * Features: Episode grid with filtering, watch teaser previews
 */

import React, { useState } from 'react';
import FanLayout from '../components/FanLayout';
import { ContentCard } from '../components/DataDisplay';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { getMockEpisodes } from '../utils/mockData';

export function FanEpisodes() {
  const [currentPage, setCurrentPage] = useState('episodes');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

  const episodes = getMockEpisodes();
  const selectedEp = episodes.find((ep) => ep.id === selectedEpisode);

  return (
    <FanLayout currentPage="episodes">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">LALA Episodes</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Watch free episode previews. Upgrade to Bestie to unlock full episodes!
        </p>
      </div>

      {/* Selected Episode Preview */}
      {selectedEp && (
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-purple-600">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 bg-gradient-to-br from-purple-200 to-pink-200 aspect-video flex items-center justify-center text-6xl rounded-lg">
              {selectedEp.thumbnail}
            </div>
            <div className="md:col-span-2 md:pl-6 mt-4 md:mt-0">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-3xl font-bold">{selectedEp.title}</h2>
                <Badge variant="success">FREE PREVIEW</Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedEp.description}</p>
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-bold">{selectedEp.duration / 60}min</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Views</p>
                  <p className="font-bold">{selectedEp.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Quality</p>
                  <p className="font-bold">{selectedEp.quality}</p>
                </div>
              </div>
              <Button variant="primary" size="lg">
                Watch Preview (5min)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Episodes Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Episodes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {episodes.map((episode) => (
            <div key={episode.id}>
              <ContentCard
                title={episode.title}
                description={episode.description}
                emoji={episode.thumbnail}
                image=""
                views={episode.views}
                likes={episode.likes}
                onClick={() => setSelectedEpisode(episode.id)}
              />
              <div className="mt-2">
                <Badge variant={selectedEpisode === episode.id ? 'success' : 'info'}>
                  Preview Available
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Want Full Episodes? 🎬</h2>
        <p className="text-lg opacity-90 mb-6">Upgrade to Bestie to watch complete episodes with bonus content.</p>
        <Button variant="secondary" size="lg">
          Upgrade Now →
        </Button>
      </div>
    </FanLayout>
  );
}

export default FanEpisodes;
