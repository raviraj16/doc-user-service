import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionJobEntity } from 'src/database/entities/ingestion-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IngestionJobEntity])],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService]
})
export class IngestionModule {}
