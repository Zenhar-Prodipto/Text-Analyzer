import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UsersRepository } from "../repositories/users.repository";
import * as bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("UsersService", () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  const mockCreateUserDto = {
    email: "test@example.com",
    password: "Password123!",
    name: "Test User",
    gender: "male" as any,
  };

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
    const mockUsersRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.createUser.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");

      const result = await service.createUser(mockCreateUserDto);

      expect(result).toEqual(mockUser);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        mockCreateUserDto.email
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(usersRepository.createUser).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        password: "hashedpassword",
      });
    });
  });
});
