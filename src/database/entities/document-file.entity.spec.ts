import { DocumentFile } from './document-file.entity';
import { Document } from './document.entity';

describe('DocumentFile Entity', () => {
  it('should create a document file instance', () => {
    // Arrange & Act
    const documentFile = new DocumentFile();
    documentFile.fileName = 'test-file.pdf';
    documentFile.fileUrl = '/uploads/test-file.pdf';
    documentFile.fileSize = 1024;
    documentFile.mimeType = 'application/pdf';

    // Assert
    expect(documentFile.fileName).toBe('test-file.pdf');
    expect(documentFile.fileUrl).toBe('/uploads/test-file.pdf');
    expect(documentFile.fileSize).toBe(1024);
    expect(documentFile.mimeType).toBe('application/pdf');
  });

  it('should allow setting all properties', () => {
    // Arrange & Act
    const documentFile = new DocumentFile();
    documentFile.id = 'file-id';
    documentFile.fileName = 'uuid_document.pdf';
    documentFile.fileUrl = '/uploads/uuid_document.pdf';
    documentFile.fileSize = 2048;
    documentFile.mimeType = 'application/pdf';
    documentFile.documentId = 'document-id';

    // Assert
    expect(documentFile.id).toBe('file-id');
    expect(documentFile.fileName).toBe('uuid_document.pdf');
    expect(documentFile.fileUrl).toBe('/uploads/uuid_document.pdf');
    expect(documentFile.fileSize).toBe(2048);
    expect(documentFile.mimeType).toBe('application/pdf');
    expect(documentFile.documentId).toBe('document-id');
  });

  it('should handle relationship with document', () => {
    // Arrange
    const document = new Document();
    const documentFile = new DocumentFile();

    document.id = 'doc-id';
    document.title = 'Test Document';
    documentFile.documentId = 'doc-id';

    // Act
    documentFile.document = document;

    // Assert
    expect(documentFile.document).toBe(document);
    expect(documentFile.document.id).toBe('doc-id');
    expect(documentFile.document.title).toBe('Test Document');
    expect(documentFile.documentId).toBe('doc-id');
  });

  it('should handle different file types', () => {
    // Arrange & Act
    const pdfFile = new DocumentFile();
    pdfFile.fileName = 'document.pdf';
    pdfFile.mimeType = 'application/pdf';

    const imageFile = new DocumentFile();
    imageFile.fileName = 'image.png';
    imageFile.mimeType = 'image/png';

    const textFile = new DocumentFile();
    textFile.fileName = 'text.txt';
    textFile.mimeType = 'text/plain';

    // Assert
    expect(pdfFile.mimeType).toBe('application/pdf');
    expect(imageFile.mimeType).toBe('image/png');
    expect(textFile.mimeType).toBe('text/plain');
  });

  it('should handle large file sizes', () => {
    // Arrange & Act
    const documentFile = new DocumentFile();
    documentFile.fileName = 'large-file.pdf';
    documentFile.fileSize = 10 * 1024 * 1024; // 10MB

    // Assert
    expect(documentFile.fileSize).toBe(10485760);
  });

  it('should handle file names with special characters', () => {
    // Arrange & Act
    const documentFile = new DocumentFile();
    documentFile.fileName = 'uuid_file with spaces & symbols.pdf';
    documentFile.fileUrl = '/uploads/uuid_file with spaces & symbols.pdf';

    // Assert
    expect(documentFile.fileName).toBe('uuid_file with spaces & symbols.pdf');
    expect(documentFile.fileUrl).toBe('/uploads/uuid_file with spaces & symbols.pdf');
  });
});
