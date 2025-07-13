import { Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  providers: [CacheService, RateLimitService, RateLimitGuard],
  exports: [CacheService, RateLimitService, RateLimitGuard],
})
export class CacheModule {}
