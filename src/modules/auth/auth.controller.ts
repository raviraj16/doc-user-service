import { SignupDto } from './dto/signup.dto';
import { Controller, Post, Body, Res, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(200)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(loginDto);
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return { message: 'Login successful' };
    }

    @Post('signup')
    @HttpCode(201)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async signup(@Body() signupDto: SignupDto) {
        await this.authService.signup(signupDto);
        return { message: 'Signup successful' };
    }
}
