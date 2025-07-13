import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { TextsService } from "../services/texts.service";
import { CreateTextDto } from "../dto/create-text.dto";
import { UpdateTextDto } from "../dto/update-text.dto";
import { TextResponseDto } from "../dto/text-response.dto";
import {
  TextSuccessResponseDto,
  TextListSuccessResponseDto,
  TextDeleteSuccessResponseDto,
  TextCountSuccessResponseDto,
} from "../dto/text-responses.doc.dto";
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
import { PaginatedTextsResponse } from "../interfaces/pagination.interface";

@ApiTags("Texts")
@ApiBearerAuth()
@Controller("texts")
export class TextsController {
  constructor(private readonly textsService: TextsService) {}

  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Post()
  @ApiOperation({
    summary: "Create a new text",
    description:
      "Create a new text document for analysis. The text will be associated with the authenticated user.",
  })
  @ApiResponse({ status: 201, type: TextSuccessResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async createText(
    @Body() createTextDto: CreateTextDto,
    @UserId() userId: string
  ): Promise<ApiSuccess<TextResponseDto>> {
    const data = await this.textsService.createText(createTextDto, userId);

    return {
      success: true,
      message: "Text created successfully",
      status: HttpStatus.CREATED,
      data,
    };
  }

  @RateLimit(RateLimitPresets.RELAXED) // 100 requests per minute
  @Get()
  @ApiOperation({
    summary: "Get user texts",
    description:
      "Retrieve a paginated list of texts belonging to the authenticated user.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Items per page (default: 10, max: 50)",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in title and content",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["created_at", "updated_at", "title"],
    description: "Sort field (default: created_at)",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    enum: ["ASC", "DESC"],
    description: "Sort order (default: DESC)",
  })
  @ApiResponse({ status: 200, type: TextListSuccessResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getUserTexts(
    @UserId() userId: string,
    @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query("search") search?: string,
    @Query("sortBy")
    sortBy: "created_at" | "updated_at" | "title" = "created_at",
    @Query("sortOrder") sortOrder: "ASC" | "DESC" = "DESC"
  ): Promise<ApiSuccess<PaginatedTextsResponse>> {
    // Limit max items per page
    const validatedLimit = Math.min(Math.max(limit, 1), 50);
    const validatedPage = Math.max(page, 1);

    const data = await this.textsService.getUserTexts(
      userId,
      validatedPage,
      validatedLimit,
      search,
      sortBy,
      sortOrder
    );

    return {
      success: true,
      message: "Texts retrieved successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @RateLimit(RateLimitPresets.RELAXED) // 100 requests per minute
  @Get("count")
  @ApiOperation({
    summary: "Get user text count",
    description:
      "Get the total number of texts belonging to the authenticated user.",
  })
  @ApiResponse({ status: 200, type: TextCountSuccessResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getUserTextCount(
    @UserId() userId: string
  ): Promise<ApiSuccess<{ count: number }>> {
    const count = await this.textsService.getUserTextCount(userId);

    return {
      success: true,
      message: "Text count retrieved successfully",
      status: HttpStatus.OK,
      data: { count },
    };
  }

  @RateLimit(RateLimitPresets.RELAXED) // 100 requests per minute
  @Get(":id")
  @ApiOperation({
    summary: "Get text by ID",
    description:
      "Retrieve a specific text document by its ID. Only texts belonging to the authenticated user can be accessed.",
  })
  @ApiParam({ name: "id", description: "Text UUID", type: "string" })
  @ApiResponse({ status: 200, type: TextSuccessResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getTextById(
    @Param("id", ParseUUIDPipe) id: string,
    @UserId() userId: string
  ): Promise<ApiSuccess<TextResponseDto>> {
    const data = await this.textsService.getTextById(id, userId);

    return {
      success: true,
      message: "Text retrieved successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Put(":id")
  @ApiOperation({
    summary: "Update text",
    description:
      "Update a text document. Only texts belonging to the authenticated user can be updated. Analysis cache will be cleared if content is modified.",
  })
  @ApiParam({ name: "id", description: "Text UUID", type: "string" })
  @ApiResponse({ status: 200, type: TextSuccessResponseDto })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async updateText(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTextDto: UpdateTextDto,
    @UserId() userId: string
  ): Promise<ApiSuccess<TextResponseDto>> {
    const data = await this.textsService.updateText(id, userId, updateTextDto);

    return {
      success: true,
      message: "Text updated successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @RateLimit(RateLimitPresets.STRICT) // 10 requests per minute
  @Delete(":id")
  @ApiOperation({
    summary: "Delete text",
    description:
      "Delete a text document. Only texts belonging to the authenticated user can be deleted.",
  })
  @ApiParam({ name: "id", description: "Text UUID", type: "string" })
  @ApiResponse({ status: 200, type: TextDeleteSuccessResponseDto })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async deleteText(
    @Param("id", ParseUUIDPipe) id: string,
    @UserId() userId: string
  ): Promise<ApiSuccess<{ message: string }>> {
    await this.textsService.deleteText(id, userId);

    return {
      success: true,
      message: "Text deleted successfully",
      status: HttpStatus.OK,
      data: { message: "Text deleted successfully" },
    };
  }
}
