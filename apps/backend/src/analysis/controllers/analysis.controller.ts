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
import { WordCountSuccessResponseDto } from "../dto/analysis-responses.doc.dto";

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
}
