import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies?.access_token;
    if (!accessToken) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(accessToken);
      const userRole = payload.role;
      if (!roles.includes(userRole)) {
        throw new UnauthorizedException(`Forbidden - Insufficient permissions (requires ${roles.join(' or ')} role)`);
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
