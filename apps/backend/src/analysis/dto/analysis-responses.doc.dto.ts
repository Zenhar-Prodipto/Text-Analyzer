import { ApiProperty } from "@nestjs/swagger";
import { WordCountResponseDto } from "./word-count-response.dto";
import { CharacterCountResponseDto } from "./character-count-response.dto";
import { SentenceCountResponseDto } from "./sentence-count-response.dto";
import { ParagraphCountResponseDto } from "./paragraph-count-response.dto";
import { LongestWordsResponseDto } from "./longest-words-response.dto";
import { FullAnalysisResponseDto } from "./full-analysis-response.dto";
import { AnalysisReportResponseDto } from "./analysis-report-response.dto";

export class WordCountSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Word count analysis completed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: WordCountResponseDto })
  data: WordCountResponseDto;
}

export class CharacterCountSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Character count analysis completed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: CharacterCountResponseDto })
  data: CharacterCountResponseDto;
}

export class SentenceCountSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Sentence count analysis completed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: SentenceCountResponseDto })
  data: SentenceCountResponseDto;
}

export class ParagraphCountSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Paragraph count analysis completed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: ParagraphCountResponseDto })
  data: ParagraphCountResponseDto;
}

export class LongestWordsSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Longest words analysis completed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: LongestWordsResponseDto })
  data: LongestWordsResponseDto;
}

export class FullAnalysisSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Complete text analysis performed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: FullAnalysisResponseDto })
  data: FullAnalysisResponseDto;
}

// Add this to existing file
export class AnalysisReportSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Analysis report retrieved successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: AnalysisReportResponseDto })
  data: AnalysisReportResponseDto;
}
