import { ApiProperty } from "@nestjs/swagger";

export class CharacterCountResponseDto {
  @ApiProperty({
    example: 78,
    description:
      "Total number of characters in the text (letters and spaces only, punctuation ignored)",
  })
  count: number;

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
