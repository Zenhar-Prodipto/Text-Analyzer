import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.redisClient = new Redis({
        host: this.configService.get<string>("REDIS_HOST"),
        port: this.configService.get<number>("REDIS_PORT"),
        password: this.configService.get<string>("REDIS_PASSWORD"),
        connectTimeout: 10000,
        lazyConnect: true,
      });

      this.redisClient.on("connect", () => {
        this.logger.log("Successfully connected to Redis");
      });

      this.redisClient.on("error", (error) => {
        this.logger.error("Redis connection error:", error);
      });

      // Test connection
      await this.redisClient.connect();
      await this.redisClient.ping();
      this.logger.log("Redis connection established and tested");
    } catch (error) {
      this.logger.error("Failed to connect to Redis:", error);
      throw new ApiException(
        "Cache service unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
        error.message
      );
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log("Redis connection closed");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (!value) return null;

      const parsed = JSON.parse(value);
      this.logger.debug(`Cache HIT for key: ${key}`);
      return parsed;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null; // Graceful degradation
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }

      this.logger.debug(
        `Cache SET for key: ${key}, TTL: ${ttlSeconds || "none"}`
      );
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.redisClient.incr(key);

      if (ttlSeconds && value === 1) {
        // Set TTL only on first increment
        await this.redisClient.expire(key, ttlSeconds);
      }

      return value;
    } catch (error) {
      this.logger.error(`Cache INCREMENT error for key ${key}:`, error);
      throw new ApiException(
        "Cache operation failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Get Redis client for advanced operations
  getClient(): Redis {
    return this.redisClient;
  }
}
