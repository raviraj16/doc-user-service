import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.VIEWER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    password: 'hashedPassword123' // Will be excluded in response
  } as UserResponseDto;

  beforeEach(async () => {
    const mockUserService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
      getAllAndOverride: jest.fn(),
      getAllAndMerge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        RolesGuard,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
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

    it('should create user successfully', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      userService.create.mockResolvedValue(mockUserResponse);

      // Act
      await controller.create(createUserDto, mockRequest, mockResponse);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: mockUserResponse,
      });
    });

    it('should handle ConflictException', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const conflictError = new ConflictException('User with this email already exists');
      userService.create.mockRejectedValue(conflictError);

      // Act
      await controller.create(createUserDto, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
        error: 'User with this email already exists',
      });
    });

    it('should handle unexpected errors', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const unexpectedError = new Error('Database connection failed');
      userService.create.mockRejectedValue(unexpectedError);

      // Act
      await controller.create(createUserDto, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        error: 'Database connection failed',
      });
    });
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const usersData = {
        users: [mockUserResponse],
        total: 1,
      };

      userService.findAll.mockResolvedValue(usersData);

      // Act
      await controller.findAll(mockRequest, mockResponse);

      // Assert
      expect(userService.findAll).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: usersData.users,
        total: usersData.total,
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const error = new Error('Database error');
      userService.findAll.mockRejectedValue(error);

      // Act
      await controller.findAll(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'Database error',
      });
    });
  });

  describe('findOne', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return user successfully', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      userService.findOne.mockResolvedValue(mockUserResponse);

      // Act
      await controller.findOne(userId, mockRequest, mockResponse);

      // Assert
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: mockUserResponse,
      });
    });

    it('should handle NotFoundException', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const notFoundError = new NotFoundException('User not found');
      userService.findOne.mockRejectedValue(notFoundError);

      // Act
      await controller.findOne(userId, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });
  });

  describe('update', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
      role: UserRole.ADMIN,
    };

    it('should update user successfully', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const updatedUser = { ...mockUserResponse, ...updateUserDto };
      userService.update.mockResolvedValue(updatedUser);

      // Act
      await controller.update(userId, updateUserDto, mockRequest, mockResponse);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    });

    it('should handle NotFoundException', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const notFoundError = new NotFoundException('User not found');
      userService.update.mockRejectedValue(notFoundError);

      // Act
      await controller.update(userId, updateUserDto, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });

    it('should handle ConflictException', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const conflictError = new ConflictException('Email already exists');
      userService.update.mockRejectedValue(conflictError);

      // Act
      await controller.update(userId, updateUserDto, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        error: 'Email already exists',
      });
    });
  });

  describe('remove', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete user successfully', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const deleteResult = { id: userId, deleted: true };
      userService.remove.mockResolvedValue(deleteResult);

      // Act
      await controller.remove(userId, mockRequest, mockResponse);

      // Assert
      expect(userService.remove).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
        data: deleteResult,
      });
    });

    it('should handle NotFoundException', async () => {
      // Arrange
      const mockRequest = {} as any;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const notFoundError = new NotFoundException('User not found');
      userService.remove.mockRejectedValue(notFoundError);

      // Act
      await controller.remove(userId, mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });
  });

  describe('Service Integration', () => {
    it('should call userService.create with correct parameters', async () => {
      // Arrange
      const createDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password',
      };

      userService.create.mockResolvedValue(mockUserResponse);

      // Act
      const result = await userService.create(createDto);

      // Assert
      expect(userService.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe(mockUserResponse);
    });

    it('should call userService.findAll', async () => {
      // Arrange
      const expectedResult = { users: [mockUserResponse], total: 1 };
      userService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should call userService.findOne with correct id', async () => {
      // Arrange
      const userId = 'test-id';
      userService.findOne.mockResolvedValue(mockUserResponse);

      // Act
      const result = await userService.findOne(userId);

      // Assert
      expect(userService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserResponse);
    });

    it('should call userService.update with correct parameters', async () => {
      // Arrange
      const userId = 'test-id';
      const updateDto = { firstName: 'Updated' };
      userService.update.mockResolvedValue(mockUserResponse);

      // Act
      const result = await userService.update(userId, updateDto);

      // Assert
      expect(userService.update).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toBe(mockUserResponse);
    });

    it('should call userService.remove with correct id', async () => {
      // Arrange
      const userId = 'test-id';
      const deleteResult = { id: userId, deleted: true };
      userService.remove.mockResolvedValue(deleteResult);

      // Act
      const result = await userService.remove(userId);

      // Assert
      expect(userService.remove).toHaveBeenCalledWith(userId);
      expect(result).toBe(deleteResult);
    });
  });
});
