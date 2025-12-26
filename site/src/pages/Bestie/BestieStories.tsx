/**
 * BESTIE Tier - Stories Page
 * Features: Share daily looks, story analytics, story replies from followers
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';
import { ChartContainer, SimpleBarChart } from '../../components/Charts';

export function BestieStories() {
  const [currentPage, setCurrentPage] = useState('stories');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [selectedStory, setSelectedStory] = useState('story_1');

  // Story stats
  const storyStats = {
    totalStories: 156,
    totalViews: 45320,
    avgEngagement: 8.7,
    followers: 3240,
  };

  // Active stories
  const activeStories = [
    {
      id: 'story_1',
      date: 'Today 2:30 PM',
      outfit: 'Coffee Shop Casual',
      thumbnail: '☕',
      views: 1240,
      replies: 34,
      saves: 128,
      likes: 456,
      duration: '24h',
    },
    {
      id: 'story_2',
      date: 'Today 10:15 AM',
      outfit: 'Work Fit Check',
      thumbnail: '💼',
      views: 2340,
      replies: 67,
      saves: 245,
      likes: 890,
      duration: '24h',
    },
    {
      id: 'story_3',
      date: 'Yesterday 6:45 PM',
      outfit: 'Evening Vibes',
      thumbnail: '✨',
      views: 3120,
      replies: 89,
      saves: 340,
      likes: 1250,
      duration: 'Expired',
    },
  ];

  // Story replies (direct messages via stories)
  const storyReplies = [
    {
      id: 'reply_1',
      from: 'Emma S.',
      avatar: '👩‍🦰',
      text: 'OMG that outfit is perfection! Where did you get the jacket?',
      timestamp: '2 mins ago',
      liked: false,
    },
    {
      id: 'reply_2',
      from: 'Alex M.',
      avatar: '👨‍🦱',
      text: 'The color coordination is insane 🔥',
      timestamp: '8 mins ago',
      liked: false,
    },
    {
      id: 'reply_3',
      from: 'Jordan T.',
      avatar: '👩‍🦳',
      text: 'I tried this combo today and got so many compliments!',
      timestamp: '15 mins ago',
      liked: true,
    },
  ];

  // Story templates
  const storyTemplates = [
    {
      id: 'template_1',
      name: 'OOTD (Outfit of the Day)',
      emoji: '👗',
      description: 'Share your daily look with full details',
      uses: 45,
    },
    {
      id: 'template_2',
      name: 'Thrift Haul',
      emoji: '🛍️',
      description: 'Showcase your thrifted finds with try-ons',
      uses: 32,
    },
    {
      id: 'template_3',
      name: 'Before & After',
      emoji: '🔄',
      description: 'Style transformation or styling same pieces differently',
      uses: 28,
    },
    {
      id: 'template_4',
      name: 'Question for Followers',
      emoji: '❓',
      description: 'Ask followers to vote or choose your outfit',
      uses: 42,
    },
    {
      id: 'template_5',
      name: 'Styling Challenge',
      emoji: '⚡',
      description: 'Challenge followers to style the same item',
      uses: 35,
    },
    {
      id: 'template_6',
      name: 'Behind the Scenes',
      emoji: '🎬',
      description: 'Show your styling process or prep routine',
      uses: 26,
    },
  ];

  // Recent reactions
  const reactions = [
    { emoji: '❤️', count: 456, label: 'Loves' },
    { emoji: '🔥', count: 234, label: 'Fire' },
    { emoji: '😍', count: 189, label: 'Amazing' },
    { emoji: '💯', count: 156, label: 'Perfect' },
    { emoji: '✨', count: 123, label: 'Gorgeous' },
  ];

  // Story metrics over time
  const storyMetrics = [
    { name: 'Mon', views: 240, replies: 15, saves: 24 },
    { name: 'Tue', views: 380, replies: 28, saves: 45 },
    { name: 'Wed', views: 320, replies: 22, saves: 38 },
    { name: 'Thu', views: 450, replies: 35, saves: 52 },
    { name: 'Fri', views: 420, replies: 31, saves: 48 },
    { name: 'Sat', views: 380, replies: 26, saves: 41 },
    { name: 'Sun', views: 280, replies: 18, saves: 32 },
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
          <h1 className="text-4xl font-bold text-white mb-2">📱 Your Stories</h1>
          <p className="text-gray-300 text-lg">
            Share your daily looks, get feedback from followers, and track engagement metrics.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Stories"
            value={storyStats.totalStories}
            trend={{ value: 8, positive: true }}
            icon="📸"
          />
          <StatCard
            title="Total Views"
            value={`${(storyStats.totalViews / 1000).toFixed(1)}k`}
            trend={{ value: 15, positive: true }}
            icon="👁️"
          />
          <StatCard
            title="Avg. Engagement"
            value={`${storyStats.avgEngagement}%`}
            trend={{ value: 2, positive: true }}
            icon="💬"
          />
          <StatCard
            title="Followers"
            value={`${(storyStats.followers / 1000).toFixed(1)}k`}
            trend={{ value: 12, positive: true }}
            icon="👥"
          />
        </div>

        {/* Create Story */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">📸 Create New Story</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button variant="primary" className="py-6 text-lg">
              📷 Upload Photo
            </Button>
            <Button variant="primary" className="py-6 text-lg">
              🎥 Record Video
            </Button>
          </div>
          <p className="text-purple-300 text-sm">
            💡 Tip: Stories posted between 6-9 PM get 35% more engagement on average
          </p>
        </div>

        {/* Active Stories */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">🔴 Active Stories (Next 24h)</h2>
          <div className="space-y-3">
            {activeStories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedStory === story.id
                    ? 'bg-cyan-500/20 border-cyan-500'
                    : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">{story.thumbnail}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{story.outfit}</h3>
                      <p className="text-gray-400 text-sm">{story.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <span>👁️ {story.views.toLocaleString()}</span>
                    <span>💬 {story.replies}</span>
                    <span>💾 {story.saves}</span>
                    <Badge variant="default">{story.duration}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Story Details */}
        {selectedStory && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Story Preview */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Story Preview</h2>
                  <div className="bg-gradient-to-b from-gray-700 to-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
                    <span className="text-6xl">
                      {activeStories.find((s) => s.id === selectedStory)?.thumbnail}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded p-4">
                      <p className="text-gray-400 text-sm mb-1">Total Views</p>
                      <p className="text-2xl font-bold text-cyan-300">
                        {activeStories.find((s) => s.id === selectedStory)?.views.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-4">
                      <p className="text-gray-400 text-sm mb-1">Direct Replies</p>
                      <p className="text-2xl font-bold text-cyan-300">
                        {activeStories.find((s) => s.id === selectedStory)?.replies}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-4">
                      <p className="text-gray-400 text-sm mb-1">Saves</p>
                      <p className="text-2xl font-bold text-cyan-300">
                        {activeStories.find((s) => s.id === selectedStory)?.saves}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded p-4">
                      <p className="text-gray-400 text-sm mb-1">Likes</p>
                      <p className="text-2xl font-bold text-cyan-300">
                        {activeStories.find((s) => s.id === selectedStory)?.likes}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Reactions */}
              <Card className="bg-gray-800/50 border-gray-700 mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Reactions</h3>
                  <div className="flex flex-wrap gap-3">
                    {reactions.map((reaction) => (
                      <div key={reaction.emoji} className="bg-gray-700/50 rounded-full px-4 py-2 flex items-center gap-2">
                        <span className="text-2xl">{reaction.emoji}</span>
                        <span className="text-cyan-300 font-bold">{reaction.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Story Replies */}
            <div>
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">💬 Replies ({storyReplies.length})</h3>
                  <div className="space-y-4">
                    {storyReplies.map((reply) => (
                      <div key={reply.id} className="p-4 bg-gray-700/30 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{reply.avatar}</span>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{reply.from}</p>
                            <p className="text-gray-400 text-xs">{reply.timestamp}</p>
                          </div>
                          {reply.liked && <span>❤️</span>}
                        </div>
                        <p className="text-gray-300 text-sm italic">"{reply.text}"</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    View All Replies →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Story Templates */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">📋 Story Templates</h2>
          <p className="text-gray-300 text-sm mb-4">
            Use templates to quickly create engaging stories. These templates are proven to get higher engagement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storyTemplates.map((template) => (
              <Card key={template.id} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer">
                <div className="p-6">
                  <span className="text-4xl block mb-3">{template.emoji}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Used {template.uses} times</span>
                    <Button variant="primary" size="sm">
                      Use
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Weekly Analytics</h2>
          <ChartContainer height={300}>
            <SimpleBarChart data={storyMetrics} dataKey="views" />
          </ChartContainer>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total Views</p>
              <p className="text-2xl font-bold text-cyan-300">2,470</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total Replies</p>
              <p className="text-2xl font-bold text-cyan-300">175</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Total Saves</p>
              <p className="text-2xl font-bold text-cyan-300">280</p>
            </div>
          </div>
        </div>

        {/* Tips for Better Stories */}
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 Tips for Higher Engagement</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-medium">Post consistently</p>
                <p className="text-gray-300 text-sm">Stories posted 5+ times per week get 40% more engagement</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-medium">Optimal posting times</p>
                <p className="text-gray-300 text-sm">6-9 PM gets peak views. Avoid 2-4 AM (lowest engagement)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-medium">Use questions & polls</p>
                <p className="text-gray-300 text-sm">Stories with questions get 3x more replies than static posts</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-medium">Good lighting matters</p>
                <p className="text-gray-300 text-sm">Natural light stories get 25% higher completion rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default BestieStories;
