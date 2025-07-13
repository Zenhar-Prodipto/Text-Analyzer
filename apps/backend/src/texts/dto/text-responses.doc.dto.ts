import { ApiProperty } from "@nestjs/swagger";
import { TextResponseDto } from "./text-response.dto";

export class TextSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Text created successfully" })
  message: string;

  @ApiProperty({ example: 201 })
  status: number;

  @ApiProperty({ type: TextResponseDto })
  data: TextResponseDto;
}

export class TextListSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Texts retrieved successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: "object",
    properties: {
      texts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", example: "uuid-here" },
            title: { type: "string", example: "My Analysis Text" },
            content: { type: "string", example: "The quick brown fox..." },
            user_id: { type: "string", example: "user-uuid-here" },
            word_count: { type: "number", example: 15 },
            character_count: { type: "number", example: 78 },
            sentence_count: { type: "number", example: 2 },
            paragraph_count: { type: "number", example: 1 },
            longest_words: {
              type: "array",
              items: { type: "string" },
              example: ["quick", "brown"],
            },
            analyzed_at: {
              type: "string",
              example: "2025-07-11T19:45:00.000Z",
              nullable: true,
            },
            created_at: { type: "string", example: "2025-07-11T19:45:00.000Z" },
            updated_at: { type: "string", example: "2025-07-11T19:45:00.000Z" },
          },
        },
      },
      pagination: {
        type: "object",
        properties: {
          page: { type: "number", example: 1 },
          limit: { type: "number", example: 10 },
          total: { type: "number", example: 25 },
          totalPages: { type: "number", example: 3 },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
        },
      },
    },
  })
  data: {
    texts: TextResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export class TextDeleteSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Text deleted successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: "object",
    properties: {
      message: { type: "string", example: "Text deleted successfully" },
    },
  })
  data: { message: string };
}

export class TextCountSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Text count retrieved successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: "object",
    properties: {
      count: { type: "number", example: 15 },
    },
  })
  data: { count: number };
}
