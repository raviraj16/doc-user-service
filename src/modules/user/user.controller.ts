import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Res,
  HttpStatus,
  Req
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBearerAuth,
  ApiCookieAuth
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { 
  UserResponseDto, 
  UserListResponseDto, 
  UserDetailResponseDto,
  UserDeleteResponseDto 
} from './dto/user-response.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';

@ApiTags('User Management')
@Controller('user')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@ApiCookieAuth()
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
@ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user account. Only accessible by admin users.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserDetailResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - User with email already exists'
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const user = await this.userService.create(createUserDto);
      
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to create user',
        error: error.message
      });
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve all users in the system. Only accessible by admin users.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    type: UserListResponseDto
  })
  async findAll(
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const { users, total } = await this.userService.findAll();
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        total
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. Only accessible by admin users.'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User retrieved successfully',
    type: UserDetailResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found'
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const user = await this.userService.findOne(id);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to retrieve user',
        error: error.message
      });
    }
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Update user information. Only accessible by admin users.'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: UserDetailResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Email already exists'
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const user = await this.userService.update(id, updateUserDto);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update user',
        error: error.message
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Delete a user from the system. Only accessible by admin users.'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    type: UserDeleteResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found'
  })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.userService.remove(id);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'User deleted successfully',
        data: result
      });
    } catch (error) {
      return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to delete user',
        error: error.message
      });
    }
  }
}
