/**
 * Phase 2 - Advanced Creator Cabinet Features
 * Bulk upload, AI tagging, asset organization, versioning
 */

import { createLogger } from '../infrastructure/logger';
import { createAPIError, ErrorCode } from '../infrastructure/error-codes';
import { uploadLimiter } from '../infrastructure/rate-limiter';

const logger = createLogger('CreatorCabinet');

/**
 * Asset with metadata
 */
export interface Asset {
  id: string;
  userId: string;
  name: string;
  type: 'outfit' | 'accessory' | 'hairstyle' | 'tip';
  url: string;
  thumbnailUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: number;
  version: number;
  tags: string[];
  category?: string;
  colors?: string[];
  style?: string;
  metadata?: Record<string, any>;
  isArchived: boolean;
}

/**
 * Asset version tracking
 */
export interface AssetVersion {
  assetId: string;
  version: number;
  url: string;
  uploadedAt: number;
  archivedAt?: number;
  comment?: string;
}

/**
 * Asset category (auto-detected by AI)
 */
export interface AssetCategory {
  primary: string;
  confidence: number;
  alternatives: Array<{ name: string; confidence: number }>;
}

/**
 * Bulk upload job
 */
export interface BulkUploadJob {
  jobId: string;
  userId: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  errors: Array<{ file: string; error: string }>;
  results?: Array<{
    filename: string;
    assetId?: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Creator Cabinet Manager
 */
export class CreatorCabinetManager {
  private assets = new Map<string, Asset>();
  private versions = new Map<string, AssetVersion[]>();
  private bulkJobs = new Map<string, BulkUploadJob>();
  private duplicateIndex = new Map<string, string>(); // hash -> assetId

  /**
   * Add asset to cabinet
   */
  addAsset(
    userId: string,
    name: string,
    type: Asset['type'],
    url: string,
    thumbnailUrl: string,
    fileSize: number,
    mimeType: string,
    tags: string[] = [],
    category?: string,
    colors?: string[]
  ): Asset {
    // Rate limit uploads
    if (!uploadLimiter.isAllowed({ userId })) {
      throw createAPIError(ErrorCode.RATE_LIMIT_EXCEEDED);
    }

    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now() / 1000;

    const asset: Asset = {
      id: assetId,
      userId,
      name,
      type,
      url,
      thumbnailUrl,
      fileSize,
      mimeType,
      uploadedAt: now,
      version: 1,
      tags: tags.map((t) => t.toLowerCase()),
      category,
      colors,
      isArchived: false,
    };

    this.assets.set(assetId, asset);

    // Track version
    const version: AssetVersion = {
      assetId,
      version: 1,
      url,
      uploadedAt: now,
    };

    this.versions.set(assetId, [version]);

    logger.info(`Asset added for user ${userId}`, {
      assetId,
      type,
      size: fileSize,
    });

    return asset;
  }

  /**
   * Update asset with new version
   */
  updateAssetVersion(
    assetId: string,
    url: string,
    thumbnailUrl: string,
    fileSize: number,
    comment?: string
  ): Asset | null {
    const asset = this.assets.get(assetId);

    if (!asset) {
      return null;
    }

    // Archive old version
    const versions = this.versions.get(assetId) || [];
    versions.forEach((v) => {
      v.archivedAt = Date.now() / 1000;
    });

    const now = Date.now() / 1000;
    asset.version += 1;
    asset.url = url;
    asset.thumbnailUrl = thumbnailUrl;
    asset.fileSize = fileSize;

    // Track new version
    const newVersion: AssetVersion = {
      assetId,
      version: asset.version,
      url,
      uploadedAt: now,
      comment,
    };

    versions.push(newVersion);

    logger.info(`Asset version updated`, {
      assetId,
      newVersion: asset.version,
    });

    return asset;
  }

  /**
   * Tag asset with AI-detected categories
   */
  autoTagAsset(
    assetId: string,
    category: AssetCategory,
    colors: string[],
    style: string
  ): Asset | null {
    const asset = this.assets.get(assetId);

    if (!asset) {
      return null;
    }

    asset.category = category.primary;
    asset.colors = colors;
    asset.style = style;
    asset.tags.push(category.primary, style, ...colors);
    asset.tags = [...new Set(asset.tags)]; // Remove duplicates

    logger.info(`Asset auto-tagged`, {
      assetId,
      category: category.primary,
      confidence: category.confidence,
    });

    return asset;
  }

  /**
   * Check for duplicate assets
   */
  checkDuplicate(assetHash: string): string | null {
    return this.duplicateIndex.get(assetHash) || null;
  }

  /**
   * Register asset hash to prevent duplicates
   */
  registerAssetHash(assetHash: string, assetId: string): void {
    this.duplicateIndex.set(assetHash, assetId);
  }

  /**
   * Search assets by tag
   */
  searchByTag(userId: string, tag: string): Asset[] {
    const results: Asset[] = [];

    for (const asset of this.assets.values()) {
      if (
        asset.userId === userId &&
        !asset.isArchived &&
        asset.tags.includes(tag.toLowerCase())
      ) {
        results.push(asset);
      }
    }

    return results;
  }

  /**
   * Search assets by category
   */
  searchByCategory(userId: string, category: string): Asset[] {
    const results: Asset[] = [];

    for (const asset of this.assets.values()) {
      if (
        asset.userId === userId &&
        !asset.isArchived &&
        asset.category === category
      ) {
        results.push(asset);
      }
    }

    return results;
  }

  /**
   * Get all assets for user
   */
  getUserAssets(
    userId: string,
    filters?: {
      type?: Asset['type'];
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    }
  ): { assets: Asset[]; total: number } {
    let results: Asset[] = [];

    for (const asset of this.assets.values()) {
      if (asset.userId === userId) {
        if (!filters?.includeArchived && asset.isArchived) {
          continue;
        }

        if (filters?.type && asset.type !== filters.type) {
          continue;
        }

        results.push(asset);
      }
    }

    // Sort by upload date descending
    results.sort((a, b) => b.uploadedAt - a.uploadedAt);

    const total = results.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    return {
      assets: results.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Archive asset (soft delete)
   */
  archiveAsset(assetId: string): Asset | null {
    const asset = this.assets.get(assetId);

    if (!asset) {
      return null;
    }

    asset.isArchived = true;

    logger.info(`Asset archived`, { assetId });

    return asset;
  }

  /**
   * Permanently delete asset
   */
  deleteAsset(assetId: string): boolean {
    const deleted = this.assets.delete(assetId);

    if (deleted) {
      this.versions.delete(assetId);
      logger.info(`Asset permanently deleted`, { assetId });
    }

    return deleted;
  }

  /**
   * Get asset versions
   */
  getAssetVersions(assetId: string): AssetVersion[] {
    return this.versions.get(assetId) || [];
  }

  /**
   * Rollback to previous version
   */
  rollbackToVersion(assetId: string, version: number): Asset | null {
    const asset = this.assets.get(assetId);
    const versions = this.versions.get(assetId);

    if (!asset || !versions) {
      return null;
    }

    const targetVersion = versions.find((v) => v.version === version);

    if (!targetVersion) {
      return null;
    }

    asset.url = targetVersion.url;
    asset.version = version;

    logger.info(`Asset rolled back`, { assetId, version });

    return asset;
  }

  /**
   * Create bulk upload job
   */
  createBulkJob(userId: string, fileCount: number): BulkUploadJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: BulkUploadJob = {
      jobId,
      userId,
      createdAt: Date.now() / 1000,
      status: 'pending',
      totalFiles: fileCount,
      processedFiles: 0,
      failedFiles: 0,
      errors: [],
    };

    this.bulkJobs.set(jobId, job);

    logger.info(`Bulk upload job created`, {
      jobId,
      fileCount,
    });

    return job;
  }

  /**
   * Update bulk job progress
   */
  updateBulkJobProgress(
    jobId: string,
    success: boolean,
    filename: string,
    assetId?: string,
    error?: string
  ): BulkUploadJob | null {
    const job = this.bulkJobs.get(jobId);

    if (!job) {
      return null;
    }

    job.processedFiles += 1;

    if (success) {
      if (!job.results) job.results = [];
      job.results.push({
        filename,
        assetId,
        success: true,
      });
    } else {
      job.failedFiles += 1;
      job.errors.push({ file: filename, error: error || 'Unknown error' });
    }

    // Check if complete
    if (job.processedFiles === job.totalFiles) {
      job.status =
        job.failedFiles === 0 ? 'completed' : 'failed';
    } else {
      job.status = 'processing';
    }

    return job;
  }

  /**
   * Get bulk job status
   */
  getBulkJobStatus(jobId: string): BulkUploadJob | null {
    return this.bulkJobs.get(jobId) || null;
  }

  /**
   * Get user stats
   */
  getUserStats(userId: string): {
    totalAssets: number;
    assetsByType: Record<Asset['type'], number>;
    totalStorageUsed: number;
    tagCloud: Record<string, number>;
  } {
    const assets = Array.from(this.assets.values()).filter(
      (a) => a.userId === userId && !a.isArchived
    );

    const stats = {
      totalAssets: assets.length,
      assetsByType: {
        outfit: 0,
        accessory: 0,
        hairstyle: 0,
        tip: 0,
      },
      totalStorageUsed: 0,
      tagCloud: {} as Record<string, number>,
    };

    for (const asset of assets) {
      stats.assetsByType[asset.type] += 1;
      stats.totalStorageUsed += asset.fileSize;

      for (const tag of asset.tags) {
        stats.tagCloud[tag] = (stats.tagCloud[tag] || 0) + 1;
      }
    }

    return stats;
  }
}

export default CreatorCabinetManager;
