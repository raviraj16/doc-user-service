import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies?.access_token;

    if (!accessToken) {
      throw new ForbiddenException('Forbidden - Missing access token');
    }

    try {
      this.jwtService.verify(accessToken);
      return true;
    } catch (error) {
      throw new UnauthorizedException('Unauthorized - Invalid or missing token');
    }
  }
}
