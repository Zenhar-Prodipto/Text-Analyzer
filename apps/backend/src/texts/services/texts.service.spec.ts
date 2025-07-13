import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { TextsService } from "./texts.service";
import { TextsRepository } from "../repositories/texts.repository";
import { CacheService } from "../../cache/services/cache.service";
import { CustomLoggerService } from "../../shared/services/logger.service";

describe("TextsService", () => {
  let service: TextsService;
  let textsRepository: jest.Mocked<TextsRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let customLogger: jest.Mocked<CustomLoggerService>;

  const mockCreateTextDto = {
    title: "Test Text",
    content: "This is test content for analysis.",
  };

  const mockText = {
    id: "text-123",
    title: "Test Text",
    content: "This is test content for analysis.",
    user_id: "user-123",
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      gender: "male" as any,
      password: "hashedpassword",
      created_at: new Date(),
      updated_at: new Date(),
    },
    word_count: 0,
    character_count: 0,
    sentence_count: 0,
    paragraph_count: 0,
    longest_words: null,
    analyzed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTextResponse = {
    id: "text-123",
    title: "Test Text",
    content: "This is test content for analysis.",
    user_id: "user-123",
    word_count: 0,
    character_count: 0,
    sentence_count: 0,
    paragraph_count: 0,
    longest_words: null,
    analyzed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockTextsRepository = {
      createText: jest.fn(),
    };

    const mockCacheService = {
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockCustomLogger = {
      logBusinessEvent: jest.fn(),
      logDatabaseEvent: jest.fn(),
      logPerformance: jest.fn(),
      logError: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue(3600),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextsService,
        { provide: TextsRepository, useValue: mockTextsRepository },
        { provide: CacheService, useValue: mockCacheService },
        { provide: CustomLoggerService, useValue: mockCustomLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TextsService>(TextsService);
    textsRepository = module.get(TextsRepository);
    cacheService = module.get(CacheService);
    customLogger = module.get(CustomLoggerService);

    // Mock the private methods that are called internally
    jest.spyOn(service as any, "cacheText").mockResolvedValue(undefined);
    jest
      .spyOn(service as any, "invalidateUserTextsCache")
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, "mapToResponseDto")
      .mockReturnValue(mockTextResponse);
  });

  describe("createText", () => {
    it("should create text successfully", async () => {
      textsRepository.createText.mockResolvedValue(mockText);
      const userId = "user-123";

      const result = await service.createText(mockCreateTextDto, userId);

      expect(result).toEqual(mockTextResponse);
      expect(textsRepository.createText).toHaveBeenCalledWith(
        mockCreateTextDto,
        userId
      );
      expect(customLogger.logBusinessEvent).toHaveBeenCalled();
      expect(customLogger.logDatabaseEvent).toHaveBeenCalled();
      expect(customLogger.logPerformance).toHaveBeenCalled();
    });
  });
});
