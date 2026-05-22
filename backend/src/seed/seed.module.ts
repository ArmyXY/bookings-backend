import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../businesses/business.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Customer, Appointment, Payment, User])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
