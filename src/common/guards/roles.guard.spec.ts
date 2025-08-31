import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums/user-role.enum';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Mock console.log to prevent noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when no roles are required', () => {
    // Arrange
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
    } as unknown as ExecutionContext;
    
    // Act
    const result = guard.canActivate(mockContext);
    
    // Assert
    expect(result).toBe(true);
    expect(reflector.get).toHaveBeenCalledWith('roles', mockContext.getHandler());
  });

  it('should return false when no token is provided', () => {
    // Arrange
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = { cookies: {} };
    
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    } as HttpArgumentsHost;
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ExecutionContext;
    
    (reflector.get as jest.Mock).mockReturnValue(requiredRoles);
    
    // Act & Assert
    const result = guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should return true when user has required role', () => {
    // Arrange
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = { 
      cookies: { access_token: 'valid_token' }
    };
    
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    } as HttpArgumentsHost;
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ExecutionContext;
    
    (reflector.get as jest.Mock).mockReturnValue(requiredRoles);
    (jwtService.verify as jest.Mock).mockReturnValue({ 
      userId: 1, 
      role: UserRole.ADMIN 
    });
    
    // Act
    const result = guard.canActivate(mockContext);
    
    // Assert
    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid_token');
  });

  it('should return false when user does not have required role', () => {
    // Arrange
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = { 
      cookies: { access_token: 'valid_token' }
    };
    
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    } as HttpArgumentsHost;
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ExecutionContext;
    
    (reflector.get as jest.Mock).mockReturnValue(requiredRoles);
    (jwtService.verify as jest.Mock).mockReturnValue({ 
      userId: 1, 
      role: UserRole.VIEWER 
    });
    
    // Act
    const result = guard.canActivate(mockContext);
    
    // Assert
    expect(result).toBe(false);
    expect(jwtService.verify).toHaveBeenCalledWith('valid_token');
  });

  it('should return false when token is invalid', () => {
    // Arrange
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = { 
      cookies: { access_token: 'invalid_token' }
    };
    
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    } as HttpArgumentsHost;
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ExecutionContext;
    
    (reflector.get as jest.Mock).mockReturnValue(requiredRoles);
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Act
    const result = guard.canActivate(mockContext);
    
    // Assert
    expect(result).toBe(false);
    expect(jwtService.verify).toHaveBeenCalledWith('invalid_token');
  });

  it('should return true when user has one of multiple required roles', () => {
    // Arrange
    const requiredRoles = [UserRole.ADMIN, UserRole.EDITOR];
    const mockRequest = { 
      cookies: { access_token: 'valid_token' }
    };
    
    const mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    } as HttpArgumentsHost;
    
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
    } as unknown as ExecutionContext;
    
    (reflector.get as jest.Mock).mockReturnValue(requiredRoles);
    (jwtService.verify as jest.Mock).mockReturnValue({ 
      userId: 1, 
      role: UserRole.EDITOR 
    });
    
    // Act
    const result = guard.canActivate(mockContext);
    
    // Assert
    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid_token');
  });
});
