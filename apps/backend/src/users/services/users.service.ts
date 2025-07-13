import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { ApiException } from '../../common/exceptions/api.exception';
import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ApiException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
          'DUPLICATE_EMAIL'
        );
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

      // Create user
      const userToCreate = {
        ...createUserDto,
        password: hashedPassword,
      };

      return await this.usersRepository.createUser(userToCreate);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepository.findByEmail(email);
    } catch (error) {
      throw new ApiException(
        'Failed to find user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findById(id);
    } catch (error) {
      throw new ApiException(
        'Failed to find user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }

  async validateUserPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      throw new ApiException(
        'Failed to validate user credentials',
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message
      );
    }
  }
}
