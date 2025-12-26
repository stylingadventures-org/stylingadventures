/**
 * Phase 3 - Advanced Fashion Game Features
 * Difficulty levels, achievements, seasonal challenges, leaderboard caching
 */

import { createLogger } from '../../infrastructure/logger';

const logger = createLogger('FashionGame');

/**
 * Difficulty level
 */
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

/**
 * Challenge with difficulty
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  emoji: string;
  difficulty: DifficultyLevel;
  requiredColors: string[];
  requiredStyles: string[];
  timeLimit?: number; // in seconds
  baseReward: number;
  maxScore: number;
  seasonalId?: string;
  category: 'regular' | 'seasonal' | 'timed';
  createdAt: number;
}

/**
 * Achievement badge
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: string; // How to earn it
  unlockedAt?: number;
}

/**
 * Seasonal challenge
 */
export interface SeasonalChallenge {
  seasonId: string;
  name: string;
  description: string;
  theme: string;
  startDate: number;
  endDate: number;
  challenges: Challenge[];
  rewards: Record<string, number>; // position -> reward
  leaderboard: Array<{
    userId: string;
    score: number;
    completedAt: number;
  }>;
}

/**
 * User score for a challenge
 */
export interface ChallengeScore {
  userId: string;
  challengeId: string;
  score: number;
  completedAt: number;
  timeSpent: number;
  difficulty: DifficultyLevel;
  timeBonusPercent: number;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  totalChallenges: number;
  averageScore: number;
  lastUpdated: number;
}

/**
 * Game stats for a user
 */
export interface UserGameStats {
  userId: string;
  totalScore: number;
  level: number;
  xp: number;
  coins: number;
  challengesCompleted: number;
  achievementsUnlocked: Achievement[];
  favoriteTheme: string;
  winRate: number;
  lastPlayedAt: number;
}

/**
 * Fashion Game Manager
 */
export class FashionGameManager {
  private challenges = new Map<string, Challenge>();
  private scores = new Map<string, ChallengeScore[]>();
  private leaderboard: LeaderboardEntry[] = [];
  private achievements = new Map<string, Achievement>();
  private userAchievements = new Map<string, Set<string>>();
  private seasonalChallenges = new Map<string, SeasonalChallenge>();
  private gameStats = new Map<string, UserGameStats>();

  constructor() {
    // Update leaderboard every 5 minutes
    setInterval(() => this.updateLeaderboard(), 5 * 60 * 1000);
  }

  /**
   * Create a challenge
   */
  createChallenge(
    title: string,
    description: string,
    theme: string,
    emoji: string,
    difficulty: DifficultyLevel,
    requiredColors: string[],
    requiredStyles: string[],
    baseReward: number = 100,
    timeLimit?: number,
    seasonalId?: string
  ): Challenge {
    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const challenge: Challenge = {
      id: challengeId,
      title,
      description,
      theme,
      emoji,
      difficulty,
      requiredColors,
      requiredStyles,
      timeLimit,
      baseReward,
      maxScore: this.calculateMaxScore(difficulty, baseReward),
      seasonalId,
      category: seasonalId ? 'seasonal' : 'regular',
      createdAt: Date.now() / 1000,
    };

    this.challenges.set(challengeId, challenge);

    logger.info(`Challenge created`, {
      challengeId,
      difficulty,
      category: challenge.category,
    });

    return challenge;
  }

  /**
   * Create seasonal challenge set
   */
  createSeasonalChallenge(
    name: string,
    description: string,
    theme: string,
    startDate: number,
    endDate: number,
    challengeCount: number = 5
  ): SeasonalChallenge {
    const seasonId = `season_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const challenges: Challenge[] = [];
    const difficulties: DifficultyLevel[] = [
      DifficultyLevel.EASY,
      DifficultyLevel.MEDIUM,
      DifficultyLevel.HARD,
      DifficultyLevel.EXPERT,
      DifficultyLevel.MEDIUM,
    ];

    // Create tiered challenges
    for (let i = 0; i < Math.min(challengeCount, difficulties.length); i++) {
      const challenge = this.createChallenge(
        `${name} - Level ${i + 1}`,
        `${description} (Seasonal)`,
        theme,
        '🎨',
        difficulties[i],
        this.generateRandomColors(2 + i),
        this.generateRandomStyles(2),
        100 * (i + 1),
        300 + i * 100,
        seasonId
      );

      challenges.push(challenge);
    }

    const seasonal: SeasonalChallenge = {
      seasonId,
      name,
      description,
      theme,
      startDate,
      endDate,
      challenges,
      rewards: {
        '1': 500,
        '2': 300,
        '3': 200,
        '4': 100,
        '5': 50,
      },
      leaderboard: [],
    };

    this.seasonalChallenges.set(seasonId, seasonal);

    logger.info(`Seasonal challenge created`, {
      seasonId,
      challengeCount: challenges.length,
    });

    return seasonal;
  }

  /**
   * Submit challenge score
   */
  submitScore(
    userId: string,
    challengeId: string,
    score: number,
    timeSpent: number,
    difficulty: DifficultyLevel
  ): ChallengeScore {
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Calculate time bonus
    const timeBonus = this.calculateTimeBonus(timeSpent, challenge.timeLimit);

    // Adjust score based on difficulty
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const finalScore = Math.floor(score * difficultyMultiplier * (1 + timeBonus / 100));

    const challengeScore: ChallengeScore = {
      userId,
      challengeId,
      score: finalScore,
      completedAt: Date.now() / 1000,
      timeSpent,
      difficulty,
      timeBonusPercent: timeBonus,
    };

    // Store score
    if (!this.scores.has(userId)) {
      this.scores.set(userId, []);
    }

    this.scores.get(userId)!.push(challengeScore);

    // Update user stats
    this.updateUserStats(userId, challenge, finalScore);

    // Check achievements
    this.checkAchievements(userId);

    logger.info(`Challenge score submitted`, {
      userId,
      challengeId,
      score: finalScore,
      difficulty,
    });

    return challengeScore;
  }

  /**
   * Get challenge recommendations for user
   */
  getRecommendedChallenges(userId: string, limit: number = 5): Challenge[] {
    const userStats = this.gameStats.get(userId);
    let targetDifficulty = DifficultyLevel.MEDIUM;

    if (userStats) {
      if (userStats.winRate > 0.8) {
        targetDifficulty = DifficultyLevel.HARD;
      } else if (userStats.winRate < 0.5) {
        targetDifficulty = DifficultyLevel.EASY;
      }
    }

    const challenges = Array.from(this.challenges.values())
      .filter((c) => c.difficulty === targetDifficulty)
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);

    return challenges;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(
    limit: number = 100,
    offset: number = 0,
    timeframe: 'all-time' | 'monthly' | 'weekly' = 'all-time'
  ): LeaderboardEntry[] {
    // Filter leaderboard by timeframe
    const cutoffTime =
      timeframe === 'weekly'
        ? Date.now() / 1000 - 7 * 24 * 60 * 60
        : timeframe === 'monthly'
          ? Date.now() / 1000 - 30 * 24 * 60 * 60
          : 0;

    return this.leaderboard
      .filter((entry) => entry.lastUpdated > cutoffTime)
      .slice(offset, offset + limit);
  }

  /**
   * Get user rank
   */
  getUserRank(userId: string): number {
    return (
      this.leaderboard.findIndex((entry) => entry.userId === userId) + 1
    );
  }

  /**
   * Create achievement
   */
  createAchievement(
    name: string,
    description: string,
    icon: string,
    rarity: 'common' | 'rare' | 'epic' | 'legendary',
    condition: string
  ): Achievement {
    const achievementId = `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const achievement: Achievement = {
      id: achievementId,
      name,
      description,
      icon,
      rarity,
      condition,
    };

    this.achievements.set(achievementId, achievement);

    logger.info(`Achievement created`, {
      achievementId,
      rarity,
    });

    return achievement;
  }

  /**
   * Unlock achievement for user
   */
  unlockAchievement(userId: string, achievementId: string): Achievement | null {
    const achievement = this.achievements.get(achievementId);

    if (!achievement) {
      return null;
    }

    if (!this.userAchievements.has(userId)) {
      this.userAchievements.set(userId, new Set());
    }

    const userAchievements = this.userAchievements.get(userId)!;

    if (userAchievements.has(achievementId)) {
      return achievement; // Already unlocked
    }

    userAchievements.add(achievementId);
    achievement.unlockedAt = Date.now() / 1000;

    logger.info(`Achievement unlocked`, {
      userId,
      achievementId,
      name: achievement.name,
    });

    return achievement;
  }

  /**
   * Get user achievements
   */
  getUserAchievements(userId: string): Achievement[] {
    const achievementIds = this.userAchievements.get(userId) || new Set();

    return Array.from(achievementIds)
      .map((id) => this.achievements.get(id))
      .filter((a) => a !== undefined) as Achievement[];
  }

  /**
   * Get user game stats
   */
  getUserStats(userId: string): UserGameStats | null {
    return this.gameStats.get(userId) || null;
  }

  /**
   * Get user scores
   */
  getUserScores(userId: string, limit: number = 50): ChallengeScore[] {
    const scores = this.scores.get(userId) || [];

    return scores
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  }

  // Private helper methods

  private calculateMaxScore(difficulty: DifficultyLevel, baseReward: number): number {
    const multiplier = this.getDifficultyMultiplier(difficulty);
    return Math.floor(baseReward * multiplier * 1.5); // 50% bonus with time
  }

  private getDifficultyMultiplier(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 1;
      case DifficultyLevel.MEDIUM:
        return 1.5;
      case DifficultyLevel.HARD:
        return 2;
      case DifficultyLevel.EXPERT:
        return 3;
    }
  }

  private calculateTimeBonus(timeSpent: number, timeLimit?: number): number {
    if (!timeLimit) return 0;

    const ratio = timeSpent / timeLimit;

    if (ratio <= 0.5) return 50; // 50% bonus if done in half the time
    if (ratio <= 0.75) return 25; // 25% bonus
    if (ratio < 1) return 10; // 10% bonus

    return 0; // No bonus if exceeded time limit
  }

  private generateRandomColors(count: number): string[] {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
    return colors.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private generateRandomStyles(count: number): string[] {
    const styles = ['casual', 'formal', 'sporty', 'bohemian', 'preppy', 'streetwear'];
    return styles.sort(() => Math.random() - 0.5).slice(0, count);
  }

  private updateUserStats(userId: string, challenge: Challenge, score: number): void {
    if (!this.gameStats.has(userId)) {
      this.gameStats.set(userId, {
        userId,
        totalScore: 0,
        level: 1,
        xp: 0,
        coins: 0,
        challengesCompleted: 0,
        achievementsUnlocked: [],
        favoriteTheme: '',
        winRate: 0,
        lastPlayedAt: Date.now() / 1000,
      });
    }

    const stats = this.gameStats.get(userId)!;

    stats.totalScore += score;
    stats.coins += challenge.baseReward;
    stats.xp += Math.floor(score / 10);
    stats.challengesCompleted += 1;
    stats.lastPlayedAt = Date.now() / 1000;
    stats.level = Math.floor(stats.xp / 1000) + 1;

    // Update favorite theme
    const themeCounts = new Map<string, number>();
    for (const s of this.scores.get(userId) || []) {
      const c = this.challenges.get(s.challengeId);
      if (c) {
        themeCounts.set(c.theme, (themeCounts.get(c.theme) || 0) + 1);
      }
    }

    let maxCount = 0;
    for (const [theme, count] of themeCounts) {
      if (count > maxCount) {
        maxCount = count;
        stats.favoriteTheme = theme;
      }
    }
  }

  private checkAchievements(userId: string): void {
    const stats = this.gameStats.get(userId);
    if (!stats) return;

    // Example achievements
    if (stats.challengesCompleted === 1) {
      this.unlockAchievement(userId, 'first_challenge');
    }
    if (stats.challengesCompleted === 10) {
      this.unlockAchievement(userId, 'ten_challenges');
    }
    if (stats.winRate > 0.9) {
      this.unlockAchievement(userId, 'perfect_record');
    }
  }

  private updateLeaderboard(): void {
    const entries: LeaderboardEntry[] = [];

    for (const [userId, stats] of this.gameStats) {
      const scores = this.scores.get(userId) || [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          : 0;

      entries.push({
        rank: 0, // Will be set after sort
        userId,
        score: stats.totalScore,
        totalChallenges: stats.challengesCompleted,
        averageScore: avgScore,
        lastUpdated: Date.now() / 1000,
      });
    }

    // Sort by score
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.leaderboard = entries;
  }
}

export default FashionGameManager;
