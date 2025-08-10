import { Controller, Post, Get, Put, Delete, Param, Body, UploadedFiles, UseInterceptors, Res, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiCookieAuth, getSchemaPath } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto, DocumentDeleteResponseDto } from './dto/document-response.dto';
import { DocumentFileResponseDto } from './dto/document-file-response.dto';
import type { Response, Request } from 'express';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Documents')
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
@Controller('document')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly jwtService: JwtService
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new document',
    description: 'Upload a new document with metadata. Requires ADMIN or EDITOR role.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'files'],
      properties: {
        title: { 
          type: 'string',
          example: 'Project Proposal',
          description: 'Title of the document'
        },
        description: { 
          type: 'string',
          example: 'A detailed project proposal for Q3',
          description: 'Description of the document'
        },
        tags: { 
          type: 'array',
          items: { type: 'string' },
          example: ['proposal', 'project', 'q3'],
          description: 'Tags associated with the document'
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Document file(s) to upload. Currently only the first file is processed.'
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Document created successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(DocumentResponseDto) },
        {
          properties: {
            files: {
              type: 'array',
              items: { $ref: getSchemaPath(DocumentFileResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data or no file uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (requires ADMIN or EDITOR role)' })
  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Extract user ID from JWT token in cookie
    const accessToken = req.cookies?.access_token;
    const payload = this.jwtService.verify(accessToken);
    const userId = payload.sub; // Extract user ID from token
    
    const doc = await this.documentService.create(createDocumentDto, files, userId);
    return res.status(HttpStatus.CREATED).json(doc);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all documents',
    description: 'Retrieves a list of all documents available in the system'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return all documents',
    schema: {
      type: 'array',
      items: {
        allOf: [
          { $ref: getSchemaPath(DocumentResponseDto) },
          {
            properties: {
              files: {
                type: 'array',
                items: { $ref: getSchemaPath(DocumentFileResponseDto) },
              },
            },
          },
        ],
      },
    },
  })
  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  async findAll(): Promise<any> {
    return await this.documentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a document by id',
    description: 'Retrieves a single document by its unique identifier'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the document',
    schema: {
      allOf: [
        { $ref: getSchemaPath(DocumentResponseDto) },
        {
          properties: {
            files: {
              type: 'array',
              items: { $ref: getSchemaPath(DocumentFileResponseDto) },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  async findOne(@Param('id') id: string): Promise<any> {
    return await this.documentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update a document',
    description: 'Update an existing document\'s metadata and/or file. Requires ADMIN or EDITOR role.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { 
          type: 'string',
          example: 'Updated Project Proposal',
          description: 'New title of the document'
        },
        description: { 
          type: 'string',
          example: 'Updated project proposal description',
          description: 'New description of the document'
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['updated', 'proposal', 'project'],
          description: 'Updated tags for the document'
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'New file to replace the existing document (optional)'
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document updated successfully',
    type: DocumentResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (requires ADMIN or EDITOR role)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() res: Response
  ) {
    const doc = await this.documentService.update(id, updateDocumentDto, files);
    return res.status(HttpStatus.OK).json(doc);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete a document',
    description: 'Permanently removes a document from the system, including its file. Requires ADMIN or EDITOR role.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Document UUID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document deleted successfully',
    type: DocumentDeleteResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions (requires ADMIN or EDITOR role)' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiCookieAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }
}
