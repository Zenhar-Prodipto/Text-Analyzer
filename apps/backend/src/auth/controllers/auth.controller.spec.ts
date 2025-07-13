import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockSignupDto = {
    email: "test@example.com",
    password: "Password123!",
    name: "Test User",
    gender: "male" as any,
  };

  const mockAuthResponse = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    gender: "male" as any,
    access_token: "token123",
    refresh_token: "refresh123",
    expires_in: 3600,
  };

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe("signup", () => {
    it("should create user successfully", async () => {
      authService.signup.mockResolvedValue(mockAuthResponse);
      const mockRequest = { headers: { "user-agent": "test-agent" } };
      const mockIp = "127.0.0.1";

      const result = await controller.signup(
        mockSignupDto,
        mockRequest as any,
        mockIp
      );

      expect(result).toEqual({
        success: true,
        message: "User registered successfully",
        status: HttpStatus.CREATED,
        data: mockAuthResponse,
      });
      expect(authService.signup).toHaveBeenCalledWith(
        mockSignupDto,
        "test-agent",
        mockIp
      );
    });
  });
});
