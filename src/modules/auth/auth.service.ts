import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/database/entities/user.entity';
import { LoginDto } from './dto/login.dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.userRepository.findOne({ where: { email: loginDto.email, isActive: true } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
        const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }

    async signup(signupDto: SignupDto): Promise<void> {
        const existing = await this.userRepository.findOne({ where: { email: signupDto.email } });
        if (existing) {
            throw new UnauthorizedException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(signupDto.password, 10);
        const user = this.userRepository.create({
            email: signupDto.email,
            firstName: signupDto.firstName,
            lastName: signupDto.lastName,
            password: hashedPassword,
            role: UserRole.VIEWER,
            isActive: true,
        });
        await this.userRepository.save(user);
    }
}
