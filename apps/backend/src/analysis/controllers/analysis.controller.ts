import { Controller, Get, Param, HttpStatus, Post } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AnalysisService } from "../services/analysis.service";
import { WordCountResponseDto } from "../dto/word-count-response.dto";
import { UserId } from "../../common/decorators/current-user.decorator";
import {
  RateLimit,
  RateLimitPresets,
} from "../../cache/decorators/rate-limit.decorator";
import { ApiSuccess } from "../../common/exceptions/api.exception";
import {
  CharacterCountSuccessResponseDto,
  SentenceCountSuccessResponseDto,
  WordCountSuccessResponseDto,
} from "../dto/analysis-responses.doc.dto";
import { CharacterCountResponseDto } from "../dto/character-count-response.dto";
import { SentenceCountResponseDto } from "../dto/sentence-count-response.dto";

@ApiTags("Text Analysis")
@ApiBearerAuth()
@Controller("analysis")
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Get(":textId/words")
  @ApiOperation({
    summary: "Get word count for text",
    description:
      "Analyze and return the word count for a specific text owned by the user",
  })
  @ApiParam({
    name: "textId",
    description: "UUID of the text to analyze",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Word count analysis completed successfully",
    type: WordCountSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getWordCount(
    @Param("textId") textId: string,
    @UserId() userId: string
  ): Promise<ApiSuccess<WordCountResponseDto>> {
    const data = await this.analysisService.analyzeWordCount(textId, userId);

    return {
      success: true,
      message: "Word count analysis completed successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Get(":textId/characters")
  @ApiOperation({
    summary: "Get character count for text",
    description:
      "Analyze and return the character count for a specific text owned by the user",
  })
  @ApiParam({
    name: "textId",
    description: "UUID of the text to analyze",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Character count analysis completed successfully",
    type: CharacterCountSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getCharacterCount(
    @Param("textId") textId: string,
    @UserId() userId: string
  ): Promise<ApiSuccess<CharacterCountResponseDto>> {
    const data = await this.analysisService.analyzeCharacterCount(
      textId,
      userId
    );

    return {
      success: true,
      message: "Character count analysis completed successfully",
      status: HttpStatus.OK,
      data,
    };
  }

  @RateLimit(RateLimitPresets.NORMAL) // 60 requests per minute
  @Get(":textId/sentences")
  @ApiOperation({
    summary: "Get sentence count for text",
    description:
      "Analyze and return the sentence count for a specific text owned by the user",
  })
  @ApiParam({
    name: "textId",
    description: "UUID of the text to analyze",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Sentence count analysis completed successfully",
    type: SentenceCountSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Text not found" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async getSentenceCount(
    @Param("textId") textId: string,
    @UserId() userId: string
  ): Promise<ApiSuccess<SentenceCountResponseDto>> {
    const data = await this.analysisService.analyzeSentenceCount(
      textId,
      userId
    );

    return {
      success: true,
      message: "Sentence count analysis completed successfully",
      status: HttpStatus.OK,
      data,
    };
  }
}
