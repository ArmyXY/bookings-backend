import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';

@Entity('businesses')
export class Business {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Peluquería Estilo' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Calle Mayor 1, Madrid' })
  @Column()
  address: string;

  @ApiProperty({ example: '600123456' })
  @Column()
  phone: string;

  @ApiProperty({ example: 'contacto@peluqueria.com' })
  @Column()
  email: string;

  @ApiProperty({ example: 'Servicios de peluquería y estética' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: '09:00' })
  @Column()
  openingTime: string;

  @ApiProperty({ example: '20:00' })
  @Column()
  closingTime: string;

  @ApiProperty({ example: '2026-05-14T10:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Appointment, (appointment) => appointment.business)
  appointments: Appointment[];

  @OneToMany(() => Payment, (payment) => payment.business)
  payments: Payment[];
}
