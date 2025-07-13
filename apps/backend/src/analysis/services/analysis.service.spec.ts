import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";
import { TextsService } from "../../texts/services/texts.service";
import { CacheService } from "../../cache/services/cache.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import { ApiException } from "../../common/exceptions/api.exception";
import { Text } from "../../texts/entities/text.entity";
import { User, Gender } from "../../users/entities/user.entity";

describe("AnalysisService", () => {
  let service: AnalysisService;
  let textsService: jest.Mocked<TextsService>;
  let cacheService: jest.Mocked<CacheService>;
  let customLogger: jest.Mocked<CustomLoggerService>;
  let configService: jest.Mocked<ConfigService>;

  // Test data
  const mockUserId = "user-123";
  const mockTextId = "text-456";
  const mockUser: User = {
    id: mockUserId,
    email: "test@example.com",
    name: "Test User",
    gender: Gender.MALE,
    password: "hashedpassword",
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockText: Text = {
    id: mockTextId,
    title: "Test Text",
    content:
      "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    user_id: mockUserId,
    user: mockUser,
    word_count: 16,
    character_count: 73,
    sentence_count: 2,
    paragraph_count: 1,
    longest_words: ["quick", "brown", "jumps", "slept"],
    analyzed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockTextsService = {
      getTextEntityById: jest.fn(),
      getTextEntityWithUser: jest.fn(),
      updateTextAnalysis: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockCustomLogger = {
      logPerformance: jest.fn(),
      logBusinessEvent: jest.fn(),
      logError: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(3600), // Default cache TTL
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: TextsService, useValue: mockTextsService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
    textsService = module.get(TextsService);
    cacheService = module.get(CacheService);
    customLogger = module.get(CustomLoggerService);
    configService = module.get(ConfigService);
  });

  describe("analyzeWordCount", () => {
    it("should return word count from cache when available", async () => {
      const cachedResult = {
        count: 16,
        text: mockText.content,
        textId: mockTextId,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.analyzeWordCount(mockTextId, mockUserId);

      expect(result).toEqual(cachedResult);
      expect(textsService.getTextEntityById).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:word_count:text-456"
      );
      expect(customLogger.logPerformance).toHaveBeenCalledWith(
        "word_count_analysis_cache_hit",
        expect.any(Number),
        expect.objectContaining({ cacheHit: true })
      );
    });

    it("should perform analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      const result = await service.analyzeWordCount(mockTextId, mockUserId);

      expect(result.count).toBe(16);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);
      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        { word_count: 16 }
      );
      expect(cacheService.set).toHaveBeenCalled();
      expect(customLogger.logBusinessEvent).toHaveBeenCalledWith(
        "analysis_performed",
        expect.objectContaining({ analysisType: "word_count" })
      );
    });

    it("should handle text not found error", async () => {
      const error = new ApiException(
        "Text not found",
        HttpStatus.NOT_FOUND,
        "TEXT_NOT_FOUND"
      );
      textsService.getTextEntityById.mockRejectedValue(error);

      await expect(
        service.analyzeWordCount(mockTextId, mockUserId)
      ).rejects.toThrow(error);
      expect(customLogger.logError).toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      const error = new Error("Database connection failed");
      textsService.getTextEntityById.mockRejectedValue(error);

      await expect(
        service.analyzeWordCount(mockTextId, mockUserId)
      ).rejects.toThrow(ApiException);
      expect(customLogger.logError).toHaveBeenCalled();
    });
  });

  describe("analyzeCharacterCount", () => {
    it("should return character count from cache when available", async () => {
      const cachedResult = {
        count: 73,
        text: mockText.content,
        textId: mockTextId,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.analyzeCharacterCount(
        mockTextId,
        mockUserId
      );

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:character_count:text-456"
      );
    });

    it("should perform character analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      const result = await service.analyzeCharacterCount(
        mockTextId,
        mockUserId
      );

      expect(result.count).toBe(73);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);
      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        { character_count: 73 }
      );
    });
  });

  describe("analyzeSentenceCount", () => {
    it("should return sentence count from cache when available", async () => {
      const cachedResult = {
        count: 2,
        text: mockText.content,
        textId: mockTextId,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.analyzeSentenceCount(mockTextId, mockUserId);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:sentence_count:text-456"
      );
    });

    it("should perform sentence analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      const result = await service.analyzeSentenceCount(mockTextId, mockUserId);

      expect(result.count).toBe(2);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);
      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        { sentence_count: 2 }
      );
    });
  });

  describe("analyzeParagraphCount", () => {
    it("should return paragraph count from cache when available", async () => {
      const cachedResult = {
        count: 1,
        text: mockText.content,
        textId: mockTextId,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.analyzeParagraphCount(
        mockTextId,
        mockUserId
      );

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:paragraph_count:text-456"
      );
    });

    it("should perform paragraph analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      const result = await service.analyzeParagraphCount(
        mockTextId,
        mockUserId
      );

      expect(result.count).toBe(1);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);
      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        { paragraph_count: 1 }
      );
    });
  });

  describe("analyzeLongestWords", () => {
    it("should return longest words from cache when available", async () => {
      const cachedResult = {
        longestWords: [
          {
            paragraph: 1,
            words: ["quick", "brown", "jumps", "slept"],
            length: 5,
          },
        ],
        text: mockText.content,
        textId: mockTextId,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.analyzeLongestWords(mockTextId, mockUserId);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:longest_words:text-456"
      );
    });

    it("should perform longest words analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      const result = await service.analyzeLongestWords(mockTextId, mockUserId);

      expect(result.longestWords).toHaveLength(1);
      expect(result.longestWords[0].paragraph).toBe(1);
      expect(result.longestWords[0].words).toContain("quick");
      expect(result.longestWords[0].words).toContain("brown");
      expect(result.longestWords[0].words).toContain("jumps");
      expect(result.longestWords[0].words).toContain("slept");
      expect(result.longestWords[0].length).toBe(5);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);

      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        { longest_words: ["quick", "brown", "jumps", "slept"] }
      );
    });
  });

  describe("performFullAnalysis", () => {
    it("should return full analysis from cache when available", async () => {
      const cachedResult = {
        wordCount: 16,
        characterCount: 73,
        sentenceCount: 2,
        paragraphCount: 1,
        longestWords: [
          {
            paragraph: 1,
            words: ["quick", "brown", "jumps", "slept"],
            length: 5,
          },
        ],
        text: mockText.content,
        textId: mockTextId,
        analyzedAt: mockText.analyzed_at,
      };

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.performFullAnalysis(mockTextId, mockUserId);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:full_analysis:text-456"
      );
    });

    it("should perform complete analysis when cache miss", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();
      cacheService.del.mockResolvedValue();

      const result = await service.performFullAnalysis(mockTextId, mockUserId);

      expect(result.wordCount).toBe(16);
      expect(result.characterCount).toBe(73);
      expect(result.sentenceCount).toBe(2);
      expect(result.paragraphCount).toBe(1);
      expect(result.longestWords).toHaveLength(1);
      expect(result.text).toBe(mockText.content);
      expect(result.textId).toBe(mockTextId);
      expect(result.analyzedAt).toBeInstanceOf(Date);

      // Should update text entity with all analysis results
      expect(textsService.updateTextAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId,
        {
          word_count: 16,
          character_count: 73,
          sentence_count: 2,
          paragraph_count: 1,
          longest_words: ["quick", "brown", "jumps", "slept"],
        }
      );

      // Should cache the complete result
      expect(cacheService.set).toHaveBeenCalledWith(
        "analysis:full_analysis:text-456",
        expect.objectContaining({ wordCount: 16 }),
        3600
      );

      // Should invalidate individual analysis caches
      expect(cacheService.del).toHaveBeenCalledTimes(5);
    });

    it("should not use cache if text not analyzed", async () => {
      const unanalyzedText = { ...mockText, analyzed_at: null };
      textsService.getTextEntityById.mockResolvedValue(unanalyzedText);
      cacheService.get.mockResolvedValue({ wordCount: 16 }); // Cached but text not analyzed
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();
      cacheService.del.mockResolvedValue();

      const result = await service.performFullAnalysis(mockTextId, mockUserId);

      expect(result.wordCount).toBe(16);
      expect(textsService.updateTextAnalysis).toHaveBeenCalled();
    });
  });

  describe("getAnalysisReport", () => {
    it("should return report from cache when available", async () => {
      const cachedResult = {
        textId: mockTextId,
        title: mockText.title,
        content: mockText.content,
        analysis: {
          wordCount: mockText.word_count,
          characterCount: mockText.character_count,
          sentenceCount: mockText.sentence_count,
          paragraphCount: mockText.paragraph_count,
          longestWords: mockText.longest_words,
          analyzedAt: mockText.analyzed_at,
        },
        owner: {
          userId: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        createdAt: mockText.created_at,
        updatedAt: mockText.updated_at,
      };

      textsService.getTextEntityWithUser.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getAnalysisReport(mockTextId, mockUserId);

      expect(result).toEqual(cachedResult);
      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:analysis_report:text-456"
      );
    });

    it("should generate report when cache miss and text is analyzed", async () => {
      textsService.getTextEntityWithUser.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockResolvedValue();

      const result = await service.getAnalysisReport(mockTextId, mockUserId);

      expect(result.textId).toBe(mockTextId);
      expect(result.title).toBe(mockText.title);
      expect(result.content).toBe(mockText.content);
      expect(result.analysis.wordCount).toBe(mockText.word_count);
      expect(result.analysis.characterCount).toBe(mockText.character_count);
      expect(result.analysis.sentenceCount).toBe(mockText.sentence_count);
      expect(result.analysis.paragraphCount).toBe(mockText.paragraph_count);
      expect(result.analysis.longestWords).toEqual(mockText.longest_words);
      expect(result.analysis.analyzedAt).toBe(mockText.analyzed_at);
      expect(result.owner.userId).toBe(mockUser.id);
      expect(result.owner.email).toBe(mockUser.email);
      expect(result.owner.name).toBe(mockUser.name);

      // Should cache the report with shorter TTL
      expect(cacheService.set).toHaveBeenCalledWith(
        "analysis:analysis_report:text-456",
        expect.any(Object),
        1800 // Half of default TTL
      );
    });

    it("should throw error if text not analyzed", async () => {
      const unanalyzedText = { ...mockText, analyzed_at: null };
      textsService.getTextEntityWithUser.mockResolvedValue(unanalyzedText);
      cacheService.get.mockResolvedValue(null);

      await expect(
        service.getAnalysisReport(mockTextId, mockUserId)
      ).rejects.toThrow(
        new ApiException(
          "Text has not been analyzed yet. Please run analysis first using POST /analysis/:textId/analyze",
          HttpStatus.BAD_REQUEST,
          "TEXT_NOT_ANALYZED"
        )
      );
    });

    it("should handle text not found error", async () => {
      const error = new ApiException(
        "Text not found",
        HttpStatus.NOT_FOUND,
        "TEXT_NOT_FOUND"
      );
      textsService.getTextEntityWithUser.mockRejectedValue(error);

      await expect(
        service.getAnalysisReport(mockTextId, mockUserId)
      ).rejects.toThrow(error);
      expect(customLogger.logError).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should preserve ApiException errors", async () => {
      const apiError = new ApiException(
        "Custom error",
        HttpStatus.FORBIDDEN,
        "FORBIDDEN"
      );
      textsService.getTextEntityById.mockRejectedValue(apiError);

      await expect(
        service.analyzeWordCount(mockTextId, mockUserId)
      ).rejects.toThrow(apiError);
      expect(customLogger.logError).toHaveBeenCalled();
    });

    it("should wrap unexpected errors in ApiException", async () => {
      const unexpectedError = new Error("Database timeout");
      textsService.getTextEntityById.mockRejectedValue(unexpectedError);

      await expect(
        service.analyzeWordCount(mockTextId, mockUserId)
      ).rejects.toThrow(ApiException);
      await expect(
        service.analyzeWordCount(mockTextId, mockUserId)
      ).rejects.toThrow("Word count analysis failed");
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate consistent cache keys", async () => {
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      await service.analyzeWordCount(mockTextId, mockUserId);

      expect(cacheService.get).toHaveBeenCalledWith(
        "analysis:word_count:text-456"
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        "analysis:word_count:text-456",
        expect.any(Object),
        3600
      );
    });
  });

  describe("Configuration", () => {
    it("should use configured cache TTL", async () => {
      const customConfigService = {
        get: jest.fn().mockReturnValue(7200), // 2 hours
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalysisService,
          { provide: TextsService, useValue: textsService },
          { provide: CacheService, useValue: cacheService },
          { provide: CustomLoggerService, useValue: customLogger },
          { provide: ConfigService, useValue: customConfigService },
        ],
      }).compile();

      const customService = module.get<AnalysisService>(AnalysisService);

      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      await customService.analyzeWordCount(mockTextId, mockUserId);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        7200
      );
    });

    it("should use default TTL when config not available", async () => {
      configService.get.mockReturnValue(undefined);
      textsService.getTextEntityById.mockResolvedValue(mockText);
      cacheService.get.mockResolvedValue(null);
      textsService.updateTextAnalysis.mockResolvedValue();
      cacheService.set.mockResolvedValue();

      await service.analyzeWordCount(mockTextId, mockUserId);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        3600 // Default fallback
      );
    });
  });
});
