import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.VIEWER,
      isActive: true,
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValueOnce('access-token');
      jwtService.signAsync.mockResolvedValueOnce('refresh-token');
      configService.get.mockReturnValueOnce('30m').mockReturnValueOnce('15d');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email, isActive: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      userRepository.findOne.mockResolvedValue(null); // findOne with isActive: true returns null

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });
  });

  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const createdUser = {
        ...signupDto,
        password: 'hashedPassword',
        role: UserRole.VIEWER,
        isActive: true,
      };
      userRepository.create.mockReturnValue(createdUser as User);
      userRepository.save.mockResolvedValue(createdUser as User);

      // Act
      await service.signup(signupDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        password: 'hashedPassword',
        role: UserRole.VIEWER,
        isActive: true,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it('should throw UnauthorizedException when email already exists', async () => {
      // Arrange
      const existingUser = { id: 'existing-id', email: signupDto.email };
      userRepository.findOne.mockResolvedValue(existingUser as User);

      // Act & Assert
      await expect(service.signup(signupDto)).rejects.toThrow(
        new UnauthorizedException('Email already in use')
      );
    });
  });

  describe('rotateTokens', () => {
    const oldRefreshToken = 'old-refresh-token';
    const mockPayload = {
      sub: 'user-id',
      role: UserRole.VIEWER,
      firstName: 'John',
      lastName: 'Doe',
    };
    const mockUser = {
      id: 'user-id',
      role: UserRole.VIEWER,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    };

    it('should rotate tokens successfully with valid refresh token', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockPayload);
      configService.get.mockReturnValueOnce('jwt-secret').mockReturnValueOnce('30m').mockReturnValueOnce('15d');
      userRepository.findOne.mockResolvedValue(mockUser as User);
      jwtService.signAsync.mockResolvedValueOnce('new-access-token');
      jwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      // Act
      const result = await service.rotateTokens(oldRefreshToken);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith(oldRefreshToken, {
        secret: 'jwt-secret',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.sub, isActive: true },
      });
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      configService.get.mockReturnValue('jwt-secret');

      // Act & Assert
      await expect(service.rotateTokens(oldRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token')
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockPayload);
      configService.get.mockReturnValue('jwt-secret');
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.rotateTokens(oldRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });
  });
});
