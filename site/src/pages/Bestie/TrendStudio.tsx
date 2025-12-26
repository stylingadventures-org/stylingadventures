/**
 * BESTIE Tier - Trend Studio Page
 * Features: Early trend access, trend forecasting, trendsetter tools
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart, SimpleLineChart } from '../../components/Charts';
import { ContentCard } from '../../components/DataDisplay';

export function TrendStudio() {
  const [currentPage, setCurrentPage] = useState('trends');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedTrend, setSelectedTrend] = useState('emerging');

  // Trend stats
  const trendStats = {
    trendsPredicted: 34,
    accuracyRate: 87,
    followersInfluenced: 12340,
    trendsetsCreated: 8,
  };

  // Emerging trends (Early Access - 2 weeks before public)
  const emergingTrends = [
    {
      id: 'trend_1',
      name: 'Cyberpunk Elegance',
      description: 'Metallic accents meet minimalist silhouettes',
      momentum: 92,
      adoption: 'Rising Rapidly',
      colors: ['Silver', 'Black', 'Electric Blue'],
      styles: ['Futuristic', 'Bold', 'Sleek'],
      prediction: 'Will dominate Q1 2025',
      emoji: '🤖',
    },
    {
      id: 'trend_2',
      name: 'Cottagecore Luxury',
      description: 'Romantic details meet high-end materials',
      momentum: 78,
      adoption: 'Growing',
      colors: ['Cream', 'Rose Gold', 'Sage'],
      styles: ['Romantic', 'Luxe', 'Vintage'],
      prediction: 'Strong seasonal play',
      emoji: '🏡',
    },
    {
      id: 'trend_3',
      name: 'Neon Minimalism',
      description: 'Bright pops of color on neutral bases',
      momentum: 85,
      adoption: 'Accelerating',
      colors: ['Neon Pink', 'White', 'Black'],
      styles: ['Modern', 'Bold', 'Clean'],
      prediction: 'Street style favorite incoming',
      emoji: '🌟',
    },
  ];

  // Current popular trends
  const popularTrends = [
    {
      id: 'pop_1',
      name: 'Barbiecore Continued',
      momentum: 74,
      posts: 342000,
      emoji: '💕',
    },
    {
      id: 'pop_2',
      name: 'Quiet Luxury',
      momentum: 82,
      posts: 289000,
      emoji: '✨',
    },
    {
      id: 'pop_3',
      name: 'Y2K Revival',
      momentum: 68,
      posts: 245000,
      emoji: '👖',
    },
  ];

  // Trend data over time
  const trendTimeline = [
    { name: 'Jan', cyberpunk: 15, cottagecore: 20, neon: 10 },
    { name: 'Feb', cyberpunk: 28, cottagecore: 32, neon: 22 },
    { name: 'Mar', cyberpunk: 45, cottagecore: 38, neon: 38 },
    { name: 'Apr', cyberpunk: 62, cottagecore: 42, neon: 55 },
    { name: 'May', cyberpunk: 78, cottagecore: 48, neon: 72 },
    { name: 'Jun', cyberpunk: 92, cottagecore: 51, neon: 85 },
  ];

  // Trend adoption curve
  const adoptionCurve = [
    { name: 'Innovators', value: 2 },
    { name: 'Early Adopters', value: 13 },
    { name: 'Early Majority', value: 34 },
    { name: 'Late Majority', value: 34 },
    { name: 'Laggards', value: 17 },
  ];

  // Trendsetters (people starting trends)
  const trendsetters = [
    {
      id: 'setter_1',
      name: 'Luna Style Guide',
      trendsCreated: 12,
      followers: 125000,
      influence: 'Ultra High',
      emoji: '👑',
    },
    {
      id: 'setter_2',
      name: 'Marcus Fashion',
      trendsCreated: 8,
      followers: 89000,
      influence: 'Very High',
      emoji: '⭐',
    },
    {
      id: 'setter_3',
      name: 'Zara Creates',
      trendsCreated: 15,
      followers: 156000,
      influence: 'Ultra High',
      emoji: '👑',
    },
  ];

  // Prediction accuracy
  const predictions = [
    { trend: 'Cyberpunk Elegance', predicted: 95, actual: 92, accuracy: 96.8 },
    { trend: 'Cottagecore Luxury', predicted: 75, actual: 78, accuracy: 96.1 },
    { trend: 'Neon Minimalism', predicted: 88, actual: 85, accuracy: 96.6 },
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
          <h1 className="text-4xl font-bold text-white mb-2">🔮 Trend Studio</h1>
          <p className="text-gray-300 text-lg">
            See emerging trends 2 weeks early. Forecast what's next with our AI-powered trend analysis and join the trendsetters.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Trends Predicted"
            value={trendStats.trendsPredicted}
            trend={{ value: 5, positive: true }}
            icon="🔮"
          />
          <StatCard
            title="Accuracy Rate"
            value={`${trendStats.accuracyRate}%`}
            trend={{ value: 2, positive: true }}
            icon="🎯"
          />
          <StatCard
            title="Followers Influenced"
            value={`${(trendStats.followersInfluenced / 1000).toFixed(1)}k`}
            trend={{ value: 18, positive: true }}
            icon="👥"
          />
          <StatCard
            title="Trends Created"
            value={trendStats.trendsetsCreated}
            trend={{ value: 2, positive: true }}
            icon="⭐"
          />
        </div>

        {/* Trend Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTrend('emerging')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTrend === 'emerging'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            🚀 Emerging (Early Access)
          </button>
          <button
            onClick={() => setSelectedTrend('popular')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTrend === 'popular'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            🔥 Currently Popular
          </button>
          <button
            onClick={() => setSelectedTrend('declining')}
            className={`px-6 py-3 rounded-lg border transition-all font-medium ${
              selectedTrend === 'declining'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
            }`}
          >
            📉 Declining
          </button>
        </div>

        {/* Emerging Trends (Early Access) */}
        {selectedTrend === 'emerging' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-300 text-sm">
                ⚡ BESTIE EXCLUSIVE: See these trends 2 weeks before the rest of the community. Be a trendsetter!
              </p>
            </div>
            <div className="space-y-4">
              {emergingTrends.map((trend) => (
                <Card key={trend.id} className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <span className="text-4xl">{trend.emoji}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{trend.name}</h3>
                          <p className="text-gray-300">{trend.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">{trend.adoption}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Momentum Score</p>
                        <div className="bg-gray-700/50 rounded-full h-3 w-full">
                          <div
                            className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 rounded-full"
                            style={{ width: `${trend.momentum}%` }}
                          />
                        </div>
                        <p className="text-cyan-300 font-bold text-sm mt-1">{trend.momentum}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Key Colors</p>
                        <div className="flex gap-2">
                          {trend.colors.map((color) => (
                            <Badge key={color} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Style Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {trend.styles.map((style) => (
                            <Badge key={style} variant="default" className="text-xs">
                              {style}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded p-4 mb-4">
                      <p className="text-gray-300 text-sm">
                        <span className="font-bold text-cyan-300">Prediction:</span> {trend.prediction}
                      </p>
                    </div>

                    <Button variant="primary" size="sm">
                      Create with This Trend →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Currently Popular Trends */}
        {selectedTrend === 'popular' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularTrends.map((trend) => (
                <Card key={trend.id} className="bg-gray-800/50 border-gray-700">
                  <div className="p-6">
                    <span className="text-4xl mb-3 block">{trend.emoji}</span>
                    <h3 className="text-lg font-bold text-white mb-4">{trend.name}</h3>
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Momentum</p>
                      <div className="bg-gray-700/50 rounded-full h-3 w-full">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                          style={{ width: `${trend.momentum}%` }}
                        />
                      </div>
                      <p className="text-orange-300 font-bold text-sm mt-1">{trend.momentum}%</p>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      {(trend.posts / 1000).toFixed(0)}K posts this week
                    </p>
                    <Button variant="secondary" size="sm" className="w-full">
                      Explore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trend Timeline */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Trend Growth Projection</h2>
          <ChartContainer height={350}>
            <SimpleLineChart data={trendTimeline} dataKey="cyberpunk" />
          </ChartContainer>
          <p className="text-gray-400 text-sm mt-4">
            Emerging trends show predicted adoption curves over the next 6 months
          </p>
        </div>

        {/* Prediction Accuracy */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Our Accuracy Record</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Trend</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Predicted</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Actual</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.trend} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-white font-medium">{pred.trend}</td>
                    <td className="py-3 px-4 text-gray-300">{pred.predicted}%</td>
                    <td className="py-3 px-4 text-gray-300">{pred.actual}%</td>
                    <td className="py-3 px-4 text-green-400 font-bold">{pred.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trendsetters Leaderboard */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">👑 Top Trendsetters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trendsetters.map((setter) => (
              <Card key={setter.id} className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-500/30">
                <div className="p-6 text-center">
                  <span className="text-4xl block mb-3">{setter.emoji}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{setter.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Trends Created</span>
                      <span className="font-bold text-amber-300">{setter.trendsCreated}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Followers</span>
                      <span className="font-bold text-amber-300">
                        {(setter.followers / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Influence</span>
                      <span className="font-bold text-amber-300">{setter.influence}</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="w-full">
                    Follow
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Trend Tools */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🛠️ Trend Tools for BESTIE Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="primary" className="py-6 text-lg">
              🔮 Run Trend Prediction for Your Style
            </Button>
            <Button variant="primary" className="py-6 text-lg">
              📊 Analyze Trend Adoption Rate
            </Button>
            <Button variant="secondary" className="py-6 text-lg">
              🎨 Create Trend-Based Mood Board
            </Button>
            <Button variant="secondary" className="py-6 text-lg">
              📉 Track Declining Trends to Avoid
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default TrendStudio;
