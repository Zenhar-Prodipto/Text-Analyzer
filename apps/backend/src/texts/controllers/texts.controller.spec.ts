import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { TextsController } from "./texts.controller";
import { TextsService } from "../services/texts.service";

describe("TextsController", () => {
  let controller: TextsController;
  let textsService: jest.Mocked<TextsService>;

  const mockCreateTextDto = {
    title: "Test Text",
    content: "This is test content for analysis.",
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
    const mockTextsService = {
      createText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextsController],
      providers: [{ provide: TextsService, useValue: mockTextsService }],
    }).compile();

    controller = module.get<TextsController>(TextsController);
    textsService = module.get(TextsService);
  });

  describe("createText", () => {
    it("should create text successfully", async () => {
      textsService.createText.mockResolvedValue(mockTextResponse);
      const userId = "user-123";

      const result = await controller.createText(mockCreateTextDto, userId);

      expect(result).toEqual({
        success: true,
        message: "Text created successfully",
        status: HttpStatus.CREATED,
        data: mockTextResponse,
      });
      expect(textsService.createText).toHaveBeenCalledWith(
        mockCreateTextDto,
        userId
      );
    });
  });
});
