/**
 * BESTIE Tier - Styling Studio Page
 * Features: Advanced styling tools, virtual try-on, expert feedback, trending combinations
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart } from '../../components/Charts';
import { ContentCard } from '../../components/DataDisplay';

export function BestieStudio() {
  const [currentPage, setCurrentPage] = useState('studio');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedTool, setSelectedTool] = useState('virtual-tryon');

  // Studio stats
  const studioStats = {
    outfitsCreated: 156,
    expertFeedback: 34,
    feedbackScore: 8.7,
    communityVotes: 2340,
  };

  // Styling tools
  const tools = [
    {
      id: 'virtual-tryon',
      name: 'Virtual Try-On',
      description: 'Visualize outfits with 3D modeling',
      icon: '👓',
      features: ['AR Try-On', '3D Modeling', 'Size Comparison'],
    },
    {
      id: 'color-match',
      name: 'Color Matcher',
      description: 'Find perfect color combinations',
      icon: '🎨',
      features: ['Skin Tone Analysis', 'Color Harmony', 'Season Guide'],
    },
    {
      id: 'style-advisor',
      name: 'Style Advisor AI',
      description: 'Get personalized styling recommendations',
      icon: '🤖',
      features: ['Body Type Match', 'Event Recommendations', 'Trend Analysis'],
    },
    {
      id: 'trend-scout',
      name: 'Trend Scout',
      description: 'Discover trending styles in real-time',
      icon: '🔥',
      features: ['Real-Time Trends', 'Similar Looks', 'Creator Picks'],
    },
  ];

  // Feedback received
  const expertFeedback = [
    {
      id: 'feedback_1',
      expert: 'Luna Style Guide',
      outfit: 'Casual Weekend Vibes',
      rating: 5,
      comment: 'Perfect color coordination! Love how you mixed textures.',
      date: '2024-12-20',
      helpful: 127,
    },
    {
      id: 'feedback_2',
      expert: 'Marcus Fashion',
      outfit: 'Professional Elegance',
      rating: 4,
      comment: 'Strong silhouette. Consider statement jewelry for more impact.',
      date: '2024-12-18',
      helpful: 89,
    },
    {
      id: 'feedback_3',
      expert: 'Zara Creates',
      outfit: 'Evening Chic',
      rating: 5,
      comment: 'Sustainable fashion forward! Great eco-conscious choices.',
      date: '2024-12-16',
      helpful: 156,
    },
  ];

  // Community feedback on outfits
  const communityOutfits = [
    {
      id: 'outfit_1',
      name: 'Monochrome Magic',
      creator: 'You',
      votes: 234,
      comments: 18,
      saves: 45,
      trend: 'Rising',
    },
    {
      id: 'outfit_2',
      name: 'Maximalist Mix',
      creator: 'You',
      votes: 189,
      comments: 12,
      saves: 31,
      trend: 'Popular',
    },
    {
      id: 'outfit_3',
      name: 'Minimalist Zen',
      creator: 'You',
      votes: 342,
      comments: 28,
      saves: 67,
      trend: 'Trending',
    },
  ];

  // Skill progress
  const skillProgress = [
    { name: 'Color Theory', value: 82, target: 100 },
    { name: 'Proportion Balance', value: 75, target: 100 },
    { name: 'Trend Awareness', value: 88, target: 100 },
    { name: 'Personal Brand', value: 79, target: 100 },
    { name: 'Sustainability', value: 91, target: 100 },
    { name: 'Event Styling', value: 71, target: 100 },
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
          <h1 className="text-4xl font-bold text-white mb-2">✨ Styling Studio</h1>
          <p className="text-gray-300 text-lg">
            Your personal styling workspace with expert feedback, AI tools, and community engagement.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Outfits Created"
            value={studioStats.outfitsCreated}
            trend={{ value: 8, positive: true }}
            icon="👗"
          />
          <StatCard
            title="Expert Feedback"
            value={studioStats.expertFeedback}
            trend={{ value: 5, positive: true }}
            icon="⭐"
          />
          <StatCard
            title="Feedback Score"
            value={`${studioStats.feedbackScore}/10`}
            trend={{ value: 0.3, positive: true }}
            icon="🎯"
          />
          <StatCard
            title="Community Votes"
            value={`${(studioStats.communityVotes / 1000).toFixed(1)}k`}
            trend={{ value: 12, positive: true }}
            icon="👥"
          />
        </div>

        {/* Styling Tools */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🛠️ Styling Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`p-6 rounded-lg border transition-all text-left ${
                  selectedTool === tool.id
                    ? 'bg-cyan-500/20 border-cyan-500'
                    : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                }`}
              >
                <div className="text-4xl mb-3">{tool.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{tool.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{tool.description}</p>
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feat) => (
                    <Badge key={feat} variant="secondary" className="text-xs">
                      {feat}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Skill Progress */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">📈 Styling Skills Progress</h2>
          <div className="space-y-4">
            {skillProgress.map((skill) => (
              <div key={skill.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{skill.name}</span>
                  <span className="text-cyan-300 font-bold">{skill.value}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="w-full mt-6">
            Continue Training
          </Button>
        </div>

        {/* Expert Feedback Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">⭐ Expert Feedback</h2>
            <Badge variant="success">NEW</Badge>
          </div>
          <div className="space-y-4">
            {expertFeedback.map((fb) => (
              <Card key={fb.id} className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-500/30">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{fb.expert}</h3>
                      <p className="text-gray-400 text-sm">Reviewed: {fb.outfit}</p>
                    </div>
                    <div className="flex gap-1">
                      {Array(fb.rating)
                        .fill(0)
                        .map((_, i) => (
                          <span key={i} className="text-xl">⭐</span>
                        ))}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4 italic">"{fb.comment}"</p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{fb.date}</span>
                    <span>👍 {fb.helpful} found this helpful</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Engagement */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">👥 Community Engagement</h2>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Outfit</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Votes</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Comments</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Saves</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {communityOutfits.map((outfit) => (
                  <tr key={outfit.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{outfit.name}</td>
                    <td className="py-3 px-4 text-gray-300">👍 {outfit.votes}</td>
                    <td className="py-3 px-4 text-gray-300">💬 {outfit.comments}</td>
                    <td className="py-3 px-4 text-gray-300">❤️ {outfit.saves}</td>
                    <td className="py-3 px-4">
                      <Badge variant={outfit.trend === 'Trending' ? 'success' : 'default'}>
                        {outfit.trend}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        View →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Featured Challenge */}
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-3">🎨 This Week's Studio Challenge</h2>
          <p className="text-gray-300 mb-4">
            Create an outfit using <span className="text-pink-400 font-bold">3 colors from the autumn palette</span> and submit for expert critique!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Prize Pool</p>
              <p className="text-2xl font-bold text-pink-400">3,500 Prime Coins</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Entries This Week</p>
              <p className="text-2xl font-bold text-cyan-300">847</p>
            </div>
          </div>
          <Button variant="primary" size="lg" className="w-full">
            Submit Your Entry
          </Button>
        </div>

        {/* Learning Path */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">📚 Recommended Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ContentCard
              title="Body Type Mastery"
              views="2,340"
              likes="890"
              emoji="💪"
              description="Learn to dress for your body type with confidence"
            />
            <ContentCard
              title="Seasonal Color Theory"
              views="3,120"
              likes="1,250"
              emoji="🎨"
              description="Discover your seasonal color palette and shine"
            />
            <ContentCard
              title="Professional Wardrobe Building"
              views="1,890"
              likes="720"
              emoji="💼"
              description="Create a versatile work wardrobe on any budget"
            />
            <ContentCard
              title="Accessory Mastery"
              views="2,560"
              likes="980"
              emoji="👜"
              description="Elevate any outfit with strategic accessories"
            />
            <ContentCard
              title="Trend Forecasting"
              views="1,450"
              likes="620"
              emoji="🔮"
              description="Stay ahead of fashion trends and adapt them to your style"
            />
            <ContentCard
              title="Sustainable Fashion"
              views="3,890"
              likes="1,560"
              emoji="🌿"
              description="Build a gorgeous wardrobe with eco-conscious choices"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default BestieStudio;
