import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsModule } from './appointments/appointments.module';
import { CustomersModule } from './customers/customers.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BusinessesModule } from './businesses/businesses.module';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AppointmentsModule,
    CustomersModule,
    PaymentsModule,
    DashboardModule,
    BusinessesModule,
    SeedModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
