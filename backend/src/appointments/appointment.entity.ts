import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Payment } from '../payments/payment.entity';
import { Business } from '../businesses/business.entity';
import { User } from '../users/user.entity';

export enum AppointmentStatus {
  PENDING = 'pendiente',
  CONFIRMED = 'confirmado',
  PAID = 'completado',
  CANCELLED = 'cancelado'
}

@Entity()
export class Appointment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '2026-04-20' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ example: '10:30' })
  @Column()
  time: string;

  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.PENDING })
  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @ApiProperty({ example: 1 })
  @Column()
  customerId: number;

  @ManyToOne(() => User, (user) => user.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @OneToMany(() => Payment, (payment) => payment.appointment)
  payments: Payment[];

  @ApiProperty({ example: 1 })
  @Column()
  businessId: number;

  @ManyToOne(() => Business, (business) => business.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ApiProperty({ example: 'Corte de pelo' })
  @Column()
  serviceName: string;
}
