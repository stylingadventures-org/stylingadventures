/**
 * Reusable UI Components - Layout Components
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { UserTier } from '../utils/mockData'

interface SidebarProps {
  tier: UserTier
  currentPage: string
  onNavigate: (page: string) => void
  isOpen: boolean
  onClose: () => void
}

const TOPBAR_HEIGHT = 72 // px
const SIDEBAR_WIDTH = 280 // px

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
}

export function Sidebar({ tier, currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const navItems = tierNavigation[tier]

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed z-50 lg:z-40
          bg-gradient-to-b from-purple-900 to-purple-800 text-white
          overflow-y-auto
          transition-transform duration-200
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          width: SIDEBAR_WIDTH,
          top: TOPBAR_HEIGHT,
          bottom: 0,
          left: 0,
        }}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id)
                onClose()
              }}
              className={`
                w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3
                ${currentPage === item.id ? 'bg-purple-600 shadow-lg' : 'hover:bg-purple-700'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

interface TopNavProps {
  username: string
  tier: UserTier
  onLogout: () => void
  onToggleSidebar: () => void
}

export function TopNav({ username, tier, onLogout, onToggleSidebar }: TopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const tierColors: Record<UserTier, string> = {
    fan: 'bg-indigo-600',
    bestie: 'bg-pink-600',
    creator: 'bg-emerald-600',
    collaborator: 'bg-amber-600',
    admin: 'bg-red-600',
    'prime-studios': 'bg-purple-600',
  }

  return (
    <header
      className="bg-white dark:bg-slate-900 shadow-md fixed top-0 left-0 right-0 z-50"
      style={{ height: TOPBAR_HEIGHT }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-full">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            className="lg:hidden w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 transition flex items-center justify-center"
            onClick={onToggleSidebar}
            aria-label="Open menu"
          >
            ☰
          </button>

          <span className="text-xl sm:text-2xl font-bold text-purple-700">Styling Adventures</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4" ref={menuRef}>
          <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${tierColors[tier]}`}>
            {tier.toUpperCase()}
          </span>

          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 hover:opacity-90 transition"
            aria-label="Profile"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-4 sm:right-6 top-[72px] w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-black/5 overflow-hidden">
              <div className="p-4">
                <p className="font-semibold">{username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tier}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

interface MainLayoutProps {
  tier: UserTier
  username: string
  currentPage: string
  onNavigate: (page: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export function MainLayout({ tier, username, currentPage, onNavigate, onLogout, children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <TopNav
        username={username}
        tier={tier}
        onLogout={onLogout}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <Sidebar
        tier={tier}
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        className="pt-6"
        style={{
          paddingTop: TOPBAR_HEIGHT + 24,
          paddingLeft: 0,
        }}
      >
        {/* Desktop left padding for sidebar */}
        <div
          className="hidden lg:block"
          style={{
            position: 'fixed',
            top: TOPBAR_HEIGHT,
            left: 0,
            width: SIDEBAR_WIDTH,
            bottom: 0,
            pointerEvents: 'none',
          }}
        />
        <div
          className="px-4 sm:px-6 pb-10"
          style={{
            marginLeft: 0,
          }}
        >
          {/* On lg+ screens, add sidebar margin */}
          <div className="lg:ml-[280px]">{children}</div>
        </div>
      </main>
    </div>
  )
}
