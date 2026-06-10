import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../../businesses/business.entity';

@Entity('rewards')
export class Reward {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Corte de pelo gratis' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Disfruta de un corte gratis al canjear tus puntos.' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 'Servicio' })
  @Column({ default: 'Servicio' })
  type: string;

  @ApiProperty({ example: 100 })
  @Column({ type: 'integer' })
  pointsCost: number;

  @ApiProperty({ example: '2027-12-31' })
  @Column({ type: 'date', nullable: true })
  expiresAt: string;

  @ApiProperty({ example: 1 })
  @Column()
  businessId: number;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @CreateDateColumn()
  createdAt: Date;
}
