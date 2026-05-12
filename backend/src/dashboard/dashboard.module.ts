import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';
import { Payment } from '../payments/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Customer, Payment])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
