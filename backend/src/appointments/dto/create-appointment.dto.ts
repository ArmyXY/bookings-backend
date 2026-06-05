import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../appointment.entity';
import { PaymentMethod } from '../../payments/payment.entity';


export class CreateAppointmentDto {
  @ApiProperty({ example: '2026-04-20' })
  @IsString()
  date: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  time: string;

  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDING,
    required: false,
  })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  businessId: number;

  @ApiProperty({ example: 'Corte de pelo' })
  @IsString()
  serviceName: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    required: false,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}
