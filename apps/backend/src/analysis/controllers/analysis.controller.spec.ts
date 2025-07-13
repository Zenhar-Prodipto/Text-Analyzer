import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { AnalysisController } from "./analysis.controller";
import { AnalysisService } from "../services/analysis.service";
import { ApiException } from "../../common/exceptions/api.exception";

describe("AnalysisController", () => {
  let controller: AnalysisController;
  let analysisService: jest.Mocked<AnalysisService>;

  // Test data
  const mockUserId = "user-123";
  const mockTextId = "text-456";

  const mockWordCountResponse = {
    count: 16,
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
  };

  const mockCharacterCountResponse = {
    count: 73,
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
  };

  const mockSentenceCountResponse = {
    count: 2,
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
  };

  const mockParagraphCountResponse = {
    count: 1,
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
  };

  const mockLongestWordsResponse = {
    longestWords: [
      {
        paragraph: 1,
        words: ["quick", "brown", "jumps", "slept"],
        length: 5,
      },
    ],
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
  };

  const mockFullAnalysisResponse = {
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
    text: "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    textId: mockTextId,
    analyzedAt: new Date(),
  };

  const mockAnalysisReportResponse = {
    textId: mockTextId,
    title: "Test Text",
    content:
      "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    analysis: {
      wordCount: 16,
      characterCount: 73,
      sentenceCount: 2,
      paragraphCount: 1,
      longestWords: ["quick", "brown", "jumps", "slept"],
      analyzedAt: new Date(),
    },
    owner: {
      userId: mockUserId,
      email: "test@example.com",
      name: "Test User",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAnalysisService = {
      analyzeWordCount: jest.fn(),
      analyzeCharacterCount: jest.fn(),
      analyzeSentenceCount: jest.fn(),
      analyzeParagraphCount: jest.fn(),
      analyzeLongestWords: jest.fn(),
      performFullAnalysis: jest.fn(),
      getAnalysisReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [{ provide: AnalysisService, useValue: mockAnalysisService }],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
    analysisService = module.get(AnalysisService);
  });

  describe("getWordCount", () => {
    it("should return word count analysis successfully", async () => {
      analysisService.analyzeWordCount.mockResolvedValue(mockWordCountResponse);

      const result = await controller.getWordCount(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Word count analysis completed successfully",
        status: HttpStatus.OK,
        data: mockWordCountResponse,
      });
      expect(analysisService.analyzeWordCount).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Text not found",
        HttpStatus.NOT_FOUND,
        "TEXT_NOT_FOUND"
      );
      analysisService.analyzeWordCount.mockRejectedValue(error);

      await expect(
        controller.getWordCount(mockTextId, mockUserId)
      ).rejects.toThrow(error);
      expect(analysisService.analyzeWordCount).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });
  });

  describe("getCharacterCount", () => {
    it("should return character count analysis successfully", async () => {
      analysisService.analyzeCharacterCount.mockResolvedValue(
        mockCharacterCountResponse
      );

      const result = await controller.getCharacterCount(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Character count analysis completed successfully",
        status: HttpStatus.OK,
        data: mockCharacterCountResponse,
      });
      expect(analysisService.analyzeCharacterCount).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Unauthorized",
        HttpStatus.UNAUTHORIZED,
        "UNAUTHORIZED"
      );
      analysisService.analyzeCharacterCount.mockRejectedValue(error);

      await expect(
        controller.getCharacterCount(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("getSentenceCount", () => {
    it("should return sentence count analysis successfully", async () => {
      analysisService.analyzeSentenceCount.mockResolvedValue(
        mockSentenceCountResponse
      );

      const result = await controller.getSentenceCount(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Sentence count analysis completed successfully",
        status: HttpStatus.OK,
        data: mockSentenceCountResponse,
      });
      expect(analysisService.analyzeSentenceCount).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "ANALYSIS_FAILED"
      );
      analysisService.analyzeSentenceCount.mockRejectedValue(error);

      await expect(
        controller.getSentenceCount(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("getParagraphCount", () => {
    it("should return paragraph count analysis successfully", async () => {
      analysisService.analyzeParagraphCount.mockResolvedValue(
        mockParagraphCountResponse
      );

      const result = await controller.getParagraphCount(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Paragraph count analysis completed successfully",
        status: HttpStatus.OK,
        data: mockParagraphCountResponse,
      });
      expect(analysisService.analyzeParagraphCount).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Rate limit exceeded",
        HttpStatus.TOO_MANY_REQUESTS,
        "RATE_LIMIT"
      );
      analysisService.analyzeParagraphCount.mockRejectedValue(error);

      await expect(
        controller.getParagraphCount(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("getLongestWords", () => {
    it("should return longest words analysis successfully", async () => {
      analysisService.analyzeLongestWords.mockResolvedValue(
        mockLongestWordsResponse
      );

      const result = await controller.getLongestWords(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Longest words analysis completed successfully",
        status: HttpStatus.OK,
        data: mockLongestWordsResponse,
      });
      expect(analysisService.analyzeLongestWords).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Text not found",
        HttpStatus.NOT_FOUND,
        "TEXT_NOT_FOUND"
      );
      analysisService.analyzeLongestWords.mockRejectedValue(error);

      await expect(
        controller.getLongestWords(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("performFullAnalysis", () => {
    it("should perform complete analysis successfully", async () => {
      analysisService.performFullAnalysis.mockResolvedValue(
        mockFullAnalysisResponse
      );

      const result = await controller.performFullAnalysis(
        mockTextId,
        mockUserId
      );

      expect(result).toEqual({
        success: true,
        message: "Complete text analysis performed successfully",
        status: HttpStatus.OK,
        data: mockFullAnalysisResponse,
      });
      expect(analysisService.performFullAnalysis).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Analysis failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "ANALYSIS_FAILED"
      );
      analysisService.performFullAnalysis.mockRejectedValue(error);

      await expect(
        controller.performFullAnalysis(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("getAnalysisReport", () => {
    it("should return analysis report successfully", async () => {
      analysisService.getAnalysisReport.mockResolvedValue(
        mockAnalysisReportResponse
      );

      const result = await controller.getAnalysisReport(mockTextId, mockUserId);

      expect(result).toEqual({
        success: true,
        message: "Analysis report retrieved successfully",
        status: HttpStatus.OK,
        data: mockAnalysisReportResponse,
      });
      expect(analysisService.getAnalysisReport).toHaveBeenCalledWith(
        mockTextId,
        mockUserId
      );
    });

    it("should handle text not analyzed error", async () => {
      const error = new ApiException(
        "Text has not been analyzed yet. Please run analysis first using POST /analysis/:textId/analyze",
        HttpStatus.BAD_REQUEST,
        "TEXT_NOT_ANALYZED"
      );
      analysisService.getAnalysisReport.mockRejectedValue(error);

      await expect(
        controller.getAnalysisReport(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });

    it("should handle service errors", async () => {
      const error = new ApiException(
        "Text not found",
        HttpStatus.NOT_FOUND,
        "TEXT_NOT_FOUND"
      );
      analysisService.getAnalysisReport.mockRejectedValue(error);

      await expect(
        controller.getAnalysisReport(mockTextId, mockUserId)
      ).rejects.toThrow(error);
    });
  });

  describe("Controller Dependencies", () => {
    it("should be defined", () => {
      expect(controller).toBeDefined();
    });

    it("should have analysis service injected", () => {
      expect(analysisService).toBeDefined();
    });
  });

  describe("Response Format Consistency", () => {
    it("should return consistent success response format for all endpoints", async () => {
      const endpoints = [
        {
          method: "analyzeWordCount",
          controller: "getWordCount",
          response: mockWordCountResponse,
        },
        {
          method: "analyzeCharacterCount",
          controller: "getCharacterCount",
          response: mockCharacterCountResponse,
        },
        {
          method: "analyzeSentenceCount",
          controller: "getSentenceCount",
          response: mockSentenceCountResponse,
        },
        {
          method: "analyzeParagraphCount",
          controller: "getParagraphCount",
          response: mockParagraphCountResponse,
        },
        {
          method: "analyzeLongestWords",
          controller: "getLongestWords",
          response: mockLongestWordsResponse,
        },
        {
          method: "performFullAnalysis",
          controller: "performFullAnalysis",
          response: mockFullAnalysisResponse,
        },
        {
          method: "getAnalysisReport",
          controller: "getAnalysisReport",
          response: mockAnalysisReportResponse,
        },
      ];

      for (const endpoint of endpoints) {
        analysisService[endpoint.method].mockResolvedValue(endpoint.response);

        const result = await controller[endpoint.controller](
          mockTextId,
          mockUserId
        );

        expect(result).toHaveProperty("success", true);
        expect(result).toHaveProperty("message");
        expect(result).toHaveProperty("status", HttpStatus.OK);
        expect(result).toHaveProperty("data");
        expect(typeof result.message).toBe("string");
        expect(result.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Parameter Validation", () => {
    it("should pass correct parameters to service methods", async () => {
      analysisService.analyzeWordCount.mockResolvedValue(mockWordCountResponse);
      analysisService.analyzeCharacterCount.mockResolvedValue(
        mockCharacterCountResponse
      );
      analysisService.analyzeSentenceCount.mockResolvedValue(
        mockSentenceCountResponse
      );
      analysisService.analyzeParagraphCount.mockResolvedValue(
        mockParagraphCountResponse
      );
      analysisService.analyzeLongestWords.mockResolvedValue(
        mockLongestWordsResponse
      );
      analysisService.performFullAnalysis.mockResolvedValue(
        mockFullAnalysisResponse
      );
      analysisService.getAnalysisReport.mockResolvedValue(
        mockAnalysisReportResponse
      );

      const testTextId = "test-text-id";
      const testUserId = "test-user-id";

      await controller.getWordCount(testTextId, testUserId);
      await controller.getCharacterCount(testTextId, testUserId);
      await controller.getSentenceCount(testTextId, testUserId);
      await controller.getParagraphCount(testTextId, testUserId);
      await controller.getLongestWords(testTextId, testUserId);
      await controller.performFullAnalysis(testTextId, testUserId);
      await controller.getAnalysisReport(testTextId, testUserId);

      expect(analysisService.analyzeWordCount).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.analyzeCharacterCount).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.analyzeSentenceCount).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.analyzeParagraphCount).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.analyzeLongestWords).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.performFullAnalysis).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
      expect(analysisService.getAnalysisReport).toHaveBeenCalledWith(
        testTextId,
        testUserId
      );
    });
  });

  describe("Error Propagation", () => {
    it("should propagate different HTTP status codes correctly", async () => {
      const testCases = [
        { status: HttpStatus.NOT_FOUND, code: "TEXT_NOT_FOUND" },
        { status: HttpStatus.UNAUTHORIZED, code: "UNAUTHORIZED" },
        { status: HttpStatus.FORBIDDEN, code: "FORBIDDEN" },
        { status: HttpStatus.BAD_REQUEST, code: "BAD_REQUEST" },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, code: "INTERNAL_ERROR" },
        { status: HttpStatus.TOO_MANY_REQUESTS, code: "RATE_LIMIT" },
      ];

      for (const testCase of testCases) {
        const error = new ApiException(
          "Test error",
          testCase.status,
          testCase.code
        );
        analysisService.analyzeWordCount.mockRejectedValue(error);

        await expect(
          controller.getWordCount(mockTextId, mockUserId)
        ).rejects.toThrow(error);
      }
    });
  });
});
