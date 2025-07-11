import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  Matches,
  IsNotEmpty,
  MaxLength,
} from "class-validator";
import { Gender } from "../entities/user.entity";
import { Transform } from "class-transformer";

export class CreateUserDto {
  @IsEmail({}, { message: "Please provide a valid email" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(50, { message: "Name cannot exceed 50 characters" })
  @Transform(({ value }) => value?.trim())
  @IsString()
  name: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: "Password must contain at least one letter and one number",
  })
  password: string;
}
