import { HttpException, HttpStatus } from "@nestjs/common";

export class ApiException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    error?: string,
    details?: Record<string, any>
  ) {
    super(
      {
        success: false,
        message,
        status,
        error: process.env.NODE_ENV === "production" ? undefined : error,
        ...(details && { details }),
      },
      status
    );
  }
}

export interface ApiSuccess<T> {
  success: boolean;
  message: string;
  status: number;
  data: T;
}
