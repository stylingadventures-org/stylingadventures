/**
 * FAN Tier - Home Page
 * Features: Featured content, trending, leaderboard teaser, upgrade CTA
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import FanLayout from '../components/FanLayout';
import { ChartContainer, SimpleBarChart } from '../components/Charts';
import { Leaderboard, ContentCard } from '../components/DataDisplay';
import {
  getMockEpisodes,
  getMockChallenges,
  getMockTrendingContent,
  getMockLeaderboard,
  generateMockGameStats,
} from '../utils/mockData';

export function FanHome() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user] = useState({
    id: 'user_123',
    name: 'Sarah',
    tier: 'fan' as const,
  });

  const episodes = getMockEpisodes();
  const challenges = getMockChallenges();
  const trending = getMockTrendingContent();
  const leaderboard = getMockLeaderboard();
  const gameStats = generateMockGameStats(user.id);

  // Prepare chart data
  const weeklyActivity = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 290 },
    { name: 'Wed', value: 200 },
    { name: 'Thu', value: 320 },
    { name: 'Fri', value: 280 },
    { name: 'Sat', value: 150 },
    { name: 'Sun', value: 80 },
  ];

  return (
    <FanLayout currentPage="home">
      {/* Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-lg opacity-90 mb-6">
          Discover new styling challenges, watch exclusive content, and join our fashion community.
        </p>
        <div className="flex gap-4">
          <Button variant="secondary" size="lg">
            Watch Latest Episode
          </Button>
          <Button variant="ghost" size="lg">
            Start Challenge
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Level"
          value={gameStats.level}
          icon="⭐"
          trend={{ value: 2, isPositive: true }}
          color="purple"
        />
        <StatCard
          label="Total Score"
          value={gameStats.totalScore.toLocaleString()}
          icon="🎯"
          trend={{ value: 15, isPositive: true }}
          color="pink"
        />
        <StatCard
          label="Challenges Done"
          value={gameStats.challengesCompleted}
          icon="✨"
          trend={{ value: 8, isPositive: true }}
          color="blue"
        />
        <StatCard
          label="Leaderboard Rank"
          value={`#${gameStats.leaderboardRank}`}
          icon="🏆"
          trend={{ value: 12, isPositive: false }}
          color="emerald"
        />
      </div>

      {/* Featured Episode */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Featured This Week</h2>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 bg-gradient-to-br from-purple-200 to-pink-200 aspect-video md:aspect-auto flex items-center justify-center text-6xl">
              {episodes[0].thumbnail}
            </div>
            <div className="md:col-span-2 p-6">
              <h3 className="text-2xl font-bold mb-2">{episodes[0].title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{episodes[0].description}</p>
              <div className="flex gap-4 mb-4 text-sm">
                <span>👁️ {episodes[0].views.toLocaleString()} views</span>
                <span>❤️ {episodes[0].likes.toLocaleString()} likes</span>
                <span>🎬 {episodes[0].duration / 60}min</span>
              </div>
              <Button variant="primary" size="lg">
                Watch Episode
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Challenges */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Challenges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge) => (
            <Card key={challenge.id} hoverable className="p-4">
              <div className="text-4xl mb-2">{challenge.emoji}</div>
              <h4 className="font-bold text-lg mb-1">{challenge.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{challenge.description}</p>
              <div className="flex justify-between items-center mb-3">
                <Badge variant={
                  challenge.difficulty === 'easy' ? 'success' :
                  challenge.difficulty === 'medium' ? 'info' :
                  challenge.difficulty === 'hard' ? 'warning' : 'danger'
                }>
                  {challenge.difficulty}
                </Badge>
                <span className="font-bold text-purple-600">+{challenge.reward} pts</span>
              </div>
              <Button variant="primary" size="sm" className="w-full">
                Start Challenge
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
          <div className="space-y-3">
            {trending.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                emoji={item.emoji}
                description={item.category}
                views={item.views}
              />
            ))}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div>
          <ChartContainer title="Your Weekly Activity">
            <SimpleBarChart data={weeklyActivity} color="#8B5CF6" />
          </ChartContainer>
        </div>
      </div>

      {/* Leaderboard Teaser */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Top Players This Week</h2>
        <Card>
          <Leaderboard entries={leaderboard} />
        </Card>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-8 text-white">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-3">Unlock More with Bestie Tier ✨</h2>
          <p className="text-lg opacity-90 mb-6">
            Watch FULL episodes, exclusive styling tutorials, participate in scene club, and more!
            Join thousands of fashion enthusiasts in the community.
          </p>
          <Button variant="secondary" size="lg">
            Upgrade to Bestie →
          </Button>
        </div>
      </div>
    </FanLayout>
  );
}

export default FanHome;
