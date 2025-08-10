import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IngestionStatus } from '../ingestion.types';

export class UpdateIngestionDto {
  @ApiPropertyOptional({ description: 'Updated status of ingestion job', enum: IngestionStatus })
  @IsOptional()
  @IsEnum(IngestionStatus)
  status?: IngestionStatus;

  @ApiPropertyOptional({ description: 'Optional status message or error details' })
  @IsOptional()
  @IsString()
  message?: string;
}
