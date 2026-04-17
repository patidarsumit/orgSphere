import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Project } from './Project'
import { User } from './User'

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({ type: 'uuid', nullable: true })
  created_by!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: User | null

  @ManyToMany(() => User, (user) => user.teams)
  @JoinTable({
    name: 'team_members',
    joinColumn: { name: 'team_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members!: User[]

  @OneToMany(() => Project, (project) => project.team)
  projects!: Project[]

  projects_count?: number

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}
