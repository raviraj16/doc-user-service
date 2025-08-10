import { validate } from 'class-validator';
import { SignupDto } from './signup.dto';

describe('SignupDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when email is missing', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation when email is invalid', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'invalid-email';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation when firstName is missing', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'test@example.com';
    dto.lastName = 'Doe';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('firstName');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when lastName is missing', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('lastName');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when password is missing', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when firstName is not a string', async () => {
    // Arrange
    const dto = new SignupDto();
    dto.email = 'test@example.com';
    dto.firstName = 123 as any;
    dto.lastName = 'Doe';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('firstName');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when all required fields are missing', async () => {
    // Arrange
    const dto = new SignupDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(4);
    const properties = errors.map(error => error.property);
    expect(properties).toContain('email');
    expect(properties).toContain('firstName');
    expect(properties).toContain('lastName');
    expect(properties).toContain('password');
  });
});
