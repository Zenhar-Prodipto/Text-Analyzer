import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "../../users/entities/user.entity";
import { Transform } from "class-transformer";

export class SignupDto {
  @ApiProperty({ example: "user@example.com", description: "User email" })
  @IsEmail({}, { message: "Please provide a valid email" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: "Password123!", description: "User password" })
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: "Password must contain at least one letter and one number",
  })
  password: string;

  @ApiProperty({ example: "John Doe", description: "User name" })
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(50, { message: "Name cannot exceed 50 characters" })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ enum: Gender, description: "User gender" })
  @IsEnum(Gender, { message: "Gender must be male, female, or other" })
  gender: Gender;
}
