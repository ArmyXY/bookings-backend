import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../businesses/business.entity';
import { ColumnNumericTransformer } from '../utils/column-numeric-transformer';

@Entity('services')
export class Service {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Corte de pelo' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Corte de pelo clásico con lavado incluido', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 25.0 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  @ApiProperty({ example: 45, description: 'Duración estimada en minutos', required: false })
  @Column({ type: 'int', nullable: true })
  duration: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-06-11T10:00:00Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: 1 })
  @Column()
  businessId: number;

  @ManyToOne(() => Business, (business) => business.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;
}
