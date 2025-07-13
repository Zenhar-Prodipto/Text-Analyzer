import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/services/cache.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import { TextsService } from "../../texts/services/texts.service";
import { TextProcessor } from "../utils/text-processor.util";
import { WordCountResponseDto } from "../dto/word-count-response.dto";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AnalysisService {
  private readonly CACHE_TTL = this.configService.get<number>(
    "ANALYSIS_CACHE_TTL",
    3600 // 1 hour cache
  );

  constructor(
    private readonly textsService: TextsService,
    private readonly cacheService: CacheService,
    private readonly customLogger: CustomLoggerService,
    private readonly configService: ConfigService
  ) {}

  // Analyze word count for a specific text owned by user

  async analyzeWordCount(
    textId: string,
    userId: string
  ): Promise<WordCountResponseDto> {
    const startTime = Date.now();

    try {
      // Get user's text and verify ownership
      const text = await this.textsService.getTextEntityById(textId, userId);

      // Check if already analyzed and cached
      const cacheKey = this.generateCacheKey("word_count", textId);
      const cachedResult =
        await this.cacheService.get<WordCountResponseDto>(cacheKey);

      if (cachedResult && text.analyzed_at) {
        this.customLogger.logPerformance(
          "word_count_analysis_cache_hit",
          Date.now() - startTime,
          {
            userId,
            textId,
            textLength: text.content.length,
            cacheHit: true,
          }
        );
        return cachedResult;
      }

      // Perform analysis if not cached or not analyzed
      const analysisStartTime = Date.now();
      const words = TextProcessor.extractWords(text.content);
      const analysisTime = Date.now() - analysisStartTime;

      const result: WordCountResponseDto = {
        count: words.length,
        text: text.content,
        textId: textId,
      };

      // Update text entity with analysis result
      await this.textsService.updateTextAnalysis(textId, userId, {
        word_count: words.length,
      });

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Log analysis event
      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "word_count",
        textLength: text.content.length,
        wordCount: words.length,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "word_count_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          wordCount: words.length,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "word_count_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) {
        throw error;
      }

      throw new ApiException(
        "Word count analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Generate consistent cache key for analysis results based on textId

  private generateCacheKey(analysisType: string, textId: string): string {
    return `analysis:${analysisType}:${textId}`;
  }
}
