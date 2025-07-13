import { Injectable, Logger, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

interface LogContext {
  service?: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class CustomLoggerService extends Logger implements LoggerService {
  private readonly logDir = "/app/logs";

  constructor(private readonly configService: ConfigService) {
    super("TextAnalyzer");
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeToFile(filename: string, logData: any) {
    const logPath = path.join(this.logDir, filename);
    const logLine = JSON.stringify(logData) + "\n";

    try {
      fs.appendFileSync(logPath, logLine);
    } catch (error) {
      super.error(
        `Failed to write to log file: ${error.message}`,
        "CustomLoggerService"
      );
    }
  }

  private formatLog(level: string, message: string, context?: LogContext) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: "text-analyzer",
      environment: this.configService.get("NODE_ENV", "development"),
      ...context,
    };
  }

  // Auth Events
  logAuthEvent(
    event:
      | "signup"
      | "login"
      | "logout"
      | "logout_all"
      | "token_refresh"
      | "token_verify",
    context: LogContext
  ) {
    const logData = this.formatLog("INFO", `Auth event: ${event}`, {
      event_type: "auth",
      auth_event: event,
      ...context,
    });

    this.log(JSON.stringify(logData), "AuthService");
    this.writeToFile("application.log", logData);
  }

  // Security Events
  logSecurityEvent(
    event:
      | "rate_limit_exceeded"
      | "unauthorized_access"
      | "invalid_token"
      | "brute_force_attempt",
    level: "warn" | "error",
    context: LogContext
  ) {
    const logData = this.formatLog(
      level.toUpperCase(),
      `Security event: ${event}`,
      {
        event_type: "security",
        security_event: event,
        ...context,
      }
    );

    if (level === "warn") {
      this.warn(JSON.stringify(logData), "SecurityService");
    } else {
      this.error(JSON.stringify(logData), "SecurityService");
    }

    this.writeToFile("application.log", logData);
  }

  // API Request Events
  logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ) {
    const logData = this.formatLog(
      "INFO",
      `API request: ${method} ${endpoint}`,
      {
        event_type: "api_request",
        method,
        endpoint,
        statusCode,
        responseTime,
        ...context,
      }
    );

    this.log(JSON.stringify(logData), "ApiService");
    this.writeToFile("application.log", logData);
  }

  // Business Logic Events
  logBusinessEvent(
    event:
      | "text_created"
      | "text_updated"
      | "text_deleted"
      | "analysis_performed",
    context: LogContext
  ) {
    const logData = this.formatLog("INFO", `Business event: ${event}`, {
      event_type: "business",
      business_event: event,
      ...context,
    });

    this.log(JSON.stringify(logData), "BusinessService");
    this.writeToFile("application.log", logData);
  }

  // Error Events
  logError(error: Error, context?: LogContext) {
    const logData = this.formatLog("ERROR", error.message, {
      event_type: "error",
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    });

    this.error(JSON.stringify(logData), "ErrorService");
    this.writeToFile("error.log", logData);
  }

  // Performance Events
  logPerformance(operation: string, duration: number, context?: LogContext) {
    const logData = this.formatLog("INFO", `Performance: ${operation}`, {
      event_type: "performance",
      operation,
      duration_ms: duration,
      ...context,
    });

    this.log(JSON.stringify(logData), "PerformanceService");
    this.writeToFile("application.log", logData);
  }

  // Database Events
  logDatabaseEvent(
    operation: "create" | "read" | "update" | "delete",
    table: string,
    context?: LogContext
  ) {
    const logData = this.formatLog("DEBUG", `Database ${operation}: ${table}`, {
      event_type: "database",
      db_operation: operation,
      table,
      ...context,
    });

    this.debug(JSON.stringify(logData), "DatabaseService");
    this.writeToFile("application.log", logData);
  }
}
