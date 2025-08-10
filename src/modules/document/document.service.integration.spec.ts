import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from 'src/database/entities/document.entity';
import { DocumentFile } from 'src/database/entities/document-file.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock file system operations
jest.mock('fs');
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('DocumentService Integration', () => {
  let service: DocumentService;
  let documentRepository: jest.Mocked<Repository<Document>>;
  let documentFileRepository: jest.Mocked<Repository<DocumentFile>>;

  beforeEach(async () => {
    const mockDocumentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDocumentFileRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockDocumentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
    documentRepository = module.get(getRepositoryToken(Document));
    documentFileRepository = module.get(getRepositoryToken(DocumentFile));

    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation();
    (fs.writeFileSync as jest.Mock).mockImplementation();
    (fs.unlinkSync as jest.Mock).mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Document Lifecycle', () => {
    it('should handle complete document creation workflow with multiple files', async () => {
      // Arrange
      const createDto = {
        title: 'Integration Test Document',
        description: 'Testing complete workflow',
        tags: 'integration,test,workflow',
      };

      const mockFiles = [
        {
          originalname: 'file1.pdf',
          buffer: Buffer.from('file1 content'),
          size: 1024,
          mimetype: 'application/pdf',
        },
        {
          originalname: 'file2.png',
          buffer: Buffer.from('file2 content'),
          size: 2048,
          mimetype: 'image/png',
        },
      ] as Array<Express.Multer.File>;

      const savedDocument = {
        id: 'doc-id',
        title: createDto.title,
        description: createDto.description,
        status: DocumentStatus.UPLOADED,
        metadata: { tags: ['integration', 'test', 'workflow'] },
        uploadedById: 'user-id',
      };

      const expectedFiles = [
        {
          id: 'file-1',
          fileName: 'mock-uuid_file1.pdf',
          fileUrl: '/uploads/mock-uuid_file1.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          documentId: 'doc-id',
        },
        {
          id: 'file-2',
          fileName: 'mock-uuid_file2.png',
          fileUrl: '/uploads/mock-uuid_file2.png',
          fileSize: 2048,
          mimeType: 'image/png',
          documentId: 'doc-id',
        },
      ];

      const documentWithFiles = {
        ...savedDocument,
        files: expectedFiles,
      };

      // Mock repository calls
      documentRepository.create.mockReturnValue(savedDocument as Document);
      documentRepository.save.mockResolvedValue(savedDocument as Document);
      documentFileRepository.create
        .mockReturnValueOnce(expectedFiles[0] as DocumentFile)
        .mockReturnValueOnce(expectedFiles[1] as DocumentFile);
      documentFileRepository.save.mockResolvedValue(expectedFiles as DocumentFile[]);

      const mockQueryBuilder = documentRepository.createQueryBuilder();
      (mockQueryBuilder.getOne as jest.Mock).mockResolvedValue(documentWithFiles);

      // Act
      const result = await service.create(createDto, mockFiles, 'user-id');

      // Assert
      expect(documentRepository.create).toHaveBeenCalledWith({
        title: createDto.title,
        description: createDto.description,
        status: DocumentStatus.UPLOADED,
        metadata: { tags: ['integration', 'test', 'workflow'] },
      });

      expect(documentFileRepository.create).toHaveBeenCalledTimes(2);
      expect(documentFileRepository.save).toHaveBeenCalledWith(expectedFiles);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

      expect(result).toEqual(documentWithFiles);
    });

    it('should handle document retrieval with files', async () => {
      // Arrange
      const documentId = 'doc-id';
      const expectedDocument = {
        id: documentId,
        title: 'Test Document',
        files: [
          {
            id: 'file-1',
            fileName: 'test.pdf',
            fileUrl: '/uploads/test.pdf',
          },
        ],
      };

      documentRepository.findOne.mockResolvedValue(expectedDocument as Document);

      // Act
      const result = await service.findOne(documentId);

      // Assert
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: documentId },
        relations: ['files'],
      });
      expect(result).toEqual(expectedDocument);
    });

    it('should handle document deletion with file cleanup', async () => {
      // Arrange
      const documentId = 'doc-id';
      const documentWithFiles = {
        id: documentId,
        title: 'Document to Delete',
        files: [
          { fileName: 'file1.pdf' },
          { fileName: 'file2.png' },
        ],
      };

      documentRepository.findOne.mockResolvedValue(documentWithFiles as Document);

      // Act
      const result = await service.remove(documentId);

      // Assert
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: documentId },
        relations: ['files'],
      });
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('file1.pdf')
      );
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('file2.png')
      );
      expect(documentRepository.remove).toHaveBeenCalledWith(documentWithFiles);
      expect(result).toEqual({ deleted: true });
    });

    it('should handle document update workflow', async () => {
      // Arrange
      const documentId = 'doc-id';
      const updateDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        tags: ['updated', 'tags'],
      };
      const existingDocument = {
        id: documentId,
        title: 'Old Title',
        description: 'Old Description',
        metadata: { tags: ['old', 'tags'] },
      };
      const updatedDocument = {
        ...existingDocument,
        title: updateDto.title,
        description: updateDto.description,
        metadata: { tags: updateDto.tags },
      };

      documentRepository.findOne.mockResolvedValue(existingDocument as Document);
      documentRepository.save.mockResolvedValue(updatedDocument as Document);

      // Act
      const result = await service.update(documentId, updateDto, []);

      // Assert
      expect(documentRepository.findOne).toHaveBeenCalledWith({
        where: { id: documentId },
        relations: ['files'],
      });
      expect(documentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: updateDto.title,
          description: updateDto.description,
          metadata: expect.objectContaining({ tags: updateDto.tags }),
        })
      );
      expect(result).toEqual(updatedDocument);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle file system errors gracefully during creation', async () => {
      // Arrange
      const createDto = {
        title: 'Test Document',
        description: 'Test description',
        tags: ['test'],
      };
      const mockFiles = [
        {
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        },
      ] as Array<Express.Multer.File>;

      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      // Act & Assert
      await expect(service.create(createDto, mockFiles)).rejects.toThrow('File system error');
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const createDto = {
        title: 'Test Document',
        description: 'Test description',
        tags: ['test'],
      };
      const mockFiles = [
        {
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        },
      ] as Array<Express.Multer.File>;

      documentRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createDto, mockFiles)).rejects.toThrow('Database error');
    });

    it('should handle missing files during deletion gracefully', async () => {
      // Arrange
      const documentId = 'doc-id';
      const documentWithFiles = {
        id: documentId,
        files: [{ fileName: 'missing-file.pdf' }],
      };

      documentRepository.findOne.mockResolvedValue(documentWithFiles as Document);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      const result = await service.remove(documentId);

      // Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags array', async () => {
      // Arrange
      const createDto = {
        title: 'Test Document',
        tags: [],
      };
      const mockFiles = [
        {
          originalname: 'test.pdf',
          buffer: Buffer.from('test'),
          size: 1024,
          mimetype: 'application/pdf',
        },
      ] as Array<Express.Multer.File>;

      const savedDocument = {
        id: 'doc-id',
        metadata: { tags: [] },
      };

      documentRepository.create.mockReturnValue(savedDocument as Document);
      documentRepository.save.mockResolvedValue(savedDocument as Document);

      // Act
      await service.create(createDto, mockFiles);

      // Assert
      expect(documentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { tags: [] },
        })
      );
    });

    it('should handle documents without files', async () => {
      // Arrange
      const documentId = 'doc-id';
      const documentWithoutFiles = {
        id: documentId,
        title: 'Document without files',
        files: [],
      };

      documentRepository.findOne.mockResolvedValue(documentWithoutFiles as Document);

      // Act
      const result = await service.remove(documentId);

      // Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });
});
