import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { Document } from 'src/database/entities/document.entity';
import { DocumentFile } from 'src/database/entities/document-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentFile]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService]
})
export class DocumentModule {}
