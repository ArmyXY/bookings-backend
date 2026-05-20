import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
