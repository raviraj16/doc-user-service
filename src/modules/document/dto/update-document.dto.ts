import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'Updated Project Proposal', description: 'New title of the document' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated project proposal description', description: 'New description of the document' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: ['updated', 'proposal', 'project'], 
    description: 'Updated tags for the document',
    type: [String]
  })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
