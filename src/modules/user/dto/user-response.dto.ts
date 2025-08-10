import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User email' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User first name' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Expose()
  lastName: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiProperty({ description: 'Whether user is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'User creation date' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    // Explicitly assign only the properties we want to expose
    this.id = partial.id!;
    this.email = partial.email!;
    this.firstName = partial.firstName!;
    this.lastName = partial.lastName!;
    this.role = partial.role!;
    this.isActive = partial.isActive!;
    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;
    // password is intentionally excluded
  }
}

export class UserListResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ 
    description: 'Users data', 
    type: [UserResponseDto] 
  })
  data: UserResponseDto[];

  @ApiProperty({ description: 'Total count of users' })
  total: number;
}

export class UserDetailResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ 
    description: 'User data', 
    type: UserResponseDto 
  })
  data: UserResponseDto;
}

export class UserDeleteResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Deleted user ID' })
  data: { id: string; deleted: boolean };
}
