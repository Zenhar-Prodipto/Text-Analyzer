import { ApiProperty } from "@nestjs/swagger";
import { AuthResponseDto } from "./auth-response.dto";
import { TokenResponseDto } from "./refresh-token.dto";
import { UserResponseDto } from "../../users/dto/user-response.dto";

export class AuthSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "User registered successfully" })
  message: string;

  @ApiProperty({ example: 201 })
  status: number;

  @ApiProperty({ type: AuthResponseDto })
  data: AuthResponseDto;
}

export class TokenSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Token refreshed successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({ type: TokenResponseDto })
  data: TokenResponseDto;
}

export class LogoutSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "User logged out successfully" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: "object",
    properties: {
      message: { type: "string", example: "Session terminated" },
    },
  })
  data: { message: string };
}

export class VerifyTokenSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "Token is valid" })
  message: string;

  @ApiProperty({ example: 200 })
  status: number;

  @ApiProperty({
    type: "object",
    properties: {
      user: {
        type: "object",
        properties: {
          id: { type: "string", example: "uuid-here" },
          email: { type: "string", example: "user@example.com" },
          name: { type: "string", example: "John Doe" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          created_at: { type: "string", example: "2025-07-11T18:45:00.000Z" },
        },
      },
    },
  })
  data: { user: Partial<UserResponseDto> };
}
