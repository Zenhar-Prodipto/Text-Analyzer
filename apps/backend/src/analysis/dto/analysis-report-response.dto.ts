import { ApiProperty } from "@nestjs/swagger";

export class AnalysisReportResponseDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "UUID of the analyzed text",
  })
  textId: string;

  @ApiProperty({
    example: "Sample Multi-Paragraph Text",
    description: "Title of the text",
  })
  title: string;

  @ApiProperty({
    example:
      "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    description: "The original text content",
  })
  content: string;

  @ApiProperty({
    example: {
      wordCount: 13,
      characterCount: 78,
      sentenceCount: 2,
      paragraphCount: 1,
      longestWords: ["brown", "jumps", "slept"],
      analyzedAt: "2025-07-12T10:30:00.000Z",
    },
    description: "Complete analysis results",
  })
  analysis: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
    longestWords: string[];
    analyzedAt: Date | null;
  };

  @ApiProperty({
    example: {
      userId: "user-550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      name: "John Doe",
    },
    description: "Information about the text owner",
  })
  owner: {
    userId: string;
    email: string;
    name: string;
  };

  @ApiProperty({
    example: "2025-07-11T18:45:00.000Z",
    description: "When the text was created",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2025-07-12T10:30:00.000Z",
    description: "When the text was last updated",
  })
  updatedAt: Date;
}
