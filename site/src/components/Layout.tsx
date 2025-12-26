/**
 * Reusable UI Components - Layout Components
 */

import React, { useState } from 'react';
import { UserTier } from '../utils/mockData';

interface SidebarProps {
  tier: UserTier;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const tierNavigation: Record<UserTier, Array<{ id: string; label: string; icon: string }>> = {
  fan: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'episodes', label: 'Episodes', icon: '📺' },
    { id: 'styling', label: 'Styling Adventures', icon: '✨' },
    { id: 'closet', label: 'Closet', icon: '👗' },
    { id: 'blog', label: 'Blog', icon: '📝' },
    { id: 'magazine', label: 'Magazine', icon: '📰' },
  ],
  bestie: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'episodes', label: 'Full Episodes', icon: '📺' },
    { id: 'styling', label: 'Styling Studio', icon: '✨' },
    { id: 'closet', label: 'Bestie Closet', icon: '👗' },
    { id: 'scenes', label: 'Scene Club', icon: '🎭' },
    { id: 'trends', label: 'Trend Studio', icon: '🎨' },
    { id: 'stories', label: 'Stories', icon: '📖' },
    { id: 'inbox', label: 'Inbox', icon: '💌' },
    { id: 'bank', label: 'Prime Bank', icon: '🏦' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ],
  creator: [
    { id: 'home', label: 'Creator Home', icon: '🎬' },
    { id: 'studio', label: 'Studio', icon: '🎥' },
    { id: 'episodes', label: 'Episodes', icon: '📺' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'monetization', label: 'Monetization', icon: '💰' },
    { id: 'collaborators', label: 'Collaborators', icon: '👥' },
    { id: 'assets', label: 'Asset Library', icon: '📦' },
    { id: 'inbox', label: 'Messages', icon: '💌' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ],
  collaborator: [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'projects', label: 'Projects', icon: '🎬' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { id: 'home', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'content', label: 'Content', icon: '📺' },
    { id: 'moderation', label: 'Moderation', icon: '⚖️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ],
  'prime-studios': [
    { id: 'home', label: 'Studios Home', icon: '🎬' },
    { id: 'productions', label: 'Productions', icon: '🎞️' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'budget', label: 'Budget', icon: '💼' },
    { id: 'distribution', label: 'Distribution', icon: '🌐' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ],
};

export function Sidebar({ tier, currentPage, onNavigate }: SidebarProps) {
  const navItems = tierNavigation[tier];

  return (
    <aside className="w-sidebar bg-gradient-to-b from-purple-900 to-purple-800 text-white fixed left-0 top-16 bottom-0 overflow-y-auto">
      <nav className="p-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3
              ${currentPage === item.id ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-700'}
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

interface TopNavProps {
  username: string;
  tier: UserTier;
  onLogout: () => void;
}

export function TopNav({ username, tier, onLogout }: TopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const tierColors: Record<UserTier, string> = {
    fan: 'bg-indigo-600',
    bestie: 'bg-cyan-600',
    creator: 'bg-emerald-600',
    collaborator: 'bg-amber-600',
    admin: 'bg-red-600',
    'prime-studios': 'bg-purple-600',
  };

  return (
    <header className="h-topbar bg-white dark:bg-slate-900 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-purple-600">✨ Lala</span>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${tierColors[tier]}`}>
            {tier.toUpperCase()}
          </span>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border">
                <div className="p-4">
                  <p className="font-semibold">{username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tier}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

interface MainLayoutProps {
  tier: UserTier;
  username: string;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function MainLayout({
  tier,
  username,
  currentPage,
  onNavigate,
  onLogout,
  children,
}: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav username={username} tier={tier} onLogout={onLogout} />
      <div className="flex flex-1 pt-topbar">
        <Sidebar tier={tier} currentPage={currentPage} onNavigate={onNavigate} />
        <main className="flex-1 ml-sidebar overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
