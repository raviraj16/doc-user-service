import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';


@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    fileName: string;

    @Column()
    fileUrl: string;

    @Column()
    fileSize: number;

    @Column()
    mimeType: string;

    @Column({
        type: 'enum',
        enum: DocumentStatus,
        default: DocumentStatus.UPLOADED,
    })
    status: DocumentStatus;

    @Column('jsonb', { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.documents)
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy: User;

    @Column('uuid')
    uploadedById: string;
}
