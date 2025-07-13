import { Injectable } from "@nestjs/common";
import { CacheService } from "../../cache/services/cache.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import { TextsService } from "../../texts/services/texts.service";
import { TextProcessor } from "../utils/text-processor.util";
import { WordCountResponseDto } from "../dto/word-count-response.dto";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CharacterCountResponseDto } from "../dto/character-count-response.dto";
import { SentenceCountResponseDto } from "../dto/sentence-count-response.dto";
import { ParagraphCountResponseDto } from "../dto/paragraph-count-response.dto";
import { LongestWordsResponseDto } from "../dto/longest-words-response.dto";
import { FullAnalysisResponseDto } from "../dto/full-analysis-response.dto";

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

  // Analyze character count for a specific text owned by user
  async analyzeCharacterCount(
    textId: string,
    userId: string
  ): Promise<CharacterCountResponseDto> {
    const startTime = Date.now();

    try {
      // Get user's text and verify ownership
      const text = await this.textsService.getTextEntityById(textId, userId);

      // Check if already analyzed and cached
      const cacheKey = this.generateCacheKey("character_count", textId);
      const cachedResult =
        await this.cacheService.get<CharacterCountResponseDto>(cacheKey);

      if (cachedResult && text.analyzed_at) {
        this.customLogger.logPerformance(
          "character_count_analysis_cache_hit",
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

      // Perform analysis
      const analysisStartTime = Date.now();
      const cleanedText = TextProcessor.cleanText(text.content);
      const characterCount = TextProcessor.countValidCharacters(cleanedText);
      const analysisTime = Date.now() - analysisStartTime;

      const result: CharacterCountResponseDto = {
        count: characterCount,
        text: text.content,
        textId: textId,
      };

      // Update text entity with analysis result
      await this.textsService.updateTextAnalysis(textId, userId, {
        character_count: characterCount,
      });

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Log analysis event
      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "character_count",
        textLength: text.content.length,
        characterCount: characterCount,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "character_count_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          characterCount: characterCount,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "character_count_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) {
        throw error;
      }

      throw new ApiException(
        "Character count analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Analyze sentence count for a specific text owned by user

  async analyzeSentenceCount(
    textId: string,
    userId: string
  ): Promise<SentenceCountResponseDto> {
    const startTime = Date.now();

    try {
      // Get user's text and verify ownership
      const text = await this.textsService.getTextEntityById(textId, userId);

      // Check if already analyzed and cached
      const cacheKey = this.generateCacheKey("sentence_count", textId);
      const cachedResult =
        await this.cacheService.get<SentenceCountResponseDto>(cacheKey);

      if (cachedResult && text.analyzed_at) {
        this.customLogger.logPerformance(
          "sentence_count_analysis_cache_hit",
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

      // Perform analysis
      const analysisStartTime = Date.now();
      const sentences = TextProcessor.extractSentences(text.content);
      const analysisTime = Date.now() - analysisStartTime;

      const result: SentenceCountResponseDto = {
        count: sentences.length,
        text: text.content,
        textId: textId,
      };

      // Update text entity with analysis result
      await this.textsService.updateTextAnalysis(textId, userId, {
        sentence_count: sentences.length,
      });

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Log analysis event
      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "sentence_count",
        textLength: text.content.length,
        sentenceCount: sentences.length,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "sentence_count_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          sentenceCount: sentences.length,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "sentence_count_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) {
        throw error;
      }

      throw new ApiException(
        "Sentence count analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Analyze Paragraph count for a specific text owned by user

  async analyzeParagraphCount(
    textId: string,
    userId: string
  ): Promise<ParagraphCountResponseDto> {
    const startTime = Date.now();

    try {
      const text = await this.textsService.getTextEntityById(textId, userId);

      const cacheKey = this.generateCacheKey("paragraph_count", textId);
      const cachedResult =
        await this.cacheService.get<ParagraphCountResponseDto>(cacheKey);

      if (cachedResult && text.analyzed_at) {
        this.customLogger.logPerformance(
          "paragraph_count_analysis_cache_hit",
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

      const analysisStartTime = Date.now();
      const paragraphs = TextProcessor.extractParagraphs(text.content);
      const analysisTime = Date.now() - analysisStartTime;

      const result: ParagraphCountResponseDto = {
        count: paragraphs.length,
        text: text.content,
        textId: textId,
      };

      await this.textsService.updateTextAnalysis(textId, userId, {
        paragraph_count: paragraphs.length,
      });

      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "paragraph_count",
        textLength: text.content.length,
        paragraphCount: paragraphs.length,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "paragraph_count_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          paragraphCount: paragraphs.length,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "paragraph_count_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) throw error;

      throw new ApiException(
        "Paragraph count analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Analyze longest words for a specific text owned by user
  async analyzeLongestWords(
    textId: string,
    userId: string
  ): Promise<LongestWordsResponseDto> {
    const startTime = Date.now();

    try {
      const text = await this.textsService.getTextEntityById(textId, userId);

      const cacheKey = this.generateCacheKey("longest_words", textId);
      const cachedResult =
        await this.cacheService.get<LongestWordsResponseDto>(cacheKey);

      if (cachedResult && text.analyzed_at) {
        this.customLogger.logPerformance(
          "longest_words_analysis_cache_hit",
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

      const analysisStartTime = Date.now();
      const longestWordsData = TextProcessor.findLongestWordsPerParagraph(
        text.content
      );
      const analysisTime = Date.now() - analysisStartTime;

      const result: LongestWordsResponseDto = {
        longestWords: longestWordsData,
        text: text.content,
        textId: textId,
      };

      // Extract all longest words for storage in Text entity
      const allLongestWords = longestWordsData.flatMap((item) => item.words);
      const uniqueLongestWords = [...new Set(allLongestWords)];

      await this.textsService.updateTextAnalysis(textId, userId, {
        longest_words: uniqueLongestWords,
      });

      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "longest_words",
        textLength: text.content.length,
        longestWordsCount: uniqueLongestWords.length,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "longest_words_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          longestWordsCount: uniqueLongestWords.length,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "longest_words_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) throw error;

      throw new ApiException(
        "Longest words analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  // Perform full analysis combining all metrics for a specific text owned by user
  async performFullAnalysis(
    textId: string,
    userId: string
  ): Promise<FullAnalysisResponseDto> {
    const startTime = Date.now();

    try {
      const text = await this.textsService.getTextEntityById(textId, userId);

      const cacheKey = this.generateCacheKey("full_analysis", textId);
      const cachedResult =
        await this.cacheService.get<FullAnalysisResponseDto>(cacheKey);

      // Check if cache is still valid (text hasn't been modified since analysis)
      if (
        cachedResult &&
        text.analyzed_at &&
        text.updated_at <= text.analyzed_at
      ) {
        this.customLogger.logPerformance(
          "full_analysis_cache_hit",
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

      // Perform all analysis in one go for efficiency
      const analysisStartTime = Date.now();
      const analysisResult = TextProcessor.analyzeText(text.content);
      const longestWordsData = TextProcessor.findLongestWordsPerParagraph(
        text.content
      );
      const analysisTime = Date.now() - analysisStartTime;

      const result: FullAnalysisResponseDto = {
        wordCount: analysisResult.words.length,
        characterCount: analysisResult.characterCount,
        sentenceCount: analysisResult.sentences.length,
        paragraphCount: analysisResult.paragraphs.length,
        longestWords: longestWordsData,
        text: text.content,
        textId: textId,
        analyzedAt: new Date(),
      };

      // Extract all longest words for storage
      const allLongestWords = longestWordsData.flatMap((item) => item.words);
      const uniqueLongestWords = [...new Set(allLongestWords)];

      // Update text entity with ALL analysis results
      await this.textsService.updateTextAnalysis(textId, userId, {
        word_count: result.wordCount,
        character_count: result.characterCount,
        sentence_count: result.sentenceCount,
        paragraph_count: result.paragraphCount,
        longest_words: uniqueLongestWords,
      });

      // Cache the complete result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Invalidate individual analysis caches since we have new data
      const analysisTypes = [
        "word_count",
        "character_count",
        "sentence_count",
        "paragraph_count",
        "longest_words",
      ];
      for (const type of analysisTypes) {
        await this.cacheService.del(this.generateCacheKey(type, textId));
      }

      this.customLogger.logBusinessEvent("analysis_performed", {
        userId,
        textId,
        analysisType: "full_analysis",
        textLength: text.content.length,
        wordCount: result.wordCount,
        characterCount: result.characterCount,
        sentenceCount: result.sentenceCount,
        paragraphCount: result.paragraphCount,
        longestWordsCount: uniqueLongestWords.length,
        processingTimeMs: analysisTime,
        cacheHit: false,
      });

      this.customLogger.logPerformance(
        "full_analysis",
        Date.now() - startTime,
        {
          userId,
          textId,
          textLength: text.content.length,
          totalMetrics: 5,
          cacheHit: false,
          algorithmTimeMs: analysisTime,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "full_analysis",
        userId,
        textId,
        processingTimeMs: Date.now() - startTime,
      });

      if (error instanceof ApiException) throw error;

      throw new ApiException(
        "Full text analysis failed",
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
