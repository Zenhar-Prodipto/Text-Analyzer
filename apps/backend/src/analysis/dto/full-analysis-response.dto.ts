import { ApiProperty } from "@nestjs/swagger";

export class FullAnalysisResponseDto {
  @ApiProperty({
    example: 13,
    description: "Total number of words in the text",
  })
  wordCount: number;

  @ApiProperty({
    example: 78,
    description:
      "Total number of characters in the text (letters and spaces only)",
  })
  characterCount: number;

  @ApiProperty({
    example: 2,
    description: "Total number of sentences in the text",
  })
  sentenceCount: number;

  @ApiProperty({
    example: 1,
    description: "Total number of paragraphs in the text",
  })
  paragraphCount: number;

  @ApiProperty({
    example: [
      {
        paragraph: 1,
        words: ["brown", "jumps"],
        length: 5,
      },
    ],
    description: "Longest words found in each paragraph",
  })
  longestWords: Array<{
    paragraph: number;
    words: string[];
    length: number;
  }>;

  @ApiProperty({
    example:
      "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    description: "The original text content that was analyzed",
  })
  text: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "UUID of the analyzed text",
  })
  textId: string;

  @ApiProperty({
    example: "2025-07-12T10:30:00.000Z",
    description: "Timestamp when the analysis was completed",
  })
  analyzedAt: Date;
}
