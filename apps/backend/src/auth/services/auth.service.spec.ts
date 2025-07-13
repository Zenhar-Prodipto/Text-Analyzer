import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../../users/services/users.service";
import { CustomLoggerService } from "../../shared/services/logger.service";
import { CacheService } from "../../cache/services/cache.service";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    gender: "male" as any,
    password: "hashedpassword",
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockUsersService = { createUser: jest.fn() };
    const mockJwtService = { sign: jest.fn().mockReturnValue("token123") };
    const mockConfigService = { get: jest.fn().mockReturnValue("3600") };
    const mockLogger = {
      logAuthEvent: jest.fn(),
      logPerformance: jest.fn(),
      logSecurityEvent: jest.fn(),
      logError: jest.fn(),
    };
    const mockCache = { set: jest.fn() };
    const mockRefreshRepo = { createRefreshToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CustomLoggerService, useValue: mockLogger },
        { provide: CacheService, useValue: mockCache },
        { provide: RefreshTokenRepository, useValue: mockRefreshRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  describe("signup", () => {
    it("should create user and return auth response", async () => {
      const signupDto = {
        email: "test@example.com",
        password: "Password123!",
        name: "Test User",
        gender: "male" as any,
      };

      usersService.createUser.mockResolvedValue(mockUser);

      const result = await service.signup(signupDto, "test-agent", "127.0.0.1");

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.access_token).toBeDefined();
      expect(usersService.createUser).toHaveBeenCalledWith(signupDto);
    });
  });
});
