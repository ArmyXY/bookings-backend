import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { Business } from '../../businesses/business.entity';

@Entity('customer_points')
export class CustomerPoints {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column()
  businessId: number;

  @Column({ type: 'integer', default: 0 })
  points: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @UpdateDateColumn()
  updatedAt: Date;
}
