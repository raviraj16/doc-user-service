import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { Document } from 'src/database/entities/document.entity';
import { DocumentFile } from 'src/database/entities/document-file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentFile]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService]
})
export class DocumentModule {}
