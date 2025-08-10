import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService]
})
export class DocumentModule {}
