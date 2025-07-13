import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../users/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty()
  expires_in: number; // Access token expiry in seconds
}
