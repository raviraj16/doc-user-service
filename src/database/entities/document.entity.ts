import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentStatus } from 'src/common/enums/document-status.enum';

import { DocumentFile } from './document-file.entity';


@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;


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

    @OneToMany(() => DocumentFile, (file) => file.document, { cascade: true })
    files: DocumentFile[];
}
