/**
 * Phase 4 - Enhanced Episode Theater Features
 * Video quality tiers, captions, chapters, watch history, recommendations
 */

import { createLogger } from '../../infrastructure/logger';

const logger = createLogger('EpisodeTheater');

/**
 * Video quality tier
 */
export enum VideoQuality {
  LOW = '360p',
  MEDIUM = '720p',
  HIGH = '1080p',
  ULTRA = '4K',
}

/**
 * Caption format
 */
export interface Caption {
  language: string;
  url: string;
  type: 'manual' | 'auto-generated';
  accuracy?: number; // 0-100 for auto-generated
  uploadedAt: number;
}

/**
 * Video chapter for navigation
 */
export interface VideoChapter {
  id: string;
  title: string;
  timestamp: number; // seconds
  thumbnail?: string;
  description?: string;
}

/**
 * Video quality variant
 */
export interface VideoVariant {
  quality: VideoQuality;
  url: string;
  bitrate: number; // kbps
  resolution: { width: number; height: number };
  fileSize: number;
  duration: number;
}

/**
 * Watch history entry
 */
export interface WatchHistory {
  userId: string;
  episodeId: string;
  startedAt: number;
  stoppedAt: number;
  percentWatched: number;
  watchedAt: number;
}

/**
 * Episode with enhanced metadata
 */
export interface EnhancedEpisode {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number; // seconds
  createdAt: number;
  publishedAt?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: 'draft' | 'published' | 'archived';
  
  // Video features
  videoVariants: VideoVariant[];
  captions: Caption[];
  chapters: VideoChapter[];
  
  // Engagement
  reactions: Record<string, number>;
  avgWatchTime: number; // seconds
  completionRate: number; // 0-100
  
  // Metadata
  tags: string[];
  category: string;
  thumbnail_hq?: string;
}

/**
 * Episode Manager
 */
export class EpisodeManager {
  private episodes = new Map<string, EnhancedEpisode>();
  private watchHistory = new Map<string, WatchHistory[]>();
  private userRecommendations = new Map<string, string[]>();

  /**
   * Create episode
   */
  createEpisode(
    creatorId: string,
    title: string,
    description: string,
    thumbnail: string,
    duration: number,
    category: string,
    tags: string[] = []
  ): EnhancedEpisode {
    const episodeId = `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const episode: EnhancedEpisode = {
      id: episodeId,
      creatorId,
      title,
      description,
      thumbnail,
      duration,
      createdAt: Date.now() / 1000,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      status: 'draft',
      videoVariants: [],
      captions: [],
      chapters: [],
      reactions: {},
      avgWatchTime: 0,
      completionRate: 0,
      tags: tags.map((t) => t.toLowerCase()),
      category,
    };

    this.episodes.set(episodeId, episode);

    logger.info(`Episode created`, {
      episodeId,
      creatorId,
      duration,
    });

    return episode;
  }

  /**
   * Add video quality variant
   */
  addVideoVariant(
    episodeId: string,
    quality: VideoQuality,
    url: string,
    bitrate: number,
    resolution: { width: number; height: number },
    fileSize: number
  ): EnhancedEpisode | null {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      return null;
    }

    const variant: VideoVariant = {
      quality,
      url,
      bitrate,
      resolution,
      fileSize,
      duration: episode.duration,
    };

    episode.videoVariants.push(variant);

    logger.info(`Video variant added`, {
      episodeId,
      quality,
      bitrate,
    });

    return episode;
  }

  /**
   * Add captions
   */
  addCaption(
    episodeId: string,
    language: string,
    url: string,
    type: 'manual' | 'auto-generated',
    accuracy?: number
  ): EnhancedEpisode | null {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      return null;
    }

    const caption: Caption = {
      language,
      url,
      type,
      accuracy,
      uploadedAt: Date.now() / 1000,
    };

    episode.captions.push(caption);

    logger.info(`Caption added`, {
      episodeId,
      language,
      type,
    });

    return episode;
  }

  /**
   * Add video chapter
   */
  addChapter(
    episodeId: string,
    title: string,
    timestamp: number,
    description?: string,
    thumbnail?: string
  ): EnhancedEpisode | null {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      return null;
    }

    if (timestamp > episode.duration) {
      throw new Error('Chapter timestamp exceeds video duration');
    }

    const chapterId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const chapter: VideoChapter = {
      id: chapterId,
      title,
      timestamp,
      description,
      thumbnail,
    };

    episode.chapters.push(chapter);

    // Sort chapters by timestamp
    episode.chapters.sort((a, b) => a.timestamp - b.timestamp);

    logger.info(`Chapter added`, {
      episodeId,
      title,
      timestamp,
    });

    return episode;
  }

  /**
   * Record watch history
   */
  recordWatchHistory(
    userId: string,
    episodeId: string,
    watchedDuration: number,
    totalDuration: number
  ): WatchHistory {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      throw new Error('Episode not found');
    }

    const percentWatched = Math.round((watchedDuration / totalDuration) * 100);

    const history: WatchHistory = {
      userId,
      episodeId,
      startedAt: Date.now() / 1000 - watchedDuration,
      stoppedAt: Date.now() / 1000,
      percentWatched,
      watchedAt: Date.now() / 1000,
    };

    if (!this.watchHistory.has(userId)) {
      this.watchHistory.set(userId, []);
    }

    this.watchHistory.get(userId)!.push(history);

    // Update episode stats
    this.updateEpisodeStats(episodeId);

    // Update user recommendations
    this.updateRecommendations(userId, episodeId);

    logger.info(`Watch history recorded`, {
      userId,
      episodeId,
      percentWatched,
    });

    return history;
  }

  /**
   * Get watch history for user
   */
  getUserWatchHistory(
    userId: string,
    limit: number = 50
  ): WatchHistory[] {
    const history = this.watchHistory.get(userId) || [];

    return history
      .sort((a, b) => b.watchedAt - a.watchedAt)
      .slice(0, limit);
  }

  /**
   * Get recommended episodes for user
   */
  getRecommendedEpisodes(
    userId: string,
    limit: number = 10
  ): EnhancedEpisode[] {
    const recommendedIds = this.userRecommendations.get(userId) || [];
    const recommended: EnhancedEpisode[] = [];

    for (const id of recommendedIds) {
      const episode = this.episodes.get(id);
      if (episode && episode.status === 'published') {
        recommended.push(episode);
      }
    }

    return recommended.slice(0, limit);
  }

  /**
   * Get trending episodes
   */
  getTrendingEpisodes(limit: number = 10): EnhancedEpisode[] {
    return Array.from(this.episodes.values())
      .filter((ep) => ep.status === 'published')
      .sort((a, b) => {
        // Trending score: views + engagement
        const scoreA = a.viewCount + a.likeCount * 2 + a.commentCount * 3;
        const scoreB = b.viewCount + b.likeCount * 2 + b.commentCount * 3;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Get episode engagement
   */
  getEpisodeEngagement(
    episodeId: string
  ): {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    avgWatchTime: number;
    completionRate: number;
    engagementRate: number;
  } | null {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      return null;
    }

    const engagementRate =
      episode.viewCount > 0
        ? ((episode.likeCount + episode.commentCount) / episode.viewCount) * 100
        : 0;

    return {
      viewCount: episode.viewCount,
      likeCount: episode.likeCount,
      commentCount: episode.commentCount,
      avgWatchTime: episode.avgWatchTime,
      completionRate: episode.completionRate,
      engagementRate,
    };
  }

  /**
   * Publish episode
   */
  publishEpisode(episodeId: string): EnhancedEpisode | null {
    const episode = this.episodes.get(episodeId);

    if (!episode) {
      return null;
    }

    if (episode.videoVariants.length === 0) {
      throw new Error('Cannot publish episode without video');
    }

    episode.status = 'published';
    episode.publishedAt = Date.now() / 1000;

    logger.info(`Episode published`, {
      episodeId,
      variants: episode.videoVariants.length,
    });

    return episode;
  }

  /**
   * Get episode with optimal quality for device
   */
  getOptimalVariant(
    episodeId: string,
    bandwidth: 'slow' | 'normal' | 'fast'
  ): VideoVariant | null {
    const episode = this.episodes.get(episodeId);

    if (!episode || episode.videoVariants.length === 0) {
      return null;
    }

    const variants = episode.videoVariants.sort((a, b) => a.bitrate - b.bitrate);

    switch (bandwidth) {
      case 'slow':
        return variants[0]; // Lowest quality
      case 'normal':
        return variants[Math.floor(variants.length / 2)]; // Medium quality
      case 'fast':
        return variants[variants.length - 1]; // Highest quality
    }
  }

  // Private helpers

  private updateEpisodeStats(episodeId: string): void {
    const episode = this.episodes.get(episodeId);
    if (!episode) return;

    const historyEntries = Array.from(this.watchHistory.values())
      .flat()
      .filter((h) => h.episodeId === episodeId);

    if (historyEntries.length === 0) return;

    episode.viewCount = historyEntries.length;
    episode.avgWatchTime =
      historyEntries.reduce((sum, h) => sum + (h.stoppedAt - h.startedAt), 0) /
      historyEntries.length;
    episode.completionRate =
      historyEntries.reduce((sum, h) => sum + h.percentWatched, 0) /
      historyEntries.length;
  }

  private updateRecommendations(userId: string, episodeId: string): void {
    const episode = this.episodes.get(episodeId);
    if (!episode) return;

    const recommendations = new Set<string>();

    // Find episodes with similar tags or category
    for (const [id, ep] of this.episodes) {
      if (
        id !== episodeId &&
        ep.status === 'published' &&
        (ep.category === episode.category ||
          ep.tags.some((tag) => episode.tags.includes(tag)))
      ) {
        recommendations.add(id);
      }
    }

    this.userRecommendations.set(userId, Array.from(recommendations));
  }
}

export default EpisodeManager;
