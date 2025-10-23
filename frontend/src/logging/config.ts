import { LogLevel } from './logger';
import type { LoggerConfig } from './logger';

const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT ?? '/api/logs';
const APP_INSIGHTS_CONNECTION_STRING = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_ENV = import.meta.env.VITE_APP_ENV;

/**
 * Frontend logger configuration for different environments
 */

/**
 * Development environment configuration
 */
export const developmentConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: false,
  enableErrorTracking: false,
  environment: 'development',
};

/**
 * Production environment configuration
 */
export const productionConfig: LoggerConfig = {
  level: LogLevel.WARN,
  enableConsole: false, // Disable console logs in production
  enableRemote: true,
  remoteEndpoint: LOG_ENDPOINT,
  enableErrorTracking: true,
  errorTrackingService: 'applicationinsights',
  errorTrackingConfig: {
    connectionString: APP_INSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    disableFetchTracking: false,
    enableCorsCorrelation: true,
  },
  sampleRate: 1.0, // Log 100% of events in production (adjust as needed)
  environment: 'production',
};

/**
 * Staging environment configuration
 */
export const stagingConfig: LoggerConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: true,
  remoteEndpoint: LOG_ENDPOINT,
  enableErrorTracking: true,
  errorTrackingService: 'applicationinsights',
  errorTrackingConfig: {
    connectionString: APP_INSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
  },
  sampleRate: 1.0,
  environment: 'staging',
};

/**
 * Test environment configuration
 */
export const testConfig: LoggerConfig = {
  level: LogLevel.ERROR,
  enableConsole: false,
  enableRemote: false,
  enableErrorTracking: false,
  environment: 'test',
};

/**
 * Get configuration based on environment
 */
export function getLoggerConfig(): LoggerConfig {
  const mode = import.meta.env.MODE ?? 'development';
  const reactEnv = APP_ENV ?? mode;

  switch (reactEnv) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Alternative configuration for Sentry error tracking
 */
export const sentryProductionConfig: LoggerConfig = {
  level: LogLevel.WARN,
  enableConsole: false,
  enableRemote: true,
  remoteEndpoint: LOG_ENDPOINT,
  enableErrorTracking: true,
  errorTrackingService: 'sentry',
  errorTrackingConfig: {
    dsn: SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1, // Sample 10% of transactions
    beforeSend(
      event: Record<string, unknown>,
      hint: { originalException?: { message?: string } } = {}
    ) {
      // Filter out specific errors if needed
      if ('exception' in event) {
        const error = hint.originalException;
        // Example: Ignore network errors
        if (error?.message && error.message.includes('Network Error')) {
          return null;
        }
      }
      return event;
    },
  },
  sampleRate: 0.5, // Log 50% of events
  environment: 'production',
};
