import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolePermission } from './rolePermission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 50, default: '' })
  module: string;

  @Column({ type: 'varchar', length: 80, default: '' })
  moduleLabel: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  label: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', default: 0 })
  moduleSortOrder: number;

  @Column({ type: 'boolean', default: false })
  isPlatform: boolean;

  @Column({ type: 'boolean', default: true })
  isAssignable: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
