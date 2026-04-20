import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './User'

export type PostStatus = 'draft' | 'published' | 'archived'

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  subtitle!: string | null

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 300 })
  slug!: string

  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, unknown>

  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image_url!: string | null

  @Column({ type: 'jsonb', default: [] })
  tags!: string[]

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status!: PostStatus

  @Column({ type: 'int', default: 1 })
  reading_time!: number

  @Column({ type: 'int', default: 0 })
  views!: number

  @Column({ type: 'uuid', nullable: true })
  author_id!: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author!: User | null

  @Column({ type: 'timestamp', nullable: true })
  published_at!: Date | null

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
