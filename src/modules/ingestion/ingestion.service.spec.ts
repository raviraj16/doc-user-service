import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngestionJobEntity } from 'src/database/entities/ingestion-job.entity';
import { IngestionStatus } from './ingestion.types';
import axios from 'axios';

jest.mock('axios');

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('IngestionService (DB)', () => {
  let service: IngestionService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: getRepositoryToken(IngestionJobEntity), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(IngestionService);
    repo = module.get(getRepositoryToken(IngestionJobEntity));
    (axios.post as jest.Mock).mockResolvedValue({ data: { ok: true } });
  });

  afterEach(() => jest.clearAllMocks());

  it('should create job and call external ingestion', async () => {
    const job = { id: 'job-1', status: IngestionStatus.PENDING } as any;
    repo.create.mockReturnValue(job);
    repo.save.mockResolvedValue(job);
    repo.findOne.mockResolvedValue(job);

    const dto = { sourceType: 'document', sourceRef: 'doc-1' } as any;
    const created = await service.trigger(dto);
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(job);
    expect(created).toBe(job);
  });

  it('should list jobs', async () => {
    const jobs = [{ id: 'job-1' } as any];
    repo.find.mockResolvedValue(jobs);
    const result = await service.list();
    expect(result).toBe(jobs);
  });

  it('should get job', async () => {
    const job = { id: 'job-1' } as any;
    repo.findOne.mockResolvedValue(job);
    const result = await service.get('job-1');
    expect(result).toBe(job);
  });

  it('should update job status', async () => {
    const job = { id: 'job-1', status: IngestionStatus.PENDING } as any;
    repo.findOne.mockResolvedValue(job);
    repo.save.mockResolvedValue(job);
    const updated = await service.update('job-1', { status: IngestionStatus.RUNNING });
    expect(updated.status).toBe(IngestionStatus.RUNNING);
  });
});
