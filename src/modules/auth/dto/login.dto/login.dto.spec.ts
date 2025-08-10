import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new LoginDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation when email is missing', async () => {
    // Arrange
    const dto = new LoginDto();
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
    const dto = new LoginDto();
    dto.email = 'invalid-email';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation when password is missing', async () => {
    // Arrange
    const dto = new LoginDto();
    dto.email = 'test@example.com';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when password is not a string', async () => {
    // Arrange
    const dto = new LoginDto();
    dto.email = 'test@example.com';
    dto.password = 123 as any;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when both email and password are missing', async () => {
    // Arrange
    const dto = new LoginDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(2);
    const properties = errors.map(error => error.property);
    expect(properties).toContain('email');
    expect(properties).toContain('password');
  });
});
