import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ProjectMember } from './ProjectMember'
import { Team } from './Team'
import { User } from './User'

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planned' | 'archived'

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({
    type: 'enum',
    enum: ['active', 'completed', 'on_hold', 'planned', 'archived'],
    default: 'active',
  })
  status!: ProjectStatus

  @Column({ type: 'jsonb', default: [] })
  tech_stack!: string[]

  @Column({ type: 'date', nullable: true })
  start_date!: string | null

  @Column({ type: 'uuid', nullable: true })
  manager_id!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null

  @Column({ type: 'uuid', nullable: true })
  tech_lead_id!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'tech_lead_id' })
  tech_lead!: User | null

  @Column({ type: 'uuid', nullable: true })
  team_id!: string | null

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.project, { cascade: true })
  project_members!: ProjectMember[]

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
