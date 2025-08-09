import { SignupDto } from './dto/signup.dto';
import { Controller, Post, Get, Body, Res, Req, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
    ) { }

    @Get('me')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async getMe(@Req() req: Request) {
        const accessToken = req.cookies?.access_token;
        if (!accessToken) {
            return { user: null };
        }
        try {
            const payload = this.jwtService.verify(accessToken);
            return {
                role: payload.role,
                firstName: payload.firstName,
                lastName: payload.lastName
            };
        } catch {
            return { user: null };
        }
    }

    @Post('login')
    @HttpCode(200)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken } = await this.authService.login(loginDto);
        this.addTokenCookiesToResponse(res, accessToken, refreshToken);
        return { message: 'Login successful' };
    }

    @Post('signup')
    @HttpCode(201)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async signup(@Body() signupDto: SignupDto) {
        await this.authService.signup(signupDto);
        return { message: 'Signup successful' };
    }

    @Get('refresh')
    @HttpCode(200)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async refresh(@Req() req, @Res({ passthrough: true }) res) {
        const oldRefreshToken = req.cookies?.refresh_token;
        const { accessToken, refreshToken } = await this.authService.rotateTokens(oldRefreshToken);
        this.addTokenCookiesToResponse(res, accessToken, refreshToken);
        return { message: 'New token generated successfully' };
    }

    private addTokenCookiesToResponse(res: Response, accessToken: string, refreshToken: string) {
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000, // 30 minutes
        });
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        });
    }
}
