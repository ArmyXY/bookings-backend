import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}

@Entity()
export class Payment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 50.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @Column({
    type: 'text',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({
    type: 'text',
    default: PaymentMethod.CASH,
  })
  method: PaymentMethod;

  @ApiProperty({ example: 1 })
  @Column()
  appointmentId: number;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
