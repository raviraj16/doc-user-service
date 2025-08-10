import { Document } from './document.entity';
import { DocumentFile } from './document-file.entity';
import { User } from './user.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('Document Entity', () => {
  it('should create a document instance with default values', () => {
    // Arrange & Act
    const document = new Document();
    document.title = 'Test Document';
    document.description = 'Test description';

    // Assert
    expect(document.title).toBe('Test Document');
    expect(document.description).toBe('Test description');
    expect(document.status).toBeUndefined(); // Will be set by default in database
  });

  it('should allow setting all properties', () => {
    // Arrange & Act
    const document = new Document();
    document.id = 'test-id';
    document.title = 'Test Document';
    document.description = 'Test description';
    document.status = DocumentStatus.UPLOADED;
    document.metadata = { tags: ['test', 'document'] };
    document.uploadedById = 'user-id';

    // Assert
    expect(document.id).toBe('test-id');
    expect(document.title).toBe('Test Document');
    expect(document.description).toBe('Test description');
    expect(document.status).toBe(DocumentStatus.UPLOADED);
    expect(document.metadata).toEqual({ tags: ['test', 'document'] });
    expect(document.uploadedById).toBe('user-id');
  });

  it('should handle relationships properly', () => {
    // Arrange
    const document = new Document();
    const file1 = new DocumentFile();
    const file2 = new DocumentFile();
    const user = new User();

    file1.fileName = 'file1.pdf';
    file2.fileName = 'file2.pdf';
    user.email = 'test@example.com';

    // Act
    document.files = [file1, file2];
    document.uploadedBy = user;

    // Assert
    expect(document.files).toHaveLength(2);
    expect(document.files[0].fileName).toBe('file1.pdf');
    expect(document.files[1].fileName).toBe('file2.pdf');
    expect(document.uploadedBy.email).toBe('test@example.com');
  });

  it('should handle null metadata gracefully', () => {
    // Arrange & Act
    const document = new Document();
    document.metadata = null;

    // Assert
    expect(document.metadata).toBeNull();
  });

  it('should handle complex metadata objects', () => {
    // Arrange & Act
    const complexMetadata = {
      tags: ['test', 'document'],
      category: 'proposal',
      priority: 'high',
      customFields: {
        department: 'IT',
        project: 'Project Alpha',
      },
    };
    const document = new Document();
    document.metadata = complexMetadata;

    // Assert
    expect(document.metadata).toEqual(complexMetadata);
    expect(document.metadata.customFields.department).toBe('IT');
  });
});
