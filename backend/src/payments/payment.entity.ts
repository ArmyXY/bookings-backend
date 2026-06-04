import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../appointments/appointment.entity';

export enum PaymentStatus {
  PENDING = 'pendiente',
  COMPLETED = 'pagado',
  REFUNDED = 'devolución',
}

export enum PaymentMethod {
  CASH = 'efectivo',
  CARD = 'tarjeta',
  TRANSFER = 'transferencia',
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

  @ManyToOne(() => Appointment, (appointment) => appointment.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
