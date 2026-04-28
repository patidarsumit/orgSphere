import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ActivityLog } from './ActivityLog'
import { User } from './User'

export type NotificationType =
  | 'task_assigned'
  | 'project_member_added'
  | 'project_member_removed'
  | 'project_owner_changed'

@Entity('notifications')
@Index(['recipient_id', 'read_at', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  recipient_id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: User

  @Column({ type: 'uuid', nullable: true })
  activity_log_id!: string | null

  @ManyToOne(() => ActivityLog, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'activity_log_id' })
  activity_log!: ActivityLog | null

  @Column({ type: 'varchar', length: 100 })
  type!: NotificationType

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'text' })
  message!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  target_url!: string | null

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ type: 'timestamp', nullable: true })
  read_at!: Date | null

  @CreateDateColumn()
  created_at!: Date
}
