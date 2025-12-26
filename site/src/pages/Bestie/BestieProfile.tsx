/**
 * BESTIE Tier - Profile Page
 * Features: User profile, settings, privacy controls, account management
 */

import React, { useState } from 'react';
import { Card, StatCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { MainLayout } from '../../components/Layout';

export function BestieProfile() {
  const [currentPage, setCurrentPage] = useState('profile');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [currentUser] = useState({
    id: 'bestie_123',
    name: 'Sarah',
    tier: 'bestie' as const,
  });

  const [editMode, setEditMode] = useState(false);

  // Profile data
  const profileData = {
    avatar: '👩‍🦰',
    name: 'Sarah',
    username: '@sarah_styles',
    bio: 'Fashion enthusiast | Sustainable style advocate | BESTIE member 💚',
    joinDate: 'January 15, 2024',
    style: 'Minimalist & Sustainable',
    location: 'Portland, OR',
    website: 'sarahstyles.com',
  };

  // Profile stats
  const profileStats = {
    followers: 3240,
    following: 856,
    posts: 156,
    likes: 45320,
    saves: 12450,
    challenges: 34,
  };

  // Achievements
  const achievements = [
    { id: 'ach_1', name: 'Early Adopter', emoji: '⚡', earned: true },
    { id: 'ach_2', name: 'Trendsetter', emoji: '🔥', earned: true },
    { id: 'ach_3', name: 'Community Hero', emoji: '🦸', earned: true },
    { id: 'ach_4', name: 'Master Styler', emoji: '👑', earned: false },
    { id: 'ach_5', name: 'Eco Champion', emoji: '🌿', earned: true },
    { id: 'ach_6', name: 'Challenge Champion', emoji: '🏆', earned: false },
  ];

  // Followers
  const topFollowers = [
    { id: 'f_1', name: 'Luna Style Guide', avatar: '👑', followers: 125000 },
    { id: 'f_2', name: 'Marcus Fashion', avatar: '👨‍🦱', followers: 89000 },
    { id: 'f_3', name: 'Emma S.', avatar: '👩‍🦰', followers: 4200 },
  ];

  // Settings options
  const settings = [
    {
      category: 'Privacy & Safety',
      options: [
        { label: 'Public Profile', status: true },
        { label: 'Allow Comments', status: true },
        { label: 'Allow DMs from Anyone', status: false },
        { label: 'Show Activity Status', status: true },
      ],
    },
    {
      category: 'Notifications',
      options: [
        { label: 'Story Replies', status: true },
        { label: 'Comment Notifications', status: true },
        { label: 'Follow Notifications', status: false },
        { label: 'Challenge Updates', status: true },
      ],
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
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-8 border border-cyan-500/30">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{profileData.avatar}</div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{profileData.name}</h1>
                <p className="text-gray-300 text-lg">{profileData.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success">Bestie Member</Badge>
                  <Badge variant="default">{profileData.location}</Badge>
                </div>
              </div>
            </div>
            {editMode ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
          <p className="text-gray-300 mb-4">{profileData.bio}</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>🌐 {profileData.website}</span>
            <span>📅 Joined {profileData.joinDate}</span>
            <span>✨ Style: {profileData.style}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Followers"
            value={`${(profileStats.followers / 1000).toFixed(1)}k`}
            trend={{ value: 8, positive: true }}
            icon="👥"
          />
          <StatCard
            title="Following"
            value={`${(profileStats.following / 100).toFixed(0)}k`}
            trend={{ value: 0, positive: false }}
            icon="👁️"
          />
          <StatCard
            title="Posts"
            value={profileStats.posts}
            trend={{ value: 5, positive: true }}
            icon="📸"
          />
          <StatCard
            title="Likes"
            value={`${(profileStats.likes / 1000).toFixed(0)}k`}
            trend={{ value: 12, positive: true }}
            icon="❤️"
          />
          <StatCard
            title="Saves"
            value={`${(profileStats.saves / 1000).toFixed(0)}k`}
            trend={{ value: 6, positive: true }}
            icon="💾"
          />
          <StatCard
            title="Challenges"
            value={profileStats.challenges}
            trend={{ value: 3, positive: true }}
            icon="🏆"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700 overflow-x-auto">
          {['overview', 'achievements', 'followers', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-3 border-b-2 transition-all font-medium capitalize ${
                selectedTab === tab
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Bio Section */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">About You</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Bio</label>
                    {editMode ? (
                      <textarea
                        defaultValue={profileData.bio}
                        className="w-full mt-2 bg-gray-700/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500/50"
                        rows={3}
                      />
                    ) : (
                      <p className="text-white mt-2">{profileData.bio}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Location</label>
                      <p className="text-white mt-2">{profileData.location}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Personal Website</label>
                      <p className="text-cyan-300 mt-2">{profileData.website}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Activity Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">Last Active</p>
                    <p className="text-white font-bold">2 minutes ago</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">Member Since</p>
                    <p className="text-white font-bold">{profileData.joinDate}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">Account Status</p>
                    <p className="text-green-400 font-bold">✓ Verified</p>
                  </div>
                  <div className="bg-gray-700/50 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">Tier Status</p>
                    <p className="text-cyan-300 font-bold">💎 Bestie</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Your Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {achievements.map((ach) => (
                <Card
                  key={ach.id}
                  className={`border-2 text-center p-6 transition-all ${
                    ach.earned
                      ? 'bg-amber-600/20 border-amber-500'
                      : 'bg-gray-800/50 border-gray-700 opacity-50'
                  }`}
                >
                  <span className="text-4xl block mb-3">{ach.emoji}</span>
                  <p className="text-white font-bold text-sm">{ach.name}</p>
                  {!ach.earned && <p className="text-gray-400 text-xs mt-2">Locked</p>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Followers Tab */}
        {selectedTab === 'followers' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">👥 Top Followers</h2>
            {topFollowers.map((follower) => (
              <Card key={follower.id} className="bg-gray-800/50 border-gray-700">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{follower.avatar}</span>
                    <div>
                      <p className="text-white font-bold">{follower.name}</p>
                      <p className="text-gray-400 text-sm">{follower.followers.toLocaleString()} followers</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === 'settings' && (
          <div className="space-y-6">
            {settings.map((setting) => (
              <Card key={setting.category} className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{setting.category}</h3>
                  <div className="space-y-3">
                    {setting.options.map((option) => (
                      <div key={option.label} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                        <label className="text-white cursor-pointer">{option.label}</label>
                        <button
                          className={`w-12 h-7 rounded-full transition-all flex items-center ${
                            option.status ? 'bg-cyan-500' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full bg-white transition-transform ${
                              option.status ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}

            {/* Account Actions */}
            <Card className="bg-red-600/20 border border-red-500/30">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full text-left">
                    🔒 Change Password
                  </Button>
                  <Button variant="ghost" className="w-full text-left">
                    📧 Change Email
                  </Button>
                  <Button variant="danger" className="w-full">
                    🗑️ Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default BestieProfile;
