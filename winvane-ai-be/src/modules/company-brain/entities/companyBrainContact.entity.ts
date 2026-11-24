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
import { CompanyBrain } from './companyBrain.entity';

@Entity('company_brain_contacts')
@Index('idx_company_brain_contacts_profile_order', [
  'companyBrainId',
  'sortOrder',
])
export class CompanyBrainContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyBrainId: string;

  @ManyToOne(() => CompanyBrain, (profile) => profile.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_brain_id' })
  companyBrain: CompanyBrain;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 254 })
  workEmail: string;

  @Column({ type: 'varchar', length: 32, default: '' })
  contactNumber: string;

  @Column({ type: 'varchar', length: 120, default: '' })
  jobTitle: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
