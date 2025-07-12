import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "rate_limit";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipIf?: (req: any) => boolean; // Skip rate limiting conditionally
}

export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

// Common rate limit presets
export const RateLimitPresets = {
  // API endpoints
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  NORMAL: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  RELAXED: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute

  // Auth endpoints
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 minutes

  // Heavy operations
  ANALYSIS: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
};
