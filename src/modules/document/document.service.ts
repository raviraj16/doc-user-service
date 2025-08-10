import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from 'src/database/entities/document.entity';
import { DocumentFile } from 'src/database/entities/document-file.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentFile)
    private readonly documentFileRepository: Repository<DocumentFile>
  ) {}

  async create(createDto: CreateDocumentDto, files: Array<Express.Multer.File>, userId?: string): Promise<any> {
    if (!files || !files.length) {
      throw new NotFoundException('No file uploaded');
    }

    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Convert tags from string to array if necessary
    const tags = Array.isArray(createDto.tags) 
      ? createDto.tags 
      : typeof createDto.tags === 'string'
        ? createDto.tags.split(',').map(tag => tag.trim())
        : [];

    // Create the document entity
    const document = this.documentRepository.create({
      title: createDto.title,
      description: createDto.description,
      status: DocumentStatus.UPLOADED,
      metadata: { tags },
    });
    if (userId) {
      document.uploadedById = userId;
    }

    // Save document first to get its ID
    const savedDocument = await this.documentRepository.save(document);

    // Save all files and associate with document
    const documentFiles: DocumentFile[] = [];
    for (const file of files) {
      const fileId = uuidv4();
      const fileName = `${fileId}_${file.originalname}`;
      
      const docFile = this.documentFileRepository.create({
        fileName: fileName,
        fileUrl: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentId: savedDocument.id,
      });
      
      // Save file to disk
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      
      documentFiles.push(docFile);
    }

    // Save all files in a transaction
    await this.documentFileRepository.save(documentFiles);

    // Reload document with files using explicit selection to avoid old columns
    const docWithFiles = await this.documentRepository
      .createQueryBuilder('doc')
      .select([
        'doc.id',
        'doc.title', 
        'doc.description',
        'doc.status',
        'doc.metadata',
        'doc.createdAt',
        'doc.updatedAt',
        'doc.uploadedById'
      ])
      .leftJoinAndSelect('doc.files', 'files')
      .where('doc.id = :id', { id: savedDocument.id })
      .getOne();
    
    if (!docWithFiles) {
      throw new NotFoundException('Document not found after creation');
    }
    
    // Debug logging
    console.log('Document with files:', JSON.stringify(docWithFiles, null, 2));
    
    // Return clean object structure to avoid any entity serialization issues
    const result = {
      id: docWithFiles.id,
      title: docWithFiles.title,
      description: docWithFiles.description,
      status: docWithFiles.status,
      metadata: docWithFiles.metadata,
      createdAt: docWithFiles.createdAt,
      updatedAt: docWithFiles.updatedAt,
      uploadedById: docWithFiles.uploadedById,
      files: docWithFiles.files || []
    };
    
    console.log('Clean result:', JSON.stringify(result, null, 2));
    
    return result;
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({ relations: ['files'] });
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({ where: { id }, relations: ['files'] });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, updateDto: UpdateDocumentDto, files: Array<Express.Multer.File>): Promise<Document> {
    const doc = await this.findOne(id);
    
    // Update metadata
    if (updateDto.title) doc.title = updateDto.title;
    if (updateDto.description) doc.description = updateDto.description;
    
    // Update tags in metadata
    if (updateDto.tags) {
      doc.metadata = { ...doc.metadata, tags: updateDto.tags };
    }
    
    // Handle file update if provided
    // TODO: Implement file update logic for multiple files if needed
    
    // Save to database
    return this.documentRepository.save(doc);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const doc = await this.findOne(id);
    
    // Remove physical files
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    // Remove all associated files
    if (doc.files) {
      for (const file of doc.files) {
        const filePath = path.join(uploadDir, file.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    // Remove from database - this will cascade delete the files as well
    await this.documentRepository.remove(doc);
    return { deleted: true };
  }
}
