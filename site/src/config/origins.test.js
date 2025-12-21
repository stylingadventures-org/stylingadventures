/**
 * Tests for CORS origin configuration
 * Ensures allowed origins are validated correctly across environments
 */

import {
  ALLOWED_ORIGINS,
  getAllowedOrigins,
  isOriginAllowed,
  getCORSHeaders,
} from './origins';

describe('CORS Origin Configuration', () => {
  describe('ALLOWED_ORIGINS', () => {
    it('should have development origins', () => {
      expect(ALLOWED_ORIGINS.development).toContain('http://localhost:5173');
      expect(ALLOWED_ORIGINS.development).toContain('http://localhost:3000');
    });

    it('should have staging origins', () => {
      expect(ALLOWED_ORIGINS.staging).toContain(
        'https://staging.stylingadventures.com'
      );
    });

    it('should have production origins', () => {
      expect(ALLOWED_ORIGINS.production).toContain(
        'https://stylingadventures.com'
      );
      expect(ALLOWED_ORIGINS.production).not.toContain('http://localhost:5173');
    });
  });

  describe('isOriginAllowed', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should allow localhost in development', () => {
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    });

    it('should not allow production domains in development', () => {
      expect(isOriginAllowed('https://stylingadventures.com')).toBe(false);
    });

    it('should reject null/undefined origins', () => {
      expect(isOriginAllowed(null)).toBe(false);
      expect(isOriginAllowed(undefined)).toBe(false);
      expect(isOriginAllowed('')).toBe(false);
    });

    it('should reject unknown domains', () => {
      expect(isOriginAllowed('https://evil.com')).toBe(false);
    });
  });

  describe('getCORSHeaders', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return headers for allowed origin', () => {
      const headers = getCORSHeaders('http://localhost:5173');
      expect(headers).not.toBeNull();
      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:5173'
      );
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should return null for disallowed origin', () => {
      const headers = getCORSHeaders('https://evil.com');
      expect(headers).toBeNull();
    });

    it('should include required CORS headers', () => {
      const headers = getCORSHeaders('http://localhost:5173');
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(headers['Access-Control-Allow-Headers']).toBeDefined();
      expect(headers['Access-Control-Max-Age']).toBeDefined();
    });
  });
});
