import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Project } from './Project'
import { User } from './User'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({
    type: 'enum',
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo',
  })
  status!: TaskStatus

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority!: TaskPriority

  @Column({ type: 'date', nullable: true })
  due_date!: string | null

  @Column({ type: 'uuid' })
  assigned_to!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_to' })
  assignee!: User

  @Column({ type: 'uuid', nullable: true })
  project_id!: string | null

  @ManyToOne(() => Project, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project!: Project | null

  @Column({ type: 'uuid' })
  created_by!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
