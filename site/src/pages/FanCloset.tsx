/**
 * FAN Tier - Closet Page
 * Features: Browse Lala's signature outfits with affiliate links
 */

import React, { useState } from 'react';
import FanLayout from '../components/FanLayout';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { getMockUserCloset } from '../utils/mockData';

export function FanCloset() {
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const closetItems = getMockUserCloset();
  const selectedItemData = closetItems.find((item) => item.id === selectedItem);

  const stats = {
    totalOutfits: closetItems.length,
    totalLikes: closetItems.reduce((sum, item) => sum + item.likes, 0),
    colors: ['Red', 'Black', 'Gold', 'Blue'],
  };

  return (
    <FanLayout currentPage="closet">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">✨ Lala's Closet</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Explore Lala's iconic outfits and find affiliate shopping links!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Iconic Outfits"
          value={stats.totalOutfits}
          icon="👗"
          color="purple"
        />
        <StatCard
          label="Total Likes"
          value={stats.totalLikes.toLocaleString()}
          icon="❤️"
          color="pink"
        />
        <StatCard
          label="Colors Used"
          value={stats.colors.length}
          icon="🎨"
          color="blue"
        />
      </div>

      {/* Selected Item Detail */}
      {selectedItemData && (
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 border-2 border-purple-600">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 bg-gradient-to-br from-purple-200 to-pink-200 aspect-square flex items-center justify-center text-8xl rounded-lg">
              {selectedItemData.image}
            </div>
            <div className="md:col-span-2 md:pl-6 mt-4 md:mt-0">
              <h2 className="text-3xl font-bold mb-2">{selectedItemData.name}</h2>
              <Badge variant="info" className="mb-4">{selectedItemData.type}</Badge>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Colors</p>
                <div className="flex gap-2">
                  {selectedItemData.colors.map((color) => (
                    <div
                      key={color}
                      className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-slate-600 text-sm"
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Community Love</p>
                <p className="text-3xl font-bold text-pink-600">❤️ {selectedItemData.likes.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <Button variant="primary" size="lg" className="w-full">
                  Shop This Outfit
                </Button>
                <Button variant="ghost" size="lg" className="w-full">
                  Get Styling Tips
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Closet Items */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">All Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {closetItems.map((item) => (
            <Card
              key={item.id}
              hoverable
              onClick={() => setSelectedItem(item.id)}
              className={`p-4 cursor-pointer ${selectedItem === item.id ? 'ring-2 ring-purple-600' : ''}`}
            >
              <div className="bg-gradient-to-br from-purple-200 to-pink-200 aspect-square flex items-center justify-center text-6xl rounded-lg mb-3">
                {item.image}
              </div>
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 uppercase">
                {item.type}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.colors.map((color) => (
                  <Badge key={color} variant="default">{color}</Badge>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-pink-600 font-bold">❤️ {item.likes}</span>
                <Button variant="primary" size="sm">
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Your Own CTA */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Create Your Own Outfits 🎨</h2>
            <p className="text-lg opacity-90">
              Upgrade to Bestie and design your own looks in the Styling Studio!
            </p>
          </div>
          <Button variant="secondary" size="lg">
            Upgrade →
          </Button>
        </div>
      </div>
    </FanLayout>
  );
}

export default FanCloset;
