import { TextResponseDto } from "../dto/text-response.dto";

export interface PaginatedTextsResponse {
  texts: TextResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
