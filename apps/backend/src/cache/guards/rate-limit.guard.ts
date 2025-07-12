import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService } from '../services/rate-limit.service';
import { RATE_LIMIT_KEY, RateLimitConfig } from '../decorators/rate-limit.decorator';
import { ApiException } from '../../common/exceptions/api.exception';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get rate limit config from decorator
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
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

    try {
      // Check rate limit
      const result = await this.rateLimitService.checkRateLimit(identifier, {
        windowMs: rateLimitConfig.windowMs,
        maxRequests: rateLimitConfig.maxRequests,
        keyGenerator: rateLimitConfig.keyGenerator,
      });

      // Add rate limit headers
      response.setHeader('X-RateLimit-Limit', rateLimitConfig.maxRequests);
      response.setHeader('X-RateLimit-Remaining', result.remainingRequests);
      response.setHeader('X-RateLimit-Reset', result.resetTime.getTime());

      if (!result.allowed) {
        this.logger.warn(
          `Rate limit exceeded for ${identifier}: ${result.totalRequests}/${rateLimitConfig.maxRequests}`,
        );

        throw new ApiException(
          'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
          'RATE_LIMIT_EXCEEDED',
          {
            limit: rateLimitConfig.maxRequests,
            remaining: result.remainingRequests,
            resetTime: result.resetTime,
          },
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      this.logger.error('Rate limit check failed:', error);
      // On Redis failure, allow request (graceful degradation)
      return true;
    }
  }

  private generateIdentifier(request: Request, config: RateLimitConfig): string {
    // Use custom key generator if provided
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default: use IP address
    const ip = this.getClientIp(request);
    return ip;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
      : request.connection.remoteAddress || request.socket.remoteAddress;
    
    return ip || 'unknown';
  }
}
