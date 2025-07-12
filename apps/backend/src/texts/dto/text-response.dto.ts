import { ApiProperty } from '@nestjs/swagger';

export class TextResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'My Analysis Text' })
  title: string;

  @ApiProperty({ example: 'The quick brown fox jumps over the lazy dog.' })
  content: string;

  @ApiProperty({ example: 'user-uuid-here' })
  user_id: string;

  @ApiProperty({ example: 15, description: 'Cached word count (0 if not analyzed)' })
  word_count: number;

  @ApiProperty({ example: 78, description: 'Cached character count (0 if not analyzed)' })
  character_count: number;

  @ApiProperty({ example: 2, description: 'Cached sentence count (0 if not analyzed)' })
  sentence_count: number;

  @ApiProperty({ example: 1, description: 'Cached paragraph count (0 if not analyzed)' })
  paragraph_count: number;

  @ApiProperty({ 
    example: ['quick', 'brown', 'jumps'], 
    description: 'Cached longest words (null if not analyzed)' 
  })
  longest_words: string[] | null;

  @ApiProperty({ example: '2025-07-11T19:45:00.000Z', nullable: true })
  analyzed_at: Date | null;

  @ApiProperty({ example: '2025-07-11T19:45:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2025-07-11T19:45:00.000Z' })
  updated_at: Date;
}
