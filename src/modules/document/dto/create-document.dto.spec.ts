import { validate } from 'class-validator';
import { CreateDocumentDto } from './create-document.dto';

describe('CreateDocumentDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.title = 'Test Document';
    dto.description = 'Test description';
    dto.tags = ['test', 'document'];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully with only required fields', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.title = 'Test Document';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should validate successfully with string tags', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.title = 'Test Document';
    dto.tags = 'tag1,tag2,tag3' as any; // Simulating form input

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when title is missing', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.description = 'Test description';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('title');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when title is not a string', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.title = 123 as any;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('title');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when description is not a string', async () => {
    // Arrange
    const dto = new CreateDocumentDto();
    dto.title = 'Test Document';
    dto.description = 123 as any;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('description');
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});
