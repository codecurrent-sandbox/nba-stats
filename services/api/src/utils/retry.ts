/**
 * Retry and Exponential Backoff Utility
 *
 * Provides retry logic with exponential backoff for resilient API calls and
 * operations that may be temporarily unavailable.
 *
 * Features:
 * - Configurable retry attempts
 * - Exponential backoff with configurable base
 * - Jitter support to prevent thundering herd
 * - Predicate-based retry filtering
 * - Timeout support
 * - Event-based callbacks for monitoring
 *
 * @module utils/retry
 */

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxAttempts: number; // Maximum number of retry attempts
  initialDelayMs: number; // Initial delay in milliseconds
  maxDelayMs: number; // Maximum delay in milliseconds (caps exponential growth)
  backoffMultiplier: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to delay
  timeoutMs?: number; // Timeout for the entire retry operation
  shouldRetry?: (error: Error, attempt: number) => boolean; // Predicate to determine if error is retryable
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Retry attempt result
 */
export interface RetryAttemptResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempt: number;
  totalDurationMs: number;
  delays: number[];
}

/**
 * Retry event for monitoring and debugging
 */
export interface RetryEvent {
  type: 'attempt' | 'retry' | 'success' | 'failure';
  attempt: number;
  delay?: number;
  error?: Error;
  totalDurationMs?: number;
}

/**
 * Calculate delay for exponential backoff
 *
 * Formula: min(initialDelay * (multiplier ^ attempt), maxDelay)
 * Optional jitter: delay * (0.5 + random(0, 1))
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig,
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (!config.jitter) {
    return cappedDelay;
  }

  // Add jitter: ±10% to ±50% of the delay
  const jitterAmount = cappedDelay * (0.1 + Math.random() * 0.4);
  return Math.round(cappedDelay + (Math.random() > 0.5 ? jitterAmount : -jitterAmount));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error, shouldRetry?: RetryConfig['shouldRetry']): boolean {
  if (shouldRetry) {
    return shouldRetry(error, 0); // Initial check
  }

  // Default retryable errors
  const retryableNames = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
  ];

  return retryableNames.some((name) => error.message.includes(name)) || (error as any).code === 'ECONNREFUSED';
}

/**
 * Retry with Exponential Backoff
 *
 * Executes an async function with automatic retry on failure using
 * exponential backoff strategy.
 *
 * @example
 * // Basic retry with defaults
 * const data = await retry(async () => {
 *   return await fetchDataFromAPI();
 * });
 *
 * @example
 * // Custom configuration
 * const data = await retry(
 *   async () => {
 *     return await fetchDataFromAPI();
 *   },
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 200,
 *     backoffMultiplier: 1.5,
 *     jitter: true,
 *   }
 * );
 *
 * @example
 * // With custom retry predicate
 * const data = await retry(
 *   async () => {
 *     return await fetchDataFromAPI();
 *   },
 *   {
 *     maxAttempts: 3,
 *     shouldRetry: (error, attempt) => {
 *       // Only retry on specific status codes
 *       return error.statusCode === 429 || error.statusCode === 503;
 *     },
 *   }
 * );
 *
 * @example
 * // With event monitoring
 * const data = await retry(
 *   async () => {
 *     return await fetchDataFromAPI();
 *   },
 *   {},
 *   (event) => {
 *     if (event.type === 'retry') {
 *       console.log(`Retrying after ${event.delay}ms on attempt ${event.attempt}`);
 *     }
 *   }
 * );
 *
 * @param fn - The async function to retry
 * @param config - Retry configuration
 * @param onEvent - Optional callback for retry events
 * @throws {Error} If all retry attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onEvent?: (event: RetryEvent) => void,
): Promise<T> {
  const finalConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  const startTime = Date.now();
  const delays: number[] = [];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      onEvent?.({ type: 'attempt', attempt: attempt + 1 });

      // Check timeout
      if (finalConfig.timeoutMs && Date.now() - startTime > finalConfig.timeoutMs) {
        throw new Error(`Retry timeout exceeded after ${Date.now() - startTime}ms`);
      }

      const result = await fn();
      onEvent?.({
        type: 'success',
        attempt: attempt + 1,
        totalDurationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < finalConfig.maxAttempts - 1) {
        const shouldRetryError = isRetryableError(
          lastError,
          finalConfig.shouldRetry,
        );

        if (shouldRetryError) {
          const delay = calculateBackoffDelay(attempt, finalConfig);
          delays.push(delay);

          onEvent?.({
            type: 'retry',
            attempt: attempt + 1,
            delay,
            error: lastError,
          });

          await sleep(delay);
        } else {
          // Error is not retryable, fail immediately
          break;
        }
      } else {
        // Last attempt failed
        onEvent?.({
          type: 'failure',
          attempt: attempt + 1,
          error: lastError,
          totalDurationMs: Date.now() - startTime,
        });
      }
    }
  }

  throw lastError || new Error('Retry failed: Unknown error');
}

/**
 * Retry builder for fluent API
 *
 * @example
 * const data = await new Retrier()
 *   .maxAttempts(5)
 *   .initialDelay(200)
 *   .withJitter()
 *   .execute(async () => {
 *     return await fetchDataFromAPI();
 *   });
 */
export class Retrier {
  private config: RetryConfig;
  private eventHandler?: (event: RetryEvent) => void;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
    };
  }

  /**
   * Set maximum number of attempts
   */
  maxAttempts(attempts: number): this {
    this.config.maxAttempts = attempts;
    return this;
  }

  /**
   * Set initial delay
   */
  initialDelay(ms: number): this {
    this.config.initialDelayMs = ms;
    return this;
  }

  /**
   * Set maximum delay
   */
  maxDelay(ms: number): this {
    this.config.maxDelayMs = ms;
    return this;
  }

  /**
   * Set backoff multiplier
   */
  backoffMultiplier(multiplier: number): this {
    this.config.backoffMultiplier = multiplier;
    return this;
  }

  /**
   * Enable jitter
   */
  withJitter(): this {
    this.config.jitter = true;
    return this;
  }

  /**
   * Disable jitter
   */
  withoutJitter(): this {
    this.config.jitter = false;
    return this;
  }

  /**
   * Set timeout for entire operation
   */
  timeout(ms: number): this {
    this.config.timeoutMs = ms;
    return this;
  }

  /**
   * Set retry predicate
   */
  shouldRetry(predicate: (error: Error, attempt: number) => boolean): this {
    this.config.shouldRetry = predicate;
    return this;
  }

  /**
   * Set event handler
   */
  onEvent(handler: (event: RetryEvent) => void): this {
    this.eventHandler = handler;
    return this;
  }

  /**
   * Execute function with retry
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return retry(fn, this.config, this.eventHandler);
  }
}

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryPresets = {
  /**
   * Fast retries for quick operations
   */
  fast: {
    maxAttempts: 2,
    initialDelayMs: 50,
    maxDelayMs: 500,
    backoffMultiplier: 2,
    jitter: true,
  } as RetryConfig,

  /**
   * Standard retries for normal operations
   */
  standard: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitter: true,
  } as RetryConfig,

  /**
   * Aggressive retries for critical operations
   */
  aggressive: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
    jitter: true,
  } as RetryConfig,

  /**
   * Conservative retries with longer delays
   */
  conservative: {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 3,
    jitter: false,
  } as RetryConfig,
};

export default retry;
