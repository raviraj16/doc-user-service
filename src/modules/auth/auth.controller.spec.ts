import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      signup: jest.fn(),
      rotateTokens: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return user details when valid token is provided', async () => {
      // Arrange
      const mockPayload = {
        sub: 'user-id',
        role: UserRole.ADMIN,
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockRequest = {
        cookies: { access_token: 'valid-token' },
      } as Request;
      jwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await controller.getMe(mockRequest);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        data: {
          role: UserRole.ADMIN,
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should return null data when no access token is provided', async () => {
      // Arrange
      const mockRequest = {
        cookies: {},
      } as Request;

      // Act
      const result = await controller.getMe(mockRequest);

      // Assert
      expect(result).toEqual({ data: null });
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      // Arrange
      const mockRequest = {
        cookies: { access_token: 'invalid-token' },
      } as Request;
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(controller.getMe(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Unauthorized access')
      );
    });
  });

  describe('login', () => {
    it('should login successfully and set cookies', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      authService.login.mockResolvedValue(tokens);

      // Act
      const result = await controller.login(loginDto, mockResponse);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true, // Since NODE_ENV is not 'development' in test
          sameSite: 'lax',
          maxAge: 30 * 60 * 1000, // 30 minutes
        })
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true, // Since NODE_ENV is not 'development' in test
          sameSite: 'lax',
          maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        })
      );
      expect(result).toEqual({ message: 'Login successful' });
    });

    it('should propagate AuthService errors', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      const mockResponse = {} as Response;
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });
  });

  describe('signup', () => {
    it('should signup successfully', async () => {
      // Arrange
      const signupDto = {
        email: 'newuser@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };
      authService.signup.mockResolvedValue(undefined);

      // Act
      const result = await controller.signup(signupDto);

      // Assert
      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual({ message: 'Signup successful' });
    });

    it('should propagate AuthService errors', async () => {
      // Arrange
      const signupDto = {
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };
      authService.signup.mockRejectedValue(new UnauthorizedException('Email already in use'));

      // Act & Assert
      await expect(controller.signup(signupDto)).rejects.toThrow(
        new UnauthorizedException('Email already in use')
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      const mockRequest = {
        cookies: { refresh_token: 'old-refresh-token' },
      } as Request;
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.rotateTokens.mockResolvedValue(newTokens);

      // Act
      const result = await controller.refresh(mockRequest, mockResponse);

      // Assert
      expect(authService.rotateTokens).toHaveBeenCalledWith('old-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ message: 'New token generated successfully' });
    });

    it('should propagate AuthService errors when refresh token is invalid', async () => {
      // Arrange
      const mockRequest = {
        cookies: { refresh_token: 'invalid-refresh-token' },
      } as Request;
      const mockResponse = {} as Response;
      authService.rotateTokens.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      // Act & Assert
      await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token')
      );
    });
  });
});
