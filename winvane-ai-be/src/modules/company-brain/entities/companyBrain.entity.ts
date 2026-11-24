import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { CompanyBrainCaseStudy } from './companyBrainCaseStudy.entity';
import { CompanyBrainContact } from './companyBrainContact.entity';

@Entity('company_brains')
export class CompanyBrain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @OneToMany(() => CompanyBrainContact, (contact) => contact.companyBrain)
  contacts: CompanyBrainContact[];

  @OneToMany(() => CompanyBrainCaseStudy, (caseStudy) => caseStudy.companyBrain)
  caseStudies: CompanyBrainCaseStudy[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  techStacks: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  industries: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  services: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  targetRegions: string[];

  @Column({ type: 'varchar', length: 80, default: '' })
  companySizeBand: string;

  @Column({ type: 'varchar', length: 120, default: '' })
  pricingRange: string;

  @Column({ type: 'varchar', length: 80, default: '' })
  pricingModel: string;

  @Column({ type: 'varchar', length: 2000, default: '' })
  summary: string;

  @Column({ type: 'varchar', length: 2048, default: '' })
  websiteUrl: string;

  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status: 'draft' | 'confirmed';

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
