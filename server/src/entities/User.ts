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

export type UserRole = 'admin' | 'manager' | 'tech_lead' | 'employee'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string

  @Column({
    type: 'enum',
    enum: ['admin', 'manager', 'tech_lead', 'employee'],
    default: 'employee',
  })
  role!: UserRole

  @Column({ type: 'varchar', length: 255, nullable: true })
  department!: string | null

  @Column({ type: 'jsonb', default: [] })
  skills!: string[]

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_path!: string | null

  @Column({ type: 'uuid', nullable: true })
  manager_id!: string | null

  @ManyToOne(() => User, (user) => user.direct_reports, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: User | null

  @OneToMany(() => User, (user) => user.manager)
  direct_reports!: User[]

  @Column({ type: 'boolean', default: true })
  is_active!: boolean

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date
}

