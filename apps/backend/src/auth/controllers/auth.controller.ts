import { Controller, Post, Body, HttpStatus, Req, Ip } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "../services/auth.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { RefreshTokenDto, TokenResponseDto } from "../dto/refresh-token.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  UserId,
} from "../../common/decorators/current-user.decorator";
import {
  RateLimit,
  RateLimitPresets,
} from "../../cache/decorators/rate-limit.decorator";
import { ApiSuccess } from "../../common/exceptions/api.exception";
import { User } from "../../users/entities/user.entity";
import {
  AuthSuccessResponseDto,
  LogoutSuccessResponseDto,
  VerifyTokenSuccessResponseDto,
} from "../dto/auth-responses.doc.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @RateLimit(RateLimitPresets.AUTH) // 5 requests per 15 minutes
  @Post("signup")
  @ApiOperation({ summary: "User registration" })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async signup(
    @Body() signupDto: SignupDto,
    @Req() request: Request,
    @Ip() ip: string
  ): Promise<ApiSuccess<AuthResponseDto>> {
    const userAgent = request.headers["user-agent"];
    const data = await this.authService.signup(signupDto, userAgent, ip);

    return {
      success: true,
      message: "User registered successfully",
      status: HttpStatus.CREATED,
      data,
    };
  }

  @Public()
  @RateLimit(RateLimitPresets.AUTH) // 5 requests per 15 minutes
  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Ip() ip: string
  ): Promise<ApiSuccess<AuthResponseDto>> {
    const userAgent = request.headers["user-agent"];
    const data = await this.authService.login(loginDto, userAgent, ip);

    return {
      success: true,
      message: "User logged in successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @Public()
  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Post("refresh")
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Get a new access token using a valid refresh token. The old refresh token will be revoked.",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<ApiSuccess<TokenResponseDto>> {
    const data = await this.authService.refreshToken(refreshTokenDto);

    return {
      success: true,
      message: "Token refreshed successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @ApiBearerAuth()
  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Post("logout")
  @ApiOperation({
    summary: "User logout",
    description:
      "Revoke a specific refresh token and log out from that session.",
  })
  @ApiResponse({
    status: 200,
    description: "User logged out successfully",
    type: LogoutSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @CurrentUser() user: User
  ): Promise<ApiSuccess<{ message: string }>> {
    await this.authService.logout(refreshTokenDto);

    return {
      success: true,
      message: "User logged out successfully",
      status: HttpStatus.OK,
      data: { message: "Session terminated" },
    };
  }

  @ApiBearerAuth()
  @RateLimit(RateLimitPresets.STRICT) // 10 requests per minute
  @Post("logout-all")
  @ApiOperation({
    summary: "Logout from all devices",
    description:
      "Revoke all refresh tokens for the current user and log out from all sessions.",
  })
  @ApiResponse({
    status: 200,
    description: "Logged out from all devices successfully",
    type: LogoutSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async logoutAll(
    @UserId() userId: string
  ): Promise<ApiSuccess<{ message: string }>> {
    await this.authService.logoutAll(userId);

    return {
      success: true,
      message: "Logged out from all devices successfully",
      status: HttpStatus.OK,
      data: { message: "All sessions terminated" },
    };
  }

  @ApiBearerAuth()
  @RateLimit(RateLimitPresets.RELAXED) // 100 requests per minute
  @Post("verify")
  @ApiOperation({
    summary: "Verify token",
    description: "Verify if the current access token is valid.",
  })
  @ApiResponse({
    status: 200,
    description: "Token is valid",
    type: VerifyTokenSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid token" })
  async verifyToken(
    @CurrentUser() user: User
  ): Promise<ApiSuccess<{ user: Partial<User> }>> {
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      message: "Token is valid",
      status: HttpStatus.OK,
      data: { user: userWithoutPassword },
    };
  }
}
