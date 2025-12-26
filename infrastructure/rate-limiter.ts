/**
 * Rate Limiting Middleware and Utilities
 * Prevents abuse and DDoS attacks
 */

import { createLogger } from './logger';
import { createAPIError, ErrorCode } from './error-codes';

const logger = createLogger('RateLimiter');

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator: (context: any) => string; // How to generate rate limit key
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
}

export interface RateLimitStore {
  get(key: string): number | undefined;
  set(key: string, value: number): void;
  increment(key: string): number;
  delete(key: string): void;
}

/**
 * In-memory rate limit store
 * For production, consider Redis or DynamoDB
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, number>();
  private timers = new Map<string, NodeJS.Timer>();

  get(key: string): number | undefined {
    return this.store.get(key);
  }

  set(key: string, value: number): void {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    this.store.set(key, value);

    // Auto-cleanup after window
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, 60000); // Keep for 1 minute regardless of window

    this.timers.set(key, timer);
  }

  increment(key: string): number {
    const current = this.get(key) || 0;
    const next = current + 1;
    this.set(key, next);
    return next;
  }

  delete(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    this.store.delete(key);
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(
    config: RateLimitConfig,
    store?: RateLimitStore
  ) {
    this.config = config;
    this.store = store || new InMemoryRateLimitStore();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(context: any): boolean {
    const key = this.config.keyGenerator(context);
    const now = Date.now();

    let record = this.requestCounts.get(key);

    // Reset if window has passed
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.requestCounts.set(key, record);
    }

    record.count++;

    logger.debug(`Rate limit check for ${key}`, {
      count: record.count,
      max: this.config.maxRequests,
      allowed: record.count <= this.config.maxRequests,
    });

    return record.count <= this.config.maxRequests;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(context: any): number {
    const key = this.config.keyGenerator(context);
    const record = this.requestCounts.get(key);
    if (!record) return this.config.maxRequests;
    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Reset rate limit for a key
   */
  reset(context: any): void {
    const key = this.config.keyGenerator(context);
    this.requestCounts.delete(key);
    logger.info(`Rate limit reset for ${key}`);
  }

  /**
   * Get all active keys
   */
  getActiveKeys(): string[] {
    const now = Date.now();
    const keys: string[] = [];

    for (const [key, record] of this.requestCounts.entries()) {
      if (now < record.resetTime) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    activeKeys: number;
    totalRequests: number;
    avgRequestsPerKey: number;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let activeCount = 0;

    for (const record of this.requestCounts.values()) {
      if (now < record.resetTime) {
        activeCount++;
        totalRequests += record.count;
      }
    }

    return {
      activeKeys: activeCount,
      totalRequests,
      avgRequestsPerKey: activeCount > 0 ? totalRequests / activeCount : 0,
    };
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Login attempts: 5 per 15 minutes per IP
export const loginLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  keyGenerator: (context) => `login:${context.ip}`,
});

// API requests: 100 per minute per user
export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyGenerator: (context) => `api:${context.userId || context.ip}`,
});

// GraphQL mutations: 30 per minute per user
export const graphqlMutationLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyGenerator: (context) => `mutation:${context.userId}`,
});

// File uploads: 10 per hour per user
export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: (context) => `upload:${context.userId}`,
});

// Password reset: 3 per hour per email
export const passwordResetLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  keyGenerator: (context) => `password-reset:${context.email}`,
});

export default RateLimiter;
