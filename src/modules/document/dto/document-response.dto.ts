import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from 'src/common/enums/document-status.enum';
import { DocumentFileResponseDto } from './document-file-response.dto';

export class DocumentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Project Proposal' })
  title: string;

  @ApiPropertyOptional({ example: 'A detailed project proposal for Q3' })
  description: string;

  @ApiProperty({
    type: [DocumentFileResponseDto],
    description: 'List of files attached to the document',
  })
  files: DocumentFileResponseDto[];

  @ApiProperty({ 
    enum: DocumentStatus, 
    example: DocumentStatus.UPLOADED,
    description: 'Current status of the document'
  })
  status: DocumentStatus;

  @ApiPropertyOptional({ 
    example: { tags: ['proposal', 'project', 'q3'] },
    description: 'Additional metadata for the document'
  })
  metadata: Record<string, any>;

  @ApiProperty({ example: '2025-08-10T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-08-10T12:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  uploadedById: string;
}

export class DocumentDeleteResponseDto {
  @ApiProperty({ example: true })
  deleted: boolean;
}
