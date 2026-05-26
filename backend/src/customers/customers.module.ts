import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './customer.entity';
import { Appointment } from '../appointments/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Appointment])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
