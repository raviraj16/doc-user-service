import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity('document_files')
export class DocumentFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @ManyToOne(() => Document, (document) => document.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column('uuid')
  documentId: string;
}
