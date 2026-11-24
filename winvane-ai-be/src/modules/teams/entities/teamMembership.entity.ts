import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
import { TeamRole } from '../enums/teamRole.enum';

@Entity('team_memberships')
export class TeamMembership {
  @PrimaryColumn({ type: 'uuid' })
  teamId: string;

  @ManyToOne(() => Team, (team) => team.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TeamRole,
    enumName: 'team_role_enum',
    default: TeamRole.MEMBER,
  })
  teamRole: TeamRole;

  @Column({ type: 'uuid', nullable: true })
  addedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'added_by_id' })
  addedBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
