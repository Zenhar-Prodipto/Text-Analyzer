import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { Public } from "../../common/decorators/public.decorator";
import {
  RateLimit,
  RateLimitPresets,
} from "../../cache/decorators/rate-limit.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Public()
  @RateLimit(RateLimitPresets.RELAXED) // 100 requests per minute
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
