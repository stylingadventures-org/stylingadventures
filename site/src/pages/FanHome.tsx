/**
 * FAN Tier - Home Page
 * Brand vision: "Where Style Becomes an Adventure"
 * Experience: Portal hero + "Today in LaLaVerse" + Closet preview + Creator District feed vibe
 */

import React, { useMemo, useState } from 'react';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
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

  // “Today in LaLaVerse” highlights (mocked from your existing data)
  const todayHighlights = useMemo(() => {
    const ep = episodes?.[0];
    const ch = challenges?.[0];
    const hot = trending?.[0];

    return [
      {
        id: 'episode',
        emoji: '🎬',
        title: 'New Episode Drop',
        subtitle: ep?.title || 'Latest Episode',
        actionLabel: 'Watch',
      },
      {
        id: 'challenge',
        emoji: '🎮',
        title: 'Style Challenge',
        subtitle: ch?.title || 'Daily Challenge',
        actionLabel: 'Play',
      },
      {
        id: 'spotlight',
        emoji: '🌟',
        title: 'Creator Spotlight',
        subtitle: hot?.title || 'Featured Creator',
        actionLabel: 'Explore',
      },
      {
        id: 'closet',
        emoji: '👗',
        title: "Lala’s Closet",
        subtitle: 'Heart looks to shape drops',
        actionLabel: 'Style',
      },
    ];
  }, [episodes, challenges, trending]);

  const handleHighlightClick = (id: string) => {
    // Wire these to your routes later (or to your navigation handler)
    // Keeping it lightweight for now.
    // Example: if you have router, you can use navigate here.
    console.log('highlight click', id);
  };

  return (
    <>
      {/* PORTAL HERO */}
      <div className="mb-8 rounded-2xl p-8 text-white bg-gradient-to-r from-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white/20 blur-2xl" />
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-sm font-bold tracking-wide opacity-95 mb-3">
              ✨ Where Style Becomes an Adventure
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
              Hi {user.name}, welcome back bestie 💜
            </h1>

            <p className="text-lg opacity-95 mb-6 max-w-xl">
              Watch the story, play the looks, and explore what’s trending in LaLaVerse today.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="lg">
                Watch Latest Episode
              </Button>
              <Button variant="ghost" size="lg">
                Play Style Lab
              </Button>
              <Button variant="ghost" size="lg">
                Explore Creators
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                🎬 New drops weekly
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                💕 Vote with hearts
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                🌍 Explore creator worlds
              </span>
            </div>
          </div>

          {/* Lala presence (simple placeholder block; swap with avatar image later) */}
          <div className="hidden lg:block">
            <div className="bg-white/15 border border-white/20 rounded-2xl p-6">
              <div className="text-5xl mb-3">👩🏽‍🎤</div>
              <div className="font-extrabold text-xl">Lala says:</div>
              <div className="opacity-95 mt-1">
                “Pick a path today — an episode, a challenge, or a creator spot. I’ll meet you there ✨”
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY IN LALAVERSE */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Today in LaLaVerse</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Quick highlights — tap one to jump in.
            </p>
          </div>
          <Badge variant="info">New ✨</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayHighlights.map((h) => (
            <Card
              key={h.id}
              hoverable
              className="p-4 cursor-pointer"
              onClick={() => handleHighlightClick(h.id)}
            >
              <div className="flex items-center justify-between">
                <div className="text-3xl">{h.emoji}</div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {h.actionLabel}
                </span>
              </div>
              <div className="mt-3 font-extrabold">{h.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{h.subtitle}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* STATS ROW (keep, but slightly more “reward loop”) */}
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

      {/* FEATURED EPISODE (more “drop” framing) */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">🔥 Latest Drop</h2>
            <p className="text-gray-600 dark:text-gray-400">Watch the newest episode and unlock today’s vibes.</p>
          </div>
          <Badge variant="success">Featured</Badge>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 bg-gradient-to-br from-purple-200 to-pink-200 aspect-video md:aspect-auto flex items-center justify-center text-6xl">
              {episodes[0]?.thumbnail}
            </div>

            <div className="md:col-span-2 p-6">
              <h3 className="text-2xl font-extrabold mb-2">{episodes[0]?.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{episodes[0]?.description}</p>

              <div className="flex gap-4 mb-5 text-sm flex-wrap">
                <span>👁️ {episodes[0]?.views?.toLocaleString()} views</span>
                <span>❤️ {episodes[0]?.likes?.toLocaleString()} likes</span>
                <span>🎬 {Math.round((episodes[0]?.duration || 0) / 60)} min</span>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button variant="primary" size="lg">
                  Watch Episode
                </Button>
                <Button variant="tertiary" size="lg">
                  See All Episodes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* CHALLENGES + WEEKLY ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">🎮 Style Challenges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenges.slice(0, 4).map((challenge) => (
              <Card key={challenge.id} hoverable className="p-4">
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{challenge.emoji}</div>
                  <Badge
                    variant={
                      challenge.difficulty === 'easy'
                        ? 'success'
                        : challenge.difficulty === 'medium'
                        ? 'info'
                        : challenge.difficulty === 'hard'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {challenge.difficulty}
                  </Badge>
                </div>

                <h4 className="font-extrabold text-lg mt-2 mb-1">{challenge.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{challenge.description}</p>

                <div className="flex justify-between items-center mb-3">
                  <span className="font-extrabold text-purple-600">+{challenge.reward} pts</span>
                  <span className="text-xs text-gray-500">Daily reward</span>
                </div>

                <Button variant="primary" size="sm" className="w-full">
                  Start Challenge
                </Button>
              </Card>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="tertiary" size="lg" className="w-full">
              View All Challenges →
            </Button>
          </div>
        </div>

        <div>
          <ChartContainer title="Your Weekly Activity">
            <SimpleBarChart data={weeklyActivity} color="#8B5CF6" />
          </ChartContainer>
        </div>
      </div>

      {/* CREATOR DISTRICT FEED + TRENDING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">🌍 From the Creator District</h2>
          <div className="space-y-3">
            {trending.slice(0, 5).map((item) => (
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

        <div>
          <h2 className="text-2xl font-bold mb-4">🏆 Top Players This Week</h2>
          <Card>
            <Leaderboard entries={leaderboard} />
          </Card>
        </div>
      </div>

      {/* UPGRADE CTA (gentle, but exciting) */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-3">Unlock more with Bestie Tier ✨</h2>
          <p className="text-lg opacity-95 mb-6">
            Full episodes, exclusive styling tutorials, Scene Club access, Trend Studio, and deeper LaLaVerse areas.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" size="lg">
              Upgrade to Bestie →
            </Button>
            <Button variant="ghost" size="lg">
              See Bestie Perks
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FanHome;
