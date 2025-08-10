import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from 'src/database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    role: UserRole.VIEWER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    documents: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));

    // Reset mocks
    jest.clearAllMocks();
    mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
      role: UserRole.EDITOR,
      isActive: true,
    };

    it('should create a new user successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
        role: UserRole.EDITOR,
        isActive: true,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result.email).toBe(mockUser.email);
      expect(result.password).toBeUndefined(); // Password should be excluded from response
    });

    it('should set default role to VIEWER when not provided', async () => {
      // Arrange
      const dtoWithoutRole = { ...createUserDto };
      delete dtoWithoutRole.role;
      
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      // Act
      await service.create(dtoWithoutRole);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutRole,
        password: 'hashedPassword',
        role: UserRole.VIEWER,
        isActive: true,
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('User with this email already exists')
      );
      
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users with total count', async () => {
      // Arrange
      const users = [mockUser, { ...mockUser, id: 'another-id', email: 'another@example.com' }];
      userRepository.findAndCount.mockResolvedValue([users, 2]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' }
      });
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0].password).toBeUndefined(); // Password should be excluded from response
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(mockUser.id);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      expect(result.id).toBe(mockUser.id);
      expect(result.password).toBeUndefined(); // Password should be excluded from response
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('User not found')
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      role: UserRole.ADMIN,
    };

    it('should update user successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateUserDto };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(mockUser.id, updateUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
      expect(result.firstName).toBe(updateUserDto.firstName);
      expect(result.password).toBeUndefined(); // Password should be excluded from response
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent-id', updateUserDto)).rejects.toThrow(
        new NotFoundException('User not found')
      );
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      // Act
      const result = await service.remove(mockUser.id);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ id: mockUser.id, deleted: true });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        new NotFoundException('User not found')
      );
      
      expect(userRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(mockUser.email);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email }
      });
      expect(result).toBe(mockUser);
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });
});
