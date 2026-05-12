import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING, required: false })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  appointmentId: number;
}
