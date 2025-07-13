import { Exclude, Expose } from 'class-transformer';
import { Gender } from '../entities/user.entity';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  gender: Gender;

  @Expose()
  created_at: Date;

  @Exclude()
  password: string;
}
