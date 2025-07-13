import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTextDto {
  @ApiProperty({ 
    example: 'My Analysis Text',
    description: 'Title of the text document',
    maxLength: 255,
    minLength: 1
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({ 
    example: 'The quick brown fox jumps over the lazy dog. The lazy dog slept in the sun.',
    description: 'Text content to be analyzed',
    maxLength: 100000
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(100000, { message: 'Content cannot exceed 100,000 characters' })
  @Transform(({ value }) => value?.trim())
  content: string;
}
