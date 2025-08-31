import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when a valid token is provided', () => {
      // Arrange
      const mockRequest = { cookies: { access_token: 'valid_token' } };
      
      const mockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as HttpArgumentsHost;
      
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      } as unknown as ExecutionContext;
      
      jest.spyOn(jwtService, 'verify').mockReturnValue({ userId: 1 });

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid_token');
    });

    it('should throw ForbiddenException when no token is provided', () => {
      // Arrange
      const mockRequest = { cookies: {} };
      
      const mockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as HttpArgumentsHost;
      
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      } as unknown as ExecutionContext;

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Forbidden - Missing access token'
      );
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      // Arrange
      const mockRequest = { cookies: { access_token: 'invalid_token' } };
      
      const mockHttpArgumentsHost = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as HttpArgumentsHost;
      
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      } as unknown as ExecutionContext;
      
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        new UnauthorizedException('Unauthorized - Invalid or missing token'),
      );
      expect(jwtService.verify).toHaveBeenCalledWith('invalid_token');
    });
    
  });
});
