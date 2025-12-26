/**
 * Structured Logging Utility
 * All logs are output as JSON for easy parsing and aggregation
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;
  private serviceName: string;
  private context: LogContext;

  constructor(
    serviceName: string,
    logLevel: LogLevel = LogLevel.INFO,
    context: LogContext = {}
  ) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(log: StructuredLog): string {
    return JSON.stringify({
      service: this.serviceName,
      ...log,
    });
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context: this.context,
        metadata,
      };
      console.log(this.formatLog(log));
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message,
        context: this.context,
        metadata,
      };
      console.log(this.formatLog(log));
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: LogLevel.WARN,
        message,
        context: this.context,
        metadata,
      };
      console.warn(this.formatLog(log));
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        message,
        context: this.context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        metadata,
      };
      console.error(this.formatLog(log));
    }
  }

  /**
   * Track operation duration
   */
  async trackDuration<T>(
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Operation completed: ${operationName}`, {
        duration,
        success: true,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(
        `Operation failed: ${operationName}`,
        error instanceof Error ? error : new Error(String(error)),
        { duration }
      );
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  createChild(additionalContext: LogContext): Logger {
    const mergedContext = {
      ...this.context,
      ...additionalContext,
    };
    return new Logger(this.serviceName, this.logLevel, mergedContext);
  }

  /**
   * Update context for this logger
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }
}

/**
 * Create a logger instance
 */
export function createLogger(
  serviceName: string,
  logLevel?: LogLevel
): Logger {
  const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
  const level =
    (Object.values(LogLevel).includes(envLogLevel as LogLevel)
      ? (envLogLevel as LogLevel)
      : logLevel) || LogLevel.INFO;

  return new Logger(serviceName, level);
}

export default createLogger;
