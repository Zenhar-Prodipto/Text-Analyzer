import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { CustomLoggerService } from "../../shared/services/logger.service";

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  constructor(private readonly customLogger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const method = request.method;
    const endpoint = request.route?.path || request.url;
    const userAgent = request.headers["user-agent"];
    const ip = this.getClientIp(request);

    // Get user info if available
    const user = (request as any).user;
    const userId = user?.id;
    const userEmail = user?.email;

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;

          // Log successful API request
          this.customLogger.logApiRequest(
            method,
            endpoint,
            response.statusCode,
            responseTime,
            {
              userId,
              email: userEmail,
              ip,
              userAgent,
              requestSize: this.getRequestSize(request),
              responseSize: this.getResponseSize(data),
            }
          );

          // Log performance warning for slow requests
          if (responseTime > 1000) {
            this.customLogger.logPerformance("slow_api_request", responseTime, {
              userId,
              email: userEmail,
              endpoint,
              method,
              warning: "Request took longer than 1 second",
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // Log API error
          this.customLogger.logError(error, {
            operation: "api_request",
            userId,
            email: userEmail,
            ip,
            userAgent,
            endpoint,
            method,
            responseTime,
          });

          // Log as security event if it's an auth-related error
          if (error.status === 401 || error.status === 403) {
            this.customLogger.logSecurityEvent("unauthorized_access", "warn", {
              userId,
              email: userEmail,
              ip,
              userAgent,
              endpoint,
              method,
              errorMessage: error.message,
            });
          }
        },
      })
    );
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    const ip = forwarded
      ? Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(",")[0]
      : request.connection.remoteAddress || request.socket.remoteAddress;

    return ip || "unknown";
  }

  private getRequestSize(request: Request): number {
    const contentLength = request.headers["content-length"];
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
