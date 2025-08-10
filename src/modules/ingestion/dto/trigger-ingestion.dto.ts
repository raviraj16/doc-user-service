import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerIngestionDto {
  @ApiProperty({ description: 'Optional external correlation/job id to track ingestion', required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ description: 'Source type (e.g. document, dataset, url)', example: 'document' })
  @IsString()
  sourceType: string;

  @ApiProperty({ description: 'Source identifier (e.g. document id, url, path)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  sourceRef: string;

  @ApiProperty({ description: 'Optional parameters for ingestion adapter', required: false, example: { reprocess: false } })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}
