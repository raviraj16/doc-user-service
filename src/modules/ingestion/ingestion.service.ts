import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IngestionJob, IngestionStatus } from './ingestion.types';
import { TriggerIngestionDto } from './dto/trigger-ingestion.dto';
import { UpdateIngestionDto } from './dto/update-ingestion.dto';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngestionJobEntity } from 'src/database/entities/ingestion-job.entity';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(IngestionJobEntity)
    private readonly jobRepo: Repository<IngestionJobEntity>,
  ) {}

  // Trigger ingestion in external Python backend
  async trigger(dto: TriggerIngestionDto): Promise<IngestionJobEntity> {
    const job = this.jobRepo.create({
      correlationId: dto.correlationId,
      sourceType: dto.sourceType,
      sourceRef: dto.sourceRef,
      params: dto.params,
      status: IngestionStatus.PENDING,
    });
    await this.jobRepo.save(job);

    // Fire-and-forget call to external service
    this.callExternalIngestion(job.id).catch(err => {
      this.failJob(job.id, err.message || 'External ingestion failed');
    });

    return job;
  }

  private async callExternalIngestion(jobId: string): Promise<void> {
    // Mark running
    await this.update(jobId, { status: IngestionStatus.RUNNING, message: 'Started' });

    const job = await this.get(jobId);

    await axios.post(process.env.INGESTION_ENDPOINT || 'http://python-backend.local/ingest', {
      jobId: job.id,
      sourceType: job.sourceType,
      sourceRef: job.sourceRef,
      params: job.params,
      correlationId: job.correlationId,
    });
  }

  async list(): Promise<IngestionJobEntity[]> {
    return this.jobRepo.find({ order: { createdAt: 'DESC' } });
  }

  async get(id: string): Promise<IngestionJobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Ingestion job not found');
    return job;
  }

  // Called by management API / webhook to update job status
  async update(id: string, dto: UpdateIngestionDto): Promise<IngestionJobEntity> {
    const job = await this.get(id);

    const startedAt = dto.status === IngestionStatus.RUNNING && !job.startedAt ? new Date() : job.startedAt;
    const finishedAt = dto.status && [IngestionStatus.COMPLETED, IngestionStatus.FAILED, IngestionStatus.CANCELLED].includes(dto.status)
      ? new Date()
      : job.finishedAt;

    Object.assign(job, dto, { startedAt, finishedAt });
    await this.jobRepo.save(job);
    return job;
  }

  private async failJob(id: string, message: string) {
    try {
      await this.update(id, { status: IngestionStatus.FAILED, message });
    } catch {
      // swallow
    }
  }
}
