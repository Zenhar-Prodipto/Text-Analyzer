import { Injectable } from "@nestjs/common";
import {
  TextsRepository,
  TextFindOptions,
} from "../repositories/texts.repository";
import { CacheService } from "../../cache/services/cache.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import { CreateTextDto } from "../dto/create-text.dto";
import { UpdateTextDto } from "../dto/update-text.dto";
import { TextResponseDto } from "../dto/text-response.dto";
import { Text } from "../entities/text.entity";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaginatedTextsResponse } from "../interfaces/pagination.interface";

@Injectable()
export class TextsService {
  private readonly CACHE_TTL = this.configService.get<number>(
    "TEXT_CACHE_TTL",
    3600
  );

  constructor(
    private readonly textsRepository: TextsRepository,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly customLogger: CustomLoggerService
  ) {}

  async createText(
    createTextDto: CreateTextDto,
    userId: string
  ): Promise<TextResponseDto> {
    const startTime = Date.now();

    try {
      // Log text creation attempt
      this.customLogger.logBusinessEvent("text_created", {
        userId,
        title: createTextDto.title,
        contentLength: createTextDto.content.length,
      });

      // Create text in database
      const text = await this.textsRepository.createText(createTextDto, userId);

      // Log database operation
      this.customLogger.logDatabaseEvent("create", "texts", {
        userId,
        textId: text.id,
        title: text.title,
      });

      // Cache the new text
      await this.cacheText(text);

      // Invalidate user's text list cache
      await this.invalidateUserTextsCache(userId);

      // Log performance
      this.customLogger.logPerformance(
        "text_creation",
        Date.now() - startTime,
        {
          userId,
          textId: text.id,
          contentLength: createTextDto.content.length,
        }
      );

      // Log successful creation
      this.customLogger.logBusinessEvent("text_created", {
        userId,
        textId: text.id,
        title: text.title,
        success: true,
      });

      return this.mapToResponseDto(text);
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "create_text",
        userId,
        title: createTextDto.title,
      });

      throw new ApiException(
        "Failed to create text",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getUserTexts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: "created_at" | "updated_at" | "title" = "created_at",
    sortOrder: "ASC" | "DESC" = "DESC"
  ): Promise<PaginatedTextsResponse> {
    const startTime = Date.now();
    const cacheKey = `user_texts:${userId}:${page}:${limit}:${search || ""}:${sortBy}:${sortOrder}`;

    try {
      // Try to get from cache first
      const cachedResult =
        await this.cacheService.get<PaginatedTextsResponse>(cacheKey);
      if (cachedResult) {
        this.customLogger.logPerformance(
          "text_list_cache_hit",
          Date.now() - startTime,
          {
            userId,
            page,
            limit,
            cacheHit: true,
          }
        );
        return cachedResult;
      }

      // Query database
      const options: TextFindOptions = {
        userId,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      };

      const { texts, total } =
        await this.textsRepository.findUserTexts(options);

      // Log database operation
      this.customLogger.logDatabaseEvent("read", "texts", {
        userId,
        page,
        limit,
        search,
        resultsCount: texts.length,
        total,
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result: PaginatedTextsResponse = {
        texts: texts.map((text) => this.mapToResponseDto(text)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Log performance
      this.customLogger.logPerformance(
        "text_list_query",
        Date.now() - startTime,
        {
          userId,
          page,
          limit,
          resultsCount: texts.length,
          cacheHit: false,
        }
      );

      return result;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "get_user_texts",
        userId,
        page,
        limit,
      });

      throw new ApiException(
        "Failed to retrieve texts",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getTextById(id: string, userId: string): Promise<TextResponseDto> {
    const startTime = Date.now();
    const cacheKey = `text:${id}:${userId}`;

    try {
      // Try cache first
      const cachedText = await this.cacheService.get<TextResponseDto>(cacheKey);
      if (cachedText) {
        this.customLogger.logPerformance(
          "text_get_cache_hit",
          Date.now() - startTime,
          {
            userId,
            textId: id,
            cacheHit: true,
          }
        );
        return cachedText;
      }

      // Query database
      const text = await this.textsRepository.findUserTextById(id, userId);

      if (!text) {
        this.customLogger.logBusinessEvent("text_created", {
          userId,
          textId: id,
          error: "text_not_found",
        });

        throw new ApiException(
          "Text not found",
          HttpStatus.NOT_FOUND,
          "TEXT_NOT_FOUND"
        );
      }

      // Log database operation
      this.customLogger.logDatabaseEvent("read", "texts", {
        userId,
        textId: id,
        title: text.title,
      });

      const responseDto = this.mapToResponseDto(text);

      // Cache the result
      await this.cacheService.set(cacheKey, responseDto, this.CACHE_TTL);

      // Log performance
      this.customLogger.logPerformance(
        "text_get_query",
        Date.now() - startTime,
        {
          userId,
          textId: id,
          cacheHit: false,
        }
      );

      return responseDto;
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      this.customLogger.logError(error, {
        operation: "get_text_by_id",
        userId,
        textId: id,
      });

      throw new ApiException(
        "Failed to retrieve text",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async updateText(
    id: string,
    userId: string,
    updateTextDto: UpdateTextDto
  ): Promise<TextResponseDto> {
    const startTime = Date.now();

    try {
      // Log update attempt
      this.customLogger.logBusinessEvent("text_updated", {
        userId,
        textId: id,
        updatedFields: Object.keys(updateTextDto),
      });

      const updatedText = await this.textsRepository.updateUserText(
        id,
        userId,
        updateTextDto
      );

      if (!updatedText) {
        throw new ApiException(
          "Text not found",
          HttpStatus.NOT_FOUND,
          "TEXT_NOT_FOUND"
        );
      }

      // Log database operation
      this.customLogger.logDatabaseEvent("update", "texts", {
        userId,
        textId: id,
        title: updatedText.title,
        updatedFields: Object.keys(updateTextDto),
      });

      // Invalidate caches
      await this.invalidateTextCaches(id, userId);

      // Log successful update
      this.customLogger.logBusinessEvent("text_updated", {
        userId,
        textId: id,
        title: updatedText.title,
        success: true,
      });

      // Log performance
      this.customLogger.logPerformance("text_update", Date.now() - startTime, {
        userId,
        textId: id,
      });

      return this.mapToResponseDto(updatedText);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      this.customLogger.logError(error, {
        operation: "update_text",
        userId,
        textId: id,
      });

      throw new ApiException(
        "Failed to update text",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async deleteText(id: string, userId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get text info before deletion for logging
      const text = await this.textsRepository.findUserTextById(id, userId);
      if (!text) {
        throw new ApiException(
          "Text not found",
          HttpStatus.NOT_FOUND,
          "TEXT_NOT_FOUND"
        );
      }

      // Log deletion attempt
      this.customLogger.logBusinessEvent("text_deleted", {
        userId,
        textId: id,
        title: text.title,
      });

      const deleted = await this.textsRepository.deleteUserText(id, userId);

      if (!deleted) {
        throw new ApiException(
          "Failed to delete text",
          HttpStatus.INTERNAL_SERVER_ERROR,
          "DELETE_FAILED"
        );
      }

      // Log database operation
      this.customLogger.logDatabaseEvent("delete", "texts", {
        userId,
        textId: id,
        title: text.title,
      });

      // Invalidate caches
      await this.invalidateTextCaches(id, userId);

      // Log successful deletion
      this.customLogger.logBusinessEvent("text_deleted", {
        userId,
        textId: id,
        title: text.title,
        success: true,
      });

      // Log performance
      this.customLogger.logPerformance("text_delete", Date.now() - startTime, {
        userId,
        textId: id,
      });
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }

      this.customLogger.logError(error, {
        operation: "delete_text",
        userId,
        textId: id,
      });

      throw new ApiException(
        "Failed to delete text",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async getUserTextCount(userId: string): Promise<number> {
    try {
      const cacheKey = `user_text_count:${userId}`;

      // Try cache first
      const cachedCount = await this.cacheService.get<number>(cacheKey);
      if (cachedCount !== null) {
        return cachedCount;
      }

      // Query database
      const count = await this.textsRepository.getUserTextCount(userId);

      // Cache the result
      await this.cacheService.set(cacheKey, count, this.CACHE_TTL);

      return count;
    } catch (error) {
      this.customLogger.logError(error, {
        operation: "get_user_text_count",
        userId,
      });

      throw new ApiException(
        "Failed to get text count",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  private async cacheText(text: Text): Promise<void> {
    const cacheKey = `text:${text.id}:${text.user_id}`;
    const responseDto = this.mapToResponseDto(text);
    await this.cacheService.set(cacheKey, responseDto, this.CACHE_TTL);
  }

  private async invalidateTextCaches(
    textId: string,
    userId: string
  ): Promise<void> {
    // Invalidate specific text cache
    await this.cacheService.del(`text:${textId}:${userId}`);

    // Invalidate user's text list cache (all variations)
    await this.invalidateUserTextsCache(userId);

    // Invalidate user text count cache
    await this.cacheService.del(`user_text_count:${userId}`);
  }

  private async invalidateUserTextsCache(userId: string): Promise<void> {
    //invalidate common cache patterns
    const patterns = [`user_texts:${userId}:*`, `user_text_count:${userId}`];

    for (const pattern of patterns) {
      await this.cacheService.del(pattern);
    }
  }

  private mapToResponseDto(text: Text): TextResponseDto {
    return {
      id: text.id,
      title: text.title,
      content: text.content,
      user_id: text.user_id,
      word_count: text.word_count,
      character_count: text.character_count,
      sentence_count: text.sentence_count,
      paragraph_count: text.paragraph_count,
      longest_words: text.longest_words,
      analyzed_at: text.analyzed_at,
      created_at: text.created_at,
      updated_at: text.updated_at,
    };
  }
}
