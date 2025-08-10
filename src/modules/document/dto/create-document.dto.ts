import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Project Proposal', description: 'Title of the document' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A detailed project proposal for Q3', description: 'Description of the document' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    example: ['proposal', 'project', 'q3'], 
    description: 'Tags associated with the document. Can be an array or comma-separated string.',
    type: [String],
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'string' }
    ]
  })
  @IsOptional()
  tags?: string[] | string;
}
