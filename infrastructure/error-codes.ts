/**
 * Standardized API Error Codes and Handling
 * All API errors use consistent error codes for client handling
 */

export enum ErrorCode {
  // Authentication (1000-1099)
  UNAUTHORIZED = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  MFA_REQUIRED = 'AUTH_005',
  INVALID_CREDENTIALS = 'AUTH_006',
  SESSION_TIMEOUT = 'AUTH_007',
  ACCOUNT_LOCKED = 'AUTH_008',

  // Validation (2000-2099)
  INVALID_INPUT = 'VAL_001',
  MISSING_REQUIRED_FIELD = 'VAL_002',
  INVALID_EMAIL = 'VAL_003',
  INVALID_PASSWORD = 'VAL_004',
  DUPLICATE_RESOURCE = 'VAL_005',
  RESOURCE_NOT_FOUND = 'VAL_006',
  INVALID_FILE_TYPE = 'VAL_007',
  FILE_TOO_LARGE = 'VAL_008',

  // Rate Limiting (3000-3099)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  TOO_MANY_REQUESTS = 'RATE_002',

  // GraphQL (4000-4099)
  QUERY_COMPLEXITY_EXCEEDED = 'GQL_001',
  INVALID_QUERY = 'GQL_002',
  SUBSCRIPTION_LIMIT_EXCEEDED = 'GQL_003',

  // Database (5000-5099)
  DATABASE_ERROR = 'DB_001',
  TRANSACTION_FAILED = 'DB_002',
  CONSTRAINT_VIOLATION = 'DB_003',

  // External Services (6000-6099)
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  S3_ERROR = 'EXT_002',
  COGNITO_ERROR = 'EXT_003',
  EMAIL_SERVICE_ERROR = 'EXT_004',

  // Server (7000-7099)
  INTERNAL_SERVER_ERROR = 'SRV_001',
  SERVICE_UNAVAILABLE = 'SRV_002',
  TIMEOUT = 'SRV_003',
  DEPENDENCY_ERROR = 'SRV_004',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized. Please log in.',
  [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to access this resource.',
  [ErrorCode.MFA_REQUIRED]: 'Multi-factor authentication is required.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.SESSION_TIMEOUT]: 'Your session timed out. Please log in again.',
  [ErrorCode.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',

  // Validation
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field: {field}',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email address.',
  [ErrorCode.INVALID_PASSWORD]: 'Password does not meet requirements.',
  [ErrorCode.DUPLICATE_RESOURCE]: 'This resource already exists.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found.',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type. Allowed types: {types}',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum of {maxSize}MB.',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down.',

  // GraphQL
  [ErrorCode.QUERY_COMPLEXITY_EXCEEDED]: 'Query is too complex. Please simplify.',
  [ErrorCode.INVALID_QUERY]: 'Invalid GraphQL query.',
  [ErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED]: 'Subscription limit exceeded.',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'Database error occurred.',
  [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
  [ErrorCode.CONSTRAINT_VIOLATION]: 'Operation violates data constraints.',

  // External Services
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error.',
  [ErrorCode.S3_ERROR]: 'File storage error.',
  [ErrorCode.COGNITO_ERROR]: 'Authentication service error.',
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'Email service error.',

  // Server
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An internal server error occurred.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  [ErrorCode.TIMEOUT]: 'Request timed out.',
  [ErrorCode.DEPENDENCY_ERROR]: 'A required service is unavailable.',
};

export interface APIError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  userMessage: string;
  details?: Record<string, any>;
  requestId?: string;
  timestamp: string;
}

/**
 * HTTP Status Code mapping for each error code
 */
const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.MFA_REQUIRED]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_TIMEOUT]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 403,

  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  [ErrorCode.QUERY_COMPLEXITY_EXCEEDED]: 400,
  [ErrorCode.INVALID_QUERY]: 400,
  [ErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED]: 429,

  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,
  [ErrorCode.CONSTRAINT_VIOLATION]: 409,

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.S3_ERROR]: 502,
  [ErrorCode.COGNITO_ERROR]: 502,
  [ErrorCode.EMAIL_SERVICE_ERROR]: 502,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.DEPENDENCY_ERROR]: 503,
};

/**
 * Create a standardized API error
 */
export function createAPIError(
  code: ErrorCode,
  details?: Record<string, any>,
  requestId?: string
): APIError {
  let message = ERROR_MESSAGES[code];

  // Interpolate details into message
  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }

  return {
    code,
    message,
    statusCode: ERROR_STATUS_CODES[code],
    userMessage: message,
    details,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if value is an API error
 */
export function isAPIError(value: any): value is APIError {
  return (
    value &&
    typeof value === 'object' &&
    'code' in value &&
    'message' in value &&
    'statusCode' in value
  );
}

export default {
  ErrorCode,
  ERROR_MESSAGES,
  createAPIError,
  isAPIError,
};
