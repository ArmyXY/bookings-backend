import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../businesses/business.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Customer, Appointment, Payment])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
