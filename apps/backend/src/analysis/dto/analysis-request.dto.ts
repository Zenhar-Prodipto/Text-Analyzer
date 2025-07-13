import { IsString, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

export class AnalysisRequestDto {
  @ApiProperty({
    example:
      "The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.",
    description: "Text content to be analyzed",
    maxLength: 100000,
  })
  @IsString()
  @IsNotEmpty({ message: "Text content is required" })
  @MaxLength(100000, { message: "Text cannot exceed 100,000 characters" })
  @Transform(({ value }) => value?.toString().trim())
  text: string;
}
