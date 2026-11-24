import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkspaceStatus } from '../enums/workspaceStatus.enum';
import { WorkspaceVerificationMethod } from '../enums/workspaceVerificationMethod.enum';
import { PlanTier } from '../enums/planTier.enum';
import { User } from '../../users/entities/user.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 253 })
  domain: string;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    enumName: 'workspace_status_enum',
    default: WorkspaceStatus.PENDING_VERIFICATION,
  })
  status: WorkspaceStatus;

  @Column({
    type: 'enum',
    enum: WorkspaceVerificationMethod,
    enumName: 'workspace_verification_method_enum',
    default: WorkspaceVerificationMethod.EMAIL_DOMAIN,
  })
  verificationMethod: WorkspaceVerificationMethod;

  @Column({
    type: 'enum',
    enum: PlanTier,
    enumName: 'plan_tier_enum',
    default: PlanTier.PILOT,
  })
  planTier: PlanTier;

  @Column({ type: 'uuid', nullable: true })
  ownerUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.workspace)
  users: User[];
}
