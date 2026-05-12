import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  time: string;

  @Column({
    type: 'text',
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column()
  customerId: number;

  @ManyToOne(() => Customer, (customer) => customer.appointments)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  businessId: number;

  @Column()
  serviceName: string;
}