/**
 * BESTIE Tier - Personalized Home Page
 * Features: Full recommendations, creator suggestions, community highlights, full access
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart, SimpleLineChart } from '../../components/Charts';
import { Leaderboard, ContentCard, AchievementGrid } from '../../components/DataDisplay';
import {
  getMockEpisodes,
  getMockChallenges,
  getMockTrendingContent,
  getMockLeaderboard,
  generateMockGameStats,
} from '../../utils/mockData';

export function BestieHome() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const episodes = getMockEpisodes();
  const challenges = getMockChallenges().filter(c => c.difficulty !== 'hard');
  const trending = getMockTrendingContent();
  const leaderboard = getMockLeaderboard();
  const gameStats = generateMockGameStats(user.id);

  // Personalized recommendations
  const recommendations = [
    {
      id: 'rec_1',
      title: 'Summer Essentials Collection',
      description: 'Curated picks based on your style preferences',
      likes: 2430,
      views: 12500,
      emoji: '☀️',
    },
    {
      id: 'rec_2',
      title: 'Bold & Confident Looks',
      description: 'High-impact outfits trending in your style tribe',
      likes: 1890,
      views: 9300,
      emoji: '💪',
    },
    {
      id: 'rec_3',
      title: 'Cozy Casual Styling',
      description: 'Comfort meets style - your personality shines through',
      likes: 3120,
      views: 15600,
      emoji: '🛋️',
    },
    {
      id: 'rec_4',
      title: 'Creator Collaboration Picks',
      description: 'Handpicked by creators you follow',
      likes: 2650,
      views: 13200,
      emoji: '✨',
    },
  ];

  // Creator suggestions (full access now!)
  const creatorSuggestions = [
    {
      id: 'creator_1',
      name: 'Luna Style Guide',
      followers: 125000,
      bio: 'Fashion guru & trend setter',
      expertise: 'Street Style',
      emoji: '👗',
    },
    {
      id: 'creator_2',
      name: 'Marcus Fashion',
      followers: 89000,
      bio: 'Luxury & minimalist styling',
      expertise: 'Sophisticated',
      emoji: '🎩',
    },
    {
      id: 'creator_3',
      name: 'Zara Creates',
      followers: 156000,
      bio: 'Eco-friendly fashion focus',
      expertise: 'Sustainable',
      emoji: '🌿',
    },
  ];

  // Chart data
  const weeklyEngagement = [
    { name: 'Mon', value: 240, target: 200 },
    { name: 'Tue', value: 380, target: 200 },
    { name: 'Wed', value: 320, target: 200 },
    { name: 'Thu', value: 450, target: 200 },
    { name: 'Fri', value: 420, target: 200 },
    { name: 'Sat', value: 380, target: 200 },
    { name: 'Sun', value: 280, target: 200 },
  ];

  const monthlyProgress = [
    { name: 'Week 1', value: 2100 },
    { name: 'Week 2', value: 2800 },
    { name: 'Week 3', value: 3200 },
    { name: 'Week 4', value: 3850 },
  ];

  return (
    <MainLayout
      tier={user.tier}
      username={user.name}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <div className="space-y-8 pb-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user.name}! 👋</h1>
          <p className="text-gray-300 text-lg">
            Your personalized Lalaverse awaits. Explore unlimited full episodes, advanced styling tools, and exclusive creator content.
          </p>
        </div>

        {/* Key Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Challenges Completed"
              value={gameStats.challengesCompleted}
              trend={{ value: 12, positive: true }}
              icon="🏆"
            />
            <StatCard
              title="Prime Coins Earned"
              value={gameStats.coins.toLocaleString()}
              trend={{ value: 8, positive: true }}
              icon="💎"
            />
            <StatCard
              title="Current Streak"
              value={`${gameStats.streak} days`}
              trend={{ value: 5, positive: true }}
              icon="🔥"
            />
            <StatCard
              title="Creator Followers"
              value="12"
              trend={{ value: 3, positive: true }}
              icon="👥"
            />
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Personalized for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform">{rec.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-2">{rec.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{rec.description}</p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>❤️ {(rec.likes / 1000).toFixed(1)}K</span>
                  <span>👁️ {(rec.views / 1000).toFixed(1)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Your Engagement This Week</h2>
          <ChartContainer height={300}>
            <SimpleBarChart data={weeklyEngagement} dataKey="value" />
          </ChartContainer>
        </div>

        {/* Progress Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Monthly Progress</h2>
          <ChartContainer height={300}>
            <SimpleLineChart data={monthlyProgress} dataKey="value" />
          </ChartContainer>
        </div>

        {/* Full Episodes Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">✨ Full Episodes (Bestie Exclusive)</h2>
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <p className="text-cyan-300 text-sm">
              🎉 As a Bestie member, you have unlimited access to ALL full episodes. No paywalls, no restrictions!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {episodes.slice(0, 3).map((ep) => (
              <ContentCard
                key={ep.id}
                title={ep.title}
                views={ep.views}
                likes={ep.likes}
                emoji="🎬"
                description={`${ep.duration} • ${ep.quality}`}
              />
            ))}
          </div>
        </div>

        {/* Creator Suggestions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">👥 Creators You Should Follow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creatorSuggestions.map((creator) => (
              <div
                key={creator.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="text-4xl mb-3">{creator.emoji}</div>
                <h3 className="text-lg font-bold text-white mb-1">{creator.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{creator.bio}</p>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="default">{creator.expertise}</Badge>
                  <span className="text-gray-400 text-sm">{(creator.followers / 1000).toFixed(0)}K</span>
                </div>
                <Button variant="primary" size="sm" className="w-full">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Community Highlights */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🌟 Community Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">Weekly Challenge: Rainbow Vibes 🌈</h3>
                <p className="text-gray-300 text-sm mb-4">
                  1,247 Besties completed this week's color challenge. Show your vibrant side!
                </p>
                <Button variant="secondary" size="sm">
                  Join Challenge
                </Button>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">Trending This Week 🔥</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Minimalist Elegance is trending! 856 new styles uploaded. Be part of the movement!
                </p>
                <Button variant="secondary" size="sm">
                  Explore Trending
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🏆 Community Leaderboard</h2>
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <Leaderboard entries={leaderboard.slice(0, 5)} />
              <Button variant="ghost" className="w-full mt-4">
                View Full Leaderboard →
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default BestieHome;
