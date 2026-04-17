import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './User'

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'member_added'
  | 'member_removed'
  | 'status_changed'
  | 'assigned'
  | 'completed'
  | 'uploaded'
  | 'commented'

export type ActivityEntityType =
  | 'project'
  | 'employee'
  | 'team'
  | 'task'
  | 'note'
  | 'project_member'
  | 'team_member'

@Entity('activity_logs')
@Index(['entity_type', 'entity_id'])
@Index(['actor_id'])
@Index(['created_at'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  action!: ActivityAction

  @Column({ type: 'varchar', length: 100 })
  entity_type!: ActivityEntityType

  @Column({ type: 'uuid' })
  entity_id!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  entity_name!: string | null

  @Column({ type: 'uuid', nullable: true })
  actor_id!: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor!: User | null

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ type: 'jsonb', default: [] })
  read_by!: string[]

  @CreateDateColumn()
  created_at!: Date
}
