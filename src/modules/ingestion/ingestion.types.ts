export enum IngestionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface IngestionJob {
  id: string;              // internal job id
  correlationId?: string;  // external id supplied by caller
  sourceType: string;
  sourceRef: string;
  params?: Record<string, any>;
  status: IngestionStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}
