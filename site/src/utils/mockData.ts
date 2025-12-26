/**
 * Mock Data Generator
 * Generates realistic data for all 6 tiers
 */

export type UserTier = 'fan' | 'bestie' | 'creator' | 'collaborator' | 'admin' | 'prime-studios';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: UserTier;
  joinedAt: Date;
}

export interface MockChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: number;
  timeLimit?: number;
  requiredColors: string[];
  requiredStyles: string[];
}

export interface MockEpisode {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  likes: number;
  createdAt: Date;
  creator: string;
  quality: '360p' | '720p' | '1080p' | '4K';
}

export interface MockGameStats {
  userId: string;
  totalScore: number;
  level: number;
  xp: number;
  coins: number;
  challengesCompleted: number;
  achievements: string[];
  leaderboardRank: number;
  winRate: number;
}

export interface MockCreatorStats {
  userId: string;
  followers: number;
  engagement: number;
  revenue: number;
  episodesCreated: number;
  collaborators: number;
  totalViews: number;
}

const challenges: MockChallenge[] = [
  {
    id: 'challenge_1',
    title: 'Summer Vibes',
    description: 'Create a fun summer outfit with bright colors',
    theme: 'summer',
    emoji: '☀️',
    difficulty: 'easy',
    reward: 100,
    timeLimit: 300,
    requiredColors: ['yellow', 'orange'],
    requiredStyles: ['casual', 'sporty'],
  },
  {
    id: 'challenge_2',
    title: 'Formal Night',
    description: 'Design an elegant evening look',
    theme: 'formal',
    emoji: '✨',
    difficulty: 'medium',
    reward: 250,
    timeLimit: 600,
    requiredColors: ['black', 'gold'],
    requiredStyles: ['formal', 'elegant'],
  },
  {
    id: 'challenge_3',
    title: 'Street Style',
    description: 'Mix high fashion with street wear',
    theme: 'streetwear',
    emoji: '🛹',
    difficulty: 'hard',
    reward: 500,
    timeLimit: 900,
    requiredColors: ['neutral', 'accent'],
    requiredStyles: ['streetwear', 'trendy'],
  },
  {
    id: 'challenge_4',
    title: 'Bohemian Dream',
    description: 'Create a free-spirited bohemian look',
    theme: 'bohemian',
    emoji: '🌸',
    difficulty: 'medium',
    reward: 300,
    timeLimit: 450,
    requiredColors: ['earth tones', 'pastels'],
    requiredStyles: ['bohemian', 'relaxed'],
  },
];

const episodes: MockEpisode[] = [
  {
    id: 'ep_1',
    title: 'Lala Meets the City',
    description: 'Episode 1: Lala arrives in the big city and faces her first styling challenge',
    thumbnail: '🏙️',
    duration: 1200,
    views: 125000,
    likes: 8500,
    createdAt: new Date('2025-12-20'),
    creator: 'Lala',
    quality: '1080p',
  },
  {
    id: 'ep_2',
    title: 'The Closet Awakens',
    description: 'Episode 2: Lala discovers her magical closet',
    thumbnail: '👗',
    duration: 1500,
    views: 98000,
    likes: 7200,
    createdAt: new Date('2025-12-19'),
    creator: 'Lala',
    quality: '1080p',
  },
  {
    id: 'ep_3',
    title: 'The First Transformation',
    description: 'Episode 3: Lala transforms for her first major event',
    thumbnail: '✨',
    duration: 1350,
    views: 110000,
    likes: 8900,
    createdAt: new Date('2025-12-18'),
    creator: 'Lala',
    quality: '1080p',
  },
];

const achievements = [
  { id: 'first_challenge', name: 'First Step', description: 'Complete your first challenge', icon: '🎯' },
  { id: 'ten_challenges', name: 'Fashion Explorer', description: 'Complete 10 challenges', icon: '🚀' },
  { id: 'perfect_style', name: 'Perfect Style', description: 'Achieve 100% score', icon: '👑' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete challenge in half the time', icon: '⚡' },
  { id: 'collector', name: 'Outfit Collector', description: 'Collect 50 outfit pieces', icon: '💎' },
];

export function generateMockUser(tier: UserTier): MockUser {
  const names = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor'];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return {
    id: `user_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email: `${name.toLowerCase()}@lalaverse.com`,
    avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
    tier,
    joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
  };
}

export function generateMockGameStats(userId: string): MockGameStats {
  const level = Math.floor(Math.random() * 50) + 1;
  
  return {
    userId,
    totalScore: Math.floor(Math.random() * 50000) + 1000,
    level,
    xp: level * 1000 + Math.floor(Math.random() * 1000),
    coins: Math.floor(Math.random() * 10000),
    challengesCompleted: Math.floor(Math.random() * 100),
    achievements: achievements.slice(0, Math.floor(Math.random() * achievements.length)),
    leaderboardRank: Math.floor(Math.random() * 1000) + 1,
    winRate: Math.random() * 100,
  };
}

export function generateMockCreatorStats(userId: string): MockCreatorStats {
  return {
    userId,
    followers: Math.floor(Math.random() * 100000) + 1000,
    engagement: Math.random() * 15,
    revenue: Math.floor(Math.random() * 50000) + 1000,
    episodesCreated: Math.floor(Math.random() * 50) + 1,
    collaborators: Math.floor(Math.random() * 20),
    totalViews: Math.floor(Math.random() * 5000000) + 100000,
  };
}

export function getMockChallenges(): MockChallenge[] {
  return challenges;
}

export function getMockEpisodes(): MockEpisode[] {
  return episodes;
}

export function getMockAchievements() {
  return achievements;
}

export function getMockLeaderboard() {
  return Array.from({ length: 100 }, (_, i) => ({
    rank: i + 1,
    name: `Player ${i + 1}`,
    score: Math.floor(Math.random() * 50000) + (100000 - i * 1000),
    challenges: Math.floor(Math.random() * 100),
    avatar: `https://i.pravatar.cc/150?img=${i}`,
  }));
}

export function getMockTrendingContent() {
  return [
    { id: '1', title: 'Summer Fashion Trends', category: 'Fashion', views: 250000, emoji: '👗' },
    { id: '2', title: 'Color Theory for Styling', category: 'Education', views: 180000, emoji: '🎨' },
    { id: '3', title: 'Budget Fashion Hacks', category: 'Lifestyle', views: 320000, emoji: '💰' },
    { id: '4', title: 'Sustainable Style', category: 'Fashion', views: 150000, emoji: '🌱' },
  ];
}

export function getMockAffiliateDeals() {
  return [
    { id: '1', brand: 'ASOS', commission: '12%', status: 'active', impressions: 5000 },
    { id: '2', brand: 'Shein', commission: '8%', status: 'active', impressions: 12000 },
    { id: '3', brand: 'Zara', commission: '10%', status: 'pending', impressions: 2000 },
    { id: '4', brand: 'H&M', commission: '9%', status: 'active', impressions: 8500 },
  ];
}

export function getMockUserCloset() {
  return [
    { id: '1', name: 'Red Summer Dress', type: 'outfit', image: '👗', colors: ['red', 'pink'], likes: 234 },
    { id: '2', name: 'Black Leather Jacket', type: 'accessory', image: '🧥', colors: ['black'], likes: 567 },
    { id: '3', name: 'Gold Heels', type: 'accessory', image: '👠', colors: ['gold', 'yellow'], likes: 345 },
    { id: '4', name: 'Blue Jeans', type: 'outfit', image: '👖', colors: ['blue'], likes: 123 },
  ];
}
