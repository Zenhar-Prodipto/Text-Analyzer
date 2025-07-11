import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../users/services/users.service";
import { SignupDto } from "../dto/signup.dto";
import { LoginDto } from "../dto/login.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { ApiException } from "../../common/exceptions/api.exception";
import { HttpStatus } from "@nestjs/common";
import { JwtPayload } from "../strategies/jwt.strategy";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.createUser(signupDto);
      const token = await this.generateToken(user.id, user.email);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        "Signup failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.validateUserPassword(
        loginDto.email,
        loginDto.password
      );

      if (!user) {
        throw new ApiException(
          "Invalid email or password",
          HttpStatus.UNAUTHORIZED,
          "INVALID_CREDENTIALS"
        );
      }

      const token = await this.generateToken(user.id, user.email);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        gender: user.gender,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        "Login failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  private async generateToken(userId: string, email: string): Promise<string> {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
