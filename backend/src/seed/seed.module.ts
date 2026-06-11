import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../businesses/business.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Payment } from '../payments/payment.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Business, Appointment, Payment, User, Service])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}
