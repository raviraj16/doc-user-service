import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/database/entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class AdminUserInitService {
  private readonly logger = new Logger(AdminUserInitService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const adminCount = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@doc.com';
      const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
      const lastName = process.env.ADMIN_LAST_NAME || 'User';
      const plainPassword = process.env.ADMIN_PASSWORD || 'Pass@123';
      const password = await bcrypt.hash(plainPassword, 10);
      const adminUser = this.userRepository.create({
        email,
        firstName,
        lastName,
        password,
        role: UserRole.ADMIN,
        isActive: true,
      });
      await this.userRepository.save(adminUser);
      this.logger.log(`Default ADMIN user created: ${email}`);
    } else {
        this.logger.log('Admin user already exists, skipping creation.');
    }
  }
}
