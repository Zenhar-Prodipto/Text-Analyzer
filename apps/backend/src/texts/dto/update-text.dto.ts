import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateTextDto {
  @ApiProperty({ 
    example: 'Updated Analysis Text',
    description: 'Title of the text document',
    required: false,
    maxLength: 255,
    minLength: 1
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiProperty({ 
    example: 'The updated quick brown fox jumps over the lazy dog.',
    description: 'Text content to be analyzed',
    required: false,
    maxLength: 100000
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(100000, { message: 'Content cannot exceed 100,000 characters' })
  @Transform(({ value }) => value?.trim())
  content?: string;
}
