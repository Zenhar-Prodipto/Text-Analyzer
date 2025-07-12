import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/services/users.service";
import { CacheService } from "../../cache/services/cache.service";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { TokenResponseDto } from "../dto/refresh-token.dto";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";
import { JwtPayload } from "../strategies/jwt.strategy";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly refreshTokenRepository: RefreshTokenRepository
  ) {}

  async signup(
    signupDto: SignupDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.createUser(signupDto);
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userAgent,
        ipAddress
      );

      this.logger.log(`User registered successfully: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: this.getAccessTokenExpirySeconds(),
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        "Signup failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.validateUserPassword(
        loginDto.email,
        loginDto.password
      );

      if (!user) {
        throw new ApiException(
          "Invalid email or password",
          HttpStatus.UNAUTHORIZED,
          "INVALID_CREDENTIALS"
        );
      }

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        userAgent,
        ipAddress
      );

      this.logger.log(`User logged in successfully: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: this.getAccessTokenExpirySeconds(),
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        "Login failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto
  ): Promise<TokenResponseDto> {
    try {
      const { refresh_token } = refreshTokenDto;

      // Find refresh token in database
      const tokenRecord =
        await this.refreshTokenRepository.findByToken(refresh_token);

      if (!tokenRecord) {
        throw new ApiException(
          "Invalid refresh token",
          HttpStatus.UNAUTHORIZED,
          "INVALID_REFRESH_TOKEN"
        );
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expires_at) {
        await this.refreshTokenRepository.revokeToken(tokenRecord.id);
        await this.cacheService.del(`refresh_token:${refresh_token}`);
        throw new ApiException(
          "Refresh token expired",
          HttpStatus.UNAUTHORIZED,
          "REFRESH_TOKEN_EXPIRED"
        );
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user_agent,
        tokenRecord.ip_address
      );

      // Revoke old refresh token (token rotation)
      await this.refreshTokenRepository.revokeToken(tokenRecord.id);
      await this.cacheService.del(`refresh_token:${refresh_token}`);

      this.logger.log(`Token refreshed for user: ${tokenRecord.user.email}`);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: this.getAccessTokenExpirySeconds(),
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        "Token refresh failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async logout(refreshTokenDto: RefreshTokenDto): Promise<void> {
    try {
      const { refresh_token } = refreshTokenDto;

      const tokenRecord =
        await this.refreshTokenRepository.findByToken(refresh_token);

      if (tokenRecord) {
        await this.refreshTokenRepository.revokeToken(tokenRecord.id);
        await this.cacheService.del(`refresh_token:${refresh_token}`);
        this.logger.log(`User logged out: ${tokenRecord.user.email}`);
      }
    } catch (error) {
      this.logger.error("Logout failed:", error);
      throw new ApiException(
        "Logout failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async logoutAll(userId: string): Promise<void> {
    try {
      // Get all active tokens for cleanup
      const userTokens = await this.refreshTokenRepository.findByUserId(userId);

      // Revoke all tokens in database
      await this.refreshTokenRepository.revokeAllUserTokens(userId);

      // Remove all from Redis cache
      for (const token of userTokens) {
        await this.cacheService.del(`refresh_token:${token.token}`);
      }

      this.logger.log(`All tokens revoked for user: ${userId}`);
    } catch (error) {
      this.logger.error("Logout all failed:", error);
      throw new ApiException(
        "Logout all failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Generate access token using config
    const payload: JwtPayload = { sub: userId, email };
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN"),
    });

    // Generate refresh token
    const refresh_token = this.generateSecureToken();
    const refreshExpiryDays = this.getRefreshTokenExpiryDays();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    // Store refresh token in database
    await this.refreshTokenRepository.createRefreshToken({
      token: refresh_token,
      user_id: userId,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    // Cache refresh token in Redis
    await this.cacheService.set(
      `refresh_token:${refresh_token}`,
      { userId, email },
      refreshExpiryDays * 24 * 60 * 60 // Convert days to seconds
    );

    return { access_token, refresh_token };
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private getAccessTokenExpirySeconds(): number {
    const expiresIn = this.configService.get<string>("JWT_EXPIRES_IN");
    return this.parseTimeToSeconds(expiresIn);
  }

  private getRefreshTokenExpiryDays(): number {
    const expiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN");
    return parseInt(expiresIn.replace("d", "")); // "30d" -> 30
  }

  private parseTimeToSeconds(timeString: string): number {
    if (timeString.endsWith("d")) {
      return parseInt(timeString) * 24 * 60 * 60;
    }
    if (timeString.endsWith("h")) {
      return parseInt(timeString) * 60 * 60;
    }
    if (timeString.endsWith("m")) {
      return parseInt(timeString) * 60;
    }
    return parseInt(timeString); // Assume seconds
  }
}
