import { ApiProperty } from "@nestjs/swagger";

export class LongestWordsResponseDto {
  @ApiProperty({
    example: [
      {
        paragraph: 1,
        words: ["brown", "jumps"],
        length: 5,
      },
      {
        paragraph: 2,
        words: ["slept"],
        length: 5,
      },
    ],
    description: "Longest words found in each paragraph with their lengths",
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
}
