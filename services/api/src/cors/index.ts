/**
 * CORS Configuration Module
 * 
 * Provides environment-aware CORS policy configuration for the NBA Stats API.
 */

export {
  CorsPolicy,
  CorsPreset,
  CorsOptions,
  createCorsPolicy,
  getCorsPresetFromEnvironment,
  defaultCorsPolicy,
} from './CorsPolicy';

export type { CorsOptions };
