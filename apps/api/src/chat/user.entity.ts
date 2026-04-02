import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './roles.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: false })
  @Column('varchar')
  sessionId: string;

  @Column({ enum: Role })
  role: Role;

  @Column('text')
  content: string;
}
