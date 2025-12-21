/**
 * Structured Logging Utility for Lambda Functions
 * 
 * ⚠️ SECURITY: Never log full events, PII, or secrets in production
 * 
 * Best Practices:
 * - Log only requestId, operation name, result status, errors
 * - Hash or redact user IDs/emails
 * - Never log tokens, credentials, or user data
 * - Use structured format for CloudWatch parsing
 */

export interface LogLevel {
  DEBUG: "DEBUG";
  INFO: "INFO";
  WARN: "WARN";
  ERROR: "ERROR";
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

export interface StructuredLog {
  level: string;
  timestamp: string;
  requestId?: string;
  operation?: string;
  userId?: string; // hashed, never raw sub
  status?: string;
  message: string;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Hash a user ID (sub) for logging (not cryptographic, just obfuscation)
 */
function hashUserId(sub: string): string {
  // Simple hash: just use first 8 chars + last 4
  if (!sub || sub.length < 12) return "xxxxx";
  return `${sub.substring(0, 4)}...${sub.substring(sub.length - 4)}`;
}

/**
 * Create a structured log entry
 */
function makeLog(
  level: string,
  message: string,
  options: {
    requestId?: string;
    operation?: string;
    userId?: string;
    status?: string;
    error?: any;
    details?: Record<string, any>;
  } = {},
): StructuredLog {
  const hashedUserId = options.userId ? hashUserId(options.userId) : undefined;

  return {
    level,
    timestamp: new Date().toISOString(),
    requestId: options.requestId,
    operation: options.operation,
    userId: hashedUserId,
    status: options.status,
    message,
    error: options.error instanceof Error ? options.error.message : String(options.error),
    details: options.details,
  };
}

/**
 * Logger instance for lambda functions
 */
export class LambdaLogger {
  private requestId?: string;
  private operation?: string;
  private userId?: string;

  constructor(options: { requestId?: string; operation?: string; userId?: string } = {}) {
    this.requestId = options.requestId;
    this.operation = options.operation;
    this.userId = options.userId;
  }

  debug(message: string, details?: Record<string, any>) {
    const log = makeLog(LOG_LEVELS.DEBUG, message, {
      requestId: this.requestId,
      operation: this.operation,
      userId: this.userId,
      details,
    });
    if (process.env.NODE_ENV !== "prod" && process.env.NODE_ENV !== "production") {
      console.log(JSON.stringify(log));
    }
  }

  info(message: string, options: { status?: string; details?: Record<string, any> } = {}) {
    const log = makeLog(LOG_LEVELS.INFO, message, {
      requestId: this.requestId,
      operation: this.operation,
      userId: this.userId,
      status: options.status,
      details: options.details,
    });
    console.log(JSON.stringify(log));
  }

  warn(message: string, options: { error?: any; details?: Record<string, any> } = {}) {
    const log = makeLog(LOG_LEVELS.WARN, message, {
      requestId: this.requestId,
      operation: this.operation,
      userId: this.userId,
      error: options.error,
      details: options.details,
    });
    console.warn(JSON.stringify(log));
  }

  error(message: string, options: { error?: any; details?: Record<string, any> } = {}) {
    const log = makeLog(LOG_LEVELS.ERROR, message, {
      requestId: this.requestId,
      operation: this.operation,
      userId: this.userId,
      error: options.error,
      details: options.details,
    });
    console.error(JSON.stringify(log));
  }

  /**
   * Log operation result (success/failure)
   */
  logResult(status: "success" | "failure" | "error", message: string, error?: any) {
    const logLevel = status === "success" ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const log = makeLog(logLevel, message, {
      requestId: this.requestId,
      operation: this.operation,
      userId: this.userId,
      status,
      error,
    });
    if (logLevel === LOG_LEVELS.INFO) {
      console.log(JSON.stringify(log));
    } else {
      console.error(JSON.stringify(log));
    }
  }
}

/**
 * Extract request context from Lambda event
 */
export function extractRequestContext(event: any): {
  requestId: string;
  userId?: string;
} {
  const requestId =
    event.requestContext?.requestId ||
    event.requestContext?.awsRequestId ||
    event.headers?.["x-amzn-requestid"] ||
    "unknown";

  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.jwt?.claims?.sub ||
    undefined;

  return { requestId, userId };
}
