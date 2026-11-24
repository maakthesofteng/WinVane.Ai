import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ICompanyBrainRichTextNode } from '../interfaces/companyBrain.interface';
import { CompanyBrain } from './companyBrain.entity';

@Entity('company_brain_case_studies')
@Index('idx_company_brain_case_studies_profile_order', [
  'companyBrainId',
  'sortOrder',
])
export class CompanyBrainCaseStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyBrainId: string;

  @ManyToOne(() => CompanyBrain, (profile) => profile.caseStudies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_brain_id' })
  companyBrain: CompanyBrain;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  clientName: string;

  @Column({ type: 'varchar', length: 120, default: '' })
  industry: string;

  @Column({ type: 'jsonb' })
  content: ICompanyBrainRichTextNode;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
