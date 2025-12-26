/**
 * BESTIE Tier - Achievement Center Page
 * Features: Unlockable achievements, badges, milestones, leaderboards
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart } from '../../components/Charts';

export function AchievementCenter() {
  const [currentPage, setCurrentPage] = useState('achievements');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Achievement stats
  const achievementStats = {
    unlocked: 18,
    total: 45,
    completionRate: 40,
    milestones: 5,
  };

  // Achievement categories
  const categories = [
    { id: 'all', name: 'All Achievements', count: 45, emoji: '🏆' },
    { id: 'posts', name: 'Content Creator', count: 12, emoji: '📸' },
    { id: 'engagement', name: 'Community', count: 10, emoji: '👥' },
    { id: 'styling', name: 'Styling Master', count: 8, emoji: '👗' },
    { id: 'challenges', name: 'Challenger', count: 9, emoji: '⚡' },
    { id: 'social', name: 'Social Butterfly', count: 6, emoji: '🦋' },
  ];

  // Achievements with progress
  const achievements = [
    {
      id: 'ach_1',
      name: 'Welcome to Lalaverse',
      description: 'Create your first account',
      emoji: '👋',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedDate: 'Jan 15, 2024',
      reward: '100 coins',
      category: 'posts',
    },
    {
      id: 'ach_2',
      name: 'First OOTD',
      description: 'Post your first outfit of the day',
      emoji: '👗',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedDate: 'Jan 16, 2024',
      reward: '250 coins',
      category: 'posts',
    },
    {
      id: 'ach_3',
      name: 'Story Teller',
      description: 'Post 10 stories',
      emoji: '📱',
      progress: 10,
      total: 10,
      unlocked: true,
      unlockedDate: 'Feb 1, 2024',
      reward: '500 coins',
      category: 'posts',
    },
    {
      id: 'ach_4',
      name: 'Like Magnet',
      description: 'Get 500 likes total',
      emoji: '❤️',
      progress: 450,
      total: 500,
      unlocked: false,
      progress_percentage: 90,
      reward: '1000 coins',
      category: 'engagement',
    },
    {
      id: 'ach_5',
      name: 'Comment King',
      description: 'Receive 100 comments',
      emoji: '💬',
      progress: 87,
      total: 100,
      unlocked: false,
      progress_percentage: 87,
      reward: '750 coins',
      category: 'engagement',
    },
    {
      id: 'ach_6',
      name: 'Trendsetter',
      description: 'Create a trend that 100+ people use',
      emoji: '🔥',
      progress: 45,
      total: 100,
      unlocked: true,
      unlockedDate: 'Mar 10, 2024',
      reward: '2000 coins',
      category: 'styling',
    },
    {
      id: 'ach_7',
      name: 'Color Master',
      description: 'Complete 15 color theory challenges',
      emoji: '🎨',
      progress: 12,
      total: 15,
      unlocked: false,
      progress_percentage: 80,
      reward: '1500 coins',
      category: 'styling',
    },
    {
      id: 'ach_8',
      name: 'Challenge Champion',
      description: 'Complete 20 styling challenges',
      emoji: '🏆',
      progress: 18,
      total: 20,
      unlocked: false,
      progress_percentage: 90,
      reward: '2500 coins',
      category: 'challenges',
    },
    {
      id: 'ach_9',
      name: 'Social Butterfly',
      description: 'Follow 50 creators',
      emoji: '🦋',
      progress: 48,
      total: 50,
      unlocked: false,
      progress_percentage: 96,
      reward: '1000 coins',
      category: 'social',
    },
  ];

  // Milestone badges
  const milestones = [
    {
      id: 'mile_1',
      name: '100 Followers',
      emoji: '🎉',
      progress: 3240,
      target: 100,
      unlocked: true,
      reward: '5000 coins',
    },
    {
      id: 'mile_2',
      name: '500 Followers',
      emoji: '⭐',
      progress: 3240,
      target: 500,
      unlocked: true,
      reward: '10000 coins',
    },
    {
      id: 'mile_3',
      name: '1K Followers',
      emoji: '👑',
      progress: 3240,
      target: 1000,
      unlocked: true,
      reward: '25000 coins',
    },
    {
      id: 'mile_4',
      name: '5K Followers',
      emoji: '💎',
      progress: 3240,
      target: 5000,
      unlocked: false,
      progress_percentage: 64.8,
      reward: '50000 coins',
    },
    {
      id: 'mile_5',
      name: '10K Followers',
      emoji: '🌟',
      progress: 3240,
      target: 10000,
      unlocked: false,
      progress_percentage: 32.4,
      reward: '100000 coins',
    },
  ];

  // Leaderboard
  const leaderboard = [
    { rank: 1, name: 'Luna Style Guide', achievements: 42, emoji: '👑' },
    { rank: 2, name: 'Marcus Fashion', achievements: 39, emoji: '⭐' },
    { rank: 3, name: 'Zara Creates', achievements: 41, emoji: '👑' },
    { rank: 4, name: 'You', achievements: 18, emoji: '👩', current: true },
    { rank: 5, name: 'Emma S.', achievements: 15, emoji: '👩‍🦰' },
  ];

  // Filter achievements
  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

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
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Achievement Center</h1>
          <p className="text-gray-300 text-lg">
            Unlock badges and milestones. Climb the leaderboard and earn exclusive rewards.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Unlocked"
            value={achievementStats.unlocked}
            trend={{ value: 0, positive: false }}
            icon="🔓"
          />
          <StatCard
            title="Total Available"
            value={achievementStats.total}
            trend={{ value: 0, positive: false }}
            icon="🏆"
          />
          <StatCard
            title="Completion"
            value={`${achievementStats.completionRate}%`}
            trend={{ value: 8, positive: true }}
            icon="📈"
          />
          <StatCard
            title="Milestones"
            value={achievementStats.milestones}
            trend={{ value: 0, positive: false }}
            icon="⭐"
          />
        </div>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Journey</h2>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300">Achievement Completion</span>
              <span className="text-purple-300 font-bold">18 / 45</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full"
                style={{ width: `${achievementStats.completionRate}%` }}
              />
            </div>
          </div>
          <p className="text-purple-300 text-sm">
            🎯 You're on track! Unlock 27 more achievements to become an Achievement Master.
          </p>
        </div>

        {/* Category Filter */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Filter by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                <div className="text-2xl mb-2">{cat.emoji}</div>
                <div className="text-xs font-medium mb-1">{cat.name}</div>
                <div className="text-xs text-gray-400">{cat.count}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((ach) => (
              <Card
                key={ach.id}
                className={`border-2 transition-all ${
                  ach.unlocked
                    ? 'bg-amber-600/20 border-amber-500'
                    : 'bg-gray-800/50 border-gray-700 opacity-75'
                }`}
              >
                <div className="p-6">
                  <div className="text-4xl mb-3">{ach.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{ach.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{ach.description}</p>

                  {ach.unlocked ? (
                    <div className="bg-green-600/20 border border-green-500/30 rounded p-3 mb-3">
                      <p className="text-green-300 text-sm">✓ Unlocked {ach.unlockedDate}</p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {ach.progress} / {ach.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${ach.progress_percentage || (ach.progress / ach.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Reward:</span>
                    <Badge variant="success">{ach.reward}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🎯 Milestones</h2>
          <div className="space-y-4">
            {milestones.map((mile) => (
              <Card key={mile.id} className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{mile.emoji}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{mile.name}</h3>
                        <p className="text-gray-400 text-sm">Reward: {mile.reward}</p>
                      </div>
                    </div>
                    {mile.unlocked && <Badge variant="success">✓ UNLOCKED</Badge>}
                  </div>

                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>
                      {mile.progress.toLocaleString()} / {mile.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                      style={{
                        width: `${mile.unlocked ? 100 : mile.progress_percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">👑 Achievement Leaderboard</h2>
          <Card className="bg-gray-800/50 border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Member</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Achievements</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                      entry.current ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '#'}
                        </span>
                        <span className="text-white font-bold">{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                      {entry.emoji} {entry.name}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{entry.achievements}</td>
                    <td className="py-3 px-4">
                      {entry.current ? (
                        <Badge variant="success">YOU</Badge>
                      ) : (
                        <Badge variant="default">{entry.rank <= 3 ? 'Top 3' : 'Member'}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 Tips to Unlock More Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <p className="text-white font-medium">Post Consistently</p>
                <p className="text-gray-300 text-sm">Daily OOTD posts unlock content creator badges</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-white font-medium">Engage with Community</p>
                <p className="text-gray-300 text-sm">Comments and likes get you social achievements</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-white font-medium">Complete Challenges</p>
                <p className="text-gray-300 text-sm">Styling challenges unlock styling master badges</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-white font-medium">Grow Your Following</p>
                <p className="text-gray-300 text-sm">Milestone badges unlock at 100, 500, 1K followers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default AchievementCenter;
