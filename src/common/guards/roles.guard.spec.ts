import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums/user-role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should return true when user has required role', () => {
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = {
      user: {
        role: UserRole.ADMIN,
      },
    };

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should return false when user does not have required role', () => {
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = {
      user: {
        role: UserRole.VIEWER,
      },
    };

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should return false when user is not authenticated', () => {
    const requiredRoles = [UserRole.ADMIN];
    const mockRequest = {};

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should return true when user has one of multiple required roles', () => {
    const requiredRoles = [UserRole.ADMIN, UserRole.EDITOR];
    const mockRequest = {
      user: {
        role: UserRole.EDITOR,
      },
    };

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(requiredRoles);
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });
});
