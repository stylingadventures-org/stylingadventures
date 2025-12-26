/**
 * Phase 1 Enhanced Authentication
 * Implements 2FA, session timeout, password reset, and advanced security
 */

import { createLogger } from '../../infrastructure/logger';
import { createAPIError, ErrorCode } from '../../infrastructure/error-codes';
import { passwordResetLimiter } from '../../infrastructure/rate-limiter';

const logger = createLogger('Auth');

/**
 * Session configuration
 */
export interface SessionConfig {
  accessTokenTTL: number; // in seconds, default 1 hour
  refreshTokenTTL: number; // in seconds, default 30 days
  idleTimeout: number; // in seconds, default 30 minutes
  absoluteTimeout: number; // in seconds, default 24 hours
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  accessTokenTTL: 3600, // 1 hour
  refreshTokenTTL: 2592000, // 30 days
  idleTimeout: 1800, // 30 minutes
  absoluteTimeout: 86400, // 24 hours
};

/**
 * 2FA Configuration
 */
export interface TwoFactorConfig {
  enabled: boolean;
  method: 'sms' | 'totp' | 'email'; // SMS, Time-based OTP, or Email
  issuer: string;
  backupCodesCount: number;
}

/**
 * User Session
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  mfaVerified: boolean;
  ipAddress: string;
  userAgent: string;
}

/**
 * 2FA Setup
 */
export interface TwoFactorSetup {
  userId: string;
  method: 'sms' | 'totp' | 'email';
  secret: string; // For TOTP
  phoneNumber?: string; // For SMS
  email?: string; // For Email
  backupCodes: string[];
  verifiedAt?: number;
  enabled: boolean;
}

/**
 * Password Reset Request
 */
export interface PasswordResetRequest {
  token: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * Session Manager
 */
export class SessionManager {
  private sessions = new Map<string, UserSession>();
  private config: SessionConfig;

  constructor(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.config = config;
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Create a new session
   */
  createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string
  ): UserSession {
    const sessionId = this.generateSessionId();
    const now = Date.now() / 1000;

    const session: UserSession = {
      sessionId,
      userId,
      accessToken,
      refreshToken,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.absoluteTimeout,
      mfaVerified: false,
      ipAddress,
      userAgent,
    };

    this.sessions.set(sessionId, session);
    logger.info(`Session created for user ${userId}`, { sessionId });

    return session;
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      logger.warn('Session not found', { sessionId });
      return null;
    }

    const now = Date.now() / 1000;

    // Check absolute timeout
    if (now > session.expiresAt) {
      this.sessions.delete(sessionId);
      logger.info('Session expired', { sessionId });
      return null;
    }

    // Check idle timeout
    if (now - session.lastActivityAt > this.config.idleTimeout) {
      this.sessions.delete(sessionId);
      logger.info('Session idle timeout', { sessionId });
      return null;
    }

    // Update last activity
    session.lastActivityAt = now;

    return session;
  }

  /**
   * Mark session as MFA verified
   */
  markMFAVerified(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.mfaVerified = true;
      logger.info('Session MFA verified', { sessionId });
    }
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      logger.info(`Session revoked for user ${session.userId}`, { sessionId });
    }
  }

  /**
   * Revoke all sessions for a user
   */
  revokeAllUserSessions(userId: string): void {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    logger.info(`Revoked ${count} sessions for user ${userId}`);
  }

  /**
   * Get active sessions for a user
   */
  getUserSessions(userId: string): UserSession[] {
    const sessions: UserSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now() / 1000;
    let count = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    if (count > 0) {
      logger.debug(`Cleaned up ${count} expired sessions`);
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    totalSessions: number;
    sessionsPerUser: number;
    oldestSession: number | null;
  } {
    const sessions = Array.from(this.sessions.values());

    return {
      totalSessions: sessions.length,
      sessionsPerUser: sessions.length > 0 ? sessions.length / new Set(sessions.map((s) => s.userId)).size : 0,
      oldestSession:
        sessions.length > 0 ? Math.min(...sessions.map((s) => s.createdAt)) : null,
    };
  }
}

/**
 * Password Reset Manager
 */
export class PasswordResetManager {
  private requests = new Map<string, PasswordResetRequest>();
  private requestTTL = 30 * 60; // 30 minutes

  /**
   * Create password reset request
   */
  createResetRequest(userId: string, email: string): PasswordResetRequest {
    // Rate limit password resets
    if (!passwordResetLimiter.isAllowed({ email })) {
      throw createAPIError(ErrorCode.RATE_LIMIT_EXCEEDED);
    }

    const token = this.generateToken();
    const now = Date.now() / 1000;

    const request: PasswordResetRequest = {
      token,
      userId,
      email,
      createdAt: now,
      expiresAt: now + this.requestTTL,
      used: false,
    };

    this.requests.set(token, request);
    logger.info(`Password reset requested for user ${userId}`);

    return request;
  }

  /**
   * Validate reset token
   */
  validateToken(token: string): PasswordResetRequest | null {
    const request = this.requests.get(token);

    if (!request) {
      logger.warn('Password reset token not found', { token });
      return null;
    }

    const now = Date.now() / 1000;

    // Check expiration
    if (now > request.expiresAt) {
      this.requests.delete(token);
      logger.warn('Password reset token expired');
      return null;
    }

    // Check if already used
    if (request.used) {
      logger.warn('Password reset token already used');
      return null;
    }

    return request;
  }

  /**
   * Mark token as used
   */
  markUsed(token: string): void {
    const request = this.requests.get(token);
    if (request) {
      request.used = true;
      logger.info(`Password reset completed for user ${request.userId}`);
    }
  }

  /**
   * Generate reset token
   */
  private generateToken(): string {
    return `reset_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

/**
 * 2FA Manager
 */
export class TwoFactorManager {
  private setups = new Map<string, TwoFactorSetup>();

  /**
   * Setup 2FA for user
   */
  setupTwoFactor(
    userId: string,
    method: 'sms' | 'totp' | 'email',
    destination: string
  ): TwoFactorSetup {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    const setup: TwoFactorSetup = {
      userId,
      method,
      secret,
      enabled: false,
      backupCodes,
    };

    if (method === 'sms') {
      setup.phoneNumber = destination;
    } else if (method === 'email') {
      setup.email = destination;
    }

    this.setups.set(userId, setup);
    logger.info(`2FA setup initiated for user ${userId}`, { method });

    return setup;
  }

  /**
   * Enable 2FA
   */
  enableTwoFactor(userId: string): TwoFactorSetup | null {
    const setup = this.setups.get(userId);

    if (!setup) {
      return null;
    }

    setup.enabled = true;
    setup.verifiedAt = Date.now() / 1000;
    logger.info(`2FA enabled for user ${userId}`);

    return setup;
  }

  /**
   * Disable 2FA
   */
  disableTwoFactor(userId: string): void {
    this.setups.delete(userId);
    logger.info(`2FA disabled for user ${userId}`);
  }

  /**
   * Get 2FA setup
   */
  getSetup(userId: string): TwoFactorSetup | undefined {
    return this.setups.get(userId);
  }

  /**
   * Use backup code
   */
  useBackupCode(userId: string, code: string): boolean {
    const setup = this.setups.get(userId);

    if (!setup) {
      return false;
    }

    const index = setup.backupCodes.indexOf(code);
    if (index !== -1) {
      setup.backupCodes.splice(index, 1);
      logger.info(`Backup code used for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Generate secret for TOTP
   */
  private generateSecret(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(`${Math.random().toString(36).substr(2, 8)}`);
    }
    return codes;
  }
}

export default {
  SessionManager,
  PasswordResetManager,
  TwoFactorManager,
  DEFAULT_SESSION_CONFIG,
};
