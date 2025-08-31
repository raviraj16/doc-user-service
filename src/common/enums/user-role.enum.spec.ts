import { UserRole } from './user-role.enum';

describe('UserRole Enum', () => {
  it('should define correct role values', () => {
    expect(UserRole.ADMIN).toBe(0);
    expect(UserRole.EDITOR).toBe(1);
    expect(UserRole.VIEWER).toBe(2);
  });

  it('should have exactly three roles defined', () => {
    // Object.keys gives string keys, so we filter to only numeric ones
    const numericKeys = Object.keys(UserRole).filter(key => !isNaN(Number(key)));
    expect(numericKeys.length).toBe(3);
  });
});
