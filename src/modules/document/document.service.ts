import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentMeta {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  filePaths: string[];
}

@Injectable()
export class DocumentService {
  private documents: DocumentMeta[] = [];

  async create(createDto: CreateDocumentDto, files: Array<Express.Multer.File>): Promise<DocumentMeta> {
    const id = uuidv4();
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePaths: string[] = [];
    if (files && files.length) {
      for (const file of files) {
        const filePath = path.join(uploadDir, `${id}_${file.originalname}`);
        fs.writeFileSync(filePath, file.buffer);
        filePaths.push(filePath);
      }
    }
    const doc: DocumentMeta = {
      id,
      title: createDto.title,
      description: createDto.description,
      tags: createDto.tags,
      filePaths,
    };
    this.documents.push(doc);
    return doc;
  }

  async findAll(): Promise<DocumentMeta[]> {
    return this.documents;
  }

  async findOne(id: string): Promise<DocumentMeta> {
    const doc = this.documents.find(d => d.id === id);
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, updateDto: UpdateDocumentDto, files: Array<Express.Multer.File>): Promise<DocumentMeta> {
    const doc = await this.findOne(id);
    if (updateDto.title) doc.title = updateDto.title;
    if (updateDto.description) doc.description = updateDto.description;
    if (updateDto.tags) doc.tags = updateDto.tags;
    if (files && files.length) {
      const uploadDir = path.join(__dirname, '../../../uploads');
      for (const file of files) {
        const filePath = path.join(uploadDir, `${id}_${file.originalname}`);
        fs.writeFileSync(filePath, file.buffer);
        doc.filePaths.push(filePath);
      }
    }
    return doc;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) throw new NotFoundException('Document not found');
    this.documents.splice(idx, 1);
    return { deleted: true };
  }
}
