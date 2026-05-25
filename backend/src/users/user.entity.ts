import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  CLIENT = 'client',
  INTERNAL = 'internal',
  BUSINESS = 'business',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Juan Perez' })
  @Column()
  name: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Column({ type: 'text', nullable: true, select: false })
  passwordHash: string | null;

  @ApiProperty({
    description: 'true = cliente, false = usuario interno',
    example: true,
  })
  @Column({ default: true })
  isClient: boolean;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @Column({ type: 'text', default: UserRole.CLIENT })
  role: UserRole;

  @ApiProperty({ example: 1, required: false })
  @Column({ type: 'integer', nullable: true })
  businessId: number | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
