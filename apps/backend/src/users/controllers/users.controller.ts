import { Controller, Get, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  CurrentUser,
  UserId,
  UserEmail,
} from "../../common/decorators/current-user.decorator";
import { User } from "../entities/user.entity";
import { UserResponseDto } from "../dto/user-response.dto";
import { ApiSuccess } from "../../common/exceptions/api.exception";
import {
  RateLimit,
  RateLimitPresets,
} from "../../cache/decorators/rate-limit.decorator";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(
    @CurrentUser() user: User
  ): Promise<ApiSuccess<UserResponseDto>> {
    const { password, ...userResponse } = user;

    return {
      success: true,
      message: "User profile retrieved successfully",
      status: HttpStatus.OK,
      data: user,
    };
  }

  @RateLimit(RateLimitPresets.NORMAL)
  @Get("id")
  @ApiOperation({ summary: "Get current user ID" })
  @ApiResponse({ status: 200, description: "User ID retrieved successfully" })
  async getCurrentUserId(
    @UserId() userId: string
  ): Promise<ApiSuccess<{ id: string }>> {
    return {
      success: true,
      message: "User ID retrieved successfully",
      status: HttpStatus.OK,
      data: { id: userId },
    };
  }

  @RateLimit(RateLimitPresets.NORMAL)
  @Get("email")
  @ApiOperation({ summary: "Get current user email" })
  @ApiResponse({
    status: 200,
    description: "User email retrieved successfully",
  })
  async getCurrentUserEmail(
    @UserEmail() email: string
  ): Promise<ApiSuccess<{ email: string }>> {
    return {
      success: true,
      message: "User email retrieved successfully",
      status: HttpStatus.OK,
      data: { email },
    };
  }

  @RateLimit(RateLimitPresets.NORMAL)
  @Get("name")
  @ApiOperation({ summary: "Get specific user property example" })
  @ApiResponse({ status: 200, description: "User name retrieved successfully" })
  async getCurrentUserName(
    @CurrentUser("name") name: string
  ): Promise<ApiSuccess<{ name: string }>> {
    return {
      success: true,
      message: "User name retrieved successfully",
      status: HttpStatus.OK,
      data: { name },
    };
  }
}
