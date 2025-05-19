// Temporary logger implementation to avoid import error
const logHelpers = {
  smpp: (...args: unknown[]) => {
    console.log('[SMPP]', ...args);
  }
};
// import { logHelpers } from '../logger';

interface RateLimiterConfig {
  tokensPerInterval: number;  // Number of tokens to add per interval
  interval: number;          // Interval in milliseconds
  maxTokens: number;         // Maximum number of tokens that can be stored
}

interface RateLimiterStats {
  tokens: number;
  lastRefill: number;
  requestsProcessed: number;
  requestsRejected: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private requestsProcessed: number;
  private requestsRejected: number;
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = {
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
      maxTokens: config.maxTokens
    };
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
    this.requestsProcessed = 0;
    this.requestsRejected = 0;
  }

  /**
   * Try to consume a token from the bucket
   * @param tokens Number of tokens to consume (default: 1)
   * @returns boolean indicating if the request should be allowed
   */
  public tryConsume(tokens: number = 1): boolean {
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      this.requestsProcessed++;
      return true;
    }

    this.requestsRejected++;
    logHelpers.smpp('Rate limit exceeded', {
      availableTokens: this.tokens,
      requestedTokens: tokens,
      requestsProcessed: this.requestsProcessed,
      requestsRejected: this.requestsRejected
    });
    return false;
  }

  /**
   * Get current rate limiter statistics
   * @returns RateLimiterStats object containing current state
   */
  public getStats(): RateLimiterStats {
    return {
      tokens: this.tokens,
      lastRefill: this.lastRefill,
      requestsProcessed: this.requestsProcessed,
      requestsRejected: this.requestsRejected
    };
  }

  /**
   * Reset the rate limiter to its initial state
   */
  public reset(): void {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
    this.requestsProcessed = 0;
    this.requestsRejected = 0;
    logHelpers.smpp('Rate limiter reset');
  }

  /**
   * Refill tokens based on time elapsed since last refill
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.config.interval) * this.config.tokensPerInterval;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

// Factory function to create rate limiters for different purposes
export class RateLimiterFactory {
  private static limiters: Map<string, RateLimiter> = new Map();

  /**
   * Create or get a rate limiter instance
   * @param name Unique identifier for the rate limiter
   * @param config Rate limiter configuration
   * @returns RateLimiter instance
   */
  public static getRateLimiter(name: string, config: RateLimiterConfig): RateLimiter {
    if (!this.limiters.has(name)) {
      this.limiters.set(name, new RateLimiter(config));
      logHelpers.smpp(`Created new rate limiter: ${name}`, {
        tokensPerInterval: config.tokensPerInterval,
        interval: config.interval,
        maxTokens: config.maxTokens
      });
    }
    return this.limiters.get(name)!;
  }

  /**
   * Get all rate limiter instances
   * @returns Map of rate limiter instances
   */
  public static getAllLimiters(): Map<string, RateLimiter> {
    return this.limiters;
  }

  /**
   * Reset all rate limiters
   */
  public static resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
    logHelpers.smpp('All rate limiters reset');
  }
}

// Predefined rate limiter configurations
export const RateLimiterConfigs = {
  // Default configuration: 100 messages per second
  DEFAULT: {
    tokensPerInterval: 100,
    interval: 1000,
    maxTokens: 1000
  },

  // Strict configuration: 10 messages per second
  STRICT: {
    tokensPerInterval: 10,
    interval: 1000,
    maxTokens: 100
  },

  // Burst configuration: 1000 messages per second with high burst capacity
  BURST: {
    tokensPerInterval: 1000,
    interval: 1000,
    maxTokens: 10000
  },

  // Per-connection configuration: 50 messages per second per connection
  PER_CONNECTION: {
    tokensPerInterval: 50,
    interval: 1000,
    maxTokens: 500
  }
};

// Example usage:
// const messageRateLimiter = RateLimiterFactory.getRateLimiter('messages', RateLimiterConfigs.DEFAULT);
// const connectionRateLimiter = RateLimiterFactory.getRateLimiter('connections', RateLimiterConfigs.PER_CONNECTION);