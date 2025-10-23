/**
 * Frontend Logging and Error Tracking Module
 * 
 * Provides structured logging, error tracking, and monitoring for the frontend application.
 * Supports multiple backends including console, HTTP endpoint, and third-party services.
 */

/**
 * Log levels for frontend logging
 */
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/**
 * Log entry metadata
 */
export interface LogMetadata {
  timestamp?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Error metadata for detailed error tracking
 */
export interface ErrorMetadata extends LogMetadata {
  stack?: string;
  errorCode?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  componentStack?: string;
  errorBoundary?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableErrorTracking: boolean;
  errorTrackingService?: 'applicationinsights' | 'sentry' | 'custom';
  errorTrackingConfig?: Record<string, unknown>;
  sampleRate?: number; // 0-1, percentage of logs to send remotely
  environment?: string;
}

/**
 * Remote log payload
 */
interface RemoteLogPayload {
  level: LogLevel;
  message: string;
  metadata: LogMetadata;
  timestamp: string;
  environment: string;
}

/**
 * Frontend Logger Class
 */
class FrontendLogger {
  private config: LoggerConfig;
  private sessionId: string;
  private errorTracker: unknown;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    
    if (config.enableErrorTracking) {
      this.initializeErrorTracking();
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize error tracking service
   */
  private initializeErrorTracking(): void {
    if (this.config.errorTrackingService === 'applicationinsights') {
      // Initialize Application Insights
      // import { ApplicationInsights } from '@microsoft/applicationinsights-web';
      // this.errorTracker = new ApplicationInsights({ config: this.config.errorTrackingConfig });
      // this.errorTracker.loadAppInsights();
    } else if (this.config.errorTrackingService === 'sentry') {
      // Initialize Sentry
      // import * as Sentry from '@sentry/browser';
      // Sentry.init(this.config.errorTrackingConfig);
      // this.errorTracker = Sentry;
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  /**
   * Check if a log should be sent based on log level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex <= configLevelIndex;
  }

  /**
   * Check if a log should be sampled for remote sending
   */
  private shouldSample(): boolean {
    if (!this.config.sampleRate) return true;
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Enhance metadata with default values
   */
  private enhanceMetadata(metadata?: LogMetadata): LogMetadata {
    return {
      ...metadata,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      environment: this.config.environment || 'development',
    };
  }

  /**
   * Log to console
   */
  private logToConsole(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.config.enableConsole) return;

    const enhancedMeta = this.enhanceMetadata(metadata);
  const logMessage = `[${level.toUpperCase()}] ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage, enhancedMeta);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, enhancedMeta);
        break;
      case LogLevel.INFO:
        console.info(logMessage, enhancedMeta);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage, enhancedMeta);
        break;
    }
  }

  /**
   * Send log to remote endpoint
   */
  private async sendToRemote(level: LogLevel, message: string, metadata?: LogMetadata): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;
    if (!this.shouldSample()) return;

    const payload: RemoteLogPayload = {
      level,
      message,
      metadata: this.enhanceMetadata(metadata),
      timestamp: new Date().toISOString(),
      environment: this.config.environment || 'development',
    };

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Use keepalive to ensure logs are sent even if page is unloading
        keepalive: true,
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
      console.error('Failed to send log to remote endpoint', error);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(level)) return;

    this.logToConsole(level, message, metadata);
    this.sendToRemote(level, message, metadata);
  }

  /**
   * Log error
   */
  public error(message: string, metadata?: ErrorMetadata): void {
    this.log(LogLevel.ERROR, message, metadata);

    // Send to error tracking service
    if (this.config.enableErrorTracking && this.errorTracker) {
      if (this.config.errorTrackingService === 'applicationinsights') {
        // this.errorTracker.trackException({ exception: new Error(message), properties: metadata });
      } else if (this.config.errorTrackingService === 'sentry') {
        // this.errorTracker.captureException(new Error(message), { extra: metadata });
      }
    }
  }

  /**
   * Log warning
   */
  public warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log info
   */
  public info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log debug
   */
  public debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Track user action
   */
  public trackAction(action: string, metadata?: LogMetadata): void {
    this.info(`User Action: ${action}`, { ...metadata, action });
  }

  /**
   * Track page view
   */
  public trackPageView(pageName: string, metadata?: LogMetadata): void {
    this.info(`Page View: ${pageName}`, { ...metadata, pageName });
    
    if (this.errorTracker && this.config.errorTrackingService === 'applicationinsights') {
      // this.errorTracker.trackPageView({ name: pageName, properties: metadata });
    }
  }

  /**
   * Track API call
   */
  public trackApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    metadata?: LogMetadata
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Call: ${method} ${url}`, {
      ...metadata,
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Track performance metric
   */
  public trackPerformance(metric: string, value: number, metadata?: LogMetadata): void {
    this.debug(`Performance: ${metric}`, { ...metadata, metric, value });
  }

  /**
   * Set user context
   */
  public setUserContext(userId: string, properties?: Record<string, unknown>): void {
    if (this.errorTracker && this.config.errorTrackingService === 'applicationinsights') {
      // this.errorTracker.setAuthenticatedUserContext(userId, undefined, true);
    } else if (this.errorTracker && this.config.errorTrackingService === 'sentry') {
      // this.errorTracker.setUser({ id: userId, ...properties });
    }

    // Mark parameters as intentionally unused when tracker integrations are disabled
    void userId;
    void properties;
  }

  /**
   * Clear user context
   */
  public clearUserContext(): void {
    if (this.errorTracker && this.config.errorTrackingService === 'applicationinsights') {
      // this.errorTracker.clearAuthenticatedUserContext();
    } else if (this.errorTracker && this.config.errorTrackingService === 'sentry') {
      // this.errorTracker.setUser(null);
    }
  }
}

// Default logger instance
let defaultLogger: FrontendLogger | null = null;

/**
 * Initialize the default logger
 */
export function initLogger(config: LoggerConfig): void {
  defaultLogger = new FrontendLogger(config);
}

/**
 * Get the default logger instance
 */
export function getLogger(): FrontendLogger {
  if (!defaultLogger) {
    // Create a default logger if not initialized
    defaultLogger = new FrontendLogger({
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      enableErrorTracking: false,
    });
  }
  return defaultLogger;
}

/**
 * Convenience logging functions
 */
export const logger = {
  error: (message: string, metadata?: ErrorMetadata) => getLogger().error(message, metadata),
  warn: (message: string, metadata?: LogMetadata) => getLogger().warn(message, metadata),
  info: (message: string, metadata?: LogMetadata) => getLogger().info(message, metadata),
  debug: (message: string, metadata?: LogMetadata) => getLogger().debug(message, metadata),
  trackAction: (action: string, metadata?: LogMetadata) => getLogger().trackAction(action, metadata),
  trackPageView: (pageName: string, metadata?: LogMetadata) => getLogger().trackPageView(pageName, metadata),
  trackApiCall: (method: string, url: string, statusCode: number, duration: number, metadata?: LogMetadata) =>
    getLogger().trackApiCall(method, url, statusCode, duration, metadata),
  trackPerformance: (metric: string, value: number, metadata?: LogMetadata) =>
    getLogger().trackPerformance(metric, value, metadata),
  setUserContext: (userId: string, properties?: Record<string, unknown>) =>
    getLogger().setUserContext(userId, properties),
  clearUserContext: () => getLogger().clearUserContext(),
};

export default logger;
