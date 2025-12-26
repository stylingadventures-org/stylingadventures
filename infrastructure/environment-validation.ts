/**
 * Environment Validation Utility
 * Ensures all required environment variables are present at startup
 */

export interface EnvConfig {
  // AWS
  AWS_REGION: string;
  AWS_ACCOUNT_ID: string;

  // AppSync & GraphQL
  APPSYNC_API_ID: string;
  APPSYNC_API_KEY: string;
  APPSYNC_ENDPOINT: string;

  // Cognito
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_REGION: string;

  // DynamoDB
  DYNAMODB_ENDPOINT?: string; // Optional for local testing
  USERS_TABLE: string;
  CLOSETS_TABLE: string;
  EPISODES_TABLE: string;
  COMMENTS_TABLE: string;
  NOTIFICATIONS_TABLE: string;

  // S3
  S3_BUCKET: string;
  S3_REGION: string;

  // Feature Flags
  ENABLE_2FA: string;
  ENABLE_VIDEO_TRANSCODING: string;
  ENABLE_ELASTICSEARCH: string;
  ENABLE_REDIS_CACHE: string;

  // URLs
  FRONTEND_URL: string;
  API_URL: string;

  // Email
  SES_FROM_EMAIL?: string;

  // Monitoring
  SENTRY_DSN?: string;
  DATADOG_API_KEY?: string;

  // Environment
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateEnvironment(): EnvConfig {
  const required: (keyof EnvConfig)[] = [
    'AWS_REGION',
    'AWS_ACCOUNT_ID',
    'APPSYNC_API_ID',
    'APPSYNC_ENDPOINT',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'COGNITO_REGION',
    'USERS_TABLE',
    'CLOSETS_TABLE',
    'EPISODES_TABLE',
    'COMMENTS_TABLE',
    'NOTIFICATIONS_TABLE',
    'S3_BUCKET',
    'S3_REGION',
    'FRONTEND_URL',
    'API_URL',
    'NODE_ENV',
    'LOG_LEVEL',
  ];

  const missing: string[] = [];
  const config: any = {};

  // Check required variables
  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      config[key] = value;
    }
  }

  // Add optional variables
  const optional = [
    'DYNAMODB_ENDPOINT',
    'ENABLE_2FA',
    'ENABLE_VIDEO_TRANSCODING',
    'ENABLE_ELASTICSEARCH',
    'ENABLE_REDIS_CACHE',
    'SES_FROM_EMAIL',
    'SENTRY_DSN',
    'DATADOG_API_KEY',
  ];

  for (const key of optional) {
    const value = process.env[key];
    if (value) {
      config[key] = value;
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missing
      .map((v) => `  - ${v}`)
      .join('\n')}`;
    throw new Error(errorMessage);
  }

  // Validate values
  validateValues(config);

  return config as EnvConfig;
}

/**
 * Validates environment variable values
 */
function validateValues(config: any): void {
  const validNodeEnvs = ['development', 'staging', 'production', 'test'];
  if (!validNodeEnvs.includes(config.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${config.NODE_ENV}. Must be one of: ${validNodeEnvs.join(', ')}`
    );
  }

  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.LOG_LEVEL)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${config.LOG_LEVEL}. Must be one of: ${validLogLevels.join(', ')}`
    );
  }

  // Validate URLs
  if (!isValidUrl(config.FRONTEND_URL)) {
    throw new Error(`Invalid FRONTEND_URL: ${config.FRONTEND_URL}`);
  }

  if (!isValidUrl(config.API_URL)) {
    throw new Error(`Invalid API_URL: ${config.API_URL}`);
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment configuration with validation
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

export default getEnvConfig;
