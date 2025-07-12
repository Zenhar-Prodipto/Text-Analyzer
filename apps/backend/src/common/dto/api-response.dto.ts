import { ApiProperty } from '@nestjs/swagger';

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty()
  data: T;
}

// Helper function to create typed response DTOs
export function createApiSuccessResponseDto<T>(
  dataType: new () => T,
  message: string = 'Operation completed successfully'
) {
  class ApiSuccessResponse extends ApiSuccessResponseDto<T> {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: message })
    message: string;

    @ApiProperty({ example: 200 })
    status: number;

    @ApiProperty({ type: dataType })
    data: T;
  }
  
  return ApiSuccessResponse;
}
