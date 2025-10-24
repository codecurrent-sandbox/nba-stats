/**
 * CORS Policy Configuration Module
 * 
 * Provides centralized CORS (Cross-Origin Resource Sharing) configuration
 * for the NBA Stats API backend. Allows flexible origin management and
 * supports environment-based settings for development and production.
 */

/**
 * CORS configuration options
 */
export interface CorsOptions {
  /**
   * Allowed origin(s) - can be a string, array of strings, or a callback function
   */
  origin: string | string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);

  /**
   * Allowed HTTP methods
   */
  methods?: string[];

  /**
   * Allowed headers
   */
  allowedHeaders?: string[];

  /**
   * Headers exposed to the client
   */
  exposedHeaders?: string[];

  /**
   * Whether to allow credentials (cookies, authorization headers, TLS client certificates)
   */
  credentials?: boolean;

  /**
   * How long the results of a preflight request can be cached (in seconds)
   */
  maxAge?: number;

  /**
   * Whether to pass the CORS preflight response to the next handler
   */
  preflightContinue?: boolean;

  /**
   * HTTP status code to use for successful OPTIONS requests
   */
  optionsSuccessStatus?: number;
}

/**
 * Environment-specific CORS presets
 */
export enum CorsPreset {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
}

/**
 * CORS Policy Configuration Manager
 * 
 * Provides a centralized way to manage CORS policies for different environments
 * and use cases.
 */
export class CorsPolicy {
  private config: CorsOptions;
  private preset: CorsPreset;

  /**
   * Creates a new CORS policy instance with the specified preset
   */
  constructor(preset: CorsPreset = CorsPreset.PRODUCTION) {
    this.preset = preset;
    this.config = this.buildConfig(preset);
  }

  /**
   * Build CORS configuration based on preset
   */
  private buildConfig(preset: CorsPreset): CorsOptions {
    switch (preset) {
      case CorsPreset.DEVELOPMENT:
        return this.getDevelopmentConfig();

      case CorsPreset.PUBLIC:
        return this.getPublicConfig();

      case CorsPreset.RESTRICTED:
        return this.getRestrictedConfig();

      case CorsPreset.PRODUCTION:
      default:
        return this.getProductionConfig();
    }
  }

  /**
   * Development CORS configuration - permissive for local development
   */
  private getDevelopmentConfig(): CorsOptions {
    return {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
      credentials: true,
      maxAge: 3600,
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Production CORS configuration - strict with specific whitelisted origins
   */
  private getProductionConfig(): CorsOptions {
    const allowedOrigins = this.getAllowedOrigins();

    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
      credentials: true,
      maxAge: 3600,
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Public CORS configuration - allows all origins
   */
  private getPublicConfig(): CorsOptions {
    return {
      origin: '*',
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // 24 hours
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Restricted CORS configuration - minimal access
   */
  private getRestrictedConfig(): CorsOptions {
    const allowedOrigins = this.getAllowedOrigins();

    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
        }
      },
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
      maxAge: 3600,
      optionsSuccessStatus: 200,
    };
  }

  /**
   * Get allowed origins from environment variables
   */
  private getAllowedOrigins(): string[] {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
    if (envOrigins) {
      return envOrigins.split(',').map((origin) => origin.trim());
    }

    // Default production origins
    return [
      'https://stats.example.com',
      'https://api.stats.example.com',
      'https://www.stats.example.com',
    ];
  }

  /**
   * Get the current CORS configuration
   */
  getConfig(): CorsOptions {
    return { ...this.config };
  }

  /**
   * Get the current preset
   */
  getPreset(): CorsPreset {
    return this.preset;
  }

  /**
   * Update the CORS configuration with custom options
   */
  updateConfig(options: Partial<CorsOptions>): void {
    this.config = {
      ...this.config,
      ...options,
    };
  }

  /**
   * Switch to a different preset
   */
  switchPreset(preset: CorsPreset): void {
    this.preset = preset;
    this.config = this.buildConfig(preset);
  }

  /**
   * Get a CORS policy with custom configuration
   */
  static create(preset: CorsPreset = CorsPreset.PRODUCTION): CorsPolicy {
    return new CorsPolicy(preset);
  }

  /**
   * Create a custom CORS policy
   */
  static custom(options: CorsOptions): CorsPolicy {
    const policy = new CorsPolicy(CorsPreset.PRODUCTION);
    policy.updateConfig(options);
    return policy;
  }

  /**
   * Get CORS configuration for Express/Connect middleware
   * Can be used directly with cors() middleware
   */
  toMiddlewareConfig(): CorsOptions {
    return this.getConfig();
  }
}

/**
 * Factory function to create CORS policies
 */
export const createCorsPolicy = (preset: CorsPreset = CorsPreset.PRODUCTION): CorsPolicy => {
  return CorsPolicy.create(preset);
};

/**
 * Helper function to determine preset based on environment
 */
export const getCorsPresetFromEnvironment = (): CorsPreset => {
  const env = process.env.NODE_ENV || 'production';
  const corsEnv = process.env.CORS_ENV || env;

  switch (corsEnv.toLowerCase()) {
    case 'development':
    case 'dev':
      return CorsPreset.DEVELOPMENT;

    case 'public':
      return CorsPreset.PUBLIC;

    case 'restricted':
      return CorsPreset.RESTRICTED;

    case 'production':
    case 'prod':
    default:
      return CorsPreset.PRODUCTION;
  }
};

// Export default CORS policy based on environment
export const defaultCorsPolicy = createCorsPolicy(getCorsPresetFromEnvironment());

export default CorsPolicy;
