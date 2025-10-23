import { LogLevel, LoggerConfig } from './logger';

/**
 * Logger configuration for different environments
 */

/**
 * Development environment configuration
 */
export const developmentConfig: LoggerConfig = {
  level: LogLevel.DEBUG,
  format: 'text',
  enableConsole: true,
  enableFile: false,
};

/**
 * Production environment configuration
 */
export const productionConfig: LoggerConfig = {
  level: LogLevel.INFO,
  format: 'json',
  enableConsole: true,
  enableFile: true,
  filePath: './logs/api.log',
  enableHttp: false, // Set to true and configure httpEndpoint for centralized logging
  // httpEndpoint: 'https://your-log-aggregator.com/logs',
};

/**
 * Test environment configuration
 */
export const testConfig: LoggerConfig = {
  level: LogLevel.ERROR,
  format: 'json',
  enableConsole: false,
  enableFile: false,
};

/**
 * Get configuration based on NODE_ENV
 */
export function getLoggerConfig(): LoggerConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Get configuration with environment variable overrides
 */
export function getLoggerConfigWithOverrides(): LoggerConfig {
  const baseConfig = getLoggerConfig();
  
  return {
    ...baseConfig,
    level: (process.env.LOG_LEVEL as LogLevel) || baseConfig.level,
    format: (process.env.LOG_FORMAT as 'json' | 'text') || baseConfig.format,
    filePath: process.env.LOG_FILE_PATH || baseConfig.filePath,
    httpEndpoint: process.env.LOG_HTTP_ENDPOINT || baseConfig.httpEndpoint,
  };
}
