import { Injectable, Logger } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  totalRequests: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly cacheService: CacheService) {}

  async checkRateLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    try {
      const { windowMs, maxRequests, keyGenerator } = options;
      const key = keyGenerator
        ? keyGenerator(identifier)
        : `rate_limit:${identifier}`;

      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis client for atomic operations
      const client = this.cacheService.getClient();

      // Sliding window log approach using sorted sets
      const pipeline = client.pipeline();

      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      const currentCount = results[1][1] as number;
      const totalRequests = currentCount + 1; // Including current request

      const allowed = totalRequests <= maxRequests;
      const remainingRequests = Math.max(0, maxRequests - totalRequests);
      const resetTime = new Date(now + windowMs);

      // Log rate limit attempt
      this.logger.debug(
        `Rate limit check for ${identifier}: ${totalRequests}/${maxRequests} requests, allowed: ${allowed}`
      );

      if (!allowed) {
        this.logger.warn(
          `Rate limit exceeded for ${identifier}: ${totalRequests}/${maxRequests} requests`
        );
      }

      return {
        allowed,
        remainingRequests,
        resetTime,
        totalRequests,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for ${identifier}:`, error);

      // In case of Redis failure, allow request (graceful degradation)
      return {
        allowed: true,
        remainingRequests: 0,
        resetTime: new Date(),
        totalRequests: 0,
      };
    }
  }

  async resetRateLimit(
    identifier: string,
    keyGenerator?: (id: string) => string
  ): Promise<void> {
    try {
      const key = keyGenerator
        ? keyGenerator(identifier)
        : `rate_limit:${identifier}`;
      await this.cacheService.del(key);
      this.logger.log(`Rate limit reset for ${identifier}`);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for ${identifier}:`, error);
    }
  }
}
