import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionStatus } from './ingestion.types';

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: IngestionService;

  const mockService = {
    trigger: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestionService, useValue: mockService }
      ]
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    service = module.get<IngestionService>(IngestionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should trigger ingestion', async () => {
    const dto = { sourceType: 'document', sourceRef: 'doc-1' } as any;
    const job = { id: 'job-1', status: IngestionStatus.PENDING } as any;
    mockService.trigger.mockResolvedValue(job);

    const result = await controller.trigger(dto);
    expect(result).toBe(job);
    expect(mockService.trigger).toHaveBeenCalledWith(dto);
  });

  it('should list jobs', () => {
    const jobs = [ { id: 'job-1' } ];
    mockService.list.mockReturnValue(jobs as any);
    const result = controller.list();
    expect(result).toBe(jobs);
  });

  it('should get job', () => {
    const job = { id: 'job-1' };
    mockService.get.mockReturnValue(job as any);
    const result = controller.get('job-1');
    expect(result).toBe(job);
    expect(mockService.get).toHaveBeenCalledWith('job-1');
  });

  it('should update job', () => {
    const job = { id: 'job-1', status: IngestionStatus.RUNNING };
    mockService.update.mockReturnValue(job as any);
    const dto = { status: IngestionStatus.RUNNING } as any;
    const result = controller.update('job-1', dto);
    expect(result).toBe(job);
    expect(mockService.update).toHaveBeenCalledWith('job-1', dto);
  });
});
