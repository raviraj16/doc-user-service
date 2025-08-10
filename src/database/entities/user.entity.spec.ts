import { User } from './user.entity';
import { Document } from './document.entity';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('User Entity', () => {
  it('should create a user instance', () => {
    // Arrange & Act
    const user = new User();
    user.email = 'test@example.com';
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.password = 'hashedPassword';
    user.role = UserRole.VIEWER;
    user.isActive = true;

    // Assert
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.password).toBe('hashedPassword');
    expect(user.role).toBe(UserRole.VIEWER);
    expect(user.isActive).toBe(true);
  });

  it('should allow setting all properties', () => {
    // Arrange & Act
    const user = new User();
    user.id = 'user-id';
    user.email = 'admin@example.com';
    user.firstName = 'Admin';
    user.lastName = 'User';
    user.password = 'secureHashedPassword';
    user.role = UserRole.ADMIN;
    user.isActive = true;

    // Assert
    expect(user.id).toBe('user-id');
    expect(user.email).toBe('admin@example.com');
    expect(user.firstName).toBe('Admin');
    expect(user.lastName).toBe('User');
    expect(user.password).toBe('secureHashedPassword');
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.isActive).toBe(true);
  });

  it('should handle different user roles', () => {
    // Arrange & Act
    const admin = new User();
    admin.role = UserRole.ADMIN;

    const editor = new User();
    editor.role = UserRole.EDITOR;

    const viewer = new User();
    viewer.role = UserRole.VIEWER;

    // Assert
    expect(admin.role).toBe(UserRole.ADMIN);
    expect(editor.role).toBe(UserRole.EDITOR);
    expect(viewer.role).toBe(UserRole.VIEWER);
  });

  it('should handle inactive users', () => {
    // Arrange & Act
    const activeUser = new User();
    activeUser.isActive = true;

    const inactiveUser = new User();
    inactiveUser.isActive = false;

    // Assert
    expect(activeUser.isActive).toBe(true);
    expect(inactiveUser.isActive).toBe(false);
  });

  it('should handle relationship with documents', () => {
    // Arrange
    const user = new User();
    const document1 = new Document();
    const document2 = new Document();

    user.id = 'user-id';
    document1.title = 'Document 1';
    document1.uploadedById = 'user-id';
    document2.title = 'Document 2';
    document2.uploadedById = 'user-id';

    // Act
    user.documents = [document1, document2];

    // Assert
    expect(user.documents).toHaveLength(2);
    expect(user.documents[0].title).toBe('Document 1');
    expect(user.documents[1].title).toBe('Document 2');
    expect(user.documents[0].uploadedById).toBe('user-id');
    expect(user.documents[1].uploadedById).toBe('user-id');
  });

  it('should handle users without documents', () => {
    // Arrange & Act
    const user = new User();
    user.documents = [];

    // Assert
    expect(user.documents).toHaveLength(0);
  });

  it('should handle email validation constraints', () => {
    // Arrange & Act
    const user = new User();
    
    // Valid emails
    user.email = 'user@example.com';
    expect(user.email).toBe('user@example.com');
    
    user.email = 'user.name+tag@example.co.uk';
    expect(user.email).toBe('user.name+tag@example.co.uk');
  });

  it('should handle name fields with various characters', () => {
    // Arrange & Act
    const user = new User();
    user.firstName = "John-Paul";
    user.lastName = "O'Connor";

    // Assert
    expect(user.firstName).toBe("John-Paul");
    expect(user.lastName).toBe("O'Connor");
  });
});
