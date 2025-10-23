import { LogLevel, LoggerConfig } from './logger';

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
  remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT || '/api/logs',
  enableErrorTracking: true,
  errorTrackingService: 'applicationinsights',
  errorTrackingConfig: {
    connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
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
  remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT || '/api/logs',
  enableErrorTracking: true,
  errorTrackingService: 'applicationinsights',
  errorTrackingConfig: {
    connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTION_STRING,
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
  const env = process.env.NODE_ENV || 'development';
  const reactEnv = process.env.REACT_APP_ENV || env;

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
  remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT || '/api/logs',
  enableErrorTracking: true,
  errorTrackingService: 'sentry',
  errorTrackingConfig: {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1, // Sample 10% of transactions
    beforeSend(event: any, hint: any) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Example: Ignore network errors
        if (error && error.message && error.message.includes('Network Error')) {
          return null;
        }
      }
      return event;
    },
  },
  sampleRate: 0.5, // Log 50% of events
  environment: 'production',
};
