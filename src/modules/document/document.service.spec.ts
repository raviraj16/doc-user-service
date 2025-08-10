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
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      })),
    };

    mockDocumentFileRepository = {
      create: jest.fn((data) => data),
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
      
      // Mock documentFileRepository.create to return the data passed to it
      mockDocumentFileRepository.create.mockImplementation((data) => data);
      
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: savedDocument.id,
          title: savedDocument.title,
          description: savedDocument.description,
          status: savedDocument.status,
          metadata: savedDocument.metadata,
          createdAt: undefined,
          updatedAt: undefined,
          uploadedById: undefined,
          files: expectedDocumentFiles,
        }),
      };
      mockDocumentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      
      mockDocumentFileRepository.save.mockResolvedValue(expectedDocumentFiles);

      const result = await service.create(createDto, mockFiles);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith({
        title: createDto.title,
        description: createDto.description,
        status: DocumentStatus.UPLOADED,
        metadata: { tags: createDto.tags },
      });

      expect(mockDocumentFileRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'test-uuid_test1.pdf',
            fileUrl: '/uploads/test-uuid_test1.pdf',
            fileSize: 100,
            mimeType: 'application/pdf',
            documentId: '1',
          }),
          expect.objectContaining({
            fileName: 'test-uuid_test2.pdf',
            fileUrl: '/uploads/test-uuid_test2.pdf',
            fileSize: 200,
            mimeType: 'application/pdf',
            documentId: '1',
          }),
        ])
      );

      expect(result).toEqual({
        id: savedDocument.id,
        title: savedDocument.title,
        description: savedDocument.description,
        status: savedDocument.status,
        metadata: savedDocument.metadata,
        createdAt: undefined,
        updatedAt: undefined,
        uploadedById: undefined,
        files: expectedDocumentFiles,
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when no files provided', async () => {
      await expect(service.create(createDto, [])).rejects.toThrow('No file uploaded');
    });
  });

  describe('findAll', () => {
    it('should return all documents with files', async () => {
      const documents = [
        {
          id: '1',
          title: 'Document 1',
          files: [],
        },
        {
          id: '2',
          title: 'Document 2',
          files: [],
        },
      ];

      mockDocumentRepository.find.mockResolvedValue(documents);

      const result = await service.findAll();

      expect(result).toEqual(documents);
      expect(mockDocumentRepository.find).toHaveBeenCalledWith({ relations: ['files'] });
    });
  });

  describe('findOne', () => {
    it('should return a document with files', async () => {
      const document = {
        id: '1',
        title: 'Test Document',
        files: [],
      };

      mockDocumentRepository.findOne.mockResolvedValue(document);

      const result = await service.findOne('1');

      expect(result).toEqual(document);
      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' }, relations: ['files'] });
    });

    it('should throw NotFoundException when document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Title',
      description: 'Updated Description',
    };

    const mockFiles = [
      {
        originalname: 'test3.pdf',
        buffer: Buffer.from('test content 3'),
        size: 300,
        mimetype: 'application/pdf',
      },
    ] as Express.Multer.File[];

    it('should update and return document with new files', async () => {
      const existingDocument = {
        id: '1',
        title: 'Old Title',
        description: 'Old Description',
        files: [],
      };

      const updatedDocument = {
        ...existingDocument,
        ...updateDto,
        files: [
          {
            fileName: 'test-uuid_test3.pdf',
            fileUrl: '/uploads/test-uuid_test3.pdf',
            fileSize: 300,
            mimeType: 'application/pdf',
            documentId: '1',
          },
        ],
      };

      // Mock findOne to return existing document
      mockDocumentRepository.findOne.mockResolvedValue(existingDocument);
      mockDocumentRepository.save.mockResolvedValue(updatedDocument);
      mockDocumentFileRepository.create.mockImplementation((data) => data);

      const result = await service.update('1', updateDto, mockFiles);

      expect(result).toEqual(updatedDocument);
      expect(mockDocumentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when document not found', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', updateDto, mockFiles)).rejects.toThrow(NotFoundException);
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
