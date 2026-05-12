import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Customer {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Juan Pérez' })
  @Column()
  name: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '+34 600 000 000', required: false })
  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Appointment, (appointment) => appointment.customer)
  appointments: Appointment[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
