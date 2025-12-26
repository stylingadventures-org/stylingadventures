/**
 * BESTIE Tier - Digital Closet Page
 * Features: Full wardrobe management, styling combinations, advanced filters, AI suggestions
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimplePieChart } from '../../components/Charts';
import { Table, ContentCard } from '../../components/DataDisplay';
import { generateMockGameStats } from '../../utils/mockData';

export function BestieCloset() {
  const [currentPage, setCurrentPage] = useState('closet');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const gameStats = generateMockGameStats(currentUser.id);

  // Wardrobe statistics
  const closetStats = {
    totalItems: 324,
    categories: 12,
    outfits: 47,
    aiMatches: 156,
  };

  // Color distribution for pie chart
  const colorDistribution = [
    { name: 'Neutral', value: 45, fill: '#6B7280' },
    { name: 'Black', value: 28, fill: '#000000' },
    { name: 'Blue', value: 15, fill: '#3B82F6' },
    { name: 'Red', value: 7, fill: '#EF4444' },
    { name: 'Green', value: 3, fill: '#10B981' },
    { name: 'Other', value: 2, fill: '#8B5CF6' },
  ];

  // Full wardrobe items
  const wardrobeItems = [
    {
      id: 'item_1',
      name: 'Classic White T-Shirt',
      category: 'Tops',
      color: 'White',
      brand: 'Lala Basics',
      purchased: '2024-01-15',
      wearCount: 34,
      costPerwear: '$2.35',
      aiMatches: 12,
    },
    {
      id: 'item_2',
      name: 'Dark Denim Jeans',
      category: 'Bottoms',
      color: 'Navy Blue',
      brand: 'Designer Co',
      purchased: '2024-02-01',
      wearCount: 28,
      costPerwear: '$4.64',
      aiMatches: 15,
    },
    {
      id: 'item_3',
      name: 'Silk Blouse',
      category: 'Tops',
      color: 'Blush',
      brand: 'Elegant Wear',
      purchased: '2024-01-20',
      wearCount: 16,
      costPerwear: '$8.13',
      aiMatches: 8,
    },
    {
      id: 'item_4',
      name: 'Leather Jacket',
      category: 'Outerwear',
      color: 'Black',
      brand: 'Leather Plus',
      purchased: '2024-03-10',
      wearCount: 11,
      costPerwear: '$12.73',
      aiMatches: 19,
    },
    {
      id: 'item_5',
      name: 'Midi Skirt',
      category: 'Bottoms',
      color: 'Forest Green',
      brand: 'Chic Styles',
      purchased: '2024-02-14',
      wearCount: 9,
      costPerwear: '$13.33',
      aiMatches: 7,
    },
  ];

  // Categories with counts
  const categories = [
    { id: 'all', name: 'All Items', count: 324, emoji: '👕' },
    { id: 'tops', name: 'Tops', count: 89, emoji: '👔' },
    { id: 'bottoms', name: 'Bottoms', count: 56, emoji: '👖' },
    { id: 'dresses', name: 'Dresses', count: 34, emoji: '👗' },
    { id: 'outerwear', name: 'Outerwear', count: 23, emoji: '🧥' },
    { id: 'shoes', name: 'Shoes', count: 45, emoji: '👟' },
    { id: 'accessories', name: 'Accessories', count: 77, emoji: '👜' },
  ];

  // AI suggested outfits
  const aiOutfits = [
    {
      id: 'outfit_1',
      name: 'Casual Weekend Vibes',
      items: ['Classic White T-Shirt', 'Dark Denim Jeans', 'White Sneakers'],
      occasions: ['Weekend', 'Casual'],
      compatibility: 98,
      aiScore: 9.2,
    },
    {
      id: 'outfit_2',
      name: 'Professional Meeting',
      items: ['Silk Blouse', 'Black Trousers', 'Leather Pumps'],
      occasions: ['Work', 'Formal'],
      compatibility: 95,
      aiScore: 9.1,
    },
    {
      id: 'outfit_3',
      name: 'Evening Elegance',
      items: ['Midi Skirt', 'Silk Blouse', 'Leather Jacket'],
      occasions: ['Evening', 'Date Night'],
      compatibility: 92,
      aiScore: 8.9,
    },
  ];

  return (
    <MainLayout
      tier={currentUser.tier}
      username={currentUser.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">Your Digital Closet 👗</h1>
          <p className="text-gray-300 text-lg">
            Full wardrobe management with AI-powered styling suggestions. Explore all {closetStats.totalItems} items and discover endless outfit combinations.
          </p>
        </div>

        {/* Closet Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Items"
            value={closetStats.totalItems}
            trend={{ value: 12, positive: true }}
            icon="👕"
          />
          <StatCard
            title="Categories"
            value={closetStats.categories}
            trend={{ value: 0, positive: false }}
            icon="🏷️"
          />
          <StatCard
            title="Saved Outfits"
            value={closetStats.outfits}
            trend={{ value: 3, positive: true }}
            icon="✨"
          />
          <StatCard
            title="AI Matches"
            value={closetStats.aiMatches}
            trend={{ value: 18, positive: true }}
            icon="🤖"
          />
        </div>

        {/* Category Navigation */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-lg border transition-all text-center ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className="text-sm font-medium mb-1">{cat.name}</div>
                <div className="text-xs text-gray-400">{cat.count}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Color Palette</h2>
            <ChartContainer height={300}>
              <SimplePieChart data={colorDistribution} />
            </ChartContainer>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Wardrobe Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded">
                <div className="text-sm text-gray-400 mb-1">Most Worn Category</div>
                <div className="text-xl font-bold text-cyan-300">Tops (89 items)</div>
              </div>
              <div className="p-4 bg-gray-700/50 rounded">
                <div className="text-sm text-gray-400 mb-1">Average Cost Per Wear</div>
                <div className="text-xl font-bold text-cyan-300">$8.23</div>
              </div>
              <div className="p-4 bg-gray-700/50 rounded">
                <div className="text-sm text-gray-400 mb-1">Most Versatile Piece</div>
                <div className="text-xl font-bold text-cyan-300">Classic White T-Shirt</div>
              </div>
              <div className="p-4 bg-gray-700/50 rounded">
                <div className="text-sm text-gray-400 mb-1">Items Needing More Love</div>
                <div className="text-xl font-bold text-cyan-300">Midi Skirt (9 wears)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wardrobe Items Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 overflow-x-auto">
          <h2 className="text-2xl font-bold text-white mb-4">💎 Your Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Item</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Category</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Color</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Brand</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Wears</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Cost/Wear</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">AI Matches</th>
              </tr>
            </thead>
            <tbody>
              {wardrobeItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                  <td className="py-3 px-4 text-gray-300">{item.category}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default">{item.color}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{item.brand}</td>
                  <td className="py-3 px-4 text-gray-300">{item.wearCount}</td>
                  <td className="py-3 px-4 text-cyan-300 font-medium">{item.costPerwear}</td>
                  <td className="py-3 px-4 text-amber-300 font-medium">🤖 {item.aiMatches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Suggested Outfits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🤖 AI Suggested Outfits</h2>
            <Badge variant="success">NEW</Badge>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Our AI analyzed your 324 items and created perfect combinations for different occasions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiOutfits.map((outfit) => (
              <Card key={outfit.id} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex-1">{outfit.name}</h3>
                    <Badge variant="default">{outfit.aiScore}/10</Badge>
                  </div>

                  <div className="mb-4 space-y-2">
                    {outfit.items.map((item, idx) => (
                      <div key={idx} className="flex items-center text-gray-300 text-sm">
                        <span className="text-cyan-400 mr-2">✓</span> {item}
                      </div>
                    ))}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {outfit.occasions.map((occ) => (
                      <Badge key={occ} variant="secondary" className="text-xs">
                        {occ}
                      </Badge>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">Compatibility Score</div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${outfit.compatibility}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-300 mt-1 text-right">{outfit.compatibility}%</div>
                  </div>

                  <Button variant="primary" size="sm" className="w-full">
                    Preview Outfit →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="primary" className="py-6 text-lg">
            ➕ Add New Item to Closet
          </Button>
          <Button variant="secondary" className="py-6 text-lg">
            📸 Photo Upload & Recognition
          </Button>
          <Button variant="secondary" className="py-6 text-lg">
            📊 Generate Style Report
          </Button>
          <Button variant="secondary" className="py-6 text-lg">
            🎨 Color Palette Analysis
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

export default BestieCloset;
