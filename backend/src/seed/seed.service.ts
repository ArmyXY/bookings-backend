import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/business.entity';
import { Customer } from '../customers/customer.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../payments/payment.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) { }

  async seed() {
    try {
      // 1. Limpiar base de datos usando query nativo para evitar problemas de truncado con FKs
      await this.paymentRepo.query('DELETE FROM payment');
      await this.appointmentRepo.query('DELETE FROM appointment');
      await this.customerRepo.query('DELETE FROM customer');
      await this.businessRepo.query('DELETE FROM businesses');

      // Resetear secuencias de ID en SQLite
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='payment'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='appointment'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='customer'");
      await this.paymentRepo.query("DELETE FROM sqlite_sequence WHERE name='businesses'");

      // 2. Crear Negocios
      const businesses = await this.businessRepo.save([
        {
          name: 'Peluquería Estilo',
          address: 'Calle Mayor 10, Madrid',
          phone: '912345678',
          email: 'info@estilo.com',
          description: 'Cortes de pelo modernos',
          openingTime: '09:00',
          closingTime: '20:00',
        },
        {
          name: 'Clínica Dental Salud',
          address: 'Avenida Libertad 5, Barcelona',
          phone: '934567890',
          email: 'contacto@dentalsalud.com',
          description: 'Tu sonrisa es lo primero',
          openingTime: '08:30',
          closingTime: '18:00',
        },
        {
          name: 'Gym Iron',
          address: 'Calle Fuerza 22, Valencia',
          phone: '965432109',
          email: 'gym@iron.com',
          description: 'Entrenamiento funcional',
          openingTime: '06:00',
          closingTime: '23:00',
        },
        {
          name: 'Fisioterapia Relax',
          address: 'Plaza España 3, Sevilla',
          phone: '954321098',
          email: 'relax@fisio.com',
          description: 'Masajes terapéuticos',
          openingTime: '10:00',
          closingTime: '21:00',
        },
        {
          name: 'Veterinaria Mascotas',
          address: 'Calle Animal 7, Bilbao',
          phone: '943210987',
          email: 'vete@mascotas.com',
          description: 'Cuidado integral animal',
          openingTime: '09:30',
          closingTime: '19:30',
        },
      ]);

      // 3. Crear Clientes
      const customers = await this.customerRepo.save([
        { name: 'Álvaro García', email: 'alvaro@mail.com', phone: '600111222' },
        { name: 'María López', email: 'maria@mail.com', phone: '600333444' },
        { name: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '600555666' },
        { name: 'Lucía Fernández', email: 'lucia@mail.com', phone: '600777888' },
        { name: 'Elena Martínez', email: 'elena@mail.com', phone: '600999000' },
      ]);

      // 4. Crear Reservas (Relacionadas con Negocios y Clientes)
      const appointments = await this.appointmentRepo.save([
        {
          date: '2026-05-20',
          time: '11:00',
          status: AppointmentStatus.CONFIRMED,
          serviceName: 'Corte de Caballero',
          businessId: businesses[0].id,
          customerId: customers[0].id,
        },
        {
          date: '2026-05-21',
          time: '09:30',
          status: AppointmentStatus.PAID,
          serviceName: 'Limpieza Dental',
          businessId: businesses[1].id,
          customerId: customers[1].id,
        },
        {
          date: '2026-05-22',
          time: '17:00',
          status: AppointmentStatus.PENDING,
          serviceName: 'Clase Crossfit',
          businessId: businesses[2].id,
          customerId: customers[2].id,
        },
        {
          date: '2026-05-23',
          time: '16:00',
          status: AppointmentStatus.CONFIRMED,
          serviceName: 'Sesión Espalda',
          businessId: businesses[3].id,
          customerId: customers[3].id,
        },
        {
          date: '2026-05-24',
          time: '12:00',
          status: AppointmentStatus.PENDING,
          serviceName: 'Vacunación',
          businessId: businesses[4].id,
          customerId: customers[4].id,
        },
      ]);

      // 5. Crear Pagos (Relacionados con Reserva, Negocio y Cliente)
      await this.paymentRepo.save([
        {
          amount: 25.0,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.CARD,
          appointmentId: appointments[0].id,
          businessId: businesses[0].id,
          customerId: customers[0].id,
        },
        {
          amount: 60.0,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.TRANSFER,
          appointmentId: appointments[1].id,
          businessId: businesses[1].id,
          customerId: customers[1].id,
        },
        {
          amount: 15.0,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.CASH,
          appointmentId: appointments[2].id,
          businessId: businesses[2].id,
          customerId: customers[2].id,
        },
        {
          amount: 45.0,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.CARD,
          appointmentId: appointments[3].id,
          businessId: businesses[3].id,
          customerId: customers[3].id,
        },
        {
          amount: 30.0,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.CASH,
          appointmentId: appointments[4].id,
          businessId: businesses[4].id,
          customerId: customers[4].id,
        },
      ]);

      return { message: 'Database cleared and seeded with 5 records per table successfully' };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}
