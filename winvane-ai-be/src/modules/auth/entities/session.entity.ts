import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionPortal } from '../enums/sessionPortal.enum';
import { SessionRevokedReason } from '../enums/sessionRevokedReason.enum';
import { User } from '../../users/entities/user.entity';

@Index(['userId', 'revokedAt'])
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: SessionPortal,
    enumName: 'session_portal_enum',
  })
  portal: SessionPortal;

  @Column({ type: 'char', length: 64 })
  jtiHash: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 512 })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;

  @Index()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({
    type: 'enum',
    enum: SessionRevokedReason,
    enumName: 'session_revoked_reason_enum',
    nullable: true,
  })
  revokedReason: SessionRevokedReason | null;
}
