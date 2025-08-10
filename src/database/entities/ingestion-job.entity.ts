import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IngestionStatus } from 'src/modules/ingestion/ingestion.types';

@Entity('ingestion_jobs')
export class IngestionJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true })
  correlationId?: string;

  @Column()
  sourceType: string;

  @Column()
  sourceRef: string;

  @Column('jsonb', { nullable: true })
  params?: Record<string, any>;

  @Column({ type: 'enum', enum: IngestionStatus, default: IngestionStatus.PENDING })
  status: IngestionStatus;

  @Column({ nullable: true })
  message?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date;
}
