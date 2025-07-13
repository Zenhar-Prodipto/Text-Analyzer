import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request, Response } from "express";
import { RateLimitService } from "../services/rate-limit.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import {
  RATE_LIMIT_KEY,
  RateLimitConfig,
} from "../decorators/rate-limit.decorator";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly customLogger: CustomLoggerService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get rate limit config from decorator
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no rate limit config, allow request
    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if should skip rate limiting
    if (rateLimitConfig.skipIf && rateLimitConfig.skipIf(request)) {
      return true;
    }

    // Generate identifier for rate limiting
    const identifier = this.generateIdentifier(request, rateLimitConfig);
    const endpoint = `${request.method} ${request.route?.path || request.url}`;
    const userAgent = request.headers["user-agent"];
    const ip = this.getClientIp(request);

    // Get user info if available
    const user = (request as any).user;
    const userId = user?.id;
    const userEmail = user?.email;

    try {
      // Check rate limit
      const result = await this.rateLimitService.checkRateLimit(identifier, {
        windowMs: rateLimitConfig.windowMs,
        maxRequests: rateLimitConfig.maxRequests,
        keyGenerator: rateLimitConfig.keyGenerator,
      });

      // Add rate limit headers
      response.setHeader("X-RateLimit-Limit", rateLimitConfig.maxRequests);
      response.setHeader("X-RateLimit-Remaining", result.remainingRequests);
      response.setHeader("X-RateLimit-Reset", result.resetTime.getTime());

      // Log rate limit check
      this.customLogger.logApiRequest(
        request.method,
        endpoint,
        result.allowed ? 200 : 429,
        0, // Response time will be logged elsewhere
        {
          userId,
          email: userEmail,
          ip,
          userAgent,
          rateLimitResult: {
            allowed: result.allowed,
            totalRequests: result.totalRequests,
            maxRequests: rateLimitConfig.maxRequests,
            remainingRequests: result.remainingRequests,
            windowMs: rateLimitConfig.windowMs,
          },
        }
      );

      if (!result.allowed) {
        // Log rate limit exceeded as security event
        this.customLogger.logSecurityEvent("rate_limit_exceeded", "warn", {
          userId,
          email: userEmail,
          ip,
          userAgent,
          endpoint,
          identifier,
          requestCount: result.totalRequests,
          maxRequests: rateLimitConfig.maxRequests,
          windowMs: rateLimitConfig.windowMs,
          resetTime: result.resetTime.toISOString(),
        });

        throw new ApiException(
          "Too many requests. Please try again later.",
          HttpStatus.TOO_MANY_REQUESTS,
          "RATE_LIMIT_EXCEEDED",
          {
            limit: rateLimitConfig.maxRequests,
            remaining: result.remainingRequests,
            resetTime: result.resetTime,
            retryAfter: Math.ceil(
              (result.resetTime.getTime() - Date.now()) / 1000
            ),
          }
        );
      }

      // Log successful rate limit check for monitoring
      if (result.totalRequests > rateLimitConfig.maxRequests * 0.8) {
        // Log warning when approaching rate limit (80% threshold)
        this.customLogger.logSecurityEvent("rate_limit_exceeded", "warn", {
          userId,
          email: userEmail,
          ip,
          userAgent,
          endpoint,
          identifier,
          requestCount: result.totalRequests,
          maxRequests: rateLimitConfig.maxRequests,
          thresholdWarning: true,
          message: "Approaching rate limit threshold",
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      // Log rate limit service failure
      this.customLogger.logError(error, {
        operation: "rate_limit_check",
        userId,
        email: userEmail,
        ip,
        endpoint,
        identifier,
      });

      // On Redis failure, allow request (graceful degradation)
      this.customLogger.logSecurityEvent("rate_limit_exceeded", "error", {
        userId,
        email: userEmail,
        ip,
        userAgent,
        endpoint,
        error: "Rate limit service failure - allowing request",
        gracefulDegradation: true,
      });

      return true;
    }
  }

  private generateIdentifier(
    request: Request,
    config: RateLimitConfig
  ): string {
    // Use custom key generator if provided
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default: use IP address, but include user ID if authenticated
    const ip = this.getClientIp(request);
    const user = (request as any).user;

    if (user?.id) {
      return `user:${user.id}`;
    }

    return `ip:${ip}`;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    const ip = forwarded
      ? Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(",")[0]
      : request.connection.remoteAddress || request.socket.remoteAddress;

    return ip || "unknown";
  }
}
