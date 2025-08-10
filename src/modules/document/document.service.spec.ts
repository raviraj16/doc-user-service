import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from 'src/database/entities/document.entity';
import { DocumentFile } from 'src/database/entities/document-file.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

describe('DocumentService', () => {
  let service: DocumentService;
  let mockDocumentRepository;
  let mockDocumentFileRepository;

  beforeEach(async () => {
    mockDocumentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    mockDocumentFileRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(DocumentFile),
          useValue: mockDocumentFileRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockFiles = [
      {
        originalname: 'test1.pdf',
        buffer: Buffer.from('test1'),
        size: 100,
        mimetype: 'application/pdf',
      },
      {
        originalname: 'test2.pdf',
        buffer: Buffer.from('test2'),
        size: 200,
        mimetype: 'application/pdf',
      },
    ] as Array<Express.Multer.File>;

    const createDto = {
      title: 'Test Document',
      description: 'Test Description',
      tags: ['test', 'document'],
    };

    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    });

    it('should create document with multiple files', async () => {
      const savedDocument = {
        id: '1',
        ...createDto,
        status: DocumentStatus.UPLOADED,
        metadata: { tags: createDto.tags },
      };

      const expectedDocumentFiles = mockFiles.map(file => ({
        fileName: `test-uuid_${file.originalname}`,
        fileUrl: `/uploads/test-uuid_${file.originalname}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentId: savedDocument.id,
      }));

      mockDocumentRepository.create.mockReturnValue(savedDocument);
      mockDocumentRepository.save.mockResolvedValue(savedDocument);
      mockDocumentRepository.findOne.mockResolvedValue({
        ...savedDocument,
        files: expectedDocumentFiles,
      });
      mockDocumentFileRepository.save.mockResolvedValue(expectedDocumentFiles);

      const result = await service.create(createDto, mockFiles);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith({
        title: createDto.title,
        description: createDto.description,
        status: DocumentStatus.UPLOADED,
        metadata: { tags: createDto.tags },
      });

      expect(mockDocumentFileRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining(expectedDocumentFiles.map(expect.objectContaining))
      );

      expect(result).toEqual({
        ...savedDocument,
        files: expectedDocumentFiles,
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when no files provided', async () => {
      await expect(service.create(createDto, [])).rejects.toThrow('No file uploaded');
    });
  });

  describe('remove', () => {
    it('should remove document and its files', async () => {
      const mockDocument = {
        id: '1',
        files: [
          { fileName: 'file1.pdf' },
          { fileName: 'file2.pdf' },
        ],
      };

      mockDocumentRepository.findOne.mockResolvedValue(mockDocument);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);

      const result = await service.remove('1');

      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(mockDocumentRepository.remove).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);
      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
