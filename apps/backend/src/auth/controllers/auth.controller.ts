import { Controller, Post, Body, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "../services/auth.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { Public } from "../../common/decorators/public.decorator";
import { ApiSuccess } from "../../common/exceptions/api.exception";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  @ApiOperation({ summary: "User registration" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async signup(
    @Body() signupDto: SignupDto
  ): Promise<ApiSuccess<AuthResponseDto>> {
    const data = await this.authService.signup(signupDto);
    return {
      success: true,
      message: "User registered successfully",
      status: HttpStatus.CREATED,
      data,
    };
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto
  ): Promise<ApiSuccess<AuthResponseDto>> {
    const data = await this.authService.login(loginDto);
    return {
      success: true,
      message: "User logged in successfully",
      status: HttpStatus.OK,
      data,
    };
  }
}
